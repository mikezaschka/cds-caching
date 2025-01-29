const cds = require('@sap/cds');

class CacheStatisticsHandler {
    constructor(options = {}) {
        console.log(options);
        this.options = {
            persistenceInterval: 5 * 60 * 60 * 1000, // 5 minutes
            maxLatencies: 1000,
            ...options
        };

        this.stats = {
            current: {
                hits: 0,
                misses: 0,
                sets: 0,
                deletes: 0,
                errors: 0,
                latencies: []
            },
            lastPersisted: Date.now()
        };

        if (this.options.enabled) {
            cds.once('served', () => {
                this.persistInterval = setInterval(
                    () => this.persistStats(),
                    this.options.persistenceInterval
                );
            })
            cds.on('shutdown', () => {
                clearInterval(this.persistInterval)
            })
        }
    }

    recordHit(latencyMs) {
        this.stats.current.hits++;
        this.recordLatency(latencyMs);
    }

    recordMiss() {
        this.stats.current.misses++;
    }

    recordSet() {
        this.stats.current.sets++;
    }

    recordDelete() {
        this.stats.current.deletes++;
    }

    recordError() {
        this.stats.current.errors++;
    }

    recordLatency(ms) {
        this.stats.current.latencies.push(ms);
        if (this.stats.current.latencies.length > this.options.maxLatencies) {
            this.stats.current.latencies.shift();
        }
    }

    async persistStats() {
        if (!this.options.enabled) return;

        const now = new Date().toISOString();
        const hourlyId = `hourly:${now.slice(0, 13)}`;
        const dailyId = `daily:${now.slice(0, 10)}`;

        const stats = await this.calculateStats();

        try {

            // Persist hourly stats
            const existingHourly = await SELECT.one.from("cds_caching_Statistics")
                .where({ ID: hourlyId, cache: this.options.cache });

            if (!existingHourly) {
                await INSERT.into('cds_caching_Statistics').entries([{
                    ID: hourlyId,
                    cache: this.options.cache,
                    timestamp: now,
                    period: 'hourly',
                    ...stats
                }]);
            } else {
                await UPDATE('cds_caching_Statistics')
                    .set({
                        hits: { '+=': stats.hits },
                        misses: { '+=': stats.misses },
                        sets: { '+=': stats.sets },
                        deletes: { '+=': stats.deletes },
                        errors: { '+=': stats.errors },
                        avgLatency: (existingHourly.avgLatency + stats.avgLatency) / 2,
                        p95Latency: Math.max(existingHourly.p95Latency, stats.p95Latency),
                        memoryUsage: stats.memoryUsage,
                        itemCount: stats.itemCount
                    })
                    .where({ ID: hourlyId, cache: this.options.cache });
            }

            // Update or insert daily stats
            const existingDaily = await SELECT.one.from("cds_caching_Statistics")
                .where({ ID: dailyId, cache: this.options.cache });

            if (existingDaily) {
                await UPDATE('cds_caching_Statistics')
                    .set({
                        hits: { '+=': stats.hits },
                        misses: { '+=': stats.misses },
                        sets: { '+=': stats.sets },
                        deletes: { '+=': stats.deletes },
                        errors: { '+=': stats.errors },
                        avgLatency: (existingDaily.avgLatency + stats.avgLatency) / 2,
                        p95Latency: Math.max(existingDaily.p95Latency, stats.p95Latency),
                        memoryUsage: stats.memoryUsage,
                        itemCount: stats.itemCount
                    })
                    .where({ ID: dailyId, cache: this.options.cache });
            } else {
                await INSERT.into("cds_caching_Statistics").entries({
                    ID: dailyId,
                    cache: this.options.cache,
                    timestamp: now,
                    period: 'daily',
                    ...stats
                });
            }

            this.resetCurrentStats();

        } catch (error) {
            cds.log('caching').error('Error persisting cache statistics:', error);
        }
    }

    async calculateStats() {
        const latencies = this.stats.current.latencies;
        const avgLatency = latencies.length > 0
            ? latencies.reduce((a, b) => a + b, 0) / latencies.length
            : 0;
        const p95Latency = latencies.length > 0
            ? latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)]
            : 0;

        return {
            hits: this.stats.current.hits,
            misses: this.stats.current.misses,
            sets: this.stats.current.sets,
            deletes: this.stats.current.deletes,
            errors: this.stats.current.errors,
            avgLatency,
            p95Latency,
            memoryUsage: process.memoryUsage().heapUsed,
            itemCount: await this.options.getItemCount?.() || 0
        };
    }

    resetCurrentStats() {
        this.stats.current = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            latencies: []
        };
        this.stats.lastPersisted = Date.now();
    }

    async getStats(period = 'hourly', from, to) {
        if (!this.options.enabled) return null;

        const query = SELECT.from("cds_caching_Statistics")
            .where({ period: period });

        if (from) query.and({ timestamp: { '>=': from } });
        if (to) query.and({ timestamp: { '<=': to } });

        query.orderBy({ timestamp: 'desc' });

        return await query;
    }

    async getCurrentStats() {
        if (!this.options.enabled) return null;

        const { current, lastPersisted } = this.stats;
        const latencies = current.latencies;

        return {
            ...current,
            avgLatency: latencies.length > 0
                ? latencies.reduce((a, b) => a + b, 0) / latencies.length
                : 0,
            p95Latency: latencies.length > 0
                ? latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)]
                : 0,
            hitRatio: (current.hits / (current.hits + current.misses)) || 0,
            lastPersisted: new Date(lastPersisted)
        };
    }

    dispose() {
        if (this.persistInterval) {
            clearInterval(this.persistInterval);
        }
    }
}

module.exports = CacheStatisticsHandler; 