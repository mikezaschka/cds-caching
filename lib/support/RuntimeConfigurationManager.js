const cds = require('@sap/cds');
const { isMultitenantMode, hasTenantContext } = require('./MultitenancyDetector');
const { isPluginModelAvailable } = require('../util');
const {
    metricsFlagsFromConfig,
    buildMetricsConfigView,
} = require('../config-normalizer');

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
     * Requires / options used as the config seed for this cache.
     * @returns {object}
     * @private
     */
    _rawConfig() {
        const requires = cds.env.requires?.[this.cacheName] || {};
        return { ...requires, ...this.options };
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
     * Upsert a single metrics override on the Caches row.
     * Pass `null` to clear the operator decision (column NULL → follow config).
     * @param {'metricsEnabled'|'keyMetricsEnabled'|'tagMetricsEnabled'} column
     * @param {boolean|null} enabled
     * @private
     */
    async _upsertMetricsFlag(column, enabled) {
        if (!isPluginModelAvailable()) return;
        if (isMultitenantMode() && !hasTenantContext()) {
            this.log.debug(`Skipping ${column} persist in MTX mode (no tenant context)`);
            return;
        }

        const value = enabled === null || enabled === undefined
            ? null
            : enabled === true;

        const db = await cds.connect.to('db');
        const { Caches } = cds.entities('plugin.cds_caching');
        const existing = await db.read(Caches, this.cacheName);

        if (existing) {
            await db.update(Caches, this.cacheName).with({ [column]: value });
            return;
        }

        const requires = cds.env.requires?.[this.cacheName] || {};
        await db.create(Caches).entries({
            name: this.cacheName,
            config: JSON.stringify({
                impl: requires.impl || this.options.impl || 'cds-caching',
                store: requires.store || this.options.store || 'memory',
                namespace: requires.namespace || this.options.namespace || this.cacheName,
            }),
            metricsEnabled: null,
            keyMetricsEnabled: null,
            tagMetricsEnabled: null,
            [column]: value,
        });
    }

    /**
     * Update metrics enabled override in database.
     * @param {boolean|null} enabled - true/false to set override; null to clear
     */
    async setMetricsEnabled(enabled) {
        await this._upsertMetricsFlag('metricsEnabled', enabled);
        this.log.debug(
            enabled === null || enabled === undefined
                ? `Statistics override cleared for cache ${this.cacheName}`
                : `Statistics ${enabled ? 'enabled' : 'disabled'} for cache ${this.cacheName}`
        );
    }

    /**
     * Update key metrics enabled override in database.
     * @param {boolean|null} enabled
     */
    async setKeyMetricsEnabled(enabled) {
        await this._upsertMetricsFlag('keyMetricsEnabled', enabled);
        this.log.debug(
            enabled === null || enabled === undefined
                ? `Key tracking override cleared for cache ${this.cacheName}`
                : `Key tracking ${enabled ? 'enabled' : 'disabled'} for cache ${this.cacheName}`
        );
    }

    /**
     * Update tag metrics enabled override in database.
     * @param {boolean|null} enabled
     */
    async setTagMetricsEnabled(enabled) {
        await this._upsertMetricsFlag('tagMetricsEnabled', enabled);
        this.log.debug(
            enabled === null || enabled === undefined
                ? `Tag tracking override cleared for cache ${this.cacheName}`
                : `Tag tracking ${enabled ? 'enabled' : 'disabled'} for cache ${this.cacheName}`
        );
    }

    /**
     * Config / override / effective view for this cache.
     * @returns {Promise<ReturnType<typeof buildMetricsConfigView>>}
     */
    async getMetricsConfigView() {
        const raw = this._rawConfig();
        if (!isPluginModelAvailable() || (isMultitenantMode() && !hasTenantContext())) {
            return buildMetricsConfigView(raw, {});
        }
        try {
            const db = await cds.connect.to('db');
            const { Caches } = cds.entities('plugin.cds_caching');
            const row = await db.read(Caches, this.cacheName);
            return buildMetricsConfigView(raw, row || {});
        } catch (error) {
            this.log.warn(`Failed to build metrics config view for cache ${this.cacheName}:`, error);
            return buildMetricsConfigView(raw, {});
        }
    }

    /**
     * Get current runtime configuration (effective flags).
     * @returns {Promise<object>} Current configuration
     */
    async getRuntimeConfiguration() {
        const keyManagement = this._resolveKeyManagement();
        const configFlags = metricsFlagsFromConfig(this._rawConfig());

        if (!isPluginModelAvailable()) {
            return {
                metricsEnabled: configFlags.metricsEnabled,
                keyMetricsEnabled: configFlags.keyMetricsEnabled,
                tagMetricsEnabled: configFlags.tagMetricsEnabled,
                metricsEnabledOverride: null,
                keyMetricsEnabledOverride: null,
                tagMetricsEnabledOverride: null,
                keyManagement,
                throwOnErrors: this.options.throwOnErrors,
            };
        }

        if (isMultitenantMode() && !hasTenantContext()) {
            return {
                metricsEnabled: configFlags.metricsEnabled,
                keyMetricsEnabled: configFlags.keyMetricsEnabled,
                tagMetricsEnabled: configFlags.tagMetricsEnabled,
                metricsEnabledOverride: null,
                keyMetricsEnabledOverride: null,
                tagMetricsEnabledOverride: null,
                keyManagement,
                throwOnErrors: this.options.throwOnErrors,
            };
        }

        try {
            const db = await cds.connect.to('db');
            const { Caches } = cds.entities('plugin.cds_caching');
            const cacheConfig = await db.read(Caches, this.cacheName);
            const view = buildMetricsConfigView(this._rawConfig(), cacheConfig || {});

            return {
                metricsEnabled: view.metrics.effective,
                keyMetricsEnabled: view.keyMetrics.effective,
                tagMetricsEnabled: view.tagMetrics.effective,
                metricsEnabledOverride: view.metrics.override,
                keyMetricsEnabledOverride: view.keyMetrics.override,
                tagMetricsEnabledOverride: view.tagMetrics.override,
                keyManagement,
                throwOnErrors: this.options.throwOnErrors,
            };
        } catch (error) {
            this.log.warn(`Failed to get runtime configuration for cache ${this.cacheName}:`, error);
            return {
                metricsEnabled: configFlags.metricsEnabled,
                keyMetricsEnabled: configFlags.keyMetricsEnabled,
                tagMetricsEnabled: configFlags.tagMetricsEnabled,
                metricsEnabledOverride: null,
                keyMetricsEnabledOverride: null,
                tagMetricsEnabledOverride: null,
                keyManagement,
                throwOnErrors: this.options.throwOnErrors,
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
