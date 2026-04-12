const cds = require('@sap/cds');
const { GET, POST, expect } = cds.test().in(__dirname + '/app/')

describe('KeyvCDS Store Adapter', () => {

    let cache;
    let appService;

    beforeEach(async () => {
        cache = await cds.connect.to("caching-cds");
        appService = await cds.connect.to("AppService");
        await cache.clear();
    })

    describe('Basic Operations', () => {
        it('should set and get a string value', async () => {
            await cache.set('str-key', 'hello world')
            const result = await cache.get('str-key')
            expect(result).to.equal('hello world')
        })

        it('should set and get a JSON object value', async () => {
            const obj = { id: 1, name: 'test', nested: { foo: 'bar' } }
            await cache.set('obj-key', obj)
            const result = await cache.get('obj-key')
            expect(result).to.deep.equal(obj)
        })

        it('should set and get a large value', async () => {
            const largeValue = 'x'.repeat(10000)
            await cache.set('large-key', largeValue)
            const result = await cache.get('large-key')
            expect(result).to.equal(largeValue)
        })

        it('should return undefined for non-existent key', async () => {
            const result = await cache.get('nonexistent')
            expect(result).to.be.undefined
        })

        it('should overwrite existing key with set', async () => {
            await cache.set('overwrite-key', 'first')
            await cache.set('overwrite-key', 'second')
            const result = await cache.get('overwrite-key')
            expect(result).to.equal('second')
        })

        it('should delete an existing key', async () => {
            await cache.set('del-key', 'value')
            await cache.delete('del-key')
            const result = await cache.get('del-key')
            expect(result).to.be.undefined
        })

        it('should clear all entries', async () => {
            await cache.set('clear-1', 'a')
            await cache.set('clear-2', 'b')
            await cache.clear()
            const r1 = await cache.get('clear-1')
            const r2 = await cache.get('clear-2')
            expect(r1).to.be.undefined
            expect(r2).to.be.undefined
        })

        it('should report has() correctly', async () => {
            await cache.set('has-key', 'value')
            const exists = await cache.has('has-key')
            const missing = await cache.has('missing-key')
            expect(exists).to.be.true
            expect(missing).to.be.false
        })

        it('should iterate over all entries', async () => {
            await cache.set('iter-1', 'a')
            await cache.set('iter-2', 'b')
            await cache.set('iter-3', 'c')

            const entries = []
            for await (const [key, value] of cache.iterator()) {
                entries.push({ key, value: value.value })
            }
            expect(entries).to.have.length(3)
        })

        it('should iterate correctly with empty store', async () => {
            const entries = []
            for await (const [key, value] of cache.iterator()) {
                entries.push(key)
            }
            expect(entries).to.have.length(0)
        })
    })

    describe('TTL / Expiry', () => {
        it('should return value before TTL expires', async () => {
            await cache.set('ttl-key', 'value', { ttl: 60000 })
            const result = await cache.get('ttl-key')
            expect(result).to.equal('value')
        })

        it('should return undefined after TTL expires', async () => {
            // Set with 1ms TTL
            await cache.set('ttl-expired', 'value', { ttl: 1 })
            // Wait a bit for expiry
            await new Promise(resolve => setTimeout(resolve, 50))
            const result = await cache.get('ttl-expired')
            expect(result).to.be.undefined
        })

        it('should not return expired entries via has()', async () => {
            await cache.set('ttl-has', 'value', { ttl: 1 })
            await new Promise(resolve => setTimeout(resolve, 50))
            const result = await cache.has('ttl-has')
            expect(result).to.be.false
        })

        it('should handle TTL of 0 (no expiry)', async () => {
            await cache.set('no-ttl', 'value', { ttl: 0 })
            const result = await cache.get('no-ttl')
            expect(result).to.equal('value')
        })
    })

    describe('Integration with CachingService', () => {
        it('should work with cache.set() / cache.get() high-level API', async () => {
            await cache.set('api-key', { data: 'test' })
            const result = await cache.get('api-key')
            expect(result).to.deep.equal({ data: 'test' })
        })

        it('should work with cache.rt.run() for read-through caching', async () => {
            const query = SELECT.from('Foo')
            const { result: r1, cacheKey: k1 } = await cache.rt.run(query, appService)
            expect(r1).to.be.an('array')
            expect(k1).to.be.a('string')

            // Second call should hit cache
            const { result: r2 } = await cache.rt.run(query, appService)
            expect(r2).to.deep.equal(r1)
        })

        it('should work with cache.rt.wrap() for function caching', async () => {
            let execCount = 0
            const fn = async (param) => {
                execCount++
                return `result_${param}`
            }

            const wrapped = cache.rt.wrap('wrap-test', fn)
            const { result: r1 } = await wrapped('arg1')
            expect(r1).to.equal('result_arg1')
            expect(execCount).to.equal(1)

            const { result: r2 } = await wrapped('arg1')
            expect(r2).to.equal('result_arg1')
            expect(execCount).to.equal(1) // not executed again
        })

        it('should work with cache.deleteByTag() for tag-based invalidation', async () => {
            await cache.set('tagged-1', 'val1', { tags: ['group-a'] })
            await cache.set('tagged-2', 'val2', { tags: ['group-a'] })
            await cache.set('tagged-3', 'val3', { tags: ['group-b'] })

            await cache.deleteByTag('group-a')

            expect(await cache.get('tagged-1')).to.be.undefined
            expect(await cache.get('tagged-2')).to.be.undefined
            expect(await cache.get('tagged-3')).to.deep.equal('val3')
        })

        it('should work with cache.metadata() to retrieve entry metadata', async () => {
            await cache.set('meta-key', 'value', { tags: ['tag1'] })
            const meta = await cache.metadata('meta-key')
            expect(meta).to.have.property('timestamp')
        })

        it('should work with cache.iterator() to enumerate entries', async () => {
            await cache.set('enum-1', 'a')
            await cache.set('enum-2', 'b')

            const keys = []
            for await (const [key] of cache.iterator()) {
                keys.push(key)
            }
            expect(keys.length).to.be.greaterThanOrEqual(2)
        })
    })

    describe('Concurrent Operations', () => {
        it('should handle multiple parallel set operations', async () => {
            const promises = []
            for (let i = 0; i < 20; i++) {
                promises.push(cache.set(`parallel-${i}`, `value-${i}`))
            }
            await Promise.all(promises)

            for (let i = 0; i < 20; i++) {
                const result = await cache.get(`parallel-${i}`)
                expect(result).to.equal(`value-${i}`)
            }
        })

        it('should handle set and get in rapid succession', async () => {
            await cache.set('rapid', 'first')
            await cache.set('rapid', 'second')
            const result = await cache.get('rapid')
            expect(result).to.equal('second')
        })
    })

    describe('Edge Cases', () => {
        it('should handle very long keys', async () => {
            const longKey = 'k'.repeat(800)
            await cache.set(longKey, 'value')
            const result = await cache.get(longKey)
            expect(result).to.equal('value')
        })

        it('should handle empty string values', async () => {
            await cache.set('empty', '')
            const result = await cache.get('empty')
            expect(result).to.equal('')
        })

        it('should handle special characters in keys', async () => {
            const specialKey = 'key:with/special!chars@#$%'
            await cache.set(specialKey, 'value')
            const result = await cache.get(specialKey)
            expect(result).to.equal('value')
        })
    })
})
