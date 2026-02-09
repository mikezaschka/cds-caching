const cds = require('@sap/cds')
const { expect } = cds.test.in(__dirname + '/app')

describe('Adapter Tests', () => {

    describe('Postgres Adapter', () => {
        let cache;

        beforeEach(async () => {
            cache = await cds.connect.to("caching-postgres");

            await cache.clear();
        })

        it('support the basic operations', async () => {
            await cache.set("key", "value");
            const value = await cache.get("key");
            expect(value).to.eql("value");
        })

        afterEach(async () => {
            await cache.disconnect();
        })
    })

    describe('Redis Adapter', () => {
        let cache;

        beforeEach(async () => {
            cache = await cds.connect.to("caching-redis");

            await cache.clear();
        })

        it('support the basic operations', async () => {
            await cache.set("key", "value");
            const value = await cache.get("key");
            expect(value).to.eql("value");
        })


        afterEach(async () => {
            await cache.disconnect();
        })
        
    })

    describe('SQLite Adapter', () => {
        let cache;

        beforeEach(async () => {
            cache = await cds.connect.to("caching-sqlite");

            await cache.clear();
        })

        it('support the basic operations', async () => {
            await cache.set("key", "value");
            const value = await cache.get("key");
            expect(value).to.eql("value");
        })
        
        afterEach(async () => {
            await cache.disconnect();
        })
    })

    describe('In-Memory Adapter', () => {
        let cache;

        beforeEach(async () => {
            cache = await cds.connect.to("caching-in-memory");

            await cache.clear();
        })

        it('support the basic operations', async () => {
            await cache.set("key", "value");
            const value = await cache.get("key");
            expect(value).to.eql("value");
        })
        
        afterEach(async () => {
            await cache.disconnect();
        })
    })

})