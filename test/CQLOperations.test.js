const cds = require('@sap/cds')
const { test, GET, expect } = cds.test().in(__dirname + '/app')
beforeEach (test.data.reset)

describe('Read-Through Operations', () => {

    const cachingOptions = {
        impl: "cds-caching"
    }
    let cache;

    describe('CQL query caching', () => {

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
            const { result, cacheKey } = await cache.rt.run(query, cds, { detailed: true })

            const cachedData = await cache.get(cacheKey)
            expect(cachedData).to.eql(await cache.get(cacheKey))
        })

        it("should cache a query by using the run executor with a custom value key", async () => {
            const query = SELECT.from(Foo)
            const { result, cacheKey } = await cache.rt.run(query, cds, { key: { value: 'customKey' } })

            const cachedData = await cache.get('customKey')
            expect(cachedData).to.eql(result)
        })

        it("should cache a query by using the run executor with a custom template key", async () => {
            const query = SELECT.from(Foo)
            const { result, cacheKey } = await cache.rt.run(query, cds, { key: { template: 'customKey_{hash}' } })
            const key = cache.createKey(query, { template: 'customKey_{hash}' })

            const cachedData = await cache.get(key)
            expect(cachedData).to.eql(result)
        })

        it('should cache a query by using the run executor with a ttl', async () => {
            const query = SELECT.from(Foo)
            const { result, cacheKey } = await cache.rt.run(query, cds, { ttl: 1000 })

            const cachedData = await cache.get(cacheKey)
            expect(cachedData).to.eql(await cache.get(cacheKey))

            await new Promise(resolve => setTimeout(resolve, 2000));
            const cachedData2 = await cache.get(cacheKey)
            expect(cachedData2).to.be.undefined
        })

        it("should not cache a query if it's not a SELECT query", async () => {
            const query = INSERT.into(Foo).entries([{ id: 1 }])
            expect(cache.createKey(query)).to.be.undefined  
        })

        it("should execute an UPDATE query but not cache it", async () => {
            const query = UPDATE(Foo).set({ ID: 1 }).where({ ID: 1 })
            await cache.rt.run(query, cds)
            expect(await cache.get(query)).to.be.undefined
        })

        it("should cache a query run against an ApplicationService", async () => {
            const { result, cacheKey } = await cache.rt.run(AppService.read(Foo), AppService, { detailed: true })
            expect(result).to.eql(await AppService.read(Foo))
            expect(await cache.get(cacheKey)).to.eql(result)
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

        it("should return cached result on subsequent query executions", async () => {
            const query = SELECT.from(Foo)
            
            // First execution - should execute the query
            const { result: data1 } = await cache.rt.run(query, cds)
            expect(data1).to.be.an('array')
            
            // Second execution - should return cached result
            const { result: data2 } = await cache.rt.run(query, cds)
            expect(data2).to.eql(data1)
            
            // Verify it's actually cached
            const cachedData = await cache.get(query)
            expect(cachedData).to.eql(data1)
        })

        it("should handle different queries independently", async () => {
            const query1 = SELECT.from(Foo).where({ ID: 1 })
            const query2 = SELECT.from(Foo).where({ ID: 2 })
            
            const { result: data1 } = await cache.rt.run(query1, cds)
            const { result: data2 } = await cache.rt.run(query2, cds)
            
            expect(data1).to.not.eql(data2)
            expect(await cache.get(query1)).to.eql(data1)
            expect(await cache.get(query2)).to.eql(data2)
        })

        it("should work with TTL settings", async () => {
            const query = SELECT.from(Foo)
            
            // Execute with 1 second TTL
            const { result: data } = await cache.rt.run(query, cds, { ttl: 1000 })
            expect(data).to.be.an('array')
            expect(await cache.get(query)).to.eql(data)

            // Wait for TTL to expire
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // Should be undefined after TTL expires
            expect(await cache.get(query)).to.be.undefined
        })

        it("should work with tags", async () => {
            const query = SELECT.from(Foo)
            const { result: data } = await cache.rt.run(query, cds, { tags: ["tag1", "tag2"] })
            
            expect(data).to.be.an('array')
            
            // Verify tags are stored
            const metadata = await cache.metadata(query)
            expect(metadata.tags).to.include("tag1")
            expect(metadata.tags).to.include("tag2")
        })

        it("should work with dynamic tags", async () => {
            const query = SELECT.from(Foo)
            const { result: data } = await cache.rt.run(query, cds, { tags: [{ prefix: "tag1_", data: "name" }] })

            expect(data).to.be.an('array')
            expect(await cache.get(query)).to.eql(data)
            const tags = await cache.tags(query)
            expect(tags).to.include("tag1_Foo1")
            expect(tags).to.include("tag1_Foo2")
        })

        it("should handle queries with WHERE clauses", async () => {
            const query = SELECT.from(Foo).where({ ID: 1 })
            const { result: data } = await cache.rt.run(query, cds)
            
            expect(data).to.be.an('array')
            expect(await cache.get(query)).to.eql(data)
        })

        it("should handle queries with ORDER BY clauses", async () => {
            const query = SELECT.from(Foo).orderBy({ ID: 'asc' })
            const { result: data } = await cache.rt.run(query, cds)
            
            expect(data).to.be.an('array')
            expect(await cache.get(query)).to.eql(data)
        })

        it("should handle queries with LIMIT clauses", async () => {
            const query = SELECT.from(Foo).limit(5)
            const { result: data } = await cache.rt.run(query, cds)
            
            expect(data).to.be.an('array')
            expect(data.length).to.be.at.most(5)
            expect(await cache.get(query)).to.eql(data)
        })

        it("should handle queries with complex WHERE conditions", async () => {
            const query = SELECT.from(Foo).where({ ID: { '>=': 1, '<=': 10 } })
            const { result: data } = await cache.rt.run(query, cds)
            
            expect(data).to.be.an('array')
            expect(await cache.get(query)).to.eql(data)
        })

        it("should handle queries with IN clauses", async () => {
            const query = SELECT.from(Foo).where({ ID: { in: [1, 2, 3] } })
            const { result: data } = await cache.rt.run(query, cds)
            
            expect(data).to.be.an('array')
            expect(await cache.get(query)).to.eql(data)
        })

        it("should handle queries with LIKE clauses", async () => {
            const query = SELECT.from(Foo).where({ name: { like: '%test%' } })
            const { result: data } = await cache.rt.run(query, cds)
            
            expect(data).to.be.an('array')
            expect(await cache.get(query)).to.eql(data)
        })

        it("should handle queries as string literals", async () => {
            const query = SELECT `name` .from(Foo);
            const { result: data } = await cache.rt.run(query, cds)
            
            expect(data).to.be.an('array')
            // Check that all items in the array have a name property
            data.forEach(item => {
                expect(item).to.have.property('name')
                expect(item).to.not.have.property('ID')
            })
            expect(await cache.get(query)).to.eql(data)
        })

       


        it("should handle queries with empty results", async () => {
            const query = SELECT.from(Foo).where({ ID: 99999 }) // Non-existent ID
            const { result: data } = await cache.rt.run(query, cds)
            
            expect(data).to.be.an('array')
            expect(data).to.have.length(0)
            expect(await cache.get(query)).to.eql(data)
        })

        it("should handle queries with large result sets", async () => {
            const query = SELECT.from(Foo)
            const { result: data } = await cache.rt.run(query, cds)
            
            expect(data).to.be.an('array')
            expect(await cache.get(query)).to.eql(data)
        })

      
        it("should handle queries with multiple TTL and tag combinations", async () => {
            const query = SELECT.from(Foo)
            const { result: data } = await cache.rt.run(query, cds, { 
                ttl: 5000,
                tags: ["query", "foo", "select"]
            })
            
            expect(data).to.be.an('array')
            expect(await cache.get(query)).to.eql(data)
            
            // Verify tags are stored
            const metadata = await cache.metadata(query)
            expect(metadata.tags).to.include("query")
            expect(metadata.tags).to.include("foo")
            expect(metadata.tags).to.include("select")
        })

        it("should handle queries with custom key and TTL", async () => {
            const query = SELECT.from(Foo)
            const { result: data, cacheKey } = await cache.rt.run(query, cds, { 
                key: { template: 'custom_query_{hash}' },
                ttl: 3000
            })
            
            expect(data).to.be.an('array')
            delete query.cacheKey
            
            // Should not be stored under the original key
            expect(await cache.get(query)).to.be.undefined
            
            expect(await cache.get(cacheKey)).to.eql(data)
        })

        it("should handle queries with all options combined", async () => {
            const query = SELECT.from(Foo).where({ ID: { '>': 0 } })
            const { result: data }   = await cache.rt.run(query, cds, { 
                key: { template: 'complex_query_{hash}' },
                ttl: 10000,
                tags: ["complex", "filtered", "foo"]
            })
            
            expect(data).to.be.an('array')
            
            // Verify custom key storage
            const customKey = cache.createKey(query, { template: 'complex_query_{hash}' })
            expect(await cache.get(customKey)).to.eql(data)
            
            // Verify tags are stored
            const metadata = await cache.metadata(customKey)
            expect(metadata.tags).to.include("complex")
            expect(metadata.tags).to.include("filtered")
            expect(metadata.tags).to.include("foo")
        })

    })

})
