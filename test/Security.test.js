const cds = require('@sap/cds');
const test = cds.test().in(__dirname + '/app/')
const { GET, POST, expect } = test
const { describeFromCds } = require('./helpers/cds-version')
const { redactHeaders, truncateField, truncateMetadataFields, REDACTED } = require('../lib/support/metricsSanitizer')

const ADMIN = { auth: { username: 'cacheadmin', password: 'cacheadmin' } }
const API = '/odata/v4/caching-api'

/** An authenticated principal for programmatic dispatch. */
const adminUser = () => new cds.User({ id: 'cacheadmin', roles: ['CacheAdmin'] })

/** Status code of a failing request, or 'no error' when it unexpectedly succeeded. */
async function statusOf(request) {
    try {
        await request
        return 'no error'
    } catch (error) {
        return error.response?.status ?? error.message
    }
}

describeFromCds(9, 'Security', () => {

    describe('Management API authorization', () => {

        it("rejects unauthenticated reads of Caches", async () => {
            expect(await statusOf(GET(`${API}/Caches`))).to.equal(401)
        })

        it("rejects unauthenticated reads of Metrics and KeyMetrics", async () => {
            expect(await statusOf(GET(`${API}/Metrics`))).to.equal(401)
            expect(await statusOf(GET(`${API}/KeyMetrics`))).to.equal(401)
        })

        it("rejects unauthenticated cache entry enumeration", async () => {
            expect(await statusOf(GET(`${API}/Caches('caching')/getEntries()`))).to.equal(401)
        })

        it("rejects unauthenticated flushing", async () => {
            expect(await statusOf(POST(`${API}/Caches('caching')/clear`, {}))).to.equal(401)
        })

        it("rejects unauthenticated writes", async () => {
            const call = POST(`${API}/Caches('caching')/setEntry`, { key: 'k', value: 'v', ttl: 0 })
            expect(await statusOf(call)).to.equal(401)
        })

        it("allows an authenticated user", async () => {
            const { data } = await GET(`${API}/Caches`, ADMIN)
            expect(data.value).to.be.an('array')
        })

        it("is enforced for programmatic dispatch without a user", async () => {
            const api = await cds.connect.to('plugin.cds_caching.CachingApiService')

            // Guards against a code path that bypasses HTTP but still reaches the cache.
            const call = api.send({
                event: 'clear',
                entity: 'Caches',
                params: [{ name: 'caching' }],
                data: {},
            })

            await expect(call).to.be.rejected
        })

        it("declares @requires on the service and @readonly on Caches", async () => {
            const service = cds.model.definitions['plugin.cds_caching.CachingApiService']
            expect(service['@requires']).to.equal('authenticated-user')

            const caches = cds.model.definitions['plugin.cds_caching.CachingApiService.Caches']
            expect(caches['@readonly']).to.be.true
        })
    })

    describe('Caches is not writable over OData', () => {

        it("rejects CREATE", async () => {
            const call = POST(`${API}/Caches`, { name: 'injected', metricsEnabled: true }, ADMIN)
            expect(await statusOf(call)).to.be.oneOf([405, 400])
        })

        it("rejects UPDATE of metricsEnabled", async () => {
            const call = test.PATCH(`${API}/Caches('caching')`, { metricsEnabled: true }, ADMIN)
            expect(await statusOf(call)).to.be.oneOf([405, 400])
        })

        it("rejects DELETE", async () => {
            const call = test.DELETE(`${API}/Caches('caching')`, ADMIN)
            expect(await statusOf(call)).to.be.oneOf([405, 400])
        })
    })

    describe('Cache name allow-list', () => {

        it("returns 404 for an unknown cache", async () => {
            expect(await statusOf(GET(`${API}/Caches('nope')/getEntries()`, ADMIN))).to.equal(404)
        })

        it("refuses to connect to a non-caching service", async () => {
            // 'db' and 'Northwind' are configured services, but not caches.
            expect(await statusOf(GET(`${API}/Caches('db')/getEntries()`, ADMIN))).to.equal(404)
            expect(await statusOf(GET(`${API}/Caches('Northwind')/getEntries()`, ADMIN))).to.equal(404)
        })

        it("refuses to flush a non-caching service", async () => {
            expect(await statusOf(POST(`${API}/Caches('db')/clear`, {}, ADMIN))).to.equal(404)
        })

        it("still serves configured caches", async () => {
            const { data } = await GET(`${API}/Caches('caching-northwind')/getEntries()`, ADMIN)
            expect(data.value).to.be.an('array')
        })
    })

    describe('Resource limits', () => {

        let cache

        beforeEach(async () => {
            cache = await cds.connect.to('caching')
            await cache.clear()
        })

        it("defaults to at most 100 entries", async () => {
            for (let i = 0; i < 120; i++) await cache.set(`page:${i}`, `v${i}`)

            const { data } = await GET(`${API}/Caches('caching')/getEntries()`, ADMIN)
            expect(data.value).to.have.length(100)
        })

        it("honours top and skip", async () => {
            for (let i = 0; i < 20; i++) await cache.set(`page:${i}`, `v${i}`)

            const { data: firstPage } = await GET(`${API}/Caches('caching')/getEntries(top=5,skip=0)`, ADMIN)
            expect(firstPage.value).to.have.length(5)

            const { data: secondPage } = await GET(`${API}/Caches('caching')/getEntries(top=5,skip=5)`, ADMIN)
            expect(secondPage.value).to.have.length(5)

            const firstKeys = firstPage.value.map(e => e.entryKey)
            const secondKeys = secondPage.value.map(e => e.entryKey)
            expect(firstKeys).to.not.have.members(secondKeys)
        })

        it("caps top at the hard maximum", async () => {
            for (let i = 0; i < 10; i++) await cache.set(`page:${i}`, `v${i}`)

            // Asking for far more than the cap must not error, just return what exists.
            const { data } = await GET(`${API}/Caches('caching')/getEntries(top=999999,skip=0)`, ADMIN)
            expect(data.value).to.have.length(10)
        })

        it("rejects oversized values", async () => {
            const tooBig = 'x'.repeat(1024 * 1024 + 1)
            const call = POST(`${API}/Caches('caching')/setEntry`, { key: 'big', value: tooBig, ttl: 0 }, ADMIN)

            // Over HTTP the body-size limit usually rejects first (413); the handler's
            // own check (400) is what protects programmatic callers and deployments
            // that raise the body limit. Either way the value must not be stored.
            expect(await statusOf(call)).to.be.oneOf([400, 413])
            expect(await cache.get('big')).to.be.undefined
        })

        it("rejects oversized values for programmatic callers too", async () => {
            const api = await cds.connect.to('plugin.cds_caching.CachingApiService')
            const tooBig = 'x'.repeat(1024 * 1024 + 1)

            const call = cds.tx({ user: adminUser() }, () => api.send({
                event: 'setEntry',
                entity: 'Caches',
                params: [{ name: 'caching' }],
                data: { key: 'big-programmatic', value: tooBig, ttl: 0 },
            }))

            await expect(call).to.be.rejectedWith(/exceeds the maximum/)
            expect(await cache.get('big-programmatic')).to.be.undefined
        })

        it("accepts values under the limit", async () => {
            const ok = 'x'.repeat(1000)
            const { data } = await POST(`${API}/Caches('caching')/setEntry`, { key: 'ok', value: ok, ttl: 0 }, ADMIN)
            expect(data.value).to.be.true
        })
    })

    describe('Dashboard static route guard', () => {

        const { requireAuthenticatedUser, capRequestMiddlewares } = require('../lib/dashboard-guard')

        /** Minimal express-like response recorder. */
        const fakeRes = () => {
            const res = {
                statusCode: null,
                headers: {},
                ended: false,
                status(code) { res.statusCode = code; return res },
                set(name, value) { res.headers[name] = value; return res },
                end() { res.ended = true; return res },
            }
            return res
        }

        /** Run the guard with a given cds.context.user, restoring context afterwards. */
        const runGuard = (user) => {
            const previous = cds.context
            try {
                cds.context = { user }
                const res = fakeRes()
                let passed = false
                requireAuthenticatedUser({}, res, () => { passed = true })
                return { passed, res }
            } finally {
                cds.context = previous
            }
        }

        it("passes an authenticated user through", () => {
            const { passed, res } = runGuard(new cds.User({ id: 'cacheadmin' }))
            expect(passed).to.be.true
            expect(res.statusCode).to.be.null
        })

        it("rejects the anonymous user with 401", () => {
            const { passed, res } = runGuard(new cds.User.Anonymous())
            expect(passed).to.be.false
            expect(res.statusCode).to.equal(401)
            expect(res.ended).to.be.true
        })

        it("rejects a missing user with 401", () => {
            const { passed, res } = runGuard(undefined)
            expect(passed).to.be.false
            expect(res.statusCode).to.equal(401)
        })

        it("challenges with WWW-Authenticate so browsers can prompt", () => {
            const { res } = runGuard(undefined)
            expect(res.headers['WWW-Authenticate']).to.match(/Basic realm/)
        })

        it("exposes CAP's middlewares as a flat list of handlers", () => {
            const middlewares = capRequestMiddlewares()
            expect(middlewares).to.be.an('array')
            expect(middlewares.length).to.be.greaterThan(0)
            for (const mw of middlewares) expect(mw).to.be.a('function')
        })
    })

    describe('Debug response headers', () => {

        const CapOperations = require('../lib/operations/CapOperations')
        const withOptions = (options) => new CapOperations(null, null, null, console, { options })

        it("is off when unconfigured", () => {
            expect(withOptions({}).debugHeadersEnabled()).to.be.false
        })

        it("is off for anything other than an explicit true", () => {
            expect(withOptions({ debugHeaders: 'true' }).debugHeadersEnabled()).to.be.false
            expect(withOptions({ debugHeaders: 1 }).debugHeadersEnabled()).to.be.false
            expect(withOptions({ debugHeaders: false }).debugHeadersEnabled()).to.be.false
        })

        it("is on when explicitly enabled", () => {
            expect(withOptions({ debugHeaders: true }).debugHeadersEnabled()).to.be.true
        })

        it("tolerates a missing runtime config manager", () => {
            expect(new CapOperations(null, null, null, console, undefined).debugHeadersEnabled()).to.be.false
        })

        it("emits the cache key only for a cache that opted in", async () => {
            // The test app sets debugHeaders on 'caching', which CachedFoo uses.
            const { headers } = await GET('/odata/v4/app/CachedFoo')
            expect(headers).to.have.property('x-sap-cap-cache-key')
        })
    })

    describe('Metrics sanitizing', () => {

        it("redacts credential-bearing headers", () => {
            const safe = redactHeaders({
                'Authorization': 'Bearer supersecret',
                'cookie': 'JSESSIONID=abc',
                'Set-Cookie': 'x=y',
                'X-API-Key': 'key123',
                'x-csrf-token': 'tok',
                'sap-passport': 'blob',
                'content-type': 'application/json',
                'accept-language': 'en',
            })

            expect(safe.Authorization).to.equal(REDACTED)
            expect(safe.cookie).to.equal(REDACTED)
            expect(safe['Set-Cookie']).to.equal(REDACTED)
            expect(safe['X-API-Key']).to.equal(REDACTED)
            expect(safe['x-csrf-token']).to.equal(REDACTED)
            expect(safe['sap-passport']).to.equal(REDACTED)

            // Non-sensitive headers stay intact, so metrics remain useful.
            expect(safe['content-type']).to.equal('application/json')
            expect(safe['accept-language']).to.equal('en')
        })

        it("leaves the original headers untouched", () => {
            const original = { authorization: 'Bearer secret' }
            redactHeaders(original)
            expect(original.authorization).to.equal('Bearer secret')
        })

        it("handles missing headers", () => {
            expect(redactHeaders(undefined)).to.be.undefined
            expect(redactHeaders(null)).to.be.undefined
        })

        it("truncates long fields and reports how much was cut", () => {
            const truncated = truncateField('a'.repeat(100), 10)
            expect(truncated).to.include('[truncated 90 chars]')
            expect(truncated.startsWith('a'.repeat(10))).to.be.true
        })

        it("leaves short fields alone", () => {
            expect(truncateField('short', 10)).to.equal('short')
            expect(truncateField(undefined, 10)).to.be.undefined
        })

        it("bounds the free-text metric fields", () => {
            const metadata = {
                metadata: 'm'.repeat(50),
                query: 'q'.repeat(50),
                subject: 's'.repeat(50),
                context: 'c'.repeat(50),
                cacheOptions: 'o'.repeat(50),
                user: 'alice',
            }

            const bounded = truncateMetadataFields(metadata, 10)

            for (const field of ['metadata', 'query', 'subject', 'context', 'cacheOptions']) {
                expect(bounded[field]).to.include('[truncated 40 chars]')
            }
            // Short, structured fields pass through unchanged.
            expect(bounded.user).to.equal('alice')
        })

        it("returns the same object when nothing needs truncating", () => {
            const metadata = { query: 'short', user: 'alice' }
            expect(truncateMetadataFields(metadata, 100)).to.equal(metadata)
        })
    })
})
