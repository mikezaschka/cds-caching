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
 * Normalize a single cds.requires caching entry to v2 shape (metrics + reuse).
 * Accepts deprecated v1 keys: statistics, dashboard.
 *
 * @param {object} [raw={}]
 * @returns {{ metrics: object|null, reuse: { api: boolean, dashboard: boolean }, legacyWarnings: string[], store?: string, impl?: string }}
 */
function normalizeCachingConfig(raw = {}) {
    const legacyWarnings = []

    let metrics = raw.metrics ? { ...raw.metrics } : null
    let reuse = {
        api: metrics?.reuse?.api === true,
        dashboard: metrics?.reuse?.dashboard === true,
    }

    if (raw.statistics) {
        const msg = warnOnce(
            'statistics',
            'cds-caching: "statistics" is deprecated; use "metrics" instead (removal planned in v3.0). See docs/migration-guide.md.'
        )
        if (msg) legacyWarnings.push(msg)

        const legacy = { ...raw.statistics }
        if (!metrics) {
            metrics = legacy
        } else {
            metrics = { ...legacy, ...metrics }
        }
    }

    if (raw.dashboard === true) {
        const msg = warnOnce(
            'dashboard',
            'cds-caching: "dashboard": true is deprecated; use metrics.reuse.dashboard instead (removal planned in v3.0). See docs/migration-guide.md.'
        )
        if (msg) legacyWarnings.push(msg)

        if (metrics?.reuse && (metrics.reuse.api === false || metrics.reuse.dashboard === false)) {
            legacyWarnings.push(
                'cds-caching: both deprecated "dashboard": true and explicit metrics.reuse are set; using the union of both flags.'
            )
        }
        reuse.api = true
        reuse.dashboard = true
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
        legacyWarnings,
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
    if (metrics.enabled === true) opts.metricsEnabled = true
    if (metrics.keyMetricsEnabled === true) opts.keyMetricsEnabled = true
    return opts
}

/**
 * Whether a metrics block is configured (v1 statistics counts too).
 * @param {ReturnType<typeof normalizeCachingConfig>} normalized
 */
function isMetricsConfigured(normalized) {
    return normalized.metrics != null
}

module.exports = {
    normalizeCachingConfig,
    getCachingRequiresEntries,
    getStatisticsHandlerOptions,
    isMetricsConfigured,
    resetDeprecationWarnings,
}
