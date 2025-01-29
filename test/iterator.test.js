const cds = require('@sap/cds')

describe('CachingService', () => {

    const { GET, expect } = cds.test(__dirname + '/app/')
    const cachingOptions = {
        kind: 'caching',
        impl: "cds-caching"
    }
    let cache;

    describe('iteration', () => {

        beforeEach(async () => {
            cache = await cds.connect.to(cachingOptions);
            await cache.clear();
        })

        it('should iterate over all keys', async () => {
            await cache.set("key1", "value1");
            await cache.set("key2", "value2");
            await cache.set("key3", "value3");

            const keys = [];
            for await (const [key] of cache.iterator()) {
                keys.push(key);
            }
            expect(keys).to.have.members(["key1", "key2", "key3"]);
        })


    })
})