const cds = require('@sap/cds');
const { GET, expect } = cds.test().in(__dirname + '/app/')

describe('Cache Through - Remote Operations', () => {

    let cache;
    let northwindCache;

    beforeEach(async () => {
        cache = await cds.connect.to("caching");
        northwindCache = await cds.connect.to("caching-northwind");
        await northwindCache.clear();
        await cache.clear();
    })

    // ============================================================================
    // ANNOTATED ENTITY TESTS
    // ============================================================================

    describe('Annotated Entity Operations', () => {

        describe('Basic OData Operations', () => {
            
            it("should cache a request for an annotated entity with $top", async () => {
                const { data, headers } = await GET(`/odata/v4/app/Products?$top=2`)
                const cacheData = await northwindCache.get(headers['x-sap-cap-cache-key']);
                expect(data.value).to.deep.equal(cacheData);
            })

            it("should cache a request for an annotated entity with $skip", async () => {
                const { data, headers } = await GET(`/odata/v4/app/Products?$skip=5&$top=3`)
                const cacheData = await northwindCache.get(headers['x-sap-cap-cache-key']);
                expect(data.value).to.deep.equal(cacheData);
            })

            it("should cache a request for an annotated entity with $filter", async () => {
                const { data, headers } = await GET(`/odata/v4/app/Products?$filter=(Rating%20gt%203)%20and%20(Price%20lt%20100)`)
                const cacheData = await northwindCache.get(headers['x-sap-cap-cache-key']);
                expect(data.value).to.deep.equal(cacheData);
            })

            it("should cache a request for an annotated entity with $orderby", async () => {
                const { data, headers } = await GET(`/odata/v4/app/Products?$orderby=Name%20asc`)
                const cacheData = await northwindCache.get(headers['x-sap-cap-cache-key']);
                expect(data.value).to.deep.equal(cacheData);
            })

            it("should cache a request for an annotated entity with $select", async () => {
                const { data, headers } = await GET(`/odata/v4/app/Products?$select=ID,Name,Price`)
                const cacheData = await northwindCache.get(headers['x-sap-cap-cache-key']);
                expect(data.value).to.deep.equal(cacheData);
            })

            it("should cache a request for an annotated entity with $expand", async () => {
                const { data, headers } = await GET(`/odata/v4/app/Products?$expand=Categories`)
                const cacheData = await northwindCache.get(headers['x-sap-cap-cache-key']);
                expect(data.value).to.deep.equal(cacheData);
            })
        })

        describe('Complex Query Combinations', () => {

            it("should cache complex queries with multiple parameters", async () => {
                const { data, headers } = await GET(`/odata/v4/app/Products?$filter=(Rating%20gt%203)%20and%20(Price%20lt%20100)&$orderby=Name%20asc&$top=5&$skip=2&$select=ID,Name,Price,Rating`)
                const cacheData = await northwindCache.get(headers['x-sap-cap-cache-key']);
                expect(data.value).to.deep.equal(cacheData);
            })

            it("should generate different cache keys for different query parameters", async () => {
                const { headers: headers1 } = await GET(`/odata/v4/app/Products?$top=2`)
                const { headers: headers2 } = await GET(`/odata/v4/app/Products?$top=3`)
                
                expect(headers1['x-sap-cap-cache-key']).to.not.equal(headers2['x-sap-cap-cache-key']);
            })

            it("should reuse cache for identical queries", async () => {
                const { data: data1, headers: headers1 } = await GET(`/odata/v4/app/Products`, {
                    params: { $top: 2 }
                })
                const { data: data2, headers: headers2 } = await GET(`/odata/v4/app/Products`, {
                    params: { $top: 2 }
                })
                
                expect(headers1['x-sap-cap-cache-key']).to.equal(headers2['x-sap-cap-cache-key']);
                expect(data1.value).to.deep.equal(data2.value);
            })
        })

        describe('Entity Navigation', () => {

            it("should cache requests for entity by key", async () => {
                const { data, headers } = await GET(`/odata/v4/app/Products(1)`);
                const cacheData = await northwindCache.get(headers['x-sap-cap-cache-key']);
                expect(data).to.deep.equal({...cacheData, "@odata.context": "$metadata#Products/$entity"});
            })

        })
    })

    // ============================================================================
    // MANUAL REQUEST TESTS
    // ============================================================================

    describe('Manual Request Operations', () => {

        describe('OData Service Requests', () => {

            it("should cache GET requests to OData service", async () => {
                const key = "odata:products:top2";
                const northwind = await cds.connect.to("Northwind");

                const { result } = await cache.rt.send({
                    method: "GET",
                    path: "Products?$top=2"
                }, northwind, { key: { value: key } });

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);
            })

            it("should cache requests with complex OData parameters", async () => {
                const key = "odata:products:complex";
                const northwind = await cds.connect.to("Northwind");

                const { result } = await cache.rt.send({
                    method: "GET",
                    path: "Products?$filter=Rating gt 3&$orderby=Name asc&$top=5&$select=ID,Name,Price"
                }, northwind, { key: { value: key } });

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);
            })

            it("should cache requests with different entities", async () => {
                const key = "odata:categories";
                const northwind = await cds.connect.to("Northwind");

                const { result } = await cache.rt.send({
                    method: "GET",
                    path: "Categories?$top=3"
                }, northwind, { key: { value: key } });

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);
            })

            it("should handle requests with custom TTL", async () => {
                const key = "odata:ttl:test";
                const northwind = await cds.connect.to("Northwind");

                const { result } = await cache.rt.send({
                    method: "GET",
                    path: "Products?$top=1"
                }, northwind, { 
                    key: { value: key },
                    ttl: 10000 // 10 seconds
                });

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);
            })

            it("should handle requests with tags", async () => {
                const key = "odata:tagged:test";
                const northwind = await cds.connect.to("Northwind");

                const { result } = await cache.rt.send({
                    method: "GET",
                    path: "Products?$top=1"
                }, northwind, { 
                    key: { value: key },
                    tags: ['products', 'test']
                });

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);
            })
        })

        describe('REST Service Requests', () => {

            it("should cache requests to REST service", async () => {
                const key = "rest:products";
                const rest = await cds.connect.to({
                    "kind": "rest",
                    "credentials": {
                        "url": "https://services.odata.org/V3/Northwind/Northwind.svc/"
                    }
                });

                const { result } = await cache.rt.send({
                    method: "GET",
                    path: "Products"
                }, rest, { key: { value: key } });

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);
            })

            it("should cache REST requests with query parameters", async () => {
                const key = "rest:products:filtered";
                const rest = await cds.connect.to({
                    "kind": "rest",
                    "credentials": {
                        "url": "https://services.odata.org/V3/Northwind/Northwind.svc/"
                    }
                });

                const { result } = await cache.rt.send({
                    method: "GET",
                    path: "Products?$top=3&$select=ProductID,ProductName"
                }, rest, { key: { value: key } });

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);
            })
        })

        describe('Error Handling', () => {

            it("should handle non-GET requests gracefully", async () => {
                const key = "non-get:request";
                const northwind = await cds.connect.to("Northwind");

                // Should return null for non-GET requests (let parent handle it)
                const { result } = await cache.rt.send({
                    method: "POST",
                    path: "Products"
                }, northwind, { key: { value: key } });

                expect(result).to.be.null;
            })

            it("should handle invalid service gracefully", async () => {
                const key = "invalid:service";
                const invalidService = {};

                // Should return null for invalid service
                const { result } = await cache.rt.send({
                    method: "GET",
                    path: "test"
                }, invalidService, { key: { value: key } });

                expect(result).to.be.null;
            })

            it("should handle service errors gracefully", async () => {
                const key = "error:service";
                const northwind = await cds.connect.to("Northwind");

                try {
                    await cache.rt.send({
                        method: "GET",
                        path: "NonExistentEntity"
                    }, northwind, { key: { value: key } });
                } catch (error) {
                    // Should not cache error responses
                    const cachedData = await cache.get(key);
                    expect(cachedData).to.be.undefined;
                }
            })
        })
    })

    // ============================================================================
    // RUN OPERATION TESTS
    // ============================================================================

    describe('Run Operations', () => {

        describe('Basic Run Operations', () => {

            it("should cache the result of a SELECT query", async () => {
                const key = "run:select:products";
                const northwind = await cds.connect.to("Northwind");
                const { Products } = northwind.entities;

                const { result } = await cache.rt.run(SELECT(Products).limit(2), northwind, { key: { value: key } });

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);
            })

            it("should cache the result of a filtered query", async () => {
                const key = "run:filtered:products";
                const northwind = await cds.connect.to("Northwind");
                const { Products } = northwind.entities;

                const { result } = await cache.rt.run(
                    SELECT(Products).where({ Rating: { '>': 3 } }).limit(5), 
                    northwind, 
                    { key: { value: key } }
                );

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);
            })

            it("should cache the result of a query with ordering", async () => {
                const key = "run:ordered:products";
                const northwind = await cds.connect.to("Northwind");
                const { Products } = northwind.entities;

                const { result } = await cache.rt.run(
                    SELECT(Products).orderBy({ Name: 'asc' }).limit(3), 
                    northwind, 
                    { key: { value: key } }
                );

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);
            })
        })

        describe('Complex Run Operations', () => {

            it("should cache complex queries with multiple clauses", async () => {
                const key = "run:complex:query";
                const northwind = await cds.connect.to("Northwind");
                const { Products } = northwind.entities;

                const { result } = await cache.rt.run(
                    SELECT(Products)
                        .where({ Rating: { '>': 3 }, Price: { '<': 100 } })
                        .orderBy({ Name: 'asc' })
                        .limit(5), 
                    northwind, 
                    { key: { value: key } }
                );

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);
            })

            it("should cache queries with projections", async () => {
                const key = "run:projection:query";
                const northwind = await cds.connect.to("Northwind");
                const { Products } = northwind.entities;

                const { result } = await cache.rt.run(
                    SELECT.from(Products).columns('ID', 'Name', 'Price').limit(3), 
                    northwind, 
                    { key: { value: key } }
                );

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);
            })

        })

        describe('Run Operation with Options', () => {

            it("should handle run operations with custom TTL", async () => {
                const key = "run:ttl:test";
                const northwind = await cds.connect.to("Northwind");
                const { Products } = northwind.entities;

                const { result } = await cache.rt.run(
                    SELECT(Products).limit(1), 
                    northwind, 
                    { 
                        key: { value: key },
                        ttl: 15000 // 15 seconds
                    }
                );

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);
            })

            it("should handle run operations with tags", async () => {
                const key = "run:tagged:test";
                const northwind = await cds.connect.to("Northwind");
                const { Products } = northwind.entities;

                const { result } = await cache.rt.run(
                    SELECT(Products).limit(1), 
                    northwind, 
                    { 
                        key: { value: key },
                        tags: ['run-operation', 'products']
                    }
                );

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);
            })
        })

        describe('Run Operation Error Handling', () => {

            it("should handle invalid queries gracefully", async () => {
                const key = "run:invalid:query";
                const northwind = await cds.connect.to("Northwind");

                try {
                    await cache.rt.run(
                        "INVALID QUERY", 
                        northwind, 
                        { key: { value: key } }
                    );
                } catch (error) {
                    // Should not cache error responses
                    const cachedData = await cache.get(key);
                    expect(cachedData).to.be.undefined;
                }
            })

            it("should handle non-existent entities gracefully", async () => {
                const key = "run:nonexistent:entity";
                const northwind = await cds.connect.to("Northwind");

                try {
                    await cache.rt.run(
                        SELECT.from('NonExistentEntity').limit(1), 
                        northwind, 
                        { key: { value: key } }
                    );
                } catch (error) {
                    // Should not cache error responses
                    const cachedData = await cache.get(key);
                    expect(cachedData).to.be.undefined;
                }
            })
        })
    })

    // ============================================================================
    // CACHE KEY GENERATION TESTS
    // ============================================================================

    describe('Cache Key Generation', () => {

        it("should generate consistent keys for identical requests", async () => {
            const northwind = await cds.connect.to("Northwind");
            
            const key1 = cache.createKey({ method: "GET", path: "Products?$top=2" });
            const key2 = cache.createKey({ method: "GET", path: "Products?$top=2" });
            
            expect(key1).to.equal(key2);
        })

        it("should generate different keys for different requests", async () => {
            const northwind = await cds.connect.to("Northwind");
            
            const key1 = cache.createKey({ method: "GET", path: "Products?$top=2" });
            const key2 = cache.createKey({ method: "GET", path: "Products?$top=3" });
            
            expect(key1).to.not.equal(key2);
        })

    })

    // ============================================================================
    // PERFORMANCE AND CONCURRENCY TESTS
    // ============================================================================

    describe('Performance and Concurrency', () => {

        it("should handle concurrent requests to the same resource", async () => {
            const key = "concurrent:test";
            const northwind = await cds.connect.to("Northwind");

            const promises = Array(5).fill().map(() => 
                cache.rt.send({
                    method: "GET",
                    path: "Products?$top=1"
                }, northwind, { key: { value: key } })
            );

            const results = await Promise.all(promises);
            
            // All results should be identical
            const firstResult = results[0];
            results.forEach(result => {
                expect(result.result).to.deep.equal(firstResult.result);
            });

            // Should be cached
            const cachedData = await cache.get(key);
            expect(cachedData).to.deep.equal(firstResult.result);
        })

        it("should handle rapid successive requests efficiently", async () => {
            const key = "rapid:successive:test";
            const northwind = await cds.connect.to("Northwind");

            // First request should cache
            const { result: result1 } = await cache.rt.send({
                method: "GET",
                path: "Products?$top=1"
            }, northwind, { key: { value: key } });

            // Second request should use cache
            const{ result:result2  } = await cache.rt.send({
                method: "GET",
                path: "Products?$top=1"
            }, northwind, { key: { value: key } });

            expect(result1).to.deep.equal(result2);
        })
    })

    // ============================================================================
    // INTEGRATION TESTS
    // ============================================================================

    describe('Integration Scenarios', () => {

        it("should work with multiple cache services", async () => {
            const key1 = "multi:cache:1";
            const key2 = "multi:cache:2";
            const northwind = await cds.connect.to("Northwind");

            // Use different cache services
            const { result: result1 } = await cache.rt.send({
                method: "GET",
                path: "Products?$top=1"
            }, northwind, { key: { value: key1 } });

            const { result: result2 } = await northwindCache.rt.send({
                method: "GET",
                path: "Products?$top=1"
            }, northwind, { key: { value: key2 } });

            // Should be cached in different services
            const cached1 = await cache.get(key1);
            const cached2 = await northwindCache.get(key2);

            expect(cached1).to.eql(result1);
            expect(cached2).to.eql(result2);
        }, 10000)

        it("should handle mixed operation types", async () => {
            const northwind = await cds.connect.to("Northwind");
            const { Products } = northwind.entities;

            // Mix of send and run operations
            const { result: sendResult } = await cache.rt.send({
                method: "GET",
                path: "Products?$top=2"
            }, northwind, { key: { value: "mixed:send" } });

            const { result: runResult } = await cache.rt.run(
                SELECT(Products).limit(2), 
                northwind, 
                { key: { value: "mixed:run" } }
            );

            expect(sendResult).to.deep.equal(runResult);
        })
    })
})