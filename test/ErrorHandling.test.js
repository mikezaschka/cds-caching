const cds = require('@sap/cds')
const { GET, expect } = cds.test().in(__dirname + '/app')

const FORCED_STORE_ERROR_MESSAGE = 'Forced cache store failure (test)'

/**
 * Force the underlying Keyv store adapter to fail deterministically.
 *
 * Important: We patch the *store adapter* methods (not Keyv's own methods),
 * so Keyv's `throwOnErrors` behavior is still exercised.
 *
 * @param {any} cacheService - The connected cds-caching service instance
 * @param {string} [message]
 * @returns {() => void} restore function
 */
const forceKeyvStoreFailure = (cacheService, message = FORCED_STORE_ERROR_MESSAGE) => {
    const keyv = cacheService?.cache
    if (!keyv) {
        throw new Error('Test setup failed: caching service has no `cache` (Keyv) instance')
    }

    const store = keyv.store || keyv.opts?.store
    if (!store) {
        throw new Error('Test setup failed: Keyv instance has no store adapter (`keyv.store`)')
    }

    const forcedError = new Error(message)
    const originals = {}

    const patch = (name, impl) => {
        if (typeof store[name] !== 'function') return
        originals[name] = store[name]
        store[name] = impl
    }

    // These are invoked by Keyv and wrapped in try/catch respecting `keyv.throwOnErrors`.
    patch('get', async () => { throw forcedError })
    patch('set', async () => { throw forcedError })
    patch('delete', async () => { throw forcedError })
    patch('clear', async () => { throw forcedError })

    // Keyv delegates `has()` directly to the adapter if it exists (no try/catch in Keyv),
    // so we mimic the adapter's behavior: throw only if the adapter is configured to throw.
    patch('has', async () => {
        if (store.throwOnErrors) throw forcedError
        if (typeof store.emit === 'function') store.emit('error', forcedError)
        return false
    })

    return () => {
        for (const [name, original] of Object.entries(originals)) {
            store[name] = original
        }
    }
}

const defaultOptions = {
    impl: "cds-caching",
    namespace: "test",
    store: "redis",
    credentials: {
        socket: {
            host: "localhost",
            port: 6379,
            keepAlive: true,
            pingInterval: 1000
        }
    },
    throwOnErrors: false    // Default is false
}

describe('CachingService Error Handling', () => {

    describe("with throwOnErrors false", () => {
        let cache;
        let AppService;
        let Foo;
        let restoreStoreFailure;

        beforeEach(async () => {
            cache = await cds.connect.to(defaultOptions);
            restoreStoreFailure = forceKeyvStoreFailure(cache);
            AppService = await cds.connect.to('AppService')
            Foo = AppService.entities.Foo
        });

        afterEach(() => {
            restoreStoreFailure?.()
            restoreStoreFailure = null
        })

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
        let restoreStoreFailure;

        beforeEach(async () => {
            cache = await cds.connect.to({ ...defaultOptions, throwOnErrors: true });
            restoreStoreFailure = forceKeyvStoreFailure(cache);
            AppService = await cds.connect.to('AppService')
            Foo = AppService.entities.Foo
        });

        afterEach(() => {
            restoreStoreFailure?.()
            restoreStoreFailure = null
        })
        
        describe("Basic Operations", () => {

            it('should throw errors when calling SET', async () => {
                await expect(cache.set("key", "value")).to.be.rejectedWith(Error);
            }, 10000);

            it('should throw errors when calling GET', async () => {
                await expect(cache.get("key")).to.be.rejectedWith(Error);
            }, 10000);

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
                expect(cacheErrors[0].operation).to.equal('set');
                expect(cacheErrors[0].message).to.contain(FORCED_STORE_ERROR_MESSAGE);
            }, 20000);

            it('should not throw errors when calling rt.send but return the result of the request', async () => {
                const northwind = await cds.connect.to("Northwind");

                const { result, cacheErrors, metadata } = await cache.rt.send({
                    method: "GET",
                    path: "Products?$top=2"
                }, northwind);

                expect(result).to.be.an('array');
                expect(cacheErrors).to.be.an('array');
                expect(cacheErrors.length).to.equal(1);
                expect(cacheErrors[0].operation).to.equal('set');
                expect(cacheErrors[0].message).to.contain(FORCED_STORE_ERROR_MESSAGE);
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
                expect(cacheErrors[0].operation).to.equal('set');
                expect(cacheErrors[0].message).to.contain(FORCED_STORE_ERROR_MESSAGE);
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
                expect(cacheErrors[0].operation).to.equal('set');
                expect(cacheErrors[0].message).to.contain(FORCED_STORE_ERROR_MESSAGE);
            });
            
        });
    });

}); 