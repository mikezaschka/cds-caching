const cds = require('@sap/cds')

class StatisticsService extends cds.ApplicationService {
    log = cds.log('cds-caching');

    async init() {
        const { Statistics, KeyAccesses } = this.entities
        
        // Handle getStatistics function
        this.on('getStatistics', async (req) => {
            const { period, from, to } = req.data
            return cache.getStats(period, from, to)
        })

        // Handle getCurrentStatistics function
        this.on('getCurrentStatistics', async () => {
            const stats = await cache.getCurrentStats()
            if (!stats) return null

            // Convert to Statistics entity format
            return {
                ID: 'current',
                cache: cache.name,
                timestamp: new Date().toISOString(),
                period: 'current',
                hits: stats.hits,
                misses: stats.misses,
                sets: stats.sets,
                deletes: stats.deletes,
                errors: stats.errors,
                avgLatency: stats.avgLatency,
                p95Latency: stats.p95Latency,
                p99Latency: stats.p99Latency,
                minLatency: stats.minLatency,
                maxLatency: stats.maxLatency,
                memoryUsage: stats.memoryUsage,
                itemCount: stats.itemCount,
                hitRatio: stats.hitRatio,
                throughput: stats.throughput,
                errorRate: stats.errorRate,
                uptimeMs: stats.uptimeMs
            }
        })

        // Handle getTopKeys function
        this.on('getTopKeys', async (req) => {
            const { limit = 10 } = req.data
            const topKeys = cache.statistics?.getTopAccessedKeys(limit) || []
            
            return topKeys.map((key, index) => ({
                ID: `top_${Date.now()}_${index}`,
                cache: cache.name,
                keyName: key.key,
                hits: key.hits,
                misses: key.misses,
                sets: key.sets,
                deletes: key.deletes,
                total: key.total,
                lastAccess: key.lastAccess,
                period: 'current',
                dataType: key.dataType || 'custom',
                serviceName: key.serviceName || '',
                entityName: key.entityName || '',
                operation: key.operation || '',
                metadata: key.metadata || ''
            }))
        })

        // Handle getColdKeys function
        this.on('getColdKeys', async (req) => {
            const { limit = 10 } = req.data
            const coldKeys = cache.statistics?.getColdKeys(limit) || []
            
            return coldKeys.map((key, index) => ({
                ID: `cold_${Date.now()}_${index}`,
                cache: cache.name,
                keyName: key.key,
                hits: key.hits,
                misses: key.misses,
                sets: key.sets,
                deletes: key.deletes,
                total: key.total,
                lastAccess: key.lastAccess,
                period: 'current',
                dataType: key.dataType || 'custom',
                serviceName: key.serviceName || '',
                entityName: key.entityName || '',
                operation: key.operation || '',
                metadata: key.metadata || ''
            }))
        })

        // Handle persistStatistics action
        this.on('persistStatistics', async (req) => {
            if (!cache.statistics?.persistStats) {
                req.warn('Statistics are not enabled')
                return false
            }

            await cache.statistics.persistStats()
            return true
        })

        // Handle setStatisticsEnabled action
        this.on('setStatisticsEnabled', async (req) => {
            const { enabled, cache } = req.data
            try {
                // Update the database directly
                await UPDATE('plugin_cds_caching_Caches')
                    .set({ enableStatistics: enabled })
                    .where({ name: cache });
                
                // Trigger configuration reload for the affected cache service
                await this.triggerConfigurationReload(cache);
                
                req.info(`Statistics ${enabled ? 'enabled' : 'disabled'} for cache ${cache}`);
                return true;
            } catch (error) {
                req.error(`Failed to set statistics enabled: ${error.message}`);
                return false;
            }
        })

        // Handle setKeyTrackingEnabled action
        this.on('setKeyTrackingEnabled', async (req) => {
            const { enabled, cache } = req.data
            try {
                // Update the database directly
                await UPDATE('plugin_cds_caching_Caches')
                    .set({ enableKeyTracking: enabled })
                    .where({ name: cache });
                
                // Trigger configuration reload for the affected cache service
                await this.triggerConfigurationReload(cache);
                
                req.info(`Key tracking ${enabled ? 'enabled' : 'disabled'} for cache ${cache}`);
                return true;
            } catch (error) {
                req.error(`Failed to set key tracking enabled: ${error.message}`);
                return false;
            }
        })

        // Handle getRuntimeConfiguration function
        this.on('getRuntimeConfiguration', async (req) => {
            const { cache } = req.data
            try {
                // Get the specific cache configuration from database
                const cacheConfig = await SELECT.one.from('plugin_cds_caching_Caches').where({ name: cache })
                if (!cacheConfig) {
                    return { enableStatistics: false, enableKeyTracking: false }
                }
                
                return {
                    enableStatistics: cacheConfig.enableStatistics || false,
                    enableKeyTracking: cacheConfig.enableKeyTracking || false
                }
            } catch (error) {
                req.error(`Failed to get runtime configuration: ${error.message}`)
                return { enableStatistics: false, enableKeyTracking: false }
            }
        })

        // Handle triggerPersistence action (for testing)
        this.on('triggerPersistence', async (req) => {
            const { cache } = req.data
            try {
                // Get the cache service and trigger persistence
                const services = cds.services;
                for (const [serviceName, service] of Object.entries(services)) {
                    if (serviceName === cache && service.statistics?.triggerPersistence) {
                        await service.statistics.triggerPersistence();
                        req.info(`Manually triggered persistence for cache ${cache}`);
                        return true;
                    }
                }
                
                req.warn(`Cache service ${cache} not found or statistics not available`);
                return false;
            } catch (error) {
                req.error(`Failed to trigger persistence: ${error.message}`);
                return false;
            }
        })

        // Handle getPersistenceStatus function (for debugging)
        this.on('getPersistenceStatus', async (req) => {
            const { cache } = req.data
            try {
                // Get the cache service and get persistence status
                const services = cds.services;
                for (const [serviceName, service] of Object.entries(services)) {
                    if (serviceName === cache && service.statistics?.getPersistenceStatus) {
                        const status = service.statistics.getPersistenceStatus();
                        req.info(`Persistence status for cache ${cache}: ${JSON.stringify(status)}`);
                        return status;
                    }
                }
                
                req.warn(`Cache service ${cache} not found or statistics not available`);
                return { error: 'Service not found' };
            } catch (error) {
                req.error(`Failed to get persistence status: ${error.message}`);
                return { error: error.message };
            }
        })

        await super.init()
    }

    // Helper method to trigger configuration reload
    async triggerConfigurationReload(cacheName) {
        try {
            this.log.info(`Attempting to trigger configuration reload for cache: ${cacheName}`);
            
            // Method 1: Try to find the service in active services
            const services = cds.services;
            for (const [serviceName, service] of Object.entries(services)) {
                if (serviceName === cacheName && service.reloadRuntimeConfiguration) {
                    await service.reloadRuntimeConfiguration();
                    this.log.info(`Successfully triggered configuration reload for cache service: ${cacheName}`);
                    return;
                }
            }
            
            // Method 2: Try to connect to the service directly
            try {
                const cacheService = await cds.connect.to(cacheName);
                if (cacheService && typeof cacheService.reloadRuntimeConfiguration === 'function') {
                    await cacheService.reloadRuntimeConfiguration();
                    this.log.info(`Successfully triggered configuration reload via connection for cache service: ${cacheName}`);
                    return;
                }
            } catch (connectError) {
                this.log.info(`Could not connect to cache service ${cacheName}:`, connectError.message);
            }
            
            // Method 3: Try to get the service from the service registry
            try {
                const serviceRegistry = cds.services;
                if (serviceRegistry && serviceRegistry[cacheName] && typeof serviceRegistry[cacheName].reloadRuntimeConfiguration === 'function') {
                    await serviceRegistry[cacheName].reloadRuntimeConfiguration();
                    this.log.info(`Successfully triggered configuration reload via service registry for cache service: ${cacheName}`);
                    return;
                }
            } catch (registryError) {
                this.log.info(`Could not access service registry for ${cacheName}:`, registryError.message);
            }
            
            // Method 4: Emit a global event that cache services can listen to
            cds.emit('cache-configuration-changed', { cacheName });
            this.log.info(`Emitted configuration change event for cache: ${cacheName}`);
            
        } catch (error) {
            this.log.error(`Failed to trigger configuration reload for ${cacheName}:`, error);
        }
    }
}

module.exports = StatisticsService 