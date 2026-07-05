const cds = require('@sap/cds');
const { Request } = cds;
const { expect } = cds.test().in(__dirname + '/app')
const { describeFromCds } = require('./helpers/cds-version')

/**
 * HCQL Protocol Adapter support.
 *
 * HCQL ("CQL over HTTP", see the June 2026 / cds 10 release) serves a service by
 * accepting CQN `SELECT` queries in the HTTP request *body* (POST), rather than
 * encoding query options in the URL query string like OData. This has two
 * consequences for cds-caching that these tests pin down:
 *
 * 1. Inbound key hashing: for OData the differentiating query lives in the URL
 *    query string, so the cache key is derived from the URL. For HCQL the URL is
 *    just the endpoint path (e.g. `/hcql/admin`) for every query, so the CQN in
 *    `req.query` must contribute to the hash — otherwise different HCQL queries
 *    to the same endpoint collide on one cache key.
 *
 * 2. Outbound read-through (`rt.send`): CAP auto-selects HCQL for CAP-to-CAP
 *    remote consumption, and HCQL sends `SELECT` as an HTTP POST. The send path
 *    must treat a POST that carries a SELECT as a cacheable read, while still
 *    bypassing genuine mutations.
 */
describeFromCds(10, 'HCQL Protocol Adapter support', () => {

    let cache;

    beforeEach(async () => {
        cache = await cds.connect.to('caching');
        await cache.clear();
    })

    describe('inbound key hashing (query in body, not URL)', () => {

        // Emulate the request an HCQL adapter dispatches to the READ handler:
        // a real CAP Request carrying the CQN in `req.query` and an HTTP URL that
        // is only the endpoint path (no query string).
        const hcqlReq = (url, query) => {
            const req = new Request({ event: 'READ', query });
            req._ = { req: { url, path: url } };
            return req;
        }

        it("derives different keys for different HCQL queries on the same endpoint", async () => {
            const km = cache.keyManager;

            const hashA = km.createContentHash(
                hcqlReq('/hcql/app', SELECT.from('AppService.CachedFoo').where({ ID: 1 }))
            );
            const hashB = km.createContentHash(
                hcqlReq('/hcql/app', SELECT.from('AppService.CachedFoo').where({ ID: 2 }))
            );

            expect(hashA).to.be.a('string');
            expect(hashB).to.be.a('string');
            // Before the fix these collided: same URL path, query dropped from hash.
            expect(hashA).to.not.equal(hashB);
        })

        it("derives a stable key for identical HCQL queries", async () => {
            const km = cache.keyManager;

            const hash1 = km.createContentHash(
                hcqlReq('/hcql/app', SELECT.from('AppService.CachedFoo').where({ ID: 1 }))
            );
            const hash2 = km.createContentHash(
                hcqlReq('/hcql/app', SELECT.from('AppService.CachedFoo').where({ ID: 1 }))
            );

            expect(hash1).to.equal(hash2);
        })
    })

    describe('outbound read-through (rt.send over HCQL POST)', () => {

        it("caches a POST request that carries a SELECT query (HCQL read)", async () => {
            let backendCalls = 0;
            const hcqlRemote = {
                name: 'HcqlRemote',
                send: async () => { backendCalls++; return [{ ID: 1, name: 'Foo1' }]; }
            };

            const request = {
                method: 'POST',
                path: '/hcql/app',
                event: 'READ',
                query: SELECT.from('Foo')
            };

            const first = await cache.rt.send(request, hcqlRemote, { key: 'hcql:send:read' });
            const second = await cache.rt.send(request, hcqlRemote, { key: 'hcql:send:read' });

            expect(first.result).to.eql([{ ID: 1, name: 'Foo1' }]);
            expect(second.result).to.eql(first.result);
            expect(second.metadata.hit).to.be.true;
            // Backend hit once; the second read was served from cache.
            expect(backendCalls).to.equal(1);
            expect(await cache.get('hcql:send:read')).to.eql(first.result);
        })

        it("still bypasses a POST without a SELECT (action / mutation)", async () => {
            const remote = { name: 'Remote', send: async () => 'should-not-cache' };

            const { result } = await cache.rt.send(
                { method: 'POST', path: 'submitOrder' },
                remote,
                { key: 'hcql:send:action' }
            );

            expect(result).to.be.null;
            expect(await cache.get('hcql:send:action')).to.be.undefined;
        })

        it("bypasses a POST carrying a write query (UPDATE)", async () => {
            const remote = { name: 'Remote', send: async () => 'should-not-cache' };

            const { result } = await cache.rt.send(
                { method: 'POST', query: UPDATE('Foo').set({ name: 'x' }).where({ ID: 1 }) },
                remote,
                { key: 'hcql:send:write' }
            );

            expect(result).to.be.null;
            expect(await cache.get('hcql:send:write')).to.be.undefined;
        })
    })
})
