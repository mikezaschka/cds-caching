const cds = require('@sap/cds');
const { GET, expect, axios } = cds.test().in(__dirname + '/app')

const ADMIN = { username: 'cacheadmin', password: 'cacheadmin' }
const PLAIN = { username: 'plainuser', password: 'plainuser' }

/**
 * Reads a @restrict-ed, cached entity as a given user and returns both the
 * derived cache key (exposed because the test app enables debugHeaders) and the
 * rows the caller actually received.
 */
async function readAs(auth, url) {
    const { headers, data } = await axios.get(url, { auth })
    return { key: headers['x-sap-cap-cache-key'], rows: data.value }
}

describe('Cache key isolation', () => {

    let cache

    beforeEach(async () => {
        cache = await cds.connect.to('caching')
        await cache.clear()
    })

    describe('row-level restrictions reach the key', () => {

        // The cache config for this service leaves isUserAware at its default of
        // false, so any isolation here comes from the derivation, not from a
        // {user} component in the template.
        it('derives different keys for two users reading the same URL', async () => {
            const admin = await readAs(ADMIN, '/odata/v4/app/RestrictedOwned')
            const plain = await readAs(PLAIN, '/odata/v4/app/RestrictedOwned')

            expect(admin.key).to.be.a('string')
            expect(plain.key).to.be.a('string')
            expect(admin.key).to.not.equal(plain.key)
        })

        it('serves each user only their own rows', async () => {
            const admin = await readAs(ADMIN, '/odata/v4/app/RestrictedOwned')
            const plain = await readAs(PLAIN, '/odata/v4/app/RestrictedOwned')

            expect(admin.rows.map(r => r.owner)).to.deep.equal(['cacheadmin'])
            expect(plain.rows.map(r => r.owner)).to.deep.equal(['plainuser'])
        })

        it('does not leak the first user rows to the second through the cache', async () => {
            const admin = await readAs(ADMIN, '/odata/v4/app/RestrictedOwned')
            expect(admin.rows).to.have.lengthOf(1)

            // Second user, same URL, immediately after the entry was stored.
            const plain = await readAs(PLAIN, '/odata/v4/app/RestrictedOwned')
            expect(plain.rows).to.have.lengthOf(1)
            expect(plain.rows[0].owner).to.equal('plainuser')
        })

        it('keeps isolation when the URL carries a query string', async () => {
            const query = '?$select=ID,name,owner&$orderby=ID'
            const admin = await readAs(ADMIN, `/odata/v4/app/RestrictedOwned${query}`)
            const plain = await readAs(PLAIN, `/odata/v4/app/RestrictedOwned${query}`)

            expect(admin.key).to.not.equal(plain.key)
            expect(plain.rows.map(r => r.owner)).to.deep.equal(['plainuser'])
        })
    })

    describe('key stability', () => {

        it('derives one key for repeated identical requests', async () => {
            const first = await readAs(ADMIN, '/odata/v4/app/RestrictedOwned?$select=ID,name,owner')
            const second = await readAs(ADMIN, '/odata/v4/app/RestrictedOwned?$select=ID,name,owner')

            expect(first.key).to.equal(second.key)
        })

        it('serves the repeated request from the cache', async () => {
            await readAs(ADMIN, '/odata/v4/app/RestrictedOwned')
            const { headers } = await axios.get('/odata/v4/app/RestrictedOwned', { auth: ADMIN })

            expect(headers['x-sap-cap-cache']).to.equal('hit')
        })

        it('derives different keys for different query options', async () => {
            const plain = await readAs(ADMIN, '/odata/v4/app/RestrictedOwned')
            const ordered = await readAs(ADMIN, '/odata/v4/app/RestrictedOwned?$orderby=name desc')

            expect(plain.key).to.not.equal(ordered.key)
        })
    })
})
