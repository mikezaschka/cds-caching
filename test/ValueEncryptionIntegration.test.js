const cds = require('@sap/cds');
const { expect } = cds.test().in(__dirname + '/app')
const { PREFIX } = require('../lib/support/valueEncryption')

describe('encrypted cache at rest', () => {

    let cache
    let plain

    beforeEach(async () => {
        cache = await cds.connect.to('caching-encrypted')
        plain = await cds.connect.to('caching')
        await cache.clear()
        await plain.clear()
    })

    /** Raw stored string, read from the underlying store rather than through the service. */
    const stored = async (service, key) => service.cache.get(service.createKey(key))

    it('returns the value the caller stored', async () => {
        await cache.set('secret', { name: 'Alice', roles: ['admin'] })
        expect(await cache.get('secret')).to.deep.equal({ name: 'Alice', roles: ['admin'] })
    })

    it('writes an envelope, not the plaintext, into the store', async () => {
        await cache.set('secret', { name: 'Alice', ssn: '123-45-6789' })
        const raw = await stored(cache, 'secret')

        expect(raw).to.be.a('string')
        expect(raw).to.not.include('123-45-6789')
        expect(raw).to.not.include('Alice')
        expect(JSON.parse(raw).value.startsWith(PREFIX)).to.be.true
    })

    it('leaves a cache without encryption configured in plaintext', async () => {
        await plain.set('open', { name: 'Alice' })
        expect(await stored(plain, 'open')).to.include('Alice')
    })

    it('keeps tags readable, so invalidation does not need the key', async () => {
        await cache.set('tagged', { v: 1 }, { tags: ['group-a'] })
        const raw = JSON.parse(await stored(cache, 'tagged'))

        expect(raw.tags).to.deep.equal(['group-a'])
        expect(raw.timestamp).to.be.a('number')
    })

    it('invalidates by tag', async () => {
        await cache.set('a', { v: 1 }, { tags: ['group-a'] })
        await cache.set('b', { v: 2 }, { tags: ['group-b'] })

        await cache.deleteByTag('group-a')

        expect(await cache.get('a')).to.be.undefined
        expect(await cache.get('b')).to.deep.equal({ v: 2 })
    })

    it('decrypts entries listed through the iterator', async () => {
        await cache.set('one', { v: 1 })

        const entries = []
        for await (const [key, wrapped] of cache.iterator()) entries.push([key, wrapped])

        expect(entries).to.have.lengthOf(1)
        expect(entries[0][1].value).to.deep.equal({ v: 1 })
    })

    it('round-trips values of every shape', async () => {
        const values = [{ a: 1 }, ['x', 'y'], 'text', 42, true, null]

        for (const [index, value] of values.entries()) {
            await cache.set(`k${index}`, value)
            expect(await cache.get(`k${index}`), JSON.stringify(value)).to.deep.equal(value)
        }
    })

    it('reports an entry it cannot decrypt as a miss', async () => {
        await cache.set('secret', { v: 1 })
        const key = cache.createKey('secret')
        const wrapped = JSON.parse(await cache.cache.get(key))

        // Simulate a rotated key: a valid envelope this cache cannot open.
        const foreign = `${PREFIX}${Buffer.alloc(12).toString('base64')}:${Buffer.alloc(16).toString('base64')}:${Buffer.from('nonsense').toString('base64')}`
        await cache.cache.set(key, JSON.stringify({ ...wrapped, value: foreign }), 0)

        expect(await cache.get('secret')).to.be.undefined
    })

    it('still reads entries written before encryption was enabled', async () => {
        const key = cache.createKey('legacy')
        await cache.cache.set(key, JSON.stringify({ value: { v: 'plaintext' }, tags: [], timestamp: Date.now() }), 0)

        // Plaintext carries no envelope, so enabling encryption does not invalidate
        // a warm cache; those entries are replaced as they are refreshed.
        expect(await cache.get('legacy')).to.deep.equal({ v: 'plaintext' })
    })

    it('still records a hit for an encrypted entry', async () => {
        await cache.set('secret', { v: 1 })
        expect(await cache.has('secret')).to.be.true
    })

    describe('with the cds store, where rows are readable by anyone with database access', () => {

        let cdsCache

        beforeEach(async () => {
            cdsCache = await cds.connect.to('caching-cds-encrypted')
            await cdsCache.clear()
        })

        it('writes ciphertext into the CacheStore table', async () => {
            await cdsCache.set('secret', { name: 'Alice', ssn: '123-45-6789' })

            const rows = await cds.db.run(SELECT.from('plugin.cds_caching.CacheStore'))
            const row = rows.find(r => r.ID.includes(cdsCache.createKey('secret')))

            expect(row, 'entry present in the table').to.exist
            expect(row.value).to.not.include('123-45-6789')
            expect(row.value).to.not.include('Alice')

            // The column holds Keyv's envelope around our wrapped entry.
            const parse = (value) => (typeof value === 'string' ? JSON.parse(value) : value)
            const wrapped = parse(parse(row.value).value)

            expect(wrapped.value.startsWith(PREFIX), 'value is encrypted').to.be.true
            expect(wrapped.tags, 'tags stay readable').to.deep.equal([])
        })

        it('returns the value to the application', async () => {
            await cdsCache.set('secret', { name: 'Alice' })
            expect(await cdsCache.get('secret')).to.deep.equal({ name: 'Alice' })
        })
    })
})
