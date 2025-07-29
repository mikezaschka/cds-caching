const cds = require('@sap/cds')
const { GET, expect } = cds.test().in(__dirname + '/app')

const defaultOptions = {
    impl: "cds-caching",
    namespace: "test",
    store: "redis",
    credentials: {
        socket: {
            host: "localhost",
            port: 6381, // Redis is not running on this port
            keepAlive: true,
            pingInterval: 1000
        }
    },
    throwOnErrors: false
}

describe('CachingService Error Handling', () => {

    describe("with throwOnErrors false", () => {
        let cache;
        let AppService;
        let Foo;

        beforeEach(async () => {
            cache = await cds.connect.to(defaultOptions);
            AppService = await cds.connect.to('AppService')
            Foo = AppService.entities.Foo
        });

        describe("Basic Operations", () => {

            it('should not throw errors when calling SET', async () => {
                await expect(cache.set("key", "value")).not.to.be.rejectedWith(Error);
                expect(await cache.set("key", "value")).to.equal(undefined);
            });

            it('should not throw errors when calling GET', async () => {
                await expect(cache.get("key")).not.to.be.rejectedWith(Error);
                expect(await cache.get("key")).to.equal(undefined);
            });

            it('should not throw errors when calling DELETE', async () => {
                await expect(cache.delete("key")).not.to.be.rejectedWith(Error);
                expect(await cache.delete("key")).to.equal(undefined);
            });

            it('should not throw errors when calling HAS', async () => {
                await expect(cache.has("key")).not.to.be.rejectedWith(Error);
                expect(await cache.has("key")).to.equal(false);
            });

        });

        describe("Read-Through Operations", () => {

            it('should not throw errors when calling rt.run', async () => {
                await expect(cache.rt.run(SELECT.from(Foo), cds)).not.to.be.rejectedWith(Error);

                const { result, cacheKey, cacheErrors, metadata } = await cache.rt.run(SELECT.from(Foo), cds)
                expect(result).to.be.an('array');
                expect(metadata.hit).to.equal(false);
                expect(cacheErrors).to.be.empty;
            });

            it('should not throw errors when calling rt.send but return the result of the request', async () => {
                const northwind = await cds.connect.to("Northwind");

                const { result, cacheErrors, metadata } = await cache.rt.send({
                    method: "GET",
                    path: "Products?$top=2"
                }, northwind);

                expect(result).to.be.an('array');
                expect(metadata.hit).to.equal(false);
                expect(cacheErrors).to.be.empty;
            });

            it('should not throw errors when calling rt.wrap with a function', async () => {
                const expensiveOperation = async () => {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return ["expensive", "result"];
                }
                const cachedExpensiveOperation = cache.rt.wrap("key", expensiveOperation);
                const { result, cacheErrors, metadata } = await cachedExpensiveOperation()
                expect(result).to.be.an('array');
                expect(metadata.hit).to.equal(false);
                expect(cacheErrors).to.be.empty;
            });

            it('should not throw errors when calling rt.execute with a function', async () => {
                const expensiveOperation = async () => {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return ["expensive", "result"];
                }
                const { result, cacheKey, cacheErrors, metadata } = await cache.rt.exec("key", expensiveOperation);
                expect(result).to.be.an('array');
                expect(cacheKey).to.be.a('string');
                expect(cacheErrors).to.be.empty;
            });
        });
    });

    describe("with throwOnErrors true", () => {
        let cache;
        let AppService;
        let Foo;

        beforeEach(async () => {
            cache = await cds.connect.to({ ...defaultOptions, throwOnErrors: true });
            AppService = await cds.connect.to('AppService')
            Foo = AppService.entities.Foo
        });
        
        describe("Basic Operations", () => {

            it('should throw errors when calling SET', async () => {
                await expect(cache.set("key", "value")).to.be.rejectedWith(Error);
            });

            it('should throw errors when calling GET', async () => {
                await expect(cache.get("key")).to.be.rejectedWith(Error);
            });

            it('should throw errors when calling DELETE', async () => {
                await expect(cache.delete("key")).to.be.rejectedWith(Error);
            });

           it('should throw errors when calling HAS', async () => {
                await expect(cache.has("key")).to.be.rejectedWith(Error);
            });
     
        });

        describe("Read-Through Operations", () => {

            it('should contain errors when calling rt.run', async () => {
                const { result, cacheKey, cacheErrors, metadata } = await cache.rt.run(SELECT.from(Foo), cds)
                expect(result).to.be.an('array');
                expect(cacheErrors).to.be.an('array');
                expect(cacheErrors.length).to.equal(1);
                expect(cacheErrors[0].message).to.equal('Redis client is not connected or has failed to connect. This is thrown because throwOnConnectError is set to true.');
            });

            it('should not throw errors when calling rt.send but return the result of the request', async () => {
                const northwind = await cds.connect.to("Northwind");

                const { result, cacheErrors, metadata } = await cache.rt.send({
                    method: "GET",
                    path: "Products?$top=2"
                }, northwind);

                expect(result).to.be.an('array');
                expect(cacheErrors).to.be.an('array');
                expect(cacheErrors.length).to.equal(1);
                expect(cacheErrors[0].message).to.equal('Redis client is not connected or has failed to connect. This is thrown because throwOnConnectError is set to true.');
            });

            it('should not throw errors when calling rt.wrap with a function', async () => {
                const expensiveOperation = async () => {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return ["expensive", "result"];
                }
                const cachedExpensiveOperation = cache.rt.wrap("key", expensiveOperation);
                const { result, cacheErrors, metadata } = await cachedExpensiveOperation()
                expect(result).to.be.an('array');
                expect(cacheErrors).to.be.an('array');
                expect(cacheErrors.length).to.equal(1);
                expect(cacheErrors[0].message).to.equal('Redis client is not connected or has failed to connect. This is thrown because throwOnConnectError is set to true.');
            });

            it('should not throw errors when calling rt.execute with a function', async () => {
                const expensiveOperation = async () => {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return ["expensive", "result"];
                }
                const { result, cacheKey, cacheErrors, metadata } = await cache.rt.exec("key", expensiveOperation);
                expect(result).to.be.an('array');
                expect(cacheErrors).to.be.an('array');
                expect(cacheErrors.length).to.equal(1);
                expect(cacheErrors[0].message).to.equal('Redis client is not connected or has failed to connect. This is thrown because throwOnConnectError is set to true.');
            });
            
        });
    });

}); 