const cds = require('@sap/cds')
const { test, GET, expect } = cds.test().in(__dirname + '/app')
beforeEach (test.data.reset)

describe('DeprecatedMethods', () => {

    const cachingOptions = {
        impl: "cds-caching"
    }
    let cache;

    // before connect to the cache service
    beforeEach(async () => {
        cache = await cds.connect.to(cachingOptions);
        await cache.clear();
    })

    describe('Comparison with rt methods', () => {

        it("should return same result as rt.wrap but without metadata", async () => {
            const expensiveOperation = async (value) => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return `processed_${value}`;
            }
            
            const deprecatedResult = await cache.wrap("compare_key", expensiveOperation)("test");
            const rtResult = await cache.rt.wrap("compare_key", expensiveOperation)("test");
            
            expect(deprecatedResult).to.eql(rtResult.result);
            expect(deprecatedResult).to.not.have.property('cacheKey');
            expect(deprecatedResult).to.not.have.property('metadata');
            expect(rtResult).to.have.property('cacheKey');
            expect(rtResult).to.have.property('metadata');
        })

        it("should return same result as rt.exec but without metadata", async () => {
            const expensiveOperation = async (value) => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return `processed_${value}`;
            }
            
            const deprecatedResult = await cache.exec("compare_exec_key", expensiveOperation, ["test"]);
            const rtResult = await cache.rt.exec("compare_exec_key", expensiveOperation, ["test"]);
            
            expect(deprecatedResult).to.eql(rtResult.result);
            expect(deprecatedResult).to.not.have.property('cacheKey');
            expect(deprecatedResult).to.not.have.property('metadata');
            expect(rtResult).to.have.property('cacheKey');
            expect(rtResult).to.have.property('metadata');
        })

        it("should return same result as rt.send but without metadata", async () => {
            const northwind = await cds.connect.to("Northwind");
            
            const deprecatedResult = await cache.send({
                method: "GET",
                path: "Products?$top=1"
            }, northwind, { key: "compare_send_key" });

            const rtResult = await cache.rt.send({
                method: "GET",
                path: "Products?$top=1"
            }, northwind, { key: "compare_send_key" });
            
            expect(deprecatedResult).to.eql(rtResult.result);
            expect(deprecatedResult).to.not.have.property('cacheKey');
            expect(deprecatedResult).to.not.have.property('metadata');
            expect(rtResult).to.have.property('cacheKey');
            expect(rtResult).to.have.property('metadata');
        })

        it("should return same result as rt.run but without metadata", async () => {
            const AppService = await cds.connect.to('AppService')
            const { Foo } = AppService.entities;
            
            const deprecatedResult = await cache.run(SELECT.one.from(Foo).limit(1), AppService, { key: "compare_run_key" });
            const rtResult = await cache.rt.run(SELECT.one.from(Foo).limit(1), AppService, { key: "compare_run_key" });
            
            expect(deprecatedResult).to.eql(rtResult.result);
            expect(deprecatedResult).to.not.have.property('cacheKey');
            expect(deprecatedResult).to.not.have.property('metadata');
            expect(rtResult).to.have.property('cacheKey');
            expect(rtResult).to.have.property('metadata');
        })

    })

}) 