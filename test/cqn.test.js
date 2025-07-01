const cds = require('@sap/cds');
const { expect } = cds.test().in(__dirname + '/app')

describe('CachingService', () => {

    const cachingOptions = {
        impl: "cds-caching"
    }
    let cache;

    describe('CQN query caching', () => {

        let AppService
        let Foo

        beforeEach(async () => {
            cache = await cds.connect.to(cachingOptions);
            await cache.clear();
            AppService = await cds.connect.to('AppService')
            Foo = AppService.entities.Foo
        })

        it('should create a query key', async () => {
            const query = SELECT.from(Foo)
            const key = cache.createKey(query)
            expect(key).to.be.a('string')
        })

        it("should cache a query by using the run executor", async () => {
            const query = SELECT.from(Foo)
            const data = await cache.run(query, cds)

            const cachedData = await cache.get(query)
            expect(cachedData).to.eql(data)
        })

        it("should cache a query by using the run executor with a custom value key", async () => {
            const query = SELECT.from(Foo)
            const data = await cache.run(query, cds, { key: { value: 'customKey' } })

            const cachedData = await cache.get('customKey')
            expect(cachedData).to.eql(data)
        })

        it("should cache a query by using the run executor with a custom template key", async () => {
            const query = SELECT.from(Foo)
            const data = await cache.run(query, cds, { key: { template: 'customKey_{hash}' } })
            const key = cache.createKey(query, { template: 'customKey_{hash}' })

            const cachedData = await cache.get(key)
            expect(cachedData).to.eql(data)
        })

        it('should cache a query by using the run executor with a ttl', async () => {
            const query = SELECT.from(Foo)
            const data = await cache.run(query, cds, { ttl: 1 })

            const cachedData = await cache.get(query)
            expect(cachedData).to.eql(data)

            await new Promise(resolve => setTimeout(resolve, 2000));
            const cachedData2 = await cache.get(query)
            expect(cachedData2).to.be.undefined
        })

        it("should not cache a query if it's not a SELECT query", async () => {
            const query = INSERT.into(Foo).entries([{ id: 1 }])
            expect(cache.createKey(query)).to.be.undefined  
        })

        it("should execute an UPDATE query but not cache it", async () => {
            const query = UPDATE(Foo).set({ ID: 1 }).where({ ID: 1 })
            await cache.run(query, cds)
            expect(await cache.get(query)).to.be.undefined
        })

        it("should cache a query run against an ApplicationService", async () => {
            await cache.run(AppService.read(Foo), AppService)
            expect(await cache.get(AppService.read(Foo))).to.eql(await AppService.read(Foo))
        })

        it('should cache a query', async () => {
            const AppService = await cds.connect.to('AppService')
            const { Foo } = AppService.entities

            const query = SELECT.from(Foo)
            const data = await query;

            await cache.set(query, data)

            const cachedData = await cache.get(query)
            expect(cachedData).to.eql(data)
        })

    })

})
