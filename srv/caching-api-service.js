const cds = require('@sap/cds')

class CachingApiService extends cds.ApplicationService {
    log = cds.log('cds-caching');

    async init() {

        // Handle setMetricsEnabled action
        this.on('setMetricsEnabled', async (req) => {
            const { enabled } = req.data
            const cache = req.params[0].name;
            const cacheService = await cds.connect.to(cache);
            try {
                await cacheService.setMetricsEnabled(enabled)
                req.info(`Metrics ${enabled ? 'enabled' : 'disabled'} for cache ${cache}`);
                return true;
            } catch (error) {
                req.error(`Failed to set metrics enabled: ${error.message}`);
                return false;
            }
        })

        // Handle setKeyMetricsEnabled action
        this.on('setKeyMetricsEnabled', async (req) => {
            const { enabled } = req.data
            const cache = req.params[0].name;
            const cacheService = await cds.connect.to(cache);
            try {
                await cacheService.setKeyMetricsEnabled(enabled)
                req.info(`Key metrics ${enabled ? 'enabled' : 'disabled'} for cache ${cache}`);
                return true;
            } catch (error) {
                req.error(`Failed to set key metrics enabled: ${error.message}`);
                return false;
            }
        })

        // Handle getCacheEntries function
        this.on('getEntries', async (req) => {
            const cache = req.params[0].name;
            try {
                const cacheService = await cds.connect.to(cache);
                const entries = [];
                for await (const [key, value] of cacheService.iterator()) {
                    entries.push({
                        entryKey: key,
                        value: JSON.stringify(value.value),
                        timestamp: value.timestamp,
                        tags: value.tags,
                    });
                }
                return entries;
            } catch (error) {
                req.error(`Failed to get cache entries: ${error.message}`);
                return [];
            }
        });

        // Handle getCacheEntry function
        this.on('getEntry', async (req) => {
            const { key } = req.data;
            const cache = req.params[0].name;
            const cacheService = await cds.connect.to(cache);
            const value = await cacheService.get(key);
            return {
                value: value,
            };
        });

        // Handle setCacheEntry action
        this.on('setEntry', async (req) => {
            const { key, value, ttl } = req.data;
            const cache = req.params[0].name;
            const cacheService = await cds.connect.to(cache);
            await cacheService.set(key, value, { ttl: ttl });
            req.info(`Cache entry set successfully: ${key}`);
            return true;
        });

        // Handle deleteCacheEntry action
        this.on('deleteEntry', async (req) => {
            const { key } = req.data;
            const cache = req.params[0].name;
            const cacheService = await cds.connect.to(cache);
            await cacheService.delete(key);
            req.info(`Cache entry deleted successfully: ${key}`);
            return true;
        });

        // Handle clearCache action
        this.on('clear', async (req) => {
            const cache = req.params[0].name;
            const cacheService = await cds.connect.to(cache);
            await cacheService.clear();
            req.info(`Cache cleared successfully: ${cache}`);
            return true;
        });

        // Handle clearKeyMetrics action
        this.on('clearKeyMetrics', async (req) => {
            const cache = req.params[0].name;
            const cacheService = await cds.connect.to(cache);
            await cacheService.clearKeyMetrics();
            req.info(`Key metrics cleared successfully: ${cache}`);
            return true;
        });

        // Handle clearMetrics action
        this.on('clearMetrics', async (req) => {
            const cache = req.params[0].name;
            const cacheService = await cds.connect.to(cache);
            await cacheService.clearMetrics();
            req.info(`Metrics cleared successfully: ${cache}`);
            return true;
        });

        await super.init()
    }

   

}

module.exports = CachingApiService 