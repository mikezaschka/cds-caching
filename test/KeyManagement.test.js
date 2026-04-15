const cds = require('@sap/cds');
const { GET, POST, expect } = cds.test().in(__dirname + '/app/')

describe('Key Management - Testing', () => {

    let cache;
    let appService;

    beforeEach(async () => {
        cache = await cds.connect.to("caching");
        appService = await cds.connect.to("AppService");
        cache.runtimeConfigManager.options.keyManagement = {
            isUserAware: false,
            isTenantAware: false,
            isLocaleAware: false
        }
        await cache.reloadRuntimeConfiguration();
        await cache.clear();
    })

    describe("Basic Key Creation", () => {
        it("should create a key from string", () => {
            const key = cache.createKey("test")
            expect(key).to.be.a("string")
            expect(key).to.equal("test") // String used directly as hash
        })

        it("should create a key from object", () => {
            const obj = { id: 1, name: "test" }
            const key = cache.createKey(obj)
            expect(key).to.be.a("string")
            expect(key).to.not.equal("test") // Object gets hashed
        })

        it("should create a key from query", () => {
            const query = SELECT.from('Foo').where({ id: 1 })
            const key = cache.createKey(query)
            expect(key).to.be.a("string")
            expect(key).to.not.equal("test") // Query gets hashed
        })
    })

    describe("Key Creation with Context", () => {
        it("should create a key with context and template", () => {
            cds.context = { tenant:'t1', user:'u2' }
            const key = cache.createKey("test", {}, "{tenant}:{user}:{hash}")
            expect(key).to.be.a("string")
            expect(key).to.equal("t1:u2:test")
        })

        it("should create a key with context and template", () => {
            cds.context = { tenant:'t1', user:'u2', locale:'de' }
            const key = cache.createKey("test", {}, "{tenant}:{user}:{locale}:{hash}")
            expect(key).to.be.a("string")
            expect(key).to.equal("t1:u2:de:test")
        })

        it("should use additional context over cds.context", () => {
            cds.context = { tenant:'t1', user:'u2', locale:'de' }
            const additionalContext = { tenant:'custom-tenant', user:'custom-user' }
            const key = cache.createKey("test", additionalContext, "{tenant}:{user}:{locale}:{hash}")
            expect(key).to.equal("custom-tenant:custom-user:de:test")
        })

        it("should handle missing context values", () => {
            const key = cache.createKey("test", {}, "{tenant}:{user}:{locale}:{hash}")
            expect(key).to.equal("global:anonymous:en:test")
        })
    })

    describe("Global Configuration Tests", () => {
        it("should use global configuration when no template provided", async () => {
            // Test with default config (no tenant/user/locale)
            cds.context = { user: { id: 'u2' }, tenant: 't1', locale: 'de' }


            const key = cache.createKey("test")
            expect(key).to.equal("test") // Only hash, no context
        })

        it("should handle function arguments in template", () => {
            const args = ["param1", "param2", 123]
            const context = { args }
            const key = cache.createKey("base", context, "{hash}:{args[0]}:{args[1]}:{args[2]}")
            expect(key).to.equal("base:param1:param2:123")
        })

        it("should handle complex objects in arguments", () => {
            const args = [{ id: 1, name: "test" }, "param2"]
            const context = { args }
            const key = cache.createKey("base", context, "{hash}:{args[0]}:{args[1]}")
            expect(key).to.equal("base:4da948eba118113aae62402c20710364:param2") // Object gets hashed
        })
    })

    describe("Integration Tests - Key Generation Only", () => {

        beforeEach(async () => {
            cache.runtimeConfigManager.options.keyManagement.isUserAware = false;
            cache.runtimeConfigManager.options.keyManagement.isTenantAware = false;
            cache.runtimeConfigManager.options.keyManagement.isLocaleAware = false;
            await cache.reloadRuntimeConfiguration();
        })

        it("should generate consistent keys for rt.run with query", async () => {
            // First call
            const { cacheKey: key1 } = await cache.rt.run(SELECT.from('Foo').where({ ID: 1 }), appService)
            expect(key1).to.be.a("string")
            
            // Second call should generate same key
            const { cacheKey: key2 } = await cache.rt.run(SELECT.from('Foo').where({ ID: 1 }), appService)
            expect(key2).to.equal(key1)
        })

        it("should generate different keys for different queries", async () => {
            const query1 = SELECT.from('Foo').where({ ID: 1 })
            const query2 = SELECT.from('Foo').where({ ID: 2 })
            
            const { cacheKey: key1 } = await cache.rt.run(query1, appService)
            const { cacheKey: key2 } = await cache.rt.run(query2, appService)
            
            expect(key1).to.not.equal(key2)
        })

        it("should generate keys with context for rt.run with query", async () => {
            cds.context = { tenant:'t1', user:'u2', locale:'de' }
            const query = SELECT.from('Foo').where({ ID: 1 })
            
            const { cacheKey } = await cache.rt.run(query, appService, {
                key: "{tenant}:{user}:{locale}:{hash}"
            })
            
            expect(cacheKey).to.match(/^t1:u2:de:/)
        })

        it("should generate consistent keys for rt.wrap", async () => {
            let executionCount = 0
            const expensiveOperation = async (param) => {
                executionCount++
                return `result_${param}_${executionCount}`
            }
            
            const cachedOperation = cache.rt.wrap("test-wrap", expensiveOperation)
            
            // First call
            const { cacheKey: key1 } = await cachedOperation("param1")
            expect(key1).to.be.a("string")
            
            // Second call with same param should generate same key
            const { cacheKey: key2 } = await cachedOperation("param1")
            expect(key2).to.equal(key1)
        })

        it("should generate different keys for different parameters in rt.wrap", async () => {
            let executionCount = 0
            const expensiveOperation = async (param) => {
                executionCount++
                return `result_${param}_${executionCount}`
            }
            
            const cachedOperation = cache.rt.wrap("test-wrap", expensiveOperation)
            
            const { cacheKey: key1 } = await cachedOperation("param1")
            const { cacheKey: key2 } = await cachedOperation("param2")
            
            expect(key1).to.not.equal(key2)
        })

        it("should generate keys with custom template for rt.wrap", async () => {
            cds.context = { tenant:'t1', user:'u2' }
            let executionCount = 0
            const expensiveOperation = async (param) => {
                executionCount++
                return `result_${param}_${executionCount}`
            }
            
            const cachedOperation = cache.rt.wrap("test-wrap", expensiveOperation, {
                key: "{tenant}:{user}:{args[0]}:{hash}"
            })
            
            const { cacheKey } = await cachedOperation("param1")
            expect(cacheKey).to.match(/^t1:u2:param1:/)
            expect(cacheKey).to.not.equal("t1:u2:param1:test-wrap") // hash should be different from base key
        })

        it("should generate consistent keys for rt.exec", async () => {
            let executionCount = 0
            const expensiveOperation = async (param) => {
                executionCount++
                return `result_${param}_${executionCount}`
            }
            
            // First call
            const { cacheKey: key1 } = await cache.rt.exec("test-exec", expensiveOperation, ["param1"])
            expect(key1).to.be.a("string")
            
            // Second call with same params should generate same key
            const { cacheKey: key2 } = await cache.rt.exec("test-exec", expensiveOperation, ["param1"])
            expect(key2).to.equal(key1)
        })

        it("should generate keys with custom template for rt.exec", async () => {
            cds.context = { tenant:'t1', user:'u2' }
            let executionCount = 0
            const expensiveOperation = async (param) => {
                executionCount++
                return `result_${param}_${executionCount}`
            }
            
            const { cacheKey } = await cache.rt.exec("test-exec", expensiveOperation, ["param1"], {
                key: "{tenant}:{user}:{args[0]}:{baseKey}"
            })
            
            expect(cacheKey).to.equal("t1:u2:param1:test-exec")
        })

        it("should generate keys for rt.send", async () => {
            const request = { method: "GET", path: "/test", data: { id: 1 } }
            const service = { name: "TestService", send: async () => ({ result: "test" }) }
            
            const { cacheKey } = await cache.rt.send(request, service)
            expect(cacheKey).to.be.a("string")
        })

        it("should generate keys with custom template for rt.send", async () => {
            cds.context = { tenant:'t1', user:{ id: 'u2' } }
            const request = { method: "GET", path: "/test", data: { id: 1 } }
            const service = { name: "TestService", send: async () => ({ result: "test" }) }
            
            const { cacheKey } = await cache.rt.send(request, service, {
                key: "{tenant}:{user}:{hash}"
            })
            
            expect(cacheKey).to.match(/^t1:u2:/)
        })
    })

    describe("Edge Cases", () => {
        it("should handle null and undefined values", () => {
            const key1 = cache.createKey(null)
            const key2 = cache.createKey(undefined)
            expect(key1).to.be.a("string")
            expect(key2).to.be.a("string")
        })

        it("should handle empty string", () => {
            const key = cache.createKey("")
            expect(key).to.equal("")
        })

        it("should handle template with no placeholders", () => {
            const key = cache.createKey("test", {}, "static-key")
            expect(key).to.equal("static-key")
        })

        it("should handle template with only hash placeholder", () => {
            const key = cache.createKey("test", {}, "{hash}")
            expect(key).to.equal("test")
        })

        it("should handle missing args in template", () => {
            const key = cache.createKey("test", {}, "{args[0]}:{args[1]}")
            expect(key).to.equal(":")
        })
    })

    describe("cds.ql prototype-based where (root cause)", () => {

        // NoaRequest ("New OData Adapter Request", @sap/cds/libx/odata/ODataAdapter.js)
        // carries cds.ql queries where SELECT.where lives on the prototype, not as an
        // own property. JSON.stringify only serializes own enumerable properties, so the
        // where clause is silently dropped. These tests reproduce this exact behavior.

        class Request {
            constructor(props) { Object.assign(this, props); }
        }

        function createCqnWithPrototypeWhere(where) {
            const selectProto = { where };
            const select = Object.create(selectProto);
            select.from = { ref: ['CachedFoo'] };
            select.columns = [{ ref: ['*'] }];
            return { SELECT: select };
        }

        it("should demonstrate that prototype-based where is invisible to JSON.stringify", () => {
            const cqn = createCqnWithPrototypeWhere([{ ref: ['ID'] }, '=', { val: 1 }]);

            expect(cqn.SELECT.where).to.deep.equal([{ ref: ['ID'] }, '=', { val: 1 }]);
            expect(Object.getOwnPropertyNames(cqn.SELECT)).to.not.include('where');
            expect(JSON.stringify(cqn.SELECT)).to.not.include('where');
        })

        it("should produce the SAME hash for queries with and without prototype-where (the bug)", () => {
            const cqnWithWhere = createCqnWithPrototypeWhere([{ ref: ['ID'] }, '=', { val: 1 }]);
            const cqnWithoutWhere = { SELECT: { from: { ref: ['CachedFoo'] }, columns: [{ ref: ['*'] }] } };

            const hash1 = cache.keyManager.createHash({ query: cqnWithWhere });
            const hash2 = cache.keyManager.createHash({ query: cqnWithoutWhere });

            // This IS the bug: both produce the same hash because JSON.stringify
            // drops prototype-based `where`, making filtered and unfiltered
            // queries indistinguishable.
            expect(hash1).to.equal(hash2);
        })

        it("should produce different hashes when URL captures the filter (the fix)", () => {
            const cqnWithPrototypeWhere = createCqnWithPrototypeWhere([{ ref: ['ID'] }, '=', { val: 1 }]);

            const reqWithFilter = new Request({
                method: "GET",
                path: "/CachedFoo",
                http: { req: { url: "/CachedFoo?$filter=ID eq 1", path: "/CachedFoo" } },
                data: null,
                params: [],
                query: cqnWithPrototypeWhere,
                event: null,
                target: { name: "CachedFoo" }
            });
            const reqWithoutFilter = new Request({
                method: "GET",
                path: "/CachedFoo",
                http: { req: { url: "/CachedFoo", path: "/CachedFoo" } },
                data: null,
                params: [],
                query: { SELECT: { from: { ref: ['CachedFoo'] }, columns: [{ ref: ['*'] }] } },
                event: null,
                target: { name: "CachedFoo" }
            });

            const key1 = cache.keyManager.createContentHash(reqWithFilter);
            const key2 = cache.keyManager.createContentHash(reqWithoutFilter);

            // The URL-based fix distinguishes these correctly even though
            // JSON.stringify(req.query) would produce the same output for both.
            expect(key1).to.not.equal(key2);
        })
    })

    describe("URL Normalization and Hash Inclusion", () => {

        class Request {
            constructor(props) { Object.assign(this, props); }
        }

        it("should include the HTTP URL in the content hash", () => {
            const reqWithUrl = new Request({
                method: "GET",
                path: "/CachedFoo",
                http: { req: { url: "/CachedFoo?$filter=ID eq 1", path: "/CachedFoo" } },
                data: null,
                params: [],
                query: {},
                event: null,
                target: { name: "CachedFoo" }
            });
            const reqWithoutUrl = new Request({
                method: "GET",
                path: "/CachedFoo",
                data: null,
                params: [],
                query: {},
                event: null,
                target: { name: "CachedFoo" }
            });

            const key1 = cache.keyManager.createContentHash(reqWithUrl);
            const key2 = cache.keyManager.createContentHash(reqWithoutUrl);
            expect(key1).to.not.equal(key2);
        })

        it("should produce the same hash regardless of URL parameter order", () => {
            const req1 = new Request({
                method: "GET",
                path: "/CachedFoo",
                http: { req: { url: "/CachedFoo?$filter=ID eq 1&$select=ID,name", path: "/CachedFoo" } },
                data: null,
                params: [],
                query: {},
                event: null,
                target: { name: "CachedFoo" }
            });
            const req2 = new Request({
                method: "GET",
                path: "/CachedFoo",
                http: { req: { url: "/CachedFoo?$select=ID,name&$filter=ID eq 1", path: "/CachedFoo" } },
                data: null,
                params: [],
                query: {},
                event: null,
                target: { name: "CachedFoo" }
            });

            const key1 = cache.keyManager.createContentHash(req1);
            const key2 = cache.keyManager.createContentHash(req2);
            expect(key1).to.equal(key2);
        })

        it("should produce different hashes when filter is in URL but not in query", () => {
            const reqWithFilter = new Request({
                method: "GET",
                path: "/CachedFoo",
                http: { req: { url: "/CachedFoo?$filter=ID eq 1", path: "/CachedFoo" } },
                data: null,
                params: [],
                query: {},
                event: null,
                target: { name: "CachedFoo" }
            });
            const reqWithoutFilter = new Request({
                method: "GET",
                path: "/CachedFoo",
                http: { req: { url: "/CachedFoo", path: "/CachedFoo" } },
                data: null,
                params: [],
                query: {},
                event: null,
                target: { name: "CachedFoo" }
            });

            const key1 = cache.keyManager.createContentHash(reqWithFilter);
            const key2 = cache.keyManager.createContentHash(reqWithoutFilter);
            expect(key1).to.not.equal(key2);
        })

        it("should prefer _.req.url over http.req.url", () => {
            const req = new Request({
                method: "GET",
                path: "/CachedFoo",
                _: { req: { url: "/CachedFoo?$filter=ID eq 1" } },
                http: { req: { url: "/CachedFoo?$filter=ID eq 2", path: "/CachedFoo" } },
                data: null,
                params: [],
                query: {},
                event: null,
                target: { name: "CachedFoo" }
            });
            const reqMatchingUnderscore = new Request({
                method: "GET",
                path: "/CachedFoo",
                http: { req: { url: "/CachedFoo?$filter=ID eq 1", path: "/CachedFoo" } },
                data: null,
                params: [],
                query: {},
                event: null,
                target: { name: "CachedFoo" }
            });

            const key1 = cache.keyManager.createContentHash(req);
            const key2 = cache.keyManager.createContentHash(reqMatchingUnderscore);
            expect(key1).to.equal(key2);
        })

        describe("normalizeUrl edge cases", () => {

            it("should return undefined for null input", () => {
                expect(cache.keyManager.normalizeUrl(null)).to.be.undefined;
            })

            it("should return undefined for undefined input", () => {
                expect(cache.keyManager.normalizeUrl(undefined)).to.be.undefined;
            })

            it("should return undefined for empty string", () => {
                expect(cache.keyManager.normalizeUrl("")).to.be.undefined;
            })

            it("should handle URL with no query string", () => {
                const result = cache.keyManager.normalizeUrl("/CachedFoo");
                expect(result).to.equal("/CachedFoo");
            })

            it("should sort query parameters alphabetically", () => {
                const result = cache.keyManager.normalizeUrl("/CachedFoo?$select=ID&$filter=ID eq 1&$orderby=ID asc");
                expect(result).to.equal("/CachedFoo?%24filter=ID+eq+1&%24orderby=ID+asc&%24select=ID");
            })

            it("should produce identical output for same params in different order", () => {
                const url1 = cache.keyManager.normalizeUrl("/test?b=2&a=1&c=3");
                const url2 = cache.keyManager.normalizeUrl("/test?c=3&a=1&b=2");
                expect(url1).to.equal(url2);
            })

            it("should handle URL with special characters", () => {
                const result = cache.keyManager.normalizeUrl("/CachedFoo?$filter=name eq 'Foo Bar'");
                expect(result).to.be.a("string");
                expect(result).to.include("/CachedFoo");
            })
        })
    })

    describe("Global Configuration Tests", () => {

        beforeEach(async () => {
            cache.runtimeConfigManager.options.keyManagement = {
                isUserAware: false,
                isTenantAware: false,
                isLocaleAware: false
            }
            await cache.reloadRuntimeConfiguration();
        })

        it("should use global configuration when no template provided", async () => {
            // Test with default config (no tenant/user/locale)
            const config = await cache.getRuntimeConfiguration();
            expect(config.keyManagement.isUserAware).to.be.false;
            expect(config.keyManagement.isTenantAware).to.be.false;
            expect(config.keyManagement.isLocaleAware).to.be.false;
        })

        it("should include user in default key when isUserAware is true", async () => {
            // Set user aware configuration
            cache.runtimeConfigManager.options.keyManagement.isUserAware = true;
            cds.context = { user: { id: 'u2' }, tenant: 't1' }
            await cache.reloadRuntimeConfiguration();

            // Create a key with user context
            const key = cache.createKey("test-key");
            
            // Should include user in the key
            expect(key).to.include("u2");
            expect(key).to.match(/.*u2.*/);
        })

        it("should include tenant in default key when isTenantAware is true", async () => {
            // Set tenant aware configuration
            cache.runtimeConfigManager.options.keyManagement.isTenantAware = true;
            await cache.reloadRuntimeConfiguration();

            // Create a key with tenant context
            const key = cache.createKey("test-key", { tenant: "testtenant" });
            
            // Should include tenant in the key
            expect(key).to.include("testtenant");
            expect(key).to.match(/.*testtenant.*/);
        })

        it("should include locale in default key when isLocaleAware is true", async () => {
            // Set locale aware configuration
            cache.runtimeConfigManager.options.keyManagement.isLocaleAware = true;
            await cache.reloadRuntimeConfiguration();

            // Create a key with locale context
            const key = cache.createKey("test-key", { locale: "de" });
            
            // Should include locale in the key
            expect(key).to.include("de");
            expect(key).to.match(/.*de.*/);
        })

        it("should include all context when all awareness flags are true", async () => {

            cds.context = { user: { id: 'u2' }, tenant: 't1', locale: 'de' }
            // Set all awareness flags to true
            cache.runtimeConfigManager.options.keyManagement.isUserAware = true;
            cache.runtimeConfigManager.options.keyManagement.isTenantAware = true;
            cache.runtimeConfigManager.options.keyManagement.isLocaleAware = true;
            await cache.reloadRuntimeConfiguration();

            // Create a key with all context
            const key = cache.createKey("test-key");
            
            // Should include all context in the key
            expect(key).to.include("u2");
            expect(key).to.include("t1");
            expect(key).to.include("de");
            expect(key).to.include("test-key");
        })

        it("should not include context when awareness flags are false", async () => {

            cds.context = { user: { id: 'u2' }, tenant: 't1', locale: 'de' }
            // Ensure all awareness flags are false
            cache.runtimeConfigManager.options.keyManagement.isUserAware = false;
            cache.runtimeConfigManager.options.keyManagement.isTenantAware = false;
            cache.runtimeConfigManager.options.keyManagement.isLocaleAware = false;
            await cache.reloadRuntimeConfiguration();

            // Create a key with context (should be ignored)
            const key = cache.createKey("test-key");
            
            // Should not include context in the key
            expect(key).to.not.include("u2");
            expect(key).to.not.include("t1");
            expect(key).to.not.include("de");
            expect(key).to.equal("test-key");
        })

        it("should use default values when context is not provided but awareness is enabled", async () => {
            // Set user aware configuration
            cache.runtimeConfigManager.options.keyManagement.isUserAware = true;
            await cache.reloadRuntimeConfiguration();

            // Create a key without user context
            const key = cache.createKey("test-key");
            
            // Should include default user value (anonymous)
            expect(key).to.include("anonymous");
        })

        it("should handle mixed awareness settings correctly", async () => {

            cds.context = { user: { id: 'u2' }, tenant: 't1', locale: 'de' }
            // Set only user and tenant aware, not locale
            cache.runtimeConfigManager.options.keyManagement.isUserAware = true;
            cache.runtimeConfigManager.options.keyManagement.isTenantAware = true;
            cache.runtimeConfigManager.options.keyManagement.isLocaleAware = false;
            await cache.reloadRuntimeConfiguration();

            // Create a key with all context
            const key = cache.createKey("test-key");
            
            // Should include user and tenant, but not locale
            expect(key).to.include("u2");
            expect(key).to.include("t1");
            expect(key).to.not.include("de");
        })
    })
})