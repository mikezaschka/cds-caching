const cds = require('@sap/cds')

describe('CachingService', () => {

    const { GET, expect } = cds.test(__dirname + '/app/')
    const cachingOptions = {
        kind: 'caching',
        impl: "cds-caching"
    }
    let cache;

    describe('basic methods', () => {

        // berfore connect to the cache service
        beforeEach(async () => {
            cache = await cds.connect.to(cachingOptions);
            cache.clear();
        })

        it('should set and get the caching value', async () => {
            await cache.set("key", ["value", "value2"]);

            const value = await cache.get("key");
            expect(value).to.eql(["value", "value2"]);
        })

        it("should respect the ttl", async () => {
            await cache.set("key", ["value", "value2"], { ttl: 1000 });

            const value = await cache.get("key");
            expect(value).to.eql(["value", "value2"]);

            await new Promise(resolve => setTimeout(resolve, 2000));
            const value2 = await cache.get("key");
            expect(value2).to.be.undefined;
        })

        it("should delete the key", async () => {
            await cache.set("key", ["value", "value2"]);

            await cache.delete("key");
            const value = await cache.get("key");
            expect(value).to.be.undefined;
        })

        it("should clear the cache", async () => {
            await cache.set("key", ["value", "value2"]);
            await cache.set("key2", ["value", "value2"]);

            await cache.clear();
            const value = await cache.get("key");
            const value2 = await cache.get("key2");
            expect(value).to.be.undefined;
            expect(value2).to.be.undefined;
        })

        it("should wrap an async function", async () => {
            const expensiveOperation = async (value) => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return value;
            }

            const cachedExpensiveOperation = cache.wrap("key", expensiveOperation);
            const value = await cachedExpensiveOperation("value");
            expect(value).to.eql(await cache.get("key"));
        })

        it("should handle non-existent keys", async () => {
            const value = await cache.get("nonexistent");
            expect(value).to.be.undefined;
        })

        it("should wrap an async function with ttl", async () => {
            const expensiveOperation = async (value) => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return value;
            }
            const cachedExpensiveOperation = cache.wrap("key", expensiveOperation, { ttl: 1000 });
            await cachedExpensiveOperation("value");

            await new Promise(resolve => setTimeout(resolve, 2000));
            const value2 = await cache.get("key");
            expect(value2).to.be.undefined;
        })

        it("should execute and cache an async function", async () => {
            const expensiveOperation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return ["expensive", "result"];
            }

            // First call should execute the function
            const result1 = await cache.exec("key", expensiveOperation);
            expect(result1).to.eql(["expensive", "result"]);

            // Second call should return cached result
            const result2 = await cache.exec("key", expensiveOperation);
            expect(result2).to.eql(["expensive", "result"]);
            expect(result2).to.eql(await cache.get("key"));
        })
    })

    describe('event handling', () => {

        beforeEach(async () => {
            cache = await cds.connect.to(cachingOptions);
            await cache.clear();
        })

        it('should call the SET before hook', async () => {
            const cache = await cds.connect.to(cachingOptions);
            cache.before("SET", (event) => event.data.value.value.push("value3"));
            await cache.set("key", ["value", "value2"]);

            const value = await cache.get("key");
            expect(value).to.eql(["value", "value2", "value3"]);
        })

        it('should call the GET before hook', async () => {
            const cache = await cds.connect.to(cachingOptions);
            await cache.set("prefix_key", ["value", "value2"]);

            cache.before("GET", (event) => event.data.key = `prefix_${event.data.key}`);

            const value = await cache.get("key");
            expect(value).to.eql(["value", "value2"]);
        })

        it('should call the DELETE before hook', async () => {
            const cache = await cds.connect.to(cachingOptions);
            await cache.set("prefix_key", ["value", "value2"]);

            cache.before("DELETE", (event) => event.data.key = `prefix_${event.data.key}`);

            await cache.delete("key");
            const value = await cache.get("key");
            expect(value).to.be.undefined;
        })

        it('should handle multiple before hooks in sequence', async () => {
            cache.before("SET", (event) => event.data.value.value.push("hook1"));
            cache.before("SET", (event) => event.data.value.value.push("hook2"));
            
            await cache.set("key", ["initial"]);
            
            const value = await cache.get("key");
            expect(value).to.eql(["initial", "hook1", "hook2"]);
        })

        it('should handle errors in before hooks', async () => {
            cache.before("SET", () => {
                throw new Error("Hook error");
            });

            try {
                await cache.set("key", ["value"]);
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect(error.message).to.equal("Hook error");
            }
        })

    })

})