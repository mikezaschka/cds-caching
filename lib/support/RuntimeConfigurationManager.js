const cds = require('@sap/cds');
const { isMultitenantMode, hasTenantContext } = require('./MultitenancyDetector');
const { isPluginModelAvailable } = require('../util');

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
     * Resolve the effective keyManagement settings.
     * In MTX mode, isTenantAware defaults to true unless explicitly set to false.
     * @returns {object} keyManagement object
     * @private
     */
    _resolveKeyManagement() {
        const keyManagementConfig = this.options?.keyManagement || {};
        return {
            isUserAware: keyManagementConfig.isUserAware === true,
            isTenantAware: keyManagementConfig.isTenantAware !== undefined
                ? keyManagementConfig.isTenantAware === true
                : isMultitenantMode(),
            isLocaleAware: keyManagementConfig.isLocaleAware === true
        };
    }

    /**
     * Load runtime configuration from database and package.json
     * @returns {Promise<object>} Configuration object
     */
    async loadRuntimeConfiguration() {
        const keyManagement = this._resolveKeyManagement();

        if (!isPluginModelAvailable()) {
            return { enableKeyTracking: false, enableStatistics: false, keyManagement };
        }

        // In MTX mode without tenant context, skip DB access — return defaults
        if (isMultitenantMode() && !hasTenantContext()) {
            this.log.info(`Loading runtime configuration for cache ${this.cacheName} (MTX mode, no tenant context — using defaults)`);
            return {
                enableKeyTracking: false,
                enableStatistics: false,
                keyManagement
            };
        }

        try {
            this.log.info(`Loading runtime configuration for cache ${this.cacheName}...`);

            const cacheConfig = await SELECT.one.from("plugin_cds_caching_Caches")
                .where({ name: this.cacheName });

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
                keyManagement
            };
        }
    }

    /**
     * Update metrics enabled status in database
     * @param {boolean} enabled - Whether metrics should be enabled
     */
    async setMetricsEnabled(enabled) {
        if (!isPluginModelAvailable()) return;
        if (isMultitenantMode() && !hasTenantContext()) {
            this.log.debug(`Skipping setMetricsEnabled in MTX mode (no tenant context)`);
            return;
        }
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
        if (!isPluginModelAvailable()) return;
        if (isMultitenantMode() && !hasTenantContext()) {
            this.log.debug(`Skipping setKeyMetricsEnabled in MTX mode (no tenant context)`);
            return;
        }
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
        const keyManagement = this._resolveKeyManagement();

        if (!isPluginModelAvailable()) {
            return { metricsEnabled: false, keyMetricsEnabled: false, keyManagement, throwOnErrors: this.options.throwOnErrors };
        }

        // In MTX mode without tenant context, skip DB access — return defaults
        if (isMultitenantMode() && !hasTenantContext()) {
            return {
                metricsEnabled: false,
                keyMetricsEnabled: false,
                keyManagement,
                throwOnErrors: this.options.throwOnErrors
            };
        }

        try {
            const cacheConfig = await SELECT.one.from("plugin_cds_caching_Caches")
                .where({ name: this.cacheName });

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
                keyManagement,
                throwOnErrors: this.options.throwOnErrors
            };
        }
    }

    /**
     * Get default key template based on runtime configuration.
     * In MTX mode, isTenantAware is automatically enabled unless explicitly disabled.
     * @returns {string} Default template string
     */
    getDefaultKeyTemplate() {
        const keyManagement = this._resolveKeyManagement();

        const parts = [];

        if (keyManagement.isTenantAware) parts.push('{tenant}');
        if (keyManagement.isUserAware) parts.push('{user}');
        if (keyManagement.isLocaleAware) parts.push('{locale}');
        parts.push('{hash}');

        return parts.join(':');
    }
}

module.exports = RuntimeConfigurationManager; 