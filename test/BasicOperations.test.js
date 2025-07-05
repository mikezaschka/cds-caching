const cds = require('@sap/cds')
const { GET, expect } = cds.test.in(__dirname + '/app')

describe('CachingService', () => {

    const cachingOptions = {
        impl: "cds-caching"
    }
    let cache;

    describe('basic operations', () => {

        // berfore connect to the cache service
        beforeEach(async () => {
            cache = await cds.connect.to(cachingOptions);
            await cache.clear();
        })

        describe('set and get', () => {

            it('should set and get the caching value', async () => {
                await cache.set("key", ["value", "value2"]);
    
                const value = await cache.get("key");
                expect(value).to.eql(["value", "value2"]);
            });

            it("should get a non-existent key", async () => {
                const value = await cache.get("key");
                expect(value).to.be.undefined;
            })

            it("should store the value as a string", async () => {
                await cache.set("key", "value");

                const value = await cache.get("key");
                expect(value).to.eql("value");
            })

            it("should store the value as a number", async () => {
                await cache.set("key", 1);

                const value = await cache.get("key");
                expect(value).to.eql(1);
            })

            it("should store the value as a boolean", async () => {
                await cache.set("key", true);

                const value = await cache.get("key");
                expect(value).to.eql(true);
            })

        })

        describe('has', () => {
            it("should return true if the key exists", async () => {
                await cache.set("key", "value");
                const value = await cache.has("key");
                expect(value).to.eql(true);
            })

            it("should return false if the key does not exist", async () => {
                const value = await cache.has("key");
                expect(value).to.eql(false);
            })
        })

        describe('delete', () => {
            it("should delete the key", async () => {
                await cache.set("key", "value");
                await cache.delete("key");
                const value = await cache.get("key");
                expect(value).to.be.undefined;
            })
        })

        describe('clear', () => {
            it("should clear the cache", async () => {
                await cache.set("key", "value");
                await cache.clear();
                const value = await cache.get("key");
                expect(value).to.be.undefined;
            })
        })

        describe('ttl', () => {
            it("should respect the ttl", async () => {
                await cache.set("key", ["value", "value2"], { ttl: 1000 });

                const value = await cache.get("key");
                expect(value).to.eql(["value", "value2"]);

                await new Promise(resolve => setTimeout(resolve, 2000));
                const value2 = await cache.get("key");
                expect(value2).to.be.undefined;
            })

            it("should not respect the ttl if it is not set", async () => {
                await cache.set("key", ["value", "value2"]);

                const value = await cache.get("key");
                expect(value).to.eql(["value", "value2"]);

                await new Promise(resolve => setTimeout(resolve, 2000));
                const value2 = await cache.get("key");
                expect(value2).to.eql(["value", "value2"]);
            })
        })

        describe('deleteByTag', () => {     
            it("should delete the key by tag", async () => {
                await cache.set("key", ["value", "value2"], { tags: ["tag"] });
                await cache.deleteByTag("tag");
                const value = await cache.get("key");
                expect(value).to.be.undefined;
            })

            it("should not delete the key if the tag does not exist", async () => {
                await cache.set("key", ["value", "value2"], { tags: ["tag"] });
                await cache.deleteByTag("tag2");
                const value = await cache.get("key");
                expect(value).to.eql(["value", "value2"]);
            })
        })

        describe('metadata', () => {
            it("should return the metadata", async () => {
                await cache.set("key", ["value", "value2"], { tags: ["tag"] });
                const metadata = await cache.metadata("key");
                expect(metadata).to.have.property('tags').that.eql(["tag"]);
                expect(metadata).to.have.property('timestamp').that.is.a('number');
            })
        })

        describe('tags', () => {
            it("should return the tags", async () => {
                await cache.set("key", ["value", "value2"], { tags: ["tag"] });
                const tags = await cache.tags("key");
                expect(tags).to.eql(["tag"]);
            })
        })

        describe('dynamic tags', () => {
            it("should return the dynamic tags", async () => {
                await cache.set("key", [{user: "123", name: "John Doe"}, {user: "456", name: "Jane Doe"}], { tags: [{ data: "user", prefix: "user-"}] });
                const tags = await cache.tags("key");
                expect(tags).to.eql(["user-123", "user-456"]);

                const value = await cache.get("key");
                expect(value).to.eql([{user: "123", name: "John Doe"}, {user: "456", name: "Jane Doe"}]);
            })
        })

        describe('iterator', () => {
            it("should return the iterator", async () => {
                await cache.set("key", ["value", "value2"], { tags: ["tag"] });
                const iterator = await cache.iterator();
                expect(iterator).to.be.an("AsyncGenerator");
            })
        })
      
    })

    describe('event handling', () => {

        beforeEach(async () => {
            cache = await cds.connect.to(cachingOptions);
            await cache.clear();
        })

        it('should call the SET before hook', async () => {
            const cache = await cds.connect.to(cachingOptions);
            cache.before("SET", (event) => {
                event.data.value.value.push("value3");
            });
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