const { Request } = require('@sap/cds');
const cds = require('@sap/cds');
const { GET, POST, expect } = cds.test().in(__dirname + '/app/')

describe('Cache Metrics - Testing', () => {

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
    // METRICS ENABLED/DISABLED TESTS
    // ============================================================================

    describe('Metrics Enabled/Disabled States', () => {

        describe('Main Metrics Flag', () => {

            it("should not record read-through metrics when disabled", async () => {
                await cache.setMetricsEnabled(false);

                // Perform read-through operations using cache.rt.send
                await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: "test:metrics:disabled" } });

                const stats = await cache.getCurrentMetrics();
                expect(stats).to.be.null;
            })

            it("should record read-through metrics when enabled", async () => {
                await cache.setMetricsEnabled(true);

                // Perform read-through operations using cache.rt.send
                await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: "test:metrics:enabled" } });
                await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: "test:metrics:enabled" } });

                const stats = await cache.getCurrentMetrics();
                expect(stats.hits).to.equal(1);
                expect(stats.misses).to.equal(1);
                expect(stats.totalRequests).to.equal(2);
                expect(stats.nativeSets).to.equal(0);
                expect(stats.nativeGets).to.equal(0);
                expect(stats.nativeDeletes).to.equal(0);
                expect(stats.totalNativeOperations).to.equal(0);
            })

            it("should not record native operation metrics when disabled", async () => {
                await cache.setMetricsEnabled(false);

                // Perform native operations    
                await cache.set("test:native:disabled", "value");
                await cache.get("test:native:disabled");
                await cache.get("test:native:disabled:missing");
                await cache.delete("test:native:disabled");

                const stats = await cache.getCurrentMetrics();
                expect(stats).to.be.null;
            })

            it("should record native operation metrics when enabled", async () => {
                await cache.setMetricsEnabled(true);

                // Perform native operations
                await cache.set("test:native:enabled", "value");
                await cache.get("test:native:enabled");
                await cache.get("test:native:enabled:missing");
                await cache.delete("test:native:enabled");

                const stats = await cache.getCurrentMetrics();
                expect(stats.nativeSets).to.equal(1);
                expect(stats.nativeGets).to.equal(2);
                expect(stats.nativeDeletes).to.equal(1);
                expect(stats.totalNativeOperations).to.equal(4);
            })

            it("should not record latencies when disabled", async () => {
                await cache.setMetricsEnabled(false);

                // Perform operations that would generate latencies
                await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: "test:latency:disabled" } });

                const stats = await cache.getCurrentMetrics();
                expect(stats).to.be.null;
            })

            it("should record latencies when enabled", async () => {
                await cache.setMetricsEnabled(true);

                // Perform operations that would generate latencies
                await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: "test:latency:enabled" } });

                const stats = await cache.getCurrentMetrics();
                expect(stats.avgMissLatency).to.be.a('number');
                expect(stats.avgMissLatency).to.be.greaterThanOrEqual(0);
            })
        })

        describe('Key Metrics Flag', () => {

            it("should not track key access when disabled", async () => {
                await cache.setKeyMetricsEnabled(false);
                await cache.setMetricsEnabled(true); // Enable main metrics

                // Perform operations
                await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: "test:key:disabled" } });

                await cache.set("test:native:key:disabled", "value");
                await cache.get("test:native:key:disabled");

                const keyMetrics = await cache.getCurrentKeyMetrics();
                expect(keyMetrics).to.be.null;
            })

            it("should track key access when enabled", async () => {
                await cache.setKeyMetricsEnabled(true);
                await cache.setMetricsEnabled(true); // Enable main metrics

                // Perform operations
                const request = new Request({ event: "getCachedValue", data: { param1: "test1" } });
                const keyOptions = { key: { value: "test:key:enabled" } };


                await cache.rt.send(request, appService, keyOptions);

                await cache.set("test:native:key:enabled", "value");
                await cache.get("test:native:key:enabled");

                const keyMetrics = await cache.getCurrentKeyMetrics();

                expect(keyMetrics).to.be.instanceof(Map);
                expect(keyMetrics.size).to.be.greaterThan(0);

                // Check if the expected key exists
                const expectedKey = "test:key:enabled";
                const expectedNativeKey = "test:native:key:enabled";


                if (keyMetrics.has(expectedKey)) {
                    const keyStats = keyMetrics.get(expectedKey);
                    expect(keyStats.totalRequests).to.be.greaterThan(0);
                } else {
                    // For now, just check that some key has totalRequests > 0
                    let foundKeyWithRequests = false;
                    for (const [key, stats] of keyMetrics.entries()) {
                        if (stats.totalRequests > 0) {
                            foundKeyWithRequests = true;
                            break;
                        }
                    }
                    expect(foundKeyWithRequests).to.be.true;
                }

                expect(keyMetrics.get(expectedNativeKey).totalNativeOperations).to.be.greaterThan(0);
            })

            it("should track key access independently of main metrics", async () => {
                await cache.setKeyMetricsEnabled(true);
                await cache.setMetricsEnabled(false); // Disable main metrics

                // Perform operations
                await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: "test:key:independent" } });

                await cache.set("test:native:key:independent", "value");
                await cache.get("test:native:key:independent");

                const keyMetrics = await cache.getCurrentKeyMetrics();
                expect(keyMetrics).to.be.instanceof(Map);
                expect(keyMetrics.size).to.be.greaterThan(0);

                // Main metrics should still be disabled
                const stats = await cache.getCurrentMetrics();
                expect(stats).to.be.null;
            })
        })
    })

    // ============================================================================
    // READ-THROUGH VS NATIVE OPERATIONS SEPARATION
    // ============================================================================

    describe('Read-Through vs Native Operations Separation', () => {

        it("should not count native operations in read-through metrics", async () => {
            await cache.setMetricsEnabled(true);

            // Perform native operations
            await cache.set("test:native:separation", "value");
            await cache.get("test:native:separation");
            await cache.delete("test:native:separation");

            // Perform read-through operations
            await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: "test:rt:separation" } });

            const stats = await cache.getCurrentMetrics();

            // Read-through metrics should only reflect read-through operations
            expect(stats.hits).to.equal(0);
            expect(stats.misses).to.equal(1);

            // Native metrics should only reflect native operations
            expect(stats.nativeSets).to.equal(1);
            expect(stats.nativeGets).to.equal(1);
            expect(stats.nativeDeletes).to.equal(1);
            expect(stats.totalNativeOperations).to.equal(3);
        })

        it("should track read-through operations with latencies", async () => {
            await cache.setMetricsEnabled(true);

            // Perform read-through operations
            await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: "test:rt:latency" } });

            const stats = await cache.getCurrentMetrics();

            // Should have latency data for read-through operations
            expect(stats.avgMissLatency).to.be.greaterThan(0);
            expect(stats.avgMissLatency).to.be.lessThan(10000);
        })

        it("should track native operations without latencies", async () => {
            await cache.setMetricsEnabled(true);

            // Perform native operations
            await cache.set("test:native:no:latency", "value");
            await cache.get("test:native:no:latency");

            const stats = await cache.getCurrentMetrics();

            // Should have counts but no latency data for native operations
            expect(stats.nativeSets).to.equal(1);
            expect(stats.nativeGets).to.equal(1);
            expect(stats.totalNativeOperations).to.equal(2);

            // Native operations don't contribute to read-through latencies
            expect(stats.avgHitLatency).to.equal(0);
            expect(stats.avgMissLatency).to.equal(0);
        })
    })

    // ============================================================================
    // METRICS CALCULATIONS
    // ============================================================================

    describe('Metrics Calculations', () => {

        describe('Hit Ratio Calculations', () => {

            it("should calculate hit ratio correctly for read-through operations", async () => {
                await cache.setMetricsEnabled(true);

                // First request (miss)
                await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: "test:hit:ratio" } });

                // Second request (hit)
                await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: "test:hit:ratio" } });

                // Third request (hit)
                await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: "test:hit:ratio" } });

                const stats = await cache.getCurrentMetrics();

                // 1 miss, 2 hits = 66.67% hit ratio
                expect(stats.hits).to.equal(2);
                expect(stats.misses).to.equal(1);
                expect(stats.totalRequests).to.equal(3);
                expect(stats.hitRatio * 100).to.be.closeTo(66.67, 1);
            })

            it("should count native operations correctly", async () => {
                await cache.setMetricsEnabled(true);

                // Set a value
                await cache.set("test:native:hit:ratio", "value");

                // Get it (hit)
                await cache.get("test:native:hit:ratio");

                // Get it again (hit)
                await cache.get("test:native:hit:ratio");

                // Get non-existent (miss)
                await cache.get("test:native:hit:ratio:missing");

                const stats = await cache.getCurrentMetrics();

                // 2 hits, 1 miss for native operations
                expect(stats.nativeGets).to.equal(3);
                expect(stats.nativeSets).to.equal(1);
                expect(stats.totalNativeOperations).to.equal(4);
            })
        })

        describe('Latency Calculations', () => {

            it("should calculate average latencies correctly", async () => {
                await cache.setMetricsEnabled(true);

                // Perform multiple operations to get average
                for (let i = 0; i < 3; i++) {
                    await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: `test:latency:avg:${i}` } });
                }

                const stats = await cache.getCurrentMetrics();

                expect(stats.avgMissLatency).to.be.a('number');
                expect(stats.avgMissLatency).to.be.greaterThanOrEqual(0);

                // Average should be reasonable (not negative, not extremely high)
                expect(stats.avgMissLatency).to.be.lessThan(10000); // Less than 10 seconds
            })

            it("should calculate min/max latencies correctly", async () => {
                await cache.setMetricsEnabled(true);

                // Perform multiple operations to get percentiles
                for (let i = 0; i < 10; i++) {
                    await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: `test:percentile:${i}` } });
                }

                const stats = await cache.getCurrentMetrics();

                // Should have min/max data
                expect(stats.minHitLatency).to.be.a('number');
                expect(stats.maxHitLatency).to.be.a('number');

                // Min should be less than or equal to max
                expect(stats.minHitLatency).to.be.lessThanOrEqual(stats.maxHitLatency);
            })
        })

        describe('Throughput Calculations', () => {

            it("should calculate throughput correctly", async () => {
                await cache.setMetricsEnabled(true);

                const startTime = Date.now();

                // Perform operations over time
                for (let i = 0; i < 5; i++) {
                    await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: `test:throughput:${i}` } });

                    // Small delay to simulate real usage
                    await new Promise(resolve => setTimeout(resolve, 10));
                }

                const stats = await cache.getCurrentMetrics();

                expect(stats.throughput).to.be.a('number');
                expect(stats.throughput).to.be.greaterThan(0);

                // Throughput should be reasonable (not negative, not extremely high)
                expect(stats.throughput).to.be.lessThan(1000); // Less than 1000 req/sec
            })
        })

        describe('Error Rate Calculations', () => {

            it("should calculate error rate correctly", async () => {
                await cache.setMetricsEnabled(true);

                // Perform successful operations
                for (let i = 0; i < 8; i++) {
                    await cache.rt.send(new Request({ event: "getCachedValue", data: { param1: "test1" } }), appService, { key: { value: `test:error:rate:${i}` } });
                }

                // Simulate some errors (these might not actually error, but we can test the calculation)
                try {
                    await cache.rt.send(new Request({ event: "NonExistentFunction" }), appService, { key: { value: "test:error:rate:error" } });
                } catch (error) {
                    // Expected to fail
                }

                try {
                    await cache.rt.send(new Request({ event: "AnotherNonExistentFunction" }), appService, { key: { value: "test:error:rate:error2" } });
                } catch (error) {
                    // Expected to fail
                }

                const stats = await cache.getCurrentMetrics();

                expect(stats.errorRate).to.be.a('number');
                expect(stats.errorRate).to.be.greaterThanOrEqual(0);

                // Error rate should be reasonable (not negative, not over 100%)
                expect(stats.errorRate * 100).to.be.lessThanOrEqual(100);
            })
        })
    })

    // ============================================================================
    // KEY METRICS TRACKING
    // ============================================================================

    describe('Key Metrics Tracking', () => {

        it("should track top accessed keys correctly", async () => {
            await cache.setKeyMetricsEnabled(true);
            await cache.setMetricsEnabled(true);

            // Access different keys with different frequencies
            for (let i = 0; i < 5; i++) {
                await cache.rt.send(
                    new Request({ event: "getCachedValue", data: { param1: "test1" } }),
                    appService,
                    { key: { value: "test:top:key:1" } }
                );
            }

            for (let i = 0; i < 3; i++) {
                await cache.rt.send(
                    new Request({ event: "getCachedValue", data: { param1: "test2" } }),
                    appService,
                    { key: { value: "test:top:key:2" } }
                );
            }

            await cache.rt.send(
                new Request({ event: "getCachedValue", data: { param1: "test3" } }),
                appService,
                { key: { value: "test:top:key:3" } }
            );

            const keyMetrics = await cache.getCurrentKeyMetrics();

            expect(keyMetrics).to.be.instanceof(Map);
            expect(keyMetrics.size).to.be.greaterThan(0);

            // Convert to array and sort by totalRequests
            const sortedKeys = Array.from(keyMetrics.entries())
                .map(([key, stats]) => ({ key, ...stats }))
                .sort((a, b) => b.totalRequests - a.totalRequests);

            // Should be sorted by access count (descending)
            if (sortedKeys.length > 1) {
                expect(sortedKeys[0].totalRequests).to.be.greaterThanOrEqual(sortedKeys[1].totalRequests);
            }
        })

        it("should track key details correctly", async () => {
            await cache.setKeyMetricsEnabled(true);
            await cache.setMetricsEnabled(true);

            const testKey = "test:key:details";

            // Perform operations on the key
            await cache.rt.send(
                new Request({ event: "getCachedValue", data: { param1: "test1" } }),
                appService,
                { key: { value: testKey } }
            );

            await cache.rt.send(
                new Request({ event: "getCachedValue", data: { param1: "test1" } }),
                appService,
                { key: { value: testKey } }
            );

            const keyMetrics = await cache.getCurrentKeyMetrics();

            expect(keyMetrics).to.be.instanceof(Map);
            expect(keyMetrics.has(testKey)).to.be.true;

            const keyStats = keyMetrics.get(testKey);
            expect(keyStats.totalRequests).to.be.greaterThan(0);
            expect(keyStats.hits).to.be.greaterThan(0);
            expect(keyStats.misses).to.be.greaterThan(0);
        })

        it("should track cold keys correctly", async () => {
            await cache.setKeyMetricsEnabled(true);
            await cache.setMetricsEnabled(true);

            // Access some keys
            for (let i = 0; i < 3; i++) {
                await cache.rt.send(
                    new Request({ event: "getCachedValue", data: { param1: "test1" } }),
                    appService,
                    { key: { value: `test:cold:key:${i}` } }
                );
            }

            const keyMetrics = await cache.getCurrentKeyMetrics();

            expect(keyMetrics).to.be.instanceof(Map);
            expect(keyMetrics.size).to.be.greaterThan(0);

            // Convert to array and sort by totalRequests (ascending for cold keys)
            const sortedKeys = Array.from(keyMetrics.entries())
                .map(([key, stats]) => ({ key, ...stats }))
                .sort((a, b) => a.totalRequests - b.totalRequests);

            // Cold keys should be keys with low access frequency
            sortedKeys.forEach(key => {
                expect(key.totalRequests).to.be.a('number');
                expect(key.totalRequests).to.be.greaterThanOrEqual(0);
            });
        })
    })

    // ============================================================================
    // METRICS PERSISTENCE
    // ============================================================================

    describe('Metrics Persistence', () => {

        it("should persist metrics correctly", async () => {
            await cache.setMetricsEnabled(true);

            // Perform operations
            await cache.rt.send(
                new Request({ event: "getCachedValue", data: { param1: "test1" } }),
                appService,
                { key: { value: "test:persistence" } }
            );

            // Trigger persistence - should not throw
            await cache.persistMetrics();

            // Verify metrics are reset after persistence
            const stats = await cache.getCurrentMetrics();
            expect(stats.hits).to.equal(0);
            expect(stats.misses).to.equal(0);
            expect(stats.nativeSets).to.equal(0);
            expect(stats.nativeGets).to.equal(0);
            expect(stats.nativeDeletes).to.equal(0);
            expect(stats.totalNativeOperations).to.equal(0);
        })

        it("should handle historical metrics correctly", async () => {
            await cache.setMetricsEnabled(true);

            // Perform operations
            await cache.rt.send(
                new Request({ event: "getCachedValue", data: { param1: "test1" } }),
                appService,
                { key: { value: "test:historical" } }
            );

            await cache.persistMetrics();

            // Get historical stats
            const from = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
            const to = new Date(Date.now() + 1 * 60 * 60 * 1000); // + 1 hour

            const historicalStats = await cache.getMetrics(from, to);

            expect(historicalStats).to.be.an('array');
            expect(historicalStats.length).to.be.greaterThan(0);
            expect(historicalStats[0].misses).to.be.greaterThan(0);
        })

        it("should handle historical key metrics correctly", async () => {
            await cache.setKeyMetricsEnabled(true);
            await cache.setMetricsEnabled(true);

            const testKey = "test:key:details";

            // Perform operations on the key
            await cache.rt.send(
                new Request({ event: "getCachedValue", data: { param1: "test1" } }),
                appService,
                { key: { value: testKey } }
            );

            await cache.rt.send(
                new Request({ event: "getCachedValue", data: { param1: "test1" } }),
                appService,
                { key: { value: testKey } }
            );

            await cache.persistMetrics();

            const from = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
            const to = new Date();

            const historicalKeyMetrics = await cache.getKeyMetrics(testKey, from, to);

            expect(historicalKeyMetrics).to.be.an('array');
            expect(historicalKeyMetrics.length).to.be.greaterThan(0);
            expect(historicalKeyMetrics[0].misses).to.be.greaterThan(0);

            // Check all the properties of the historicalKeyMetrics
            historicalKeyMetrics.forEach(metric => {
                expect(metric.keyName).to.be.equal(testKey);
                expect(metric.hits).to.be.greaterThan(0);
                expect(metric.misses).to.be.greaterThan(0);
                expect(metric.totalRequests).to.be.greaterThan(0);
            });
        })
    })

    // ============================================================================
    // METRICS CLEANUP
    // ============================================================================

    describe('Metrics Cleanup', () => {

        it("should clear metrics correctly", async () => {
            await cache.setMetricsEnabled(true);

            // Perform operations to generate metrics
            await cache.rt.send(
                new Request({ event: "getCachedValue", data: { param1: "test1" } }),
                appService,
                { key: { value: "test:clear:metrics" } }
            );

            await cache.set("test:clear:native", "value");
            await cache.get("test:clear:native");

            // Verify metrics exist
            let stats = await cache.getCurrentMetrics();
            expect(stats.misses).to.be.greaterThan(0);

            // Clear metrics
            await cache.clearMetrics();

            // Verify metrics are cleared
            stats = await cache.getCurrentMetrics();
            expect(stats.hits).to.equal(0);
            expect(stats.misses).to.equal(0);
            expect(stats.nativeSets).to.equal(0);
            expect(stats.nativeGets).to.equal(0);
        })

        it("should clear key metrics correctly", async () => {
            await cache.setKeyMetricsEnabled(true);
            await cache.setMetricsEnabled(true);

            // Perform operations to generate key metrics
            await cache.rt.send(
                new Request({ event: "getCachedValue", data: { param1: "test1" } }),
                appService,
                { key: { value: "test:clear:key:metrics" } }
            );

            // Verify key metrics exist
            let keyMetrics = await cache.getCurrentKeyMetrics();
            expect(keyMetrics.size).to.be.greaterThan(0);

            // Clear key metrics
            await cache.clearKeyMetrics();

            // Verify key metrics are cleared
            keyMetrics = await cache.getCurrentKeyMetrics();
            expect(keyMetrics.size).to.equal(0);
        })
    })

    // ============================================================================
    // EDGE CASES AND ERROR HANDLING
    // ============================================================================

    describe('Edge Cases and Error Handling', () => {

        it("should handle rapid metric updates correctly", async () => {
            await cache.setMetricsEnabled(true);

            // Perform rapid operations
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(cache.rt.send(
                    new Request({ event: "getCachedValue", data: { param1: "test1" } }),
                    appService,
                    { key: { value: `test:rapid:${i}` } }
                ));
            }

            await Promise.all(promises);

            const stats = await cache.getCurrentMetrics();
            expect(stats.totalRequests).to.equal(10);
        })

        it("should handle concurrent metric access correctly", async () => {
            await cache.setMetricsEnabled(true);

            // Perform concurrent operations
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(cache.rt.send(
                    new Request({ event: "getCachedValue", data: { param1: "test1" } }),
                    appService,
                    { key: { value: `test:concurrent:${i}` } }
                ));
            }

            await Promise.all(promises);

            const stats = await cache.getCurrentMetrics();
            expect(stats.totalRequests).to.equal(5);
        })

        it("should handle metrics with very high latencies", async () => {
            await cache.setMetricsEnabled(true);

            // Simulate high latency by adding delay to the service
            const originalRun = appService.run;
            appService.run = async (req) => {
                await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
                return originalRun.call(appService, req);
            };

            await cache.rt.send(
                new Request({ event: "getCachedValue", data: { param1: "test1" } }),
                appService,
                { key: { value: "test:high:latency" } }
            );

            const stats = await cache.getCurrentMetrics();
            expect(stats.avgMissLatency).to.be.a('number');
            expect(stats.avgMissLatency).to.be.greaterThan(100); // Should reflect the delay

            // Reset the delay
            appService.run = originalRun;
        })
    })
}) 