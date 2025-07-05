const cds = require('@sap/cds');

/**
 * Manages runtime configuration for cache services
 */
class RuntimeConfigurationManager {
    constructor(cacheName, log) {
        this.cacheName = cacheName;
        this.log = log || cds.log('cds-caching');
    }

    /**
     * Load runtime configuration from database
     * @returns {Promise<object>} Configuration object
     */
    async loadRuntimeConfiguration() {
        try {
            this.log.info(`Loading runtime configuration for cache ${this.cacheName}...`);

            const cacheConfig = await SELECT.one.from("plugin_cds_caching_Caches")
                .where({ name: this.cacheName });

            if (cacheConfig) {
                return {
                    enableKeyTracking: cacheConfig.enableKeyTracking || false,
                    enableStatistics: cacheConfig.enableStatistics || false
                };
            } else {
                this.log.warn(`No cache configuration found for cache ${this.cacheName}`);
                return {
                    enableKeyTracking: false,
                    enableStatistics: false
                };
            }
        } catch (error) {
            this.log.warn(`Failed to load runtime configuration for cache ${this.cacheName}:`, error);
            return {
                enableKeyTracking: false,
                enableStatistics: false
            };
        }
    }

    /**
     * Update metrics enabled status in database
     * @param {boolean} enabled - Whether metrics should be enabled
     */
    async setMetricsEnabled(enabled) {
        await UPDATE('plugin_cds_caching_Caches')
            .set({ metricsEnabled: enabled })
            .where({ name: this.cacheName });

        this.log.debug(`Statistics ${enabled ? 'enabled' : 'disabled'} for cache ${this.cacheName}`);
    }

    /**
     * Update key metrics enabled status in database
     * @param {boolean} enabled - Whether key metrics should be enabled
     */
    async setKeyMetricsEnabled(enabled) {
        await UPDATE('plugin_cds_caching_Caches')
            .set({ keyMetricsEnabled: enabled })
            .where({ name: this.cacheName });

        this.log.debug(`Key tracking ${enabled ? 'enabled' : 'disabled'} for cache ${this.cacheName}`);
    }

    /**
     * Get current runtime configuration
     * @returns {Promise<object>} Current configuration
     */
    async getRuntimeConfiguration() {
        try {
            const cacheConfig = await SELECT.one.from("plugin_cds_caching_Caches")
                .where({ name: this.cacheName });

            return {
                metricsEnabled: cacheConfig?.metricsEnabled === true || cacheConfig?.metricsEnabled === 1 || false,
                keyMetricsEnabled: cacheConfig?.keyMetricsEnabled === true || cacheConfig?.keyMetricsEnabled === 1 || false
            };
        } catch (error) {
            this.log.warn(`Failed to get runtime configuration for cache ${this.cacheName}:`, error);
            return {
                metricsEnabled: false,
                keyMetricsEnabled: false
            };
        }
    }
}

module.exports = RuntimeConfigurationManager; 