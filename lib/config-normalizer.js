const _warned = new Set()

function warnOnce(key, message) {
    if (_warned.has(key)) return null
    _warned.add(key)
    return message
}

/** Reset warned keys — for tests only. */
function resetDeprecationWarnings() {
    _warned.clear()
}

/**
 * Reject v1 config keys that were shimmed through 2.x.
 * @param {object} raw
 */
function rejectRemovedV1Keys(raw = {}) {
    if (raw.statistics != null) {
        throw new Error(
            'cds-caching: "statistics" was removed in 3.0. ' +
            'Use "metrics" instead, e.g. "metrics": { "enabled": true, "persistenceInterval": 60000 }. ' +
            'See docs/migration-guide.md#upgrading-to-30.'
        )
    }
    if (Object.prototype.hasOwnProperty.call(raw, 'dashboard')) {
        throw new Error(
            'cds-caching: "dashboard" was removed in 3.0. ' +
            'Use "metrics": { "reuse": { "api": true, "dashboard": true } } instead. ' +
            'See docs/migration-guide.md#upgrading-to-30.'
        )
    }
}

/**
 * Normalize a single cds.requires caching entry to metrics + reuse.
 *
 * @param {object} [raw={}]
 * @returns {{ metrics: object|null, reuse: { api: boolean, dashboard: boolean }, store?: string, impl?: string }}
 */
function normalizeCachingConfig(raw = {}) {
    rejectRemovedV1Keys(raw)

    let metrics = raw.metrics ? { ...raw.metrics } : null
    let reuse = {
        api: metrics?.reuse?.api === true,
        dashboard: metrics?.reuse?.dashboard === true,
    }

    if (metrics?.reuse) {
        if (metrics.reuse.api === true) reuse.api = true
        if (metrics.reuse.dashboard === true) reuse.dashboard = true
    }

    if (reuse.dashboard) {
        reuse.api = true
    }

    if (metrics) {
        metrics = { ...metrics, reuse: { ...reuse } }
    } else if (reuse.api || reuse.dashboard) {
        metrics = { reuse: { ...reuse } }
    }

    return {
        impl: raw.impl,
        store: raw.store,
        namespace: raw.namespace,
        metrics,
        reuse,
        raw,
    }
}

/**
 * All normalized caching configs from cds.env.requires.
 * @param {object} [requires={}]
 * @returns {Array<{ name: string, normalized: ReturnType<typeof normalizeCachingConfig> }>}
 */
function getCachingRequiresEntries(requires = {}) {
    return Object.entries(requires)
        .filter(([, c]) => c?.impl === 'cds-caching')
        .map(([name, config]) => ({
            name,
            normalized: normalizeCachingConfig(config),
        }))
}

/**
 * Options for CacheStatisticsHandler from normalized metrics config.
 * @param {object|null} metrics
 * @returns {object}
 */
function getStatisticsHandlerOptions(metrics) {
    if (!metrics) return {}
    const opts = {}
    if (metrics.persistenceInterval != null) opts.persistenceInterval = metrics.persistenceInterval
    if (metrics.maxLatencies != null) opts.maxLatencies = metrics.maxLatencies
    if (metrics.maxKeyMetrics != null) opts.maxKeyMetrics = metrics.maxKeyMetrics
    if (metrics.maxTagMetrics != null) opts.maxTagMetrics = metrics.maxTagMetrics
    if (metrics.maxMetricFieldLength != null) opts.maxMetricFieldLength = metrics.maxMetricFieldLength
    if (metrics.enabled === true) opts.metricsEnabled = true
    if (metrics.keyMetricsEnabled === true) opts.keyMetricsEnabled = true
    if (metrics.tagMetricsEnabled === true) opts.tagMetricsEnabled = true
    return opts
}

/**
 * Boolean flags to persist on the Caches row from a requires / options object.
 * Only `true` from config maps to true — missing or false stays false.
 * @param {object} [raw={}]
 * @returns {{ metricsEnabled: boolean, keyMetricsEnabled: boolean, tagMetricsEnabled: boolean }}
 */
function metricsFlagsFromConfig(raw = {}) {
    const metrics = normalizeCachingConfig(raw).metrics
    return {
        metricsEnabled: metrics?.enabled === true,
        keyMetricsEnabled: metrics?.keyMetricsEnabled === true,
        tagMetricsEnabled: metrics?.tagMetricsEnabled === true,
    }
}

/**
 * Normalize a DB override cell: true / false / null (no operator decision).
 * @param {any} value
 * @returns {boolean|null}
 */
function readMetricsOverride(value) {
    if (value === true || value === 1) return true
    if (value === false || value === 0) return false
    return null
}

/**
 * Effective flag: explicit operator override wins; otherwise config seeds.
 * @param {boolean|null|undefined} override
 * @param {boolean} configValue
 * @returns {boolean}
 */
function resolveMetricsFlag(override, configValue) {
    if (override === true || override === false) return override
    return configValue === true
}

/**
 * Three-layer view for one cache: config seed, operator override, effective.
 * @param {object} [rawConfig={}] - cds.requires entry or service options
 * @param {object} [dbRow={}] - Caches row (override columns may be null)
 */
function buildMetricsConfigView(rawConfig = {}, dbRow = {}) {
    const config = metricsFlagsFromConfig(rawConfig)
    const override = {
        metricsEnabled: readMetricsOverride(dbRow.metricsEnabled),
        keyMetricsEnabled: readMetricsOverride(dbRow.keyMetricsEnabled),
        tagMetricsEnabled: readMetricsOverride(dbRow.tagMetricsEnabled),
    }
    return {
        metrics: {
            config: config.metricsEnabled,
            override: override.metricsEnabled,
            effective: resolveMetricsFlag(override.metricsEnabled, config.metricsEnabled),
        },
        keyMetrics: {
            config: config.keyMetricsEnabled,
            override: override.keyMetricsEnabled,
            effective: resolveMetricsFlag(override.keyMetricsEnabled, config.keyMetricsEnabled),
        },
        tagMetrics: {
            config: config.tagMetricsEnabled,
            override: override.tagMetricsEnabled,
            effective: resolveMetricsFlag(override.tagMetricsEnabled, config.tagMetricsEnabled),
        },
    }
}

/**
 * Whether a metrics block is configured.
 * @param {ReturnType<typeof normalizeCachingConfig>} normalized
 */
function isMetricsConfigured(normalized) {
    return normalized.metrics != null
}

/**
 * Detect a `keyManagement` block placed outside `cds.requires.<cache>`.
 *
 * Releases up to 2.0.2 documented this as a top-level `"cds-caching"` key, which
 * the runtime never read — so keys silently stayed context-free even though the
 * project looked configured for user-aware caching. Warn loudly instead.
 *
 * @param {object} [env={}] - cds.env
 * @param {object} [projectPackage={}] - Parsed project package.json
 * @returns {string|null} Warning message, or null when nothing is misplaced
 */
function detectMisplacedKeyManagement(env = {}, projectPackage = {}) {
    const misplaced =
        env['cds-caching']?.keyManagement ??
        projectPackage['cds-caching']?.keyManagement

    if (!misplaced) return null

    return warnOnce(
        'misplaced-keyManagement',
        'cds-caching: a "cds-caching.keyManagement" block was found outside "cds.requires", where it is ignored. ' +
        'Cache keys are therefore NOT user/tenant/locale aware. Move it into the individual cache config, e.g. ' +
        '{"cds":{"requires":{"caching":{"keyManagement":{"isUserAware":true}}}}}. See docs/key-management.md.'
    )
}

module.exports = {
    normalizeCachingConfig,
    getCachingRequiresEntries,
    getStatisticsHandlerOptions,
    metricsFlagsFromConfig,
    readMetricsOverride,
    resolveMetricsFlag,
    buildMetricsConfigView,
    isMetricsConfigured,
    detectMisplacedKeyManagement,
    resetDeprecationWarnings,
    rejectRemovedV1Keys,
}
