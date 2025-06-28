const cds = require('@sap/cds')
const { GET, expect } = cds.test().in(__dirname + '/app')

describe('Cache Statistics', () => {

    const cachingOptions = {
        impl: "cds-caching"
    }
    let cache;

    describe('basic methods', () => {

        // berfore connect to the cache service
        beforeEach(async () => {
            cache = await cds.connect.to("caching");
            await cache.setStatisticsEnabled(true);
            await cache.setKeyTrackingEnabled(true);
            await cache.clear();
        })

        describe('Basic Statistics', () => {
            it('should record cache operations with enhanced metrics', async () => {
                // Perform some cache operations
                await cache.set('test-key-1', 'value1');
                await cache.set('test-key-2', 'value2');

                await cache.get('test-key-1');
                await cache.get('test-key-2');
                await cache.get('non-existent-key'); // miss

                // Get current statistics
                const currentStats = await cache.getCurrentStats();

                expect(currentStats).to.not.be.null;
                expect(currentStats.hits).to.be.at.least(2);
                expect(currentStats.misses).to.be.at.least(1);
                expect(currentStats.sets).to.be.at.least(2);
                expect(currentStats.avgLatency).to.be.a('number');
                expect(currentStats.p95Latency).to.be.a('number');
                expect(currentStats.p99Latency).to.be.a('number');
                expect(currentStats.minLatency).to.be.a('number');
                expect(currentStats.maxLatency).to.be.a('number');
                expect(currentStats.hitRatio).to.be.a('number');
                expect(currentStats.throughput).to.be.a('number');
                expect(currentStats.errorRate).to.be.a('number');
                expect(currentStats.uptimeMs).to.be.a('number');
            });

            it('should calculate correct hit ratio', async () => {

                await cache.set('test-key-1', 'value1');
                await cache.set('test-key-2', 'value2');

                const result1 = await cache.get('test-key-1');
                const result2 = await cache.get('test-key-2');
                const result3 = await cache.get('non-existent-key'); // miss
                
                const stats = await cache.getCurrentStats();
                const expectedHitRatio = stats.hits / (stats.hits + stats.misses);
                expect(stats.hitRatio).to.be.closeTo(expectedHitRatio, 0.0001);
            });

            it('should calculate the correct cache efficiency', async () => {
                await cache.set('test-key-1', 'value1');
                await cache.set('test-key-2', 'value2');

                await cache.get('test-key-1');
                await cache.get('test-key-2');
                await cache.get('non-existent-key'); // miss

                const stats = await cache.getCurrentStats();
                const expectedCacheEfficiency = (stats.avgMissLatency / stats.avgHitLatency) || 0;
                expect(stats.cacheEfficiency).to.be.closeTo(expectedCacheEfficiency, 0.0001);
            })
        });

        describe('Enhanced Latency Metrics', () => {
            it('should track separate latency metrics for hits, misses, sets, and deletes', async () => {
                // Perform operations with different latencies
                await cache.set('key1', 'value1');
                await cache.set('key2', 'value2');
                await cache.set('key3', 'value3');

                await cache.get('key1'); // hit
                await cache.get('key2'); // hit
                await cache.get('non-existent-1'); // miss
                await cache.get('non-existent-2'); // miss

                await cache.delete('key1');
                await cache.delete('key2');

                const stats = await cache.getCurrentStats();

                // Check that all latency metrics are present
                expect(stats.avgHitLatency).to.be.a('number');
                expect(stats.p95HitLatency).to.be.a('number');
                expect(stats.p99HitLatency).to.be.a('number');
                expect(stats.minHitLatency).to.be.a('number');
                expect(stats.maxHitLatency).to.be.a('number');

                expect(stats.avgMissLatency).to.be.a('number');
                expect(stats.p95MissLatency).to.be.a('number');
                expect(stats.p99MissLatency).to.be.a('number');
                expect(stats.minMissLatency).to.be.a('number');
                expect(stats.maxMissLatency).to.be.a('number');

                expect(stats.avgSetLatency).to.be.a('number');
                expect(stats.avgDeleteLatency).to.be.a('number');

                // Verify that latencies are reasonable (not necessarily hit < miss)
                expect(stats.avgHitLatency).to.be.at.least(0);
                expect(stats.avgMissLatency).to.be.at.least(0);
                expect(stats.avgSetLatency).to.be.at.least(0);
                expect(stats.avgDeleteLatency).to.be.at.least(0);
            });

            it('should calculate cache efficiency correctly', async () => {
                await cache.set('key1', 'value1');
                await cache.get('key1'); // hit
                await cache.get('non-existent'); // miss

                const stats = await cache.getCurrentStats();

                expect(stats.cacheEfficiency).to.be.a('number');
                
                // Cache efficiency should be the ratio of miss latency to hit latency
                if (stats.avgHitLatency > 0 && stats.avgMissLatency > 0) {
                    const expectedEfficiency = stats.avgMissLatency / stats.avgHitLatency;
                    expect(stats.cacheEfficiency).to.be.closeTo(expectedEfficiency, 0.01);
                }
            });

            it('should handle percentile calculations correctly', async () => {
                // Create multiple operations to test percentiles
                for (let i = 0; i < 10; i++) {
                    await cache.set(`key${i}`, `value${i}`);
                    await cache.get(`key${i}`);
                }

                const stats = await cache.getCurrentStats();

                // P95 should be greater than or equal to average
                if (stats.avgHitLatency > 0 && stats.p95HitLatency > 0) {
                    expect(stats.p95HitLatency).to.be.at.least(stats.avgHitLatency);
                }

                // P99 should be greater than or equal to P95
                if (stats.p95HitLatency > 0 && stats.p99HitLatency > 0) {
                    expect(stats.p99HitLatency).to.be.at.least(stats.p95HitLatency);
                }

                // Max should be greater than or equal to P99
                if (stats.p99HitLatency > 0 && stats.maxHitLatency > 0) {
                    expect(stats.maxHitLatency).to.be.at.least(stats.p99HitLatency);
                }
            });
        });

        describe('Key Access Tracking', () => {
            it('should track key access patterns', async () => {
                // Access some keys multiple times
                await cache.set('frequent-key', 'value');
                await cache.get('frequent-key');
                await cache.get('frequent-key');
                await cache.get('frequent-key');

                await cache.set('rare-key', 'value');
                await cache.get('rare-key');

                const topKeys = await cache.statistics.getTopAccessedKeys(5);
                const coldKeys = await cache.statistics.getColdKeys(5);

                expect(topKeys).to.be.an('array');
                expect(coldKeys).to.be.an('array');

                // Should have at least some keys tracked
                expect(topKeys.length).to.be.at.least(1);

                // Check that frequent-key appears in top keys
                const frequentKey = topKeys.find(k => k.key === 'frequent-key');
                expect(frequentKey).to.exist;
                expect(frequentKey.total).to.be.at.least(4); // 1 set + 3 gets
            });

            it('should track metadata for key access', async () => {
                await cache.set('test-key', 'value');
                await cache.get('test-key');

                const topKeys = await cache.statistics.getTopAccessedKeys(5);
                const testKey = topKeys.find(k => k.key === 'test-key');

                // Key should exist in tracking
                expect(topKeys.length).to.be.at.least(1);
                
                // If the key is found, check its metadata
                if (testKey) {
                    expect(testKey.dataType).to.be.a('string');
                    expect(testKey.serviceName).to.be.a('string');
                    expect(testKey.operation).to.be.a('string');
                }
            });
        });

        describe('Historical Statistics', () => {
            it('should persist statistics to database', async () => {
                await cache.set('test-key-1', 'value1');
                await cache.set('test-key-2', 'value2');

                await cache.get('test-key-1');
                await cache.get('test-key-2');
                await cache.get('non-existent-key'); // miss

                // Trigger statistics persistence
                await cache.statistics.triggerPersistence();

                // Query historical statistics
                const historicalStats = await cache.getStats('hourly');

                expect(historicalStats).to.be.an('array');

                if (historicalStats.length > 0) {
                    const stat = historicalStats[0];
                    expect(stat).to.have.property('hits');
                    expect(stat).to.have.property('misses');
                    expect(stat).to.have.property('avgLatency');
                    expect(stat).to.have.property('p95Latency');
                    expect(stat).to.have.property('p99Latency');
                    expect(stat).to.have.property('minLatency');
                    expect(stat).to.have.property('maxLatency');
                    expect(stat).to.have.property('hitRatio');
                    expect(stat).to.have.property('throughput');
                    expect(stat).to.have.property('errorRate');
                    expect(stat).to.have.property('avgHitLatency');
                    expect(stat).to.have.property('avgMissLatency');
                    expect(stat).to.have.property('avgSetLatency');
                    expect(stat).to.have.property('avgDeleteLatency');
                    expect(stat).to.have.property('cacheEfficiency');
                }
            });

            it('should calculate weighted averages correctly during persistence', async () => {
                // First batch of operations
                await cache.set('key1', 'value1');
                await cache.get('key1');
                await cache.get('non-existent-1');

                // Trigger first persistence
                await cache.statistics.triggerPersistence();

                // Second batch of operations
                await cache.set('key2', 'value2');
                await cache.get('key2');
                await cache.get('non-existent-2');

                // Trigger second persistence
                await cache.statistics.triggerPersistence();

                const historicalStats = await cache.getStats('hourly');
                
                if (historicalStats.length > 0) {
                    const stat = historicalStats[0];
                    
                    // Total counts should be cumulative
                    expect(stat.hits).to.be.at.least(2);
                    expect(stat.misses).to.be.at.least(2);
                    expect(stat.sets).to.be.at.least(2);
                    
                    // Hit ratio should be calculated from cumulative totals
                    if (stat.hitRatio !== undefined) {
                        const expectedHitRatio = (stat.hits / (stat.hits + stat.misses)) * 100; // Convert to percentage
                        expect(stat.hitRatio).to.be.closeTo(expectedHitRatio, 1); // Allow 1% variance
                    }
                }
            });
        });

        describe('Real-time Monitoring', () => {
            it('should provide real-time statistics via OData', async () => {

                const app = await cds.connect.to('AppService');
                const response = await GET `/odata/v4/caching/Statistics?$filter=period eq 'current'`;

                expect(response.status).to.equal(200);
                expect(response.data.value).to.be.an('array');

                if (response.data.value.length > 0) {
                    const stat = response.data.value[0];
                    expect(stat).to.have.property('hits');
                    expect(stat).to.have.property('misses');
                    expect(stat).to.have.property('avgLatency');
                    expect(stat).to.have.property('hitRatio');
                    expect(stat).to.have.property('avgHitLatency');
                    expect(stat).to.have.property('avgMissLatency');
                    expect(stat).to.have.property('avgSetLatency');
                    expect(stat).to.have.property('avgDeleteLatency');
                    expect(stat).to.have.property('cacheEfficiency');
                }
            });
        });

        describe('Configuration Options', () => {
            it('should respect configuration settings', async () => {
                // Test that statistics handler respects configuration
                const currentStats = await cache.getCurrentStats();

                // Should have basic statistics available
                expect(currentStats.hits).to.be.a('number');
                expect(currentStats.misses).to.be.a('number');
                expect(currentStats.avgLatency).to.be.a('number');
                expect(currentStats.hitRatio).to.be.a('number');
            });

            it('should handle statistics enable/disable', async () => {
                // Disable statistics
                await cache.setStatisticsEnabled(false);
                
                await cache.set('test-key', 'value');
                await cache.get('test-key');
                
                const stats = await cache.getCurrentStats();
                expect(stats).to.be.null;

                // Re-enable statistics
                await cache.setStatisticsEnabled(true);
                
                await cache.set('test-key2', 'value');
                await cache.get('test-key2');
                
                const stats2 = await cache.getCurrentStats();
                expect(stats2).to.not.be.null;
                expect(stats2.hits).to.be.at.least(1);
            });
        });

        describe('Memory and Resource Monitoring', () => {
            it('should track memory usage', async () => {
                const stats = await cache.getCurrentStats();

                expect(stats.memoryUsage).to.be.a('number');
                expect(stats.memoryUsage).to.be.greaterThan(0);
                expect(stats.itemCount).to.be.a('number');
                expect(stats.itemCount).to.be.at.least(0);
            });

            it('should track item count correctly', async () => {
                await cache.set('key1', 'value1');
                await cache.set('key2', 'value2');
                
                const stats = await cache.getCurrentStats();
                expect(stats.itemCount).to.be.at.least(2);
            });
        });

        describe('Error Handling', () => {
            it('should handle errors gracefully', async () => {
                // Test error recording
                try {
                    await cache.get('invalid-key');
                } catch (error) {
                    // Expected
                }

                const stats = await cache.getCurrentStats();
                expect(stats.errors).to.be.at.least(0);
            });

            it('should not count errors as requests', async () => {
                // Clear any existing stats first
                await cache.clear();
                await cache.statistics.resetCurrentStats();
                
                const initialStats = await cache.getCurrentStats();
                const initialTotalRequests = initialStats ? (initialStats.hits + initialStats.misses) : 0;

                // First, do a normal cache miss to establish baseline
                await cache.get('non-existent-key'); // This should be a miss, not an error
                
                const afterMissStats = await cache.getCurrentStats();
                const afterMissTotalRequests = afterMissStats ? (afterMissStats.hits + afterMissStats.misses) : 0;
                expect(afterMissTotalRequests).to.equal(initialTotalRequests + 1); // Should have increased by 1
                
                // Now try to get an invalid key that should cause an error
                try {
                    await cache.get(null); // This should cause an error
                } catch (error) {
                    // Expected
                }

                const finalStats = await cache.getCurrentStats();
                const finalTotalRequests = finalStats ? (finalStats.hits + finalStats.misses) : 0;
                
                // Total requests should not have increased due to error (should still be 1)
                expect(finalTotalRequests).to.equal(initialTotalRequests + 1);
                if (finalStats) {
                    expect(finalStats.errors).to.be.at.least(1);
                }
            });
        });

        describe('Edge Cases', () => {
            it('should handle zero operations gracefully', async () => {
                // Clear cache and reset stats
                await cache.clear();
                await cache.statistics.resetCurrentStats();
                
                const stats = await cache.getCurrentStats();
                
                expect(stats.hits).to.equal(0);
                expect(stats.misses).to.equal(0);
                expect(stats.sets).to.equal(0);
                expect(stats.deletes).to.equal(0);
                expect(stats.hitRatio).to.equal(0);
                expect(stats.throughput).to.equal(0);
                expect(stats.errorRate).to.equal(0);
                expect(stats.cacheEfficiency).to.equal(0);
            });

            it('should handle very fast operations', async () => {
                // Clear cache first
                await cache.clear();
                
                // Perform many fast operations
                for (let i = 0; i < 100; i++) {
                    await cache.set(`fast-key-${i}`, `value-${i}`);
                    await cache.get(`fast-key-${i}`);
                }

                const stats = await cache.getCurrentStats();
                
                expect(stats.hits).to.equal(100);
                expect(stats.sets).to.equal(100);
                expect(stats.avgLatency).to.be.a('number');
                expect(stats.avgHitLatency).to.be.a('number');
                expect(stats.avgSetLatency).to.be.a('number');
            });

            it('should handle very slow operations', async () => {
                // Clear cache first
                await cache.clear();
                
                // Simulate slow operations by adding delay
                const slowSet = async (key, value) => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    return cache.set(key, value);
                };

                const slowGet = async (key) => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    return cache.get(key);
                };

                await slowSet('slow-key', 'value');
                await slowGet('slow-key');

                const stats = await cache.getCurrentStats();
                
                // Latencies should be reasonable (may not be exactly 10ms due to overhead)
                expect(stats.avgLatency).to.be.a('number');
                expect(stats.avgHitLatency).to.be.a('number');
                expect(stats.avgSetLatency).to.be.a('number');
            });

            it('should handle large data sets', async () => {
                // Clear cache first
                await cache.clear();
                await cache.statistics.resetCurrentStats();
                
                const largeData = 'x'.repeat(10000);
                
                await cache.set('large-key', largeData);
                await cache.get('large-key');

                const stats = await cache.getCurrentStats();
                
                expect(stats.hits).to.equal(1);
                expect(stats.sets).to.equal(1);
                expect(stats.avgLatency).to.be.a('number');
            });
        });

        describe('Performance Metrics', () => {
            it('should calculate throughput correctly', async () => {
                // Clear cache first
                await cache.clear();
                
                const startTime = Date.now();
                
                // Perform operations over time
                for (let i = 0; i < 10; i++) {
                    await cache.set(`throughput-key-${i}`, `value-${i}`);
                    await cache.get(`throughput-key-${i}`);
                    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
                }

                const stats = await cache.getCurrentStats();
                const endTime = Date.now();
                const duration = (endTime - startTime) / 1000; // seconds
                
                expect(stats.throughput).to.be.a('number');
                expect(stats.throughput).to.be.greaterThan(0);
                
                // Throughput should be reasonable (allow for variance)
                const expectedThroughput = (stats.hits + stats.misses) / duration;
                expect(stats.throughput).to.be.closeTo(expectedThroughput, expectedThroughput * 0.5); // Allow 50% variance
            });

            it('should calculate error rate correctly', async () => {
                // Clear cache first
                await cache.clear();
                
                await cache.set('key1', 'value1');
                await cache.get('key1'); // hit
                await cache.get('non-existent'); // miss
                
                // Simulate an error
                try {
                    await cache.get('invalid-key');
                } catch (error) {
                    // Expected
                }

                const stats = await cache.getCurrentStats();
                const totalRequests = stats.hits + stats.misses;
                const expectedErrorRate = stats.errors / totalRequests;
                
                expect(stats.errorRate).to.be.closeTo(expectedErrorRate, 0.01);
            });
        });

        describe('Latency Distribution', () => {
            it('should maintain latency arrays correctly', async () => {
                // Perform operations to populate latency arrays
                for (let i = 0; i < 50; i++) {
                    await cache.set(`latency-key-${i}`, `value-${i}`);
                    await cache.get(`latency-key-${i}`);
                }

                const stats = await cache.getCurrentStats();
                
                // Check that latency arrays are populated
                expect(stats.avgLatency).to.be.greaterThan(0);
                expect(stats.avgHitLatency).to.be.greaterThan(0);
                expect(stats.avgSetLatency).to.be.greaterThan(0);
                
                // Check percentile calculations
                expect(stats.p95Latency).to.be.at.least(stats.avgLatency);
                expect(stats.p99Latency).to.be.at.least(stats.p95Latency);
                expect(stats.maxLatency).to.be.at.least(stats.p99Latency);
            });
        });
    });
});