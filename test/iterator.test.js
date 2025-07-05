const cds = require('@sap/cds')
const { GET, expect } = cds.test.in(__dirname + '/app')

describe('Iterator', () => {
    
    const cachingOptions = {
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

        it('should iterate over all keys with a tag', async () => {
            await cache.set("key1", "value1", { tags: ["tag"] });
            await cache.set("key2", "value2", { tags: ["tag"] });
            await cache.set("key3", "value3", { tags: ["tag"] });

            const keys = [];
            for await (const [key] of cache.iterator({ tags: ["tag"] })) {
                keys.push(key);
            }
            expect(keys).to.have.members(["key1", "key2", "key3"]);
        })
    })
})