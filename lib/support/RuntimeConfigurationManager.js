const cds = require('@sap/cds');

/**
 * Manages runtime configuration for cache services
 */
class RuntimeConfigurationManager {
    constructor(cacheName, log, options = {}) {
        this.cacheName = cacheName;
        this.log = log || cds.log('cds-caching');
        this.options = options;
    }

    /**
     * Load runtime configuration from database and package.json
     * @returns {Promise<object>} Configuration object
     */
    async loadRuntimeConfiguration() {
        try {
            this.log.info(`Loading runtime configuration for cache ${this.cacheName}...`);

            const cacheConfig = await SELECT.one.from("plugin_cds_caching_Caches")
                .where({ name: this.cacheName });

            // Get key management configuration from package.json options (defaults to false)
            const keyManagementConfig = this.options?.keyManagement || {};
            const keyManagement = {
                isUserAware: keyManagementConfig.isUserAware === true, // Default to false
                isTenantAware: keyManagementConfig.isTenantAware === true, // Default to false
                isLocaleAware: keyManagementConfig.isLocaleAware === true // Default to false
            };

            if (cacheConfig) {
                return {
                    enableKeyTracking: cacheConfig.enableKeyTracking || false,
                    enableStatistics: cacheConfig.enableStatistics || false,
                    keyManagement
                };
            } else {
                this.log.warn(`No cache configuration found for cache ${this.cacheName}`);
                return {
                    enableKeyTracking: false,
                    enableStatistics: false,
                    keyManagement
                };
            }
        } catch (error) {
            this.log.warn(`Failed to load runtime configuration for cache ${this.cacheName}:`, error);
            return {
                enableKeyTracking: false,
                enableStatistics: false,
                keyManagement: {
                    isUserAware: false,
                    isTenantAware: false,
                    isLocaleAware: false
                }
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

            // Get key management configuration from package.json options (defaults to false)
            const keyManagementConfig = this.options?.keyManagement || {};
            const keyManagement = {
                isUserAware: keyManagementConfig.isUserAware === true,
                isTenantAware: keyManagementConfig.isTenantAware === true,
                isLocaleAware: keyManagementConfig.isLocaleAware === true
            };

            return {
                metricsEnabled: cacheConfig?.metricsEnabled === true || cacheConfig?.metricsEnabled === 1 || false,
                keyMetricsEnabled: cacheConfig?.keyMetricsEnabled === true || cacheConfig?.keyMetricsEnabled === 1 || false,
                keyManagement,
                throwOnErrors: this.options.throwOnErrors
            };
        } catch (error) {
            this.log.warn(`Failed to get runtime configuration for cache ${this.cacheName}:`, error);
            return {
                metricsEnabled: false,
                keyMetricsEnabled: false,
                keyManagement: {
                    isUserAware: false,
                    isTenantAware: false,
                    isLocaleAware: false
                },
                throwOnErrors: this.options.throwOnErrors
            };
        }
    }

    /**
     * Get default key template based on runtime configuration
     * @returns {string} Default template string
     */
    getDefaultKeyTemplate() {
        // Get key management configuration from package.json options (defaults to false)
        const keyManagementConfig = this.options?.keyManagement || {};
        const keyManagement = {
            isUserAware: keyManagementConfig.isUserAware === true, // Default to false
            isTenantAware: keyManagementConfig.isTenantAware === true, // Default to false
            isLocaleAware: keyManagementConfig.isLocaleAware === true // Default to false
        };
        
        const parts = [];
        
        if (keyManagement.isTenantAware) parts.push('{tenant}');
        if (keyManagement.isUserAware) parts.push('{user}');
        if (keyManagement.isLocaleAware) parts.push('{locale}');
        parts.push('{hash}');
        
        return parts.join(':');
    }
}

module.exports = RuntimeConfigurationManager; 