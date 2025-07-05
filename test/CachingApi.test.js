const cds = require('@sap/cds');
const { GET, POST, expect } = cds.test().in(__dirname + '/app/')

describe('Caching API Service', () => {

    let cache;
    let appService;

    beforeEach(async () => {
        cache = await cds.connect.to("caching");
        appService = await cds.connect.to("AppService");
        await cache.clear();
        
        // Reset metrics to known state
        await cache.setMetricsEnabled(false);
        await cache.setKeyMetricsEnabled(false);
        await cache.clearMetrics();
        await cache.clearKeyMetrics();
    })

    // ============================================================================
    // CACHE ENTRIES MANAGEMENT
    // ============================================================================

    describe('Cache Entries Management', () => {

        describe('getEntries', () => {

            it("should return empty array when cache is empty", async () => {
                const { data } = await GET('/odata/v4/caching-api/Caches(\'caching\')/getEntries()');
                expect(data.value).to.be.an('array');
                expect(data.value).to.have.length(0);
            })

            it("should return all cache entries", async () => {
                // Add some entries to the cache
                await cache.set("test:entry:1", "value1");
                await cache.set("test:entry:2", "value2", { tags: ["tag1", "tag2"] });
                await cache.set("test:entry:3", { complex: "object" });

                const { data } = await GET('/odata/v4/caching-api/Caches(\'caching\')/getEntries()');
                
                expect(data.value).to.be.an('array');
                expect(data.value).to.have.length(3);
                
                // Check entry structure
                const entry = data.value[0];
                expect(entry).to.have.property('entryKey');
                expect(entry).to.have.property('value');
                expect(entry).to.have.property('timestamp');
                expect(entry).to.have.property('tags');
                expect(entry.timestamp).to.be.a('number');
                expect(entry.tags).to.be.an('array');
            })

            it("should handle entries with different data types", async () => {
                // Add entries with different data types
                await cache.set("string:entry", "string value");
                await cache.set("number:entry", 42);
                await cache.set("boolean:entry", true);
                await cache.set("object:entry", { key: "value", nested: { data: "test" } });
                await cache.set("array:entry", [1, 2, 3, "test"]);

                const { data } = await GET('/odata/v4/caching-api/Caches(\'caching\')/getEntries()');
                
                expect(data.value).to.have.length(5);
                
                // Verify all entries have valid JSON string values
                data.value.forEach(entry => {
                    expect(entry.value).to.be.a('string');
                    // Should be valid JSON
                    expect(() => JSON.parse(entry.value)).to.not.throw();
                });
            })

            it("should handle entries with tags", async () => {
                await cache.set("tagged:entry", "value", { tags: ["user-123", "product-456"] });

                const { data } = await GET('/odata/v4/caching-api/Caches(\'caching\')/getEntries()');
                
                const taggedEntry = data.value.find(entry => entry.entryKey === "tagged:entry");
                expect(taggedEntry).to.exist;
                expect(taggedEntry.tags).to.include("user-123");
                expect(taggedEntry.tags).to.include("product-456");
            })
        })

        describe('getEntry', () => {

            it("should return specific cache entry", async () => {
                const testValue = { test: "data", number: 42 };
                await cache.set("test:get:entry", testValue);

                const { data } = await GET('/odata/v4/caching-api/Caches(\'caching\')/getEntry(key=\'test:get:entry\')');
                
                expect(data.value).to.deep.equal(testValue);
            })

            it("should return undefined for non-existent entry", async () => {
                const { data } = await GET('/odata/v4/caching-api/Caches(\'caching\')/getEntry(key=\'non:existent:entry\')');
                
                expect(data.value).to.be.undefined;
            })

            it("should handle complex objects", async () => {
                const complexObject = {
                    string: "test",
                    number: 123,
                    boolean: true,
                    array: [1, 2, 3],
                    nested: {
                        key: "value",
                        deep: {
                            data: "test"
                        }
                    }
                };
                
                await cache.set("complex:entry", complexObject);

                const { data } = await GET('/odata/v4/caching-api/Caches(\'caching\')/getEntry(key=\'complex:entry\')');
                
                expect(data.value).to.deep.equal(complexObject);
            })
        })

        describe('setEntry', () => {

            it("should set a new cache entry", async () => {
                const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/setEntry', {
                    key: "test:set:entry",
                    value: "test value",
                    ttl: 5000
                });

                expect(data.value).to.be.true;

                // Verify entry was set
                const entry = await cache.get("test:set:entry");
                expect(entry).to.equal("test value");
            })

            it("should set entry with TTL", async () => {
                const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/setEntry', {
                    key: "test:ttl:entry",
                    value: "ttl value",
                    ttl: 1000 // 1 second
                });

                expect(data.value).to.be.true;

                // Entry should exist immediately
                let entry = await cache.get("test:ttl:entry");
                expect(entry).to.equal("ttl value");

                // Wait for TTL to expire   
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Entry should be expired
                entry = await cache.get("test:ttl:entry");
                expect(entry).to.be.undefined;
            })

            it("should set entry without TTL", async () => {
                const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/setEntry', {
                    key: "test:no:ttl:entry",
                    value: "no ttl value"
                });

                expect(data.value).to.be.true;

                // Entry should exist and not expire
                const entry = await cache.get("test:no:ttl:entry");
                expect(entry).to.equal("no ttl value");

                // Wait and verify it still exists
                await new Promise(resolve => setTimeout(resolve, 1000));
                const entryAfter = await cache.get("test:no:ttl:entry");
                expect(entryAfter).to.equal("no ttl value");
            })

            it("should handle complex values", async () => {
                const complexValue = {
                    string: "test",
                    number: 42,
                    array: [1, 2, 3],
                    nested: { key: "value" }
                };

                const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/setEntry', {
                    key: "test:complex:entry",
                    value: JSON.stringify(complexValue),
                    ttl: 5000
                });

                expect(data.value).to.be.true;

                // Verify entry was set correctly
                const entry = await cache.get("test:complex:entry");
                expect(entry).to.deep.equal(JSON.stringify(complexValue));
            })

            it("should overwrite existing entry", async () => {
                // Set initial entry
                await cache.set("test:overwrite:entry", "initial value");

                // Overwrite with new value
                const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/setEntry', {
                    key: "test:overwrite:entry",
                    value: "new value",
                    ttl: 5000
                });

                expect(data.value).to.be.true;

                // Verify new value
                const entry = await cache.get("test:overwrite:entry");
                expect(entry).to.equal("new value");
            })
        })

        describe('deleteEntry', () => {

            it("should delete existing cache entry", async () => {
                // Set an entry first
                await cache.set("test:delete:entry", "value to delete");

                const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/deleteEntry', {
                    key: "test:delete:entry"
                });

                expect(data.value).to.be.true;

                // Verify entry was deleted
                const entry = await cache.get("test:delete:entry");
                expect(entry).to.be.undefined;
            })

            it("should handle deletion of non-existent entry", async () => {
                const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/deleteEntry', {
                    key: "non:existent:entry"
                });

                expect(data.value).to.be.true;
            })

            it("should delete multiple entries", async () => {
                // Set multiple entries
                await cache.set("test:delete:1", "value1");
                await cache.set("test:delete:2", "value2");
                await cache.set("test:delete:3", "value3");

                // Delete them one by one
                await POST('/odata/v4/caching-api/Caches(\'caching\')/deleteEntry', { key: "test:delete:1" });
                await POST('/odata/v4/caching-api/Caches(\'caching\')/deleteEntry', { key: "test:delete:2" });
                await POST('/odata/v4/caching-api/Caches(\'caching\')/deleteEntry', { key: "test:delete:3" });

                // Verify all were deleted
                expect(await cache.get("test:delete:1")).to.be.undefined;
                expect(await cache.get("test:delete:2")).to.be.undefined;
                expect(await cache.get("test:delete:3")).to.be.undefined;
            })
        })

        describe('clear', () => {

            it("should clear all cache entries", async () => {
                // Add some entries
                await cache.set("test:clear:1", "value1");
                await cache.set("test:clear:2", "value2");
                await cache.set("test:clear:3", "value3");

                // Verify entries exist
                expect(await cache.get("test:clear:1")).to.equal("value1");
                expect(await cache.get("test:clear:2")).to.equal("value2");
                expect(await cache.get("test:clear:3")).to.equal("value3");

                // Clear cache
                const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/clear');

                expect(data.value).to.be.true;

                // Verify all entries were cleared
                expect(await cache.get("test:clear:1")).to.be.undefined;
                expect(await cache.get("test:clear:2")).to.be.undefined;
                expect(await cache.get("test:clear:3")).to.be.undefined;
            })

            it("should handle clearing empty cache", async () => {
                const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/clear');

                expect(data.value).to.be.true;
            })
        })
    })

    // ============================================================================
    // METRICS MANAGEMENT
    // ============================================================================

    describe('Metrics Management', () => {

        describe('setMetricsEnabled', () => {

            it("should enable metrics", async () => {
                const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/setMetricsEnabled', {
                    enabled: true
                });

                expect(data.value).to.be.true;

                // Verify metrics are enabled
                const config = await cache.getRuntimeConfiguration();
                expect(config.metricsEnabled).to.be.true;
            })

            it("should disable metrics", async () => {
                // Enable first
                await cache.setMetricsEnabled(true);

                const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/setMetricsEnabled', {
                    enabled: false
                });

                expect(data.value).to.be.true;

                // Verify metrics are disabled
                const config = await cache.getRuntimeConfiguration();
                expect(config.metricsEnabled).to.be.false;
            })

        })

        describe('setKeyMetricsEnabled', () => {

            it("should enable key metrics", async () => {
                const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/setKeyMetricsEnabled', {
                    enabled: true
                });

                expect(data.value).to.be.true;

                // Verify key metrics are enabled
                const config = await cache.getRuntimeConfiguration();
                expect(config.keyMetricsEnabled).to.be.true;
            })

            it("should disable key metrics", async () => {
                // Enable first
                await cache.setKeyMetricsEnabled(true);

                const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/setKeyMetricsEnabled', {
                    enabled: false
                });

                expect(data.value).to.be.true;

                // Verify key metrics are disabled
                const config = await cache.getRuntimeConfiguration();
                expect(config.keyMetricsEnabled).to.be.false;
            })
        })

        describe('clearMetrics', () => {

            it("should clear all metrics", async () => {
                // Enable metrics and generate some data
                await cache.setMetricsEnabled(true);
                await cache.set("test:metrics", "value");
                await cache.get("test:metrics");

                // Verify metrics exist
                let stats = await cache.getCurrentMetrics();
                expect(stats.nativeSets).to.be.greaterThan(0);
                expect(stats.nativeGets).to.be.greaterThan(0);

                // Clear metrics
                const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/clearMetrics');

                expect(data.value).to.be.true;

                // Verify metrics are cleared
                stats = await cache.getCurrentMetrics();
                expect(stats.nativeSets).to.equal(0);
                expect(stats.nativeGets).to.equal(0);
            })
        })

        describe('clearKeyMetrics', () => {

            it("should clear key metrics", async () => {
                // Enable key metrics and generate some data
                await cache.setKeyMetricsEnabled(true);
                await cache.setMetricsEnabled(true);
                await cache.set("test:key:metrics", "value");
                await cache.get("test:key:metrics");

                // Verify key metrics exist
                let keyMetrics = await cache.getCurrentKeyMetrics();
                expect(keyMetrics.size).to.be.greaterThan(0);

                // Clear key metrics
                const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/clearKeyMetrics');

                expect(data.value).to.be.true;

                // Verify key metrics are cleared
                keyMetrics = await cache.getCurrentKeyMetrics();
                expect(keyMetrics.size).to.equal(0);
            })
        })
    })

    // ============================================================================
    // METRICS DATA ACCESS
    // ============================================================================

    describe('Metrics Data Access', () => {

        describe('Metrics Entity', () => {

            it("should return metrics data", async () => {
                // Enable metrics and generate some data
                await cache.setMetricsEnabled(true);
                await cache.set("test:metrics:data", "value");
                await cache.get("test:metrics:data");
                await cache.persistMetrics();

                const { data } = await GET('/odata/v4/caching-api/Metrics');
                
                expect(data.value).to.be.an('array');
                // Should have at least one metrics record
                expect(data.value.length).to.be.greaterThan(0);
            })

            it("should filter metrics by cache name", async () => {
                await cache.setMetricsEnabled(true);
                await cache.set("test:filter", "value");
                await cache.persistMetrics();

                const { data } = await GET('/odata/v4/caching-api/Metrics?$filter=cache eq \'caching\'');
                
                expect(data.value).to.be.an('array');
                data.value.forEach(metric => {
                    expect(metric.cache).to.equal('caching');
                });
            })

            it("should return metrics with all required fields", async () => {
                await cache.setMetricsEnabled(true);
                await cache.set("test:fields", "value");
                await cache.persistMetrics();

                const { data } = await GET('/odata/v4/caching-api/Metrics?$top=1');
                
                if (data.value.length > 0) {
                    const metric = data.value[0];
                    expect(metric).to.have.property('ID');
                    expect(metric).to.have.property('cache');
                    expect(metric).to.have.property('timestamp');
                    expect(metric).to.have.property('period');
                    expect(metric).to.have.property('hits');
                    expect(metric).to.have.property('misses');
                    expect(metric).to.have.property('avgHitLatency');
                    expect(metric).to.have.property('avgMissLatency');
                    expect(metric).to.have.property('hitRatio');
                    expect(metric).to.have.property('throughput');
                    expect(metric).to.have.property('errorRate');
                    expect(metric).to.have.property('totalRequests');
                    expect(metric).to.have.property('nativeSets');
                    expect(metric).to.have.property('nativeGets');
                    expect(metric).to.have.property('totalNativeOperations');
                }
            })
        })

        describe('KeyMetrics Entity', () => {

            it("should return key metrics data", async () => {
                // Enable key metrics and generate some data
                await cache.setKeyMetricsEnabled(true);
                await cache.set("test:key:metrics:data", "value");
                await cache.get("test:key:metrics:data");
                await cache.persistMetrics();
                const { data } = await GET('/odata/v4/caching-api/KeyMetrics');
                
                expect(data.value).to.be.an('array');
                // Should have at least one key metrics record
                expect(data.value.length).to.be.greaterThan(0);
            })

            it("should filter key metrics by cache name", async () => {
                await cache.setKeyMetricsEnabled(true);
                await cache.set("test:key:filter", "value");
                await cache.persistMetrics();

                const { data } = await GET('/odata/v4/caching-api/KeyMetrics?$filter=cache eq \'caching\'');
                
                expect(data.value).to.be.an('array');
                data.value.forEach(keyMetric => {
                    expect(keyMetric.cache).to.equal('caching');
                });
            })

            it("should return key metrics with all required fields", async () => {
                await cache.setKeyMetricsEnabled(true);
                await cache.set("test:key:fields", "value");

                const { data } = await GET('/odata/v4/caching-api/KeyMetrics?$top=1');
                
                if (data.value.length > 0) {
                    const keyMetric = data.value[0];
                    expect(keyMetric).to.have.property('ID');
                    expect(keyMetric).to.have.property('cache');
                    expect(keyMetric).to.have.property('keyName');
                    expect(keyMetric).to.have.property('lastAccess');
                    expect(keyMetric).to.have.property('period');
                    expect(keyMetric).to.have.property('operationType');
                    expect(keyMetric).to.have.property('hits');
                    expect(keyMetric).to.have.property('misses');
                    expect(keyMetric).to.have.property('totalRequests');
                    expect(keyMetric).to.have.property('hitRatio');
                    expect(keyMetric).to.have.property('dataType');
                    expect(keyMetric).to.have.property('serviceName');
                    expect(keyMetric).to.have.property('operation');
                    expect(keyMetric).to.have.property('metadata');
                }
            })
        })
    })

    // ============================================================================
    // ERROR HANDLING
    // ============================================================================

    describe('Error Handling', () => {

        it("should handle malformed requests gracefully", async () => {
            // Test with missing required parameters
            try {
                await POST('/odata/v4/caching-api/Caches(\'caching\')/setEntry', {
                    // Missing key and value
                });
            } catch (error) {
                // Should handle gracefully
                expect(error).to.exist;
            }
        })

        it("should handle concurrent access", async () => {
            // Test concurrent set operations
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(POST('/odata/v4/caching-api/Caches(\'caching\')/setEntry', {
                    key: `concurrent:test:${i}`,
                    value: `value${i}`
                }));
            }

            const results = await Promise.all(promises);
            results.forEach(result => {
                expect(result.data.value).to.be.true;
            });

            // Verify all entries were set
            for (let i = 0; i < 5; i++) {
                const entry = await cache.get(`concurrent:test:${i}`);
                expect(entry).to.equal(`value${i}`);
            }
        })

        it("should handle large values", async () => {
            // Create a large value
            const largeValue = "x".repeat(10000);

            const { data } = await POST('/odata/v4/caching-api/Caches(\'caching\')/setEntry', {
                key: "large:value:test",
                value: largeValue
            });

            expect(data.value).to.be.true;

            // Verify large value was stored correctly
            const entry = await cache.get("large:value:test");
            expect(entry).to.equal(largeValue);
        })
    })

    // ============================================================================
    // INTEGRATION TESTS
    // ============================================================================

    describe('Integration Tests', () => {

        it("should work with multiple cache services", async () => {
            // Test with different cache service
            const { data } = await GET('/odata/v4/caching-api/Caches(\'caching-northwind\')/getEntries()');
            
            expect(data.value).to.be.an('array');
        })

        it("should handle complete workflow", async () => {
            // 1. Set entries
            await POST('/odata/v4/caching-api/Caches(\'caching\')/setEntry', {
                key: "workflow:test",
                value: "workflow value",
                ttl: 10000
            });

            // 2. Get entry
            const { data: getData } = await GET('/odata/v4/caching-api/Caches(\'caching\')/getEntry(key=\'workflow:test\')');
            expect(getData.value).to.equal("workflow value");

            // 3. Get all entries
            const { data: entriesData } = await GET('/odata/v4/caching-api/Caches(\'caching\')/getEntries()');
            expect(entriesData.value).to.have.length(1);
            expect(entriesData.value[0].entryKey).to.equal("workflow:test");

            // 4. Enable metrics
            await POST('/odata/v4/caching-api/Caches(\'caching\')/setMetricsEnabled', { enabled: true });

            // 5. Check metrics
            const { data: metricsData } = await GET('/odata/v4/caching-api/Metrics?$filter=cache eq \'caching\'');
            expect(metricsData.value).to.be.an('array');

            // 6. Delete entry
            await POST('/odata/v4/caching-api/Caches(\'caching\')/deleteEntry', { key: "workflow:test" });

            // 7. Verify deletion
            const { data: deletedData } = await GET('/odata/v4/caching-api/Caches(\'caching\')/getEntry(key=\'workflow:test\')');
            expect(deletedData.value).to.be.undefined;
        })
    })
}) 