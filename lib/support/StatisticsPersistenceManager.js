const cds = require('@sap/cds');
const { SELECT, INSERT, UPDATE } = cds.ql;
const { isMultitenantMode, hasTenantContext } = require('./MultitenancyDetector');
const { isPluginModelAvailable } = require('../util');

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
        if (!enabled || !isPluginModelAvailable()) return;

        // In MTX mode, only persist when we have a tenant context
        if (isMultitenantMode() && !hasTenantContext()) {
            this.log.debug(`Skipping hourly stats persistence in MTX mode (no tenant context)`);
            return;
        }

        try {
            const { Metrics } = cds.entities('plugin.cds_caching');
            const existingHourly = await SELECT.one.from(Metrics)
                .where({ ID: hourlyId, cache: this.cacheName });

            if (!existingHourly) {
                await this._createHourlyStats(Metrics, stats, hourlyId, hourlyTimestamp);
            } else {
                await this._updateHourlyStats(Metrics, stats, hourlyId, existingHourly);
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
        if (!keyMetricsEnabled || keyAccess.size === 0 || !isPluginModelAvailable()) return;

        // In MTX mode, only persist when we have a tenant context
        if (isMultitenantMode() && !hasTenantContext()) {
            this.log.debug(`Skipping key metrics persistence in MTX mode (no tenant context)`);
            return;
        }

        this.log.debug(`Persisting ${keyAccess.size} key access records for cache ${this.cacheName}`);

        const { KeyMetrics } = cds.entities('plugin.cds_caching');
        for (const [key, keyStats] of keyAccess) {
            try {
                await this._persistKeyMetric(KeyMetrics, key, keyStats);
            } catch (error) {
                this.log.error(`Failed to persist key metric for key ${key}:`, error);
            }
        }
    }

    /**
     * Persist tag metrics
     * @param {Map} tagAccess - Tag access data
     * @param {boolean} tagMetricsEnabled - Whether tag metrics are enabled
     */
    async persistTagMetrics(tagAccess, tagMetricsEnabled) {
        if (!tagMetricsEnabled || tagAccess.size === 0 || !isPluginModelAvailable()) return;

        if (isMultitenantMode() && !hasTenantContext()) {
            this.log.debug(`Skipping tag metrics persistence in MTX mode (no tenant context)`);
            return;
        }

        this.log.debug(`Persisting ${tagAccess.size} tag access records for cache ${this.cacheName}`);

        const { TagMetrics } = cds.entities('plugin.cds_caching');
        for (const [tag, tagStats] of tagAccess) {
            try {
                await this._persistTagMetric(TagMetrics, tag, tagStats);
            } catch (error) {
                this.log.error(`Failed to persist tag metric for tag ${tag}:`, error);
            }
        }
    }

    /**
     * Delete metrics for this cache
     */
    async deleteMetrics() {
        if (!isPluginModelAvailable()) return;
        if (isMultitenantMode() && !hasTenantContext()) {
            this.log.debug(`Skipping deleteMetrics in MTX mode (no tenant context)`);
            return;
        }
        const db = await cds.connect.to('db');
        const { Metrics } = cds.entities('plugin.cds_caching');
        await db.delete(Metrics).where({ cache: this.cacheName });
        this.log.debug(`Deleted metrics for cache ${this.cacheName}`);
    }

    /**
     * Delete key metrics for this cache
     */
    async deleteKeyMetrics() {
        if (!isPluginModelAvailable()) return;
        if (isMultitenantMode() && !hasTenantContext()) {
            this.log.debug(`Skipping deleteKeyMetrics in MTX mode (no tenant context)`);
            return;
        }
        const db = await cds.connect.to('db');
        const { KeyMetrics } = cds.entities('plugin.cds_caching');
        await db.delete(KeyMetrics).where({ cache: this.cacheName });
        this.log.debug(`Deleted key metrics for cache ${this.cacheName}`);
    }

    /**
     * Delete tag metrics for this cache
     */
    async deleteTagMetrics() {
        if (!isPluginModelAvailable()) return;
        if (isMultitenantMode() && !hasTenantContext()) {
            this.log.debug(`Skipping deleteTagMetrics in MTX mode (no tenant context)`);
            return;
        }
        const db = await cds.connect.to('db');
        const { TagMetrics } = cds.entities('plugin.cds_caching');
        await db.delete(TagMetrics).where({ cache: this.cacheName });
        this.log.debug(`Deleted tag metrics for cache ${this.cacheName}`);
    }

    /**
     * Create new hourly stats record
     * @private
     */
    async _createHourlyStats(Metrics, stats, hourlyId, hourlyTimestamp) {
        await INSERT.into(Metrics).entries([{
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
            minHitLatency: stats.minHitLatency === Infinity ? 0 : stats.minHitLatency,
            maxHitLatency: stats.maxHitLatency,
            avgMissLatency: stats.avgMissLatency,
            minMissLatency: stats.minMissLatency === Infinity ? 0 : stats.minMissLatency,
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
    async _updateHourlyStats(Metrics, stats, hourlyId, existingHourly) {
        const updatedStats = this._calculateUpdatedStats(stats, existingHourly);

        await UPDATE(Metrics)
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
            hits: (Number(existingHourly.hits) || 0) + stats.hits,
            misses: (Number(existingHourly.misses) || 0) + stats.misses,
            errors: (Number(existingHourly.errors) || 0) + stats.errors,
            totalRequests: (Number(existingHourly.totalRequests) || 0) + stats.totalRequests,

            // Native function metrics
            nativeSets: (Number(existingHourly.nativeSets) || 0) + stats.nativeSets,
            nativeGets: (Number(existingHourly.nativeGets) || 0) + stats.nativeGets,
            nativeDeletes: (Number(existingHourly.nativeDeletes) || 0) + stats.nativeDeletes,
            nativeClears: (Number(existingHourly.nativeClears) || 0) + stats.nativeClears,
            nativeDeleteByTags: (Number(existingHourly.nativeDeleteByTags) || 0) + stats.nativeDeleteByTags,
            nativeErrors: (Number(existingHourly.nativeErrors) || 0) + stats.nativeErrors,
            totalNativeOperations: (Number(existingHourly.totalNativeOperations) || 0) + stats.totalNativeOperations,

            // Common metrics
            memoryUsage: stats.memoryUsage,
            itemCount: stats.itemCount,
            uptimeMs: stats.uptimeMs
        };

        // Calculate weighted averages for latencies
        const totalRequests = updatedStats.hits + updatedStats.misses;

        // Weighted average for hit latency
        if (updatedStats.hits > 0) {
            const existingHitLatencySum = (Number(existingHourly.avgHitLatency) || 0) * (Number(existingHourly.hits) || 0);
            const newHitLatencySum = stats.avgHitLatency * stats.hits;
            updatedStats.avgHitLatency = (existingHitLatencySum + newHitLatencySum) / updatedStats.hits;
        } else {
            updatedStats.avgHitLatency = 0;
        }

        // Weighted average for miss latency
        if (updatedStats.misses > 0) {
            const existingMissLatencySum = (Number(existingHourly.avgMissLatency) || 0) * (Number(existingHourly.misses) || 0);
            const newMissLatencySum = stats.avgMissLatency * stats.misses;
            updatedStats.avgMissLatency = (existingMissLatencySum + newMissLatencySum) / updatedStats.misses;
        } else {
            updatedStats.avgMissLatency = 0;
        }

        // Weighted average for read-through latency (combined hits and misses)
        const existingCount = (Number(existingHourly.hits) || 0) + (Number(existingHourly.misses) || 0);
        const newCount = (stats.hits || 0) + (stats.misses || 0);
        const totalCount = existingCount + newCount;
        if (totalCount > 0) {
            updatedStats.avgReadThroughLatency =
                ((Number(existingHourly.avgReadThroughLatency) || 0) * existingCount +
                 (stats.avgReadThroughLatency || 0) * newCount) / totalCount;
        } else {
            updatedStats.avgReadThroughLatency = 0;
        }

        // Calculate read-through performance metrics
        if (totalRequests > 0) {
            updatedStats.hitRatio = (updatedStats.hits / totalRequests) * 100;
            updatedStats.throughput = stats.uptimeMs > 0 ? totalRequests / (stats.uptimeMs / 1000) : 0;
            updatedStats.errorRate = (updatedStats.errors / totalRequests) * 100;
        }

        // Calculate cache efficiency from weighted averages
        if (updatedStats.avgHitLatency > 0 && updatedStats.avgMissLatency > 0) {
            updatedStats.cacheEfficiency = updatedStats.avgMissLatency / updatedStats.avgHitLatency;
        }

        // Calculate native function performance metrics
        const totalNativeOps = updatedStats.totalNativeOperations;
        if (totalNativeOps > 0) {
            updatedStats.nativeThroughput = stats.uptimeMs > 0 ? totalNativeOps / (stats.uptimeMs / 1000) : 0;
            updatedStats.nativeErrorRate = (updatedStats.nativeErrors / totalNativeOps) * 100;
        }

        // Update percentiles (use max/min of existing and current, with min using mergeMin)
        updatedStats.maxHitLatency = Math.max(Number(existingHourly.maxHitLatency) || 0, stats.maxHitLatency || 0);
        updatedStats.maxMissLatency = Math.max(Number(existingHourly.maxMissLatency) || 0, stats.maxMissLatency || 0);
        updatedStats.minHitLatency = mergeMin(Number(existingHourly.minHitLatency) || 0, stats.minHitLatency === Infinity ? 0 : stats.minHitLatency);
        updatedStats.minMissLatency = mergeMin(Number(existingHourly.minMissLatency) || 0, stats.minMissLatency === Infinity ? 0 : stats.minMissLatency);

        return updatedStats;
    }

    /**
     * Persist a single key metric
     * @private
     */
    async _persistKeyMetric(KeyMetrics, key, keyStats) {
        const keyId = `key:${this.cacheName}:${key}`;

        const existingKey = await SELECT.one.from(KeyMetrics)
            .where({ ID: keyId, cache: this.cacheName, keyName: key });

        if (!existingKey) {
            await this._createKeyMetric(KeyMetrics, key, keyStats, keyId);
        } else {
            await this._updateKeyMetric(KeyMetrics, key, keyStats, keyId, existingKey);
        }
    }

    /**
     * Create new key metric record
     * @private
     */
    async _createKeyMetric(KeyMetrics, key, keyStats, keyId) {

        await INSERT.into(KeyMetrics).entries([{
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
    async _updateKeyMetric(KeyMetrics, key, keyStats, keyId, existingKey) {
        const totalHits = (Number(existingKey.hits) || 0) + keyStats.hits;
        const totalMisses = (Number(existingKey.misses) || 0) + keyStats.misses;

        const updatedKeyStats = {
            hits: totalHits,
            misses: totalMisses,
            errors: (Number(existingKey.errors) || 0) + (keyStats.errors || 0),
            totalRequests: totalHits + totalMisses,
            lastAccess: new Date(keyStats.lastAccess).toISOString(),

            // Native function metrics
            nativeHits: (Number(existingKey.nativeHits) || 0) + (keyStats.nativeHits || 0),
            nativeMisses: (Number(existingKey.nativeMisses) || 0) + (keyStats.nativeMisses || 0),
            nativeSets: (Number(existingKey.nativeSets) || 0) + (keyStats.nativeSets || 0),
            nativeDeletes: (Number(existingKey.nativeDeletes) || 0) + (keyStats.nativeDeletes || 0),
            nativeClears: (Number(existingKey.nativeClears) || 0) + (keyStats.nativeClears || 0),
            nativeDeleteByTags: (Number(existingKey.nativeDeleteByTags) || 0) + (keyStats.nativeDeleteByTags || 0),
            nativeErrors: (Number(existingKey.nativeErrors) || 0) + (keyStats.nativeErrors || 0),
            totalNativeOperations: (Number(existingKey.totalNativeOperations) || 0) + (keyStats.totalNativeOperations || 0),

            // Weighted average for hit latency
            avgHitLatency: totalHits > 0
                ? (((Number(existingKey.avgHitLatency) || 0) * (Number(existingKey.hits) || 0)) + (keyStats.avgHitLatency * keyStats.hits)) / totalHits
                : 0,
            // Weighted average for miss latency
            avgMissLatency: totalMisses > 0
                ? (((Number(existingKey.avgMissLatency) || 0) * (Number(existingKey.misses) || 0)) + (keyStats.avgMissLatency * keyStats.misses)) / totalMisses
                : 0,

            // Update percentiles (use max/min of existing and current, with min using mergeMin)
            minHitLatency: mergeMin(Number(existingKey.minHitLatency) || 0, keyStats.minHitLatency === Infinity ? 0 : keyStats.minHitLatency),
            maxHitLatency: Math.max(Number(existingKey.maxHitLatency) || 0, keyStats.maxHitLatency || 0),
            minMissLatency: mergeMin(Number(existingKey.minMissLatency) || 0, keyStats.minMissLatency === Infinity ? 0 : keyStats.minMissLatency),
            maxMissLatency: Math.max(Number(existingKey.maxMissLatency) || 0, keyStats.maxMissLatency || 0)
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
        await UPDATE(KeyMetrics)
            .set(updatedKeyStats)
            .where({ ID: keyId, cache: this.cacheName, keyName: key });
    }

    /**
     * Persist a single tag metric
     * @private
     */
    async _persistTagMetric(TagMetrics, tag, tagStats) {
        const tagId = `tag:${this.cacheName}:${tag}`;

        const existingTag = await SELECT.one.from(TagMetrics)
            .where({ ID: tagId, cache: this.cacheName, tag });

        if (!existingTag) {
            await this._createTagMetric(TagMetrics, tag, tagStats, tagId);
        } else {
            await this._updateTagMetric(TagMetrics, tag, tagStats, tagId, existingTag);
        }
    }

    /**
     * Create new tag metric record
     * @private
     */
    async _createTagMetric(TagMetrics, tag, tagStats, tagId) {
        await INSERT.into(TagMetrics).entries([{
            ID: tagId,
            cache: this.cacheName,
            tag,
            lastAccess: new Date(tagStats.lastAccess).toISOString(),
            period: 'current',
            hits: tagStats.hits,
            misses: tagStats.misses,
            errors: tagStats.errors,
            totalRequests: tagStats.totalRequests,
            hitRatio: tagStats.hitRatio,
            cacheEfficiency: tagStats.cacheEfficiency,
            avgHitLatency: tagStats.avgHitLatency || 0,
            minHitLatency: tagStats.minHitLatency === Infinity ? 0 : tagStats.minHitLatency,
            maxHitLatency: tagStats.maxHitLatency || 0,
            avgMissLatency: tagStats.avgMissLatency || 0,
            minMissLatency: tagStats.minMissLatency === Infinity ? 0 : tagStats.minMissLatency,
            maxMissLatency: tagStats.maxMissLatency || 0,
            avgReadThroughLatency: tagStats.avgReadThroughLatency || 0,
            throughput: tagStats.throughput || 0,
            errorRate: tagStats.errorRate || 0,
            nativeHits: tagStats.nativeHits || 0,
            nativeMisses: tagStats.nativeMisses || 0,
            nativeSets: tagStats.nativeSets || 0,
            nativeDeletes: tagStats.nativeDeletes || 0,
            nativeErrors: tagStats.nativeErrors || 0,
            totalNativeOperations: tagStats.totalNativeOperations || 0,
            nativeThroughput: tagStats.nativeThroughput || 0,
            nativeErrorRate: tagStats.nativeErrorRate || 0,
            timestamp: new Date(tagStats.timestamp).toISOString(),
        }]);
    }

    /**
     * Update existing tag metric record
     * @private
     */
    async _updateTagMetric(TagMetrics, tag, tagStats, tagId, existingTag) {
        const totalHits = (Number(existingTag.hits) || 0) + tagStats.hits;
        const totalMisses = (Number(existingTag.misses) || 0) + tagStats.misses;

        const updatedTagStats = {
            hits: totalHits,
            misses: totalMisses,
            errors: (Number(existingTag.errors) || 0) + (tagStats.errors || 0),
            totalRequests: totalHits + totalMisses,
            lastAccess: new Date(tagStats.lastAccess).toISOString(),
            hitRatio: (totalHits + totalMisses) > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0,
            nativeHits: (Number(existingTag.nativeHits) || 0) + (tagStats.nativeHits || 0),
            nativeMisses: (Number(existingTag.nativeMisses) || 0) + (tagStats.nativeMisses || 0),
            nativeSets: (Number(existingTag.nativeSets) || 0) + (tagStats.nativeSets || 0),
            nativeDeletes: (Number(existingTag.nativeDeletes) || 0) + (tagStats.nativeDeletes || 0),
            nativeErrors: (Number(existingTag.nativeErrors) || 0) + (tagStats.nativeErrors || 0),
            totalNativeOperations: (Number(existingTag.totalNativeOperations) || 0) + (tagStats.totalNativeOperations || 0),
            avgHitLatency: totalHits > 0
                ? (((Number(existingTag.avgHitLatency) || 0) * (Number(existingTag.hits) || 0)) + (tagStats.avgHitLatency * tagStats.hits)) / totalHits
                : 0,
            avgMissLatency: totalMisses > 0
                ? (((Number(existingTag.avgMissLatency) || 0) * (Number(existingTag.misses) || 0)) + (tagStats.avgMissLatency * tagStats.misses)) / totalMisses
                : 0,
            minHitLatency: mergeMin(Number(existingTag.minHitLatency) || 0, tagStats.minHitLatency === Infinity ? 0 : tagStats.minHitLatency),
            maxHitLatency: Math.max(Number(existingTag.maxHitLatency) || 0, tagStats.maxHitLatency || 0),
            minMissLatency: mergeMin(Number(existingTag.minMissLatency) || 0, tagStats.minMissLatency === Infinity ? 0 : tagStats.minMissLatency),
            maxMissLatency: Math.max(Number(existingTag.maxMissLatency) || 0, tagStats.maxMissLatency || 0),
        };

        await UPDATE(TagMetrics)
            .set(updatedTagStats)
            .where({ ID: tagId, cache: this.cacheName, tag });
    }
}

module.exports = StatisticsPersistenceManager; 