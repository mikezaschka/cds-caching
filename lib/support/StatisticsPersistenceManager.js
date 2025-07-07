const cds = require('@sap/cds');

// Helper to merge min values, treating 0 as unset
function mergeMin(a, b) {
    if ((a === 0 || a === undefined) && (b === 0 || b === undefined)) return 0;
    if (a === 0 || a === undefined) return b;
    if (b === 0 || b === undefined) return a;
    return Math.min(a, b);
}

/**
 * Manages persistence of cache statistics to the database
 */
class StatisticsPersistenceManager {
    constructor(cacheName, log) {
        this.cacheName = cacheName;
        this.log = log || cds.log('cds-caching');
    }

    /**
     * Persist hourly statistics
     * @param {object} stats - Statistics to persist
     * @param {string} hourlyId - Hourly ID
     * @param {string} hourlyTimestamp - Hourly timestamp
     * @param {boolean} enabled - Whether main metrics are enabled
     */
    async persistHourlyStats(stats, hourlyId, hourlyTimestamp, enabled) {
        if (!enabled) return;

        try {
            const existingHourly = await SELECT.one.from("plugin_cds_caching_Metrics")
                .where({ ID: hourlyId, cache: this.cacheName });

            if (!existingHourly) {
                await this._createHourlyStats(stats, hourlyId, hourlyTimestamp);
            } else {
                await this._updateHourlyStats(stats, hourlyId, existingHourly);
            }
        } catch (error) {
            this.log.error(`Failed to persist hourly stats for cache ${this.cacheName}:`, error);
        }
    }

    /**
     * Persist key metrics
     * @param {Map} keyAccess - Key access data
     * @param {boolean} keyMetricsEnabled - Whether key metrics are enabled
     */
    async persistKeyMetrics(keyAccess, keyMetricsEnabled) {
        if (!keyMetricsEnabled || keyAccess.size === 0) return;

        this.log.debug(`Persisting ${keyAccess.size} key access records for cache ${this.cacheName}`);

        for (const [key, keyStats] of keyAccess) {
            try {
                await this._persistKeyMetric(key, keyStats);
            } catch (error) {
                this.log.error(`Failed to persist key metric for key ${key}:`, error);
            }
        }
    }

    /**
     * Delete metrics for this cache
     */
    async deleteMetrics() {
        await DELETE('plugin_cds_caching_Metrics')
            .where({ cache: this.cacheName });
        this.log.debug(`Deleted metrics for cache ${this.cacheName}`);
    }

    /**
     * Delete key metrics for this cache
     */
    async deleteKeyMetrics() {
        await DELETE('plugin_cds_caching_KeyMetrics')
            .where({ cache: this.cacheName });
        this.log.debug(`Deleted key metrics for cache ${this.cacheName}`);
    }

    /**
     * Create new hourly stats record
     * @private
     */
    async _createHourlyStats(stats, hourlyId, hourlyTimestamp) {
        await INSERT.into('plugin_cds_caching_Metrics').entries([{
            ID: hourlyId,
            cache: this.cacheName,
            timestamp: hourlyTimestamp,
            period: 'hourly',
            // Read-through metrics
            hits: stats.hits,
            misses: stats.misses,
            errors: stats.errors,
            totalRequests: stats.totalRequests,

            // Read-through latency metrics
            avgHitLatency: stats.avgHitLatency,
            minHitLatency: stats.minHitLatency,
            maxHitLatency: stats.maxHitLatency,
            avgMissLatency: stats.avgMissLatency,
            minMissLatency: stats.minMissLatency,
            maxMissLatency: stats.maxMissLatency,
            avgReadThroughLatency: stats.avgReadThroughLatency,

            // Read-through performance metrics
            hitRatio: stats.hitRatio,
            throughput: stats.throughput,
            errorRate: stats.errorRate,
            cacheEfficiency: stats.cacheEfficiency,

            // Native function metrics
            nativeSets: stats.nativeSets,
            nativeGets: stats.nativeGets,
            nativeDeletes: stats.nativeDeletes,
            nativeClears: stats.nativeClears,
            nativeDeleteByTags: stats.nativeDeleteByTags,
            nativeErrors: stats.nativeErrors,
            totalNativeOperations: stats.totalNativeOperations,

            // Native function performance metrics
            nativeThroughput: stats.nativeThroughput,
            nativeErrorRate: stats.nativeErrorRate,

            // Common metrics
            memoryUsage: stats.memoryUsage,
            itemCount: stats.itemCount,
            uptimeMs: stats.uptimeMs
        }]);
        this.log.debug(`Created new hourly stats for cache ${this.cacheName}`);
    }

    /**
     * Update existing hourly stats record
     * @private
     */
    async _updateHourlyStats(stats, hourlyId, existingHourly) {
        const updatedStats = this._calculateUpdatedStats(stats, existingHourly);

        await UPDATE('plugin_cds_caching_Metrics')
            .set(updatedStats)
            .where({ ID: hourlyId, cache: this.cacheName });
        this.log.debug(`Updated existing hourly stats for cache ${this.cacheName}`);
    }

    /**
     * Calculate updated stats with weighted averages
     * @private
     */
    _calculateUpdatedStats(stats, existingHourly) {
        const updatedStats = {
            // Read-through metrics
            hits: existingHourly.hits + stats.hits,
            misses: existingHourly.misses + stats.misses,
            errors: existingHourly.errors + stats.errors,
            totalRequests: existingHourly.totalRequests + stats.totalRequests,

            // Native function metrics
            nativeSets: existingHourly.nativeSets + stats.nativeSets,
            nativeGets: existingHourly.nativeGets + stats.nativeGets,
            nativeDeletes: existingHourly.nativeDeletes + stats.nativeDeletes,
            nativeClears: existingHourly.nativeClears + stats.nativeClears,
            nativeDeleteByTags: existingHourly.nativeDeleteByTags + stats.nativeDeleteByTags,
            nativeErrors: existingHourly.nativeErrors + stats.nativeErrors,
            totalNativeOperations: existingHourly.totalNativeOperations + stats.totalNativeOperations,

            // Common metrics
            memoryUsage: stats.memoryUsage,
            itemCount: stats.itemCount,
            uptimeMs: stats.uptimeMs
        };

        // Calculate weighted averages for latencies
        const totalRequests = updatedStats.hits + updatedStats.misses;

        // Weighted average for hit latency
        if (updatedStats.hits > 0) {
            const existingHitLatencySum = existingHourly.avgHitLatency * existingHourly.hits;
            const newHitLatencySum = stats.avgHitLatency * stats.hits;
            updatedStats.avgHitLatency = (existingHitLatencySum + newHitLatencySum) / updatedStats.hits;
        } else {
            updatedStats.avgHitLatency = 0;
        }

        // Weighted average for miss latency
        if (updatedStats.misses > 0) {
            const existingMissLatencySum = existingHourly.avgMissLatency * existingHourly.misses;
            const newMissLatencySum = stats.avgMissLatency * stats.misses;
            updatedStats.avgMissLatency = (existingMissLatencySum + newMissLatencySum) / updatedStats.misses;
        } else {
            updatedStats.avgMissLatency = 0;
        }

        // Weighted average for read-through latency (combined hits and misses)
        const existingCount = (existingHourly.hits || 0) + (existingHourly.misses || 0);
        const newCount = (stats.hits || 0) + (stats.misses || 0);
        const totalCount = existingCount + newCount;
        if (totalCount > 0) {
            updatedStats.avgReadThroughLatency =
                ((existingHourly.avgReadThroughLatency || 0) * existingCount +
                 (stats.avgReadThroughLatency || 0) * newCount) / totalCount;
        } else {
            updatedStats.avgReadThroughLatency = 0;
        }

        // Calculate read-through performance metrics
        if (totalRequests > 0) {
            updatedStats.hitRatio = (updatedStats.hits / totalRequests) * 100;
            updatedStats.throughput = totalRequests / (stats.uptimeMs / 1000);
            updatedStats.errorRate = (updatedStats.errors / totalRequests) * 100;
        }

        // Calculate cache efficiency from weighted averages
        if (updatedStats.avgHitLatency > 0 && updatedStats.avgMissLatency > 0) {
            updatedStats.cacheEfficiency = updatedStats.avgMissLatency / updatedStats.avgHitLatency;
        }

        // Calculate native function performance metrics
        const totalNativeOps = updatedStats.totalNativeOperations;
        if (totalNativeOps > 0) {
            updatedStats.nativeThroughput = totalNativeOps / (stats.uptimeMs / 1000);
            updatedStats.nativeErrorRate = (updatedStats.nativeErrors / totalNativeOps) * 100;
        }

        // Update percentiles (use max/min of existing and current, with min using mergeMin)
        updatedStats.maxHitLatency = Math.max(existingHourly.maxHitLatency || 0, stats.maxHitLatency || 0);
        updatedStats.maxMissLatency = Math.max(existingHourly.maxMissLatency || 0, stats.maxMissLatency || 0);
        updatedStats.minHitLatency = mergeMin(existingHourly.minHitLatency, stats.minHitLatency);
        updatedStats.minMissLatency = mergeMin(existingHourly.minMissLatency, stats.minMissLatency);

        return updatedStats;
    }

    /**
     * Persist a single key metric
     * @private
     */
    async _persistKeyMetric(key, keyStats) {
        const keyId = `key:${this.cacheName}:${key}`;

        const existingKey = await SELECT.one.from("plugin_cds_caching_KeyMetrics")
            .where({ ID: keyId, cache: this.cacheName, keyName: key });

        if (!existingKey) {
            await this._createKeyMetric(key, keyStats, keyId);
        } else {
            await this._updateKeyMetric(key, keyStats, keyId, existingKey);
        }
    }

    /**
     * Create new key metric record
     * @private
     */
    async _createKeyMetric(key, keyStats, keyId) {

        await INSERT.into('plugin_cds_caching_KeyMetrics').entries([{
            ID: keyId,
            cache: this.cacheName,
            keyName: key,
            lastAccess: new Date(keyStats.lastAccess).toISOString(),
            period: 'current',
            // Operation type tracking
            operationType: keyStats.operationType,

            // Read-through metrics
            hits: keyStats.hits,
            misses: keyStats.misses,
            errors: keyStats.errors,
            totalRequests: keyStats.totalRequests,
            hitRatio: keyStats.hitRatio,
            cacheEfficiency: keyStats.cacheEfficiency,

            // Read-through latency metrics
            avgHitLatency: keyStats.avgHitLatency || 0,
            minHitLatency: keyStats.minHitLatency === Infinity ? 0 : keyStats.minHitLatency,
            maxHitLatency: keyStats.maxHitLatency || 0,
            avgMissLatency: keyStats.avgMissLatency || 0,
            minMissLatency: keyStats.minMissLatency === Infinity ? 0 : keyStats.minMissLatency,
            maxMissLatency: keyStats.maxMissLatency || 0,
            avgReadThroughLatency: keyStats.avgReadThroughLatency || 0,

            // Read-through performance metrics
            throughput: keyStats.throughput || 0,
            errorRate: keyStats.errorRate || 0,

            // Native function metrics
            nativeHits: keyStats.nativeHits || 0,
            nativeMisses: keyStats.nativeMisses || 0,
            nativeSets: keyStats.nativeSets || 0,
            nativeDeletes: keyStats.nativeDeletes || 0,
            nativeClears: keyStats.nativeClears || 0,
            nativeDeleteByTags: keyStats.nativeDeleteByTags || 0,
            nativeErrors: keyStats.nativeErrors || 0,
            totalNativeOperations: keyStats.totalNativeOperations || 0,

            // Native function performance metrics
            nativeThroughput: keyStats.nativeThroughput || 0,
            nativeErrorRate: keyStats.nativeErrorRate || 0,

            // Enhanced metadata
            dataType: keyStats.dataType,
            operation: keyStats.operation,
            metadata: keyStats.metadata,

            // Enhanced context information
            context: keyStats.context,
            query: keyStats.query,
            subject: keyStats.subject,
            target: keyStats.target,
            tenant: keyStats.tenant,
            user: keyStats.user,
            locale: keyStats.locale,
            timestamp: new Date(keyStats.timestamp).toISOString(),
            cacheOptions: keyStats.cacheOptions
        }]);
    }

    /**
     * Update existing key metric record
     * @private
     */
    async _updateKeyMetric(key, keyStats, keyId, existingKey) {
        const totalHits = existingKey.hits + keyStats.hits;
        const totalMisses = existingKey.misses + keyStats.misses;

        const updatedKeyStats = {
            hits: totalHits,
            misses: totalMisses,
            errors: (existingKey.errors || 0) + (keyStats.errors || 0),
            totalRequests: totalHits + totalMisses,
            lastAccess: new Date(keyStats.lastAccess).toISOString(),

            // Native function metrics
            nativeHits: (existingKey.nativeHits || 0) + (keyStats.nativeHits || 0),
            nativeMisses: (existingKey.nativeMisses || 0) + (keyStats.nativeMisses || 0),
            nativeSets: (existingKey.nativeSets || 0) + (keyStats.nativeSets || 0),
            nativeDeletes: (existingKey.nativeDeletes || 0) + (keyStats.nativeDeletes || 0),
            nativeClears: (existingKey.nativeClears || 0) + (keyStats.nativeClears || 0),
            nativeDeleteByTags: (existingKey.nativeDeleteByTags || 0) + (keyStats.nativeDeleteByTags || 0),
            nativeErrors: (existingKey.nativeErrors || 0) + (keyStats.nativeErrors || 0),
            totalNativeOperations: (existingKey.totalNativeOperations || 0) + (keyStats.totalNativeOperations || 0),

            // Weighted average for hit latency
            avgHitLatency: totalHits > 0
                ? ((existingKey.avgHitLatency * existingKey.hits) + (keyStats.avgHitLatency * keyStats.hits)) / totalHits
                : 0,
            // Weighted average for miss latency
            avgMissLatency: totalMisses > 0
                ? ((existingKey.avgMissLatency * existingKey.misses) + (keyStats.avgMissLatency * keyStats.misses)) / totalMisses
                : 0,

            // Update percentiles (use max/min of existing and current, with min using mergeMin)
            minHitLatency: mergeMin(existingKey.minHitLatency, keyStats.minHitLatency),
            maxHitLatency: Math.max(existingKey.maxHitLatency || 0, keyStats.maxHitLatency || 0),
            minMissLatency: mergeMin(existingKey.minMissLatency, keyStats.minMissLatency),
            maxMissLatency: Math.max(existingKey.maxMissLatency || 0, keyStats.maxMissLatency || 0)
        };

        // Update context information if new data is available
        if (keyStats.context) updatedKeyStats.context = keyStats.context;
        if (keyStats.query) updatedKeyStats.query = keyStats.query;
        if (keyStats.subject) updatedKeyStats.subject = keyStats.subject;
        if (keyStats.target) updatedKeyStats.target = keyStats.target;
        if (keyStats.tenant) updatedKeyStats.tenant = keyStats.tenant;
        if (keyStats.user) updatedKeyStats.user = keyStats.user;
        if (keyStats.locale) updatedKeyStats.locale = keyStats.locale;
        if (keyStats.cacheOptions) updatedKeyStats.cacheOptions = keyStats.cacheOptions;    
        await UPDATE('plugin_cds_caching_KeyMetrics')
            .set(updatedKeyStats)
            .where({ ID: keyId, cache: this.cacheName, keyName: key });
    }
}

module.exports = StatisticsPersistenceManager; 