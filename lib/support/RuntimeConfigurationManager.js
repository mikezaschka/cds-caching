const cds = require('@sap/cds');
const { isMultitenantMode, hasTenantContext } = require('./MultitenancyDetector');
const { isPluginModelAvailable } = require('../util');
const { metricsFlagsFromConfig } = require('../config-normalizer');

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

            const db = await cds.connect.to('db');
            const { Caches } = cds.entities('plugin.cds_caching');
            const cacheConfig = await db.read(Caches, this.cacheName);

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
     * Upsert a single metrics flag on the Caches row.
     * Creates the row when missing so config-driven enablement at init is not lost
     * when the seed INSERT has not run yet (or never includes the flags).
     * @param {'metricsEnabled'|'keyMetricsEnabled'|'tagMetricsEnabled'} column
     * @param {boolean} enabled
     * @private
     */
    async _upsertMetricsFlag(column, enabled) {
        if (!isPluginModelAvailable()) return;
        if (isMultitenantMode() && !hasTenantContext()) {
            this.log.debug(`Skipping ${column} persist in MTX mode (no tenant context)`);
            return;
        }

        const db = await cds.connect.to('db');
        const { Caches } = cds.entities('plugin.cds_caching');
        const existing = await db.read(Caches, this.cacheName);

        if (existing) {
            await db.update(Caches, this.cacheName).with({ [column]: enabled });
            return;
        }

        const requires = cds.env.requires?.[this.cacheName] || {};
        const flags = metricsFlagsFromConfig({ ...requires, ...this.options });
        flags[column] = enabled;

        await db.create(Caches).entries({
            name: this.cacheName,
            config: JSON.stringify({
                impl: requires.impl || this.options.impl || 'cds-caching',
                store: requires.store || this.options.store || 'memory',
                namespace: requires.namespace || this.options.namespace || this.cacheName,
            }),
            ...flags,
        });
    }

    /**
     * Update metrics enabled status in database
     * @param {boolean} enabled - Whether metrics should be enabled
     */
    async setMetricsEnabled(enabled) {
        await this._upsertMetricsFlag('metricsEnabled', enabled);
        this.log.debug(`Statistics ${enabled ? 'enabled' : 'disabled'} for cache ${this.cacheName}`);
    }

    /**
     * Update key metrics enabled status in database
     * @param {boolean} enabled - Whether key metrics should be enabled
     */
    async setKeyMetricsEnabled(enabled) {
        await this._upsertMetricsFlag('keyMetricsEnabled', enabled);
        this.log.debug(`Key tracking ${enabled ? 'enabled' : 'disabled'} for cache ${this.cacheName}`);
    }

    /**
     * Update tag metrics enabled status in database
     * @param {boolean} enabled - Whether tag metrics should be enabled
     */
    async setTagMetricsEnabled(enabled) {
        await this._upsertMetricsFlag('tagMetricsEnabled', enabled);
        this.log.debug(`Tag tracking ${enabled ? 'enabled' : 'disabled'} for cache ${this.cacheName}`);
    }



    /**
     * Get current runtime configuration
     * @returns {Promise<object>} Current configuration
     */
    async getRuntimeConfiguration() {
        const keyManagement = this._resolveKeyManagement();

        if (!isPluginModelAvailable()) {
            return { metricsEnabled: false, keyMetricsEnabled: false, tagMetricsEnabled: false, keyManagement, throwOnErrors: this.options.throwOnErrors };
        }

        // In MTX mode without tenant context, skip DB access — return defaults
        if (isMultitenantMode() && !hasTenantContext()) {
            return {
                metricsEnabled: false,
                keyMetricsEnabled: false,
                tagMetricsEnabled: false,
                keyManagement,
                throwOnErrors: this.options.throwOnErrors
            };
        }

        try {
            const db = await cds.connect.to('db');
            const { Caches } = cds.entities('plugin.cds_caching');
            const cacheConfig = await db.read(Caches, this.cacheName);

            return {
                metricsEnabled: cacheConfig?.metricsEnabled === true || cacheConfig?.metricsEnabled === 1 || false,
                keyMetricsEnabled: cacheConfig?.keyMetricsEnabled === true || cacheConfig?.keyMetricsEnabled === 1 || false,
                tagMetricsEnabled: cacheConfig?.tagMetricsEnabled === true || cacheConfig?.tagMetricsEnabled === 1 || false,
                keyManagement,
                throwOnErrors: this.options.throwOnErrors
            };
        } catch (error) {
            this.log.warn(`Failed to get runtime configuration for cache ${this.cacheName}:`, error);
            return {
                metricsEnabled: false,
                keyMetricsEnabled: false,
                tagMetricsEnabled: false,
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
