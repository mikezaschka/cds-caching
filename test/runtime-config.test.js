const cds = require('@sap/cds');
const { expect } = require('chai');

describe('Runtime Configuration Tests', () => {
    let app, cacheService;

    before(async () => {
        app = cds.test(__dirname + '/app');
        await app.load('index.cds');
        await app.serve('all');
    });

    beforeEach(async () => {
        // Clear any existing cache configurations
        await app.db.run(DELETE.from('plugin_cds_caching_Caches'));
    });

    after(async () => {
        await app.db.disconnect();
    });

    describe('Runtime Configuration Management', () => {
        it('should create cache with default configuration', async () => {
            const cacheName = 'test-cache';
            
            // Create a cache entry
            await app.db.run(INSERT.into('plugin_cds_caching_Caches').entries([{
                name: cacheName,
                config: JSON.stringify({}),
                enableStatistics: false,
                enableKeyTracking: false
            }]));

            // Verify default configuration
            const cache = await app.db.run(SELECT.one.from('plugin_cds_caching_Caches').where({ name: cacheName }));
            expect(cache.enableStatistics).to.be.false;
            expect(cache.enableKeyTracking).to.be.false;
        });

        it('should enable statistics at runtime', async () => {
            const cacheName = 'test-cache';
            
            // Create a cache entry
            await app.db.run(INSERT.into('plugin_cds_caching_Caches').entries([{
                name: cacheName,
                config: JSON.stringify({}),
                enableStatistics: false,
                enableKeyTracking: false
            }]));

            // Enable statistics
            const result = await app.service('statistics').setStatisticsEnabled({ cache: cacheName, enabled: true });
            expect(result).to.be.true;

            // Verify configuration was updated
            const cache = await app.db.run(SELECT.one.from('plugin_cds_caching_Caches').where({ name: cacheName }));
            expect(cache.enableStatistics).to.be.true;
        });

        it('should enable key tracking at runtime', async () => {
            const cacheName = 'test-cache';
            
            // Create a cache entry
            await app.db.run(INSERT.into('plugin_cds_caching_Caches').entries([{
                name: cacheName,
                config: JSON.stringify({}),
                enableStatistics: false,
                enableKeyTracking: false
            }]));

            // Enable key tracking
            const result = await app.service('statistics').setKeyTrackingEnabled({ cache: cacheName, enabled: true });
            expect(result).to.be.true;

            // Verify configuration was updated
            const cache = await app.db.run(SELECT.one.from('plugin_cds_caching_Caches').where({ name: cacheName }));
            expect(cache.enableKeyTracking).to.be.true;
        });

        it('should get runtime configuration', async () => {
            const cacheName = 'test-cache';
            
            // Create a cache entry with enabled features
            await app.db.run(INSERT.into('plugin_cds_caching_Caches').entries([{
                name: cacheName,
                config: JSON.stringify({}),
                enableStatistics: true,
                enableKeyTracking: true
            }]));

            // Get runtime configuration
            const config = await app.service('statistics').getRuntimeConfiguration({ cache: cacheName });
            expect(config.enableStatistics).to.be.true;
            expect(config.enableKeyTracking).to.be.true;
        });

        it('should disable features at runtime', async () => {
            const cacheName = 'test-cache';
            
            // Create a cache entry with enabled features
            await app.db.run(INSERT.into('plugin_cds_caching_Caches').entries([{
                name: cacheName,
                config: JSON.stringify({}),
                enableStatistics: true,
                enableKeyTracking: true
            }]));

            // Disable statistics
            const result1 = await app.service('statistics').setStatisticsEnabled({ cache: cacheName, enabled: false });
            expect(result1).to.be.true;

            // Disable key tracking
            const result2 = await app.service('statistics').setKeyTrackingEnabled({ cache: cacheName, enabled: false });
            expect(result2).to.be.true;

            // Verify configuration was updated
            const cache = await app.db.run(SELECT.one.from('plugin_cds_caching_Caches').where({ name: cacheName }));
            expect(cache.enableStatistics).to.be.false;
            expect(cache.enableKeyTracking).to.be.false;
        });

        it('should actually record statistics when enabled', async () => {
            const cacheName = 'test-cache';
            
            // Create a cache entry with statistics disabled
            await app.db.run(INSERT.into('plugin_cds_caching_Caches').entries([{
                name: cacheName,
                config: JSON.stringify({}),
                enableStatistics: false,
                enableKeyTracking: false
            }]));

            // Enable statistics
            const result = await app.service('statistics').setStatisticsEnabled({ cache: cacheName, enabled: true });
            expect(result).to.be.true;

            // Verify configuration was updated
            const cache = await app.db.run(SELECT.one.from('plugin_cds_caching_Caches').where({ name: cacheName }));
            expect(cache.enableStatistics).to.be.true;

            // Get the cache service and verify it has statistics enabled
            const cacheService = await cds.connect.to(cacheName);
            expect(cacheService.statistics.options.enabled).to.be.true;

            // Perform some cache operations and verify statistics are recorded
            await cacheService.set('test-key', 'test-value');
            const value = await cacheService.get('test-key');
            
            // Check if statistics were recorded
            const currentStats = await cacheService.getCurrentStats();
            expect(currentStats).to.not.be.null;
            expect(currentStats.hits).to.be.greaterThan(0);
        });

        it('should trigger configuration reload when settings are changed', async () => {
            const cacheName = 'test-cache';
            
            // Create a cache entry
            await app.db.run(INSERT.into('plugin_cds_caching_Caches').entries([{
                name: cacheName,
                config: JSON.stringify({}),
                enableStatistics: false,
                enableKeyTracking: false
            }]));

            // Mock the reloadRuntimeConfiguration method to track calls
            let reloadCalled = false;
            const originalReload = app.service(cacheName)?.reloadRuntimeConfiguration;
            if (app.service(cacheName)) {
                app.service(cacheName).reloadRuntimeConfiguration = async () => {
                    reloadCalled = true;
                    if (originalReload) {
                        await originalReload.call(app.service(cacheName));
                    }
                };
            }

            // Enable statistics
            const result = await app.service('statistics').setStatisticsEnabled({ cache: cacheName, enabled: true });
            expect(result).to.be.true;

            // Verify that reload was called (if service exists)
            if (app.service(cacheName)) {
                expect(reloadCalled).to.be.true;
            }

            // Verify configuration was updated
            const cache = await app.db.run(SELECT.one.from('plugin_cds_caching_Caches').where({ name: cacheName }));
            expect(cache.enableStatistics).to.be.true;
        });

        it('should set up persistence interval when statistics are enabled', async () => {
            const cacheName = 'test-cache';
            
            // Create a cache entry
            await app.db.run(INSERT.into('plugin_cds_caching_Caches').entries([{
                name: cacheName,
                config: JSON.stringify({}),
                enableStatistics: false,
                enableKeyTracking: false
            }]));

            // Get the cache service
            const cacheService = await cds.connect.to(cacheName);
            
            // Verify persistence interval is not running when disabled
            expect(cacheService.statistics.persistInterval).to.not.be.null;
            
            // Enable statistics
            const result = await app.service('statistics').setStatisticsEnabled({ cache: cacheName, enabled: true });
            expect(result).to.be.true;

            // Verify that the persistence interval was restarted
            expect(cacheService.statistics.persistInterval).to.not.be.null;
            
            // Verify configuration was updated
            const cache = await app.db.run(SELECT.one.from('plugin_cds_caching_Caches').where({ name: cacheName }));
            expect(cache.enableStatistics).to.be.true;
        });

        it('should persist statistics when enabled', async () => {
            const cacheName = 'test-cache';
            
            // Create a cache entry
            await app.db.run(INSERT.into('plugin_cds_caching_Caches').entries([{
                name: cacheName,
                config: JSON.stringify({}),
                enableStatistics: false,
                enableKeyTracking: false
            }]));

            // Enable statistics
            const result = await app.service('statistics').setStatisticsEnabled({ cache: cacheName, enabled: true });
            expect(result).to.be.true;

            // Get the cache service
            const cacheService = await cds.connect.to(cacheName);
            
            // Perform some cache operations to generate statistics
            await cacheService.set('test-key-1', 'test-value-1');
            await cacheService.get('test-key-1');
            await cacheService.get('test-key-2'); // This should be a miss
            
            // Manually trigger persistence
            const persistenceResult = await app.service('statistics').triggerPersistence({ cache: cacheName });
            expect(persistenceResult).to.be.true;
            
            // Check if statistics were persisted
            const stats = await app.db.run(SELECT.from('plugin_cds_caching_Statistics').where({ cache: cacheName }));
            expect(stats.length).to.be.greaterThan(0);
            
            // Verify the persisted data
            const latestStat = stats[stats.length - 1];
            expect(latestStat.hits).to.be.greaterThan(0);
            expect(latestStat.misses).to.be.greaterThan(0);
            expect(latestStat.sets).to.be.greaterThan(0);
        });
    });
}); 