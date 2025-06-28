const cds = require('@sap/cds');

class CacheStatisticsHandler {

    log = cds.log('cds-caching');

    constructor(options = {}) {
        this.options = {
            persistenceInterval: 10 * 1000, // 10 seconds 
            maxLatencies: 1000,
            maxKeyTracking: 100, // Track top accessed keys
            enableKeyTracking: true,
            enabled: true, // Add enabled flag for runtime control
            ...options
        };

        this.stats = {
            current: {
                hits: 0,
                misses: 0,
                sets: 0,
                deletes: 0,
                errors: 0,
                totalRequests: 0, // Add total requests counter
                latencies: [],
                hitLatencies: [], // Separate latency tracking for hits
                missLatencies: [], // Separate latency tracking for misses
                setLatencies: [], // Separate latency tracking for sets
                deleteLatencies: [], // Separate latency tracking for deletes
                keyAccess: new Map(), // Track key access patterns
                startTime: Date.now(),
                lastReset: Date.now()
            },
            historical: {
                hourly: new Map(),
                daily: new Map()
            },
            lastPersisted: Date.now()
        };

        // Always set up persistence interval, but control execution based on enabled flag
        this.setupPersistenceInterval();

        cds.on('shutdown', () => {
            this.cleanupPersistenceInterval();
        });
    }

    /**
     * Set up the persistence interval
     */
    setupPersistenceInterval() {
        // Clear any existing interval
        this.cleanupPersistenceInterval();
        
        //cds.once('served', () => {
            this.persistInterval = setInterval(() => {
                // Only persist if statistics are enabled
                if (this.options.enabled) {
                    this.persistStats();
                }
            }, this.options.persistenceInterval);
        //});
    }

    /**
     * Clean up the persistence interval
     */
    cleanupPersistenceInterval() {
        if (this.persistInterval) {
            clearInterval(this.persistInterval);
            this.persistInterval = null;
        }
    }

    /**
     * Restart persistence interval (called when enabled/disabled at runtime)
     */
    restartPersistenceInterval() {
        this.log.info(`Restarting persistence interval for cache ${this.options.cache}, enabled: ${this.options.enabled}`);
        
        // Clear any existing interval
        this.cleanupPersistenceInterval();
        
        // Check if the service is already served
        if (cds.services && Object.keys(cds.services).length > 0) {
            // Service is already served, create interval immediately
            this.persistInterval = setInterval(() => {
                // Only persist if statistics are enabled
                if (this.options.enabled) {
                    this.persistStats();
                }
            }, this.options.persistenceInterval);
            this.log.info(`Created persistence interval immediately for cache ${this.options.cache}`);
        } else {
            // Service not yet served, use the normal setup
            this.setupPersistenceInterval();
            this.log.info(`Set up persistence interval for later creation for cache ${this.options.cache}`);
        }
    }

    recordHit(latency, key, metadata = {}) {
        if (!this.options.enabled) return;

        this.stats.current.hits++;
        this.recordLatency(latency);
        this.recordHitLatency(latency);

        // Record key access if key tracking is enabled
        if (this.options.enableKeyTracking && key) {
            this.recordKeyAccess(key, 'hit', metadata);
        }

        // Log for debugging
        this.log.info(`Recorded HIT for key: ${key}, latency: ${latency}ms, enabled: ${this.options.enabled}, keyTracking: ${this.options.enableKeyTracking}`);
    }

    recordMiss(latency, key, metadata = {}) {
        if (!this.options.enabled) return;
        
        this.stats.current.misses++;
        this.recordLatency(latency);
        this.recordMissLatency(latency);
        
        // Record key access if key tracking is enabled
        if (this.options.enableKeyTracking && key) {
            this.recordKeyAccess(key, 'miss', metadata);
        }
        
        // Log for debugging
        this.log.info(`Recorded MISS for key: ${key}, latency: ${latency}ms, enabled: ${this.options.enabled}, keyTracking: ${this.options.enableKeyTracking}`);
    }

    recordSet(latency, key, metadata = {}) {
        if (!this.options.enabled) return;
        
        this.stats.current.sets++;
        this.recordLatency(latency);
        this.recordSetLatency(latency);
        
        // Record key access if key tracking is enabled
        if (this.options.enableKeyTracking && key) {
            this.recordKeyAccess(key, 'set', metadata);
        }
        
        // Log for debugging
        this.log.info(`Recorded SET for key: ${key}, latency: ${latency}ms, enabled: ${this.options.enabled}, keyTracking: ${this.options.enableKeyTracking}`);
    }

    recordDelete(latency, key, metadata = {}) {
        if (!this.options.enabled) return;
        
        this.stats.current.deletes++;
        this.recordLatency(latency);
        this.recordDeleteLatency(latency);
        
        // Record key access if key tracking is enabled
        if (this.options.enableKeyTracking && key) {
            this.recordKeyAccess(key, 'delete', metadata);
        }
        
        // Log for debugging
        this.log.info(`Recorded DELETE for key: ${key}, latency: ${latency}ms, enabled: ${this.options.enabled}, keyTracking: ${this.options.enableKeyTracking}`);
    }

    recordError(error) {
        if (!this.options.enabled) return;

        this.stats.current.errors++;
    }

    recordLatency(ms) {
        this.stats.current.latencies.push(ms);
        if (this.stats.current.latencies.length > this.options.maxLatencies) {
            this.stats.current.latencies.shift();
        }
    }

    recordHitLatency(ms) {
        this.log.info(`[DEBUG] recordHitLatency: ${ms}`);
        this.stats.current.hitLatencies.push(ms);
        if (this.stats.current.hitLatencies.length > this.options.maxLatencies) {
            this.stats.current.hitLatencies.shift();
        }
    }

    recordMissLatency(ms) {
        this.stats.current.missLatencies.push(ms);
        if (this.stats.current.missLatencies.length > this.options.maxLatencies) {
            this.stats.current.missLatencies.shift();
        }
    }

    recordSetLatency(ms) {
        this.stats.current.setLatencies.push(ms);
        if (this.stats.current.setLatencies.length > this.options.maxLatencies) {
            this.stats.current.setLatencies.shift();
        }
    }

    recordDeleteLatency(ms) {
        this.stats.current.deleteLatencies.push(ms);
        if (this.stats.current.deleteLatencies.length > this.options.maxLatencies) {
            this.stats.current.deleteLatencies.shift();
        }
    }

    recordKeyAccess(key, operation, metadata = {}) {
        if (!this.stats.current.keyAccess.has(key)) {
            this.stats.current.keyAccess.set(key, {
                hits: 0,
                misses: 0,
                sets: 0,
                deletes: 0,
                lastAccess: Date.now(),
                metadata: {
                    dataType: metadata.dataType || 'custom',
                    serviceName: metadata.serviceName || '',
                    entityName: metadata.entityName || '',
                    operation: metadata.operation || '',
                    metadata: metadata.metadata || ''
                }
            });
        }

        const keyStats = this.stats.current.keyAccess.get(key);
        keyStats[operation + 's']++;
        keyStats.lastAccess = Date.now();

        // Keep only top accessed keys
        if (this.stats.current.keyAccess.size > this.options.maxKeyTracking) {
            const entries = Array.from(this.stats.current.keyAccess.entries());
            entries.sort((a, b) => {
                const totalA = a[1].hits + a[1].misses + a[1].sets + a[1].deletes;
                const totalB = b[1].hits + b[1].misses + b[1].sets + b[1].deletes;
                return totalB - totalA;
            });

            this.stats.current.keyAccess = new Map(entries.slice(0, this.options.maxKeyTracking));
        }
    }

    async persistStats() {
        if (!this.options.enabled) {
            this.log.info(`PersistStats called but statistics are disabled for cache ${this.options.cache}`);
            return;
        }

        this.log.info(`Starting persistStats for cache ${this.options.cache}, enabled: ${this.options.enabled}`);
        
        const now = new Date();
        
        // Calculate beginning of hour for hourly stats
        const hourlyTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0).toISOString();
        
        // Calculate beginning of day for daily stats
        const dailyTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
        
        const hourlyId = `hourly:${hourlyTimestamp.slice(0, 13)}`;
        const dailyId = `daily:${dailyTimestamp.slice(0, 10)}`;

        const stats = await this.calculateStats();
        this.log.info(`Calculated stats for cache ${this.options.cache}:`, {
            hits: stats.hits,
            misses: stats.misses,
            sets: stats.sets,
            deletes: stats.deletes,
            totalRequests: stats.totalRequests
        });

        try {
            // Persist hourly stats
            const existingHourly = await SELECT.one.from("plugin_cds_caching_Statistics")
                .where({ ID: hourlyId, cache: this.options.cache });

            if (!existingHourly) {
                await INSERT.into('plugin_cds_caching_Statistics').entries([{
                    ID: hourlyId,
                    cache: this.options.cache,
                    timestamp: hourlyTimestamp,
                    period: 'hourly',
                    hits: stats.hits,
                    misses: stats.misses,
                    sets: stats.sets,
                    deletes: stats.deletes,
                    errors: stats.errors,
                    avgLatency: stats.avgLatency,
                    p95Latency: stats.p95Latency,
                    p99Latency: stats.p99Latency,
                    minLatency: stats.minLatency,
                    maxLatency: stats.maxLatency,
                    avgHitLatency: stats.avgHitLatency,
                    p95HitLatency: stats.p95HitLatency,
                    p99HitLatency: stats.p99HitLatency,
                    minHitLatency: stats.minHitLatency,
                    maxHitLatency: stats.maxHitLatency,
                    avgMissLatency: stats.avgMissLatency,
                    p95MissLatency: stats.p95MissLatency,
                    p99MissLatency: stats.p99MissLatency,
                    minMissLatency: stats.minMissLatency,
                    maxMissLatency: stats.maxMissLatency,
                    avgSetLatency: stats.avgSetLatency,
                    avgDeleteLatency: stats.avgDeleteLatency,
                    memoryUsage: stats.memoryUsage,
                    itemCount: stats.itemCount,
                    hitRatio: stats.hitRatio,
                    throughput: stats.throughput,
                    errorRate: stats.errorRate,
                    cacheEfficiency: stats.cacheEfficiency,
                    uptimeMs: stats.uptimeMs
                }]);
                this.log.info(`Created new hourly stats for cache ${this.options.cache}`);
            } else {
                // Update existing hourly stats with cumulative values
                const updatedStats = {
                    hits: existingHourly.hits + stats.hits,
                    misses: existingHourly.misses + stats.misses,
                    sets: existingHourly.sets + stats.sets,
                    deletes: existingHourly.deletes + stats.deletes,
                    errors: existingHourly.errors + stats.errors,
                    memoryUsage: stats.memoryUsage,
                    itemCount: stats.itemCount,
                    uptimeMs: stats.uptimeMs
                };

                // Calculate weighted averages for latencies
                const totalRequests = updatedStats.hits + updatedStats.misses;
                const totalSets = updatedStats.sets;
                const totalDeletes = updatedStats.deletes;

                // Weighted average for overall latency
                if (totalRequests > 0) {
                    updatedStats.avgLatency = ((existingHourly.avgLatency * (existingHourly.hits + existingHourly.misses)) + (stats.avgLatency * (stats.hits + stats.misses))) / totalRequests;
                    updatedStats.hitRatio = (updatedStats.hits / totalRequests) * 100;
                    updatedStats.throughput = totalRequests / (stats.uptimeMs / 1000);
                    updatedStats.errorRate = (updatedStats.errors / totalRequests) * 100;
                }

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

                // Weighted average for set latency
                if (updatedStats.sets > 0) {
                    const existingSetLatencySum = existingHourly.avgSetLatency * existingHourly.sets;
                    const newSetLatencySum = stats.avgSetLatency * stats.sets;
                    updatedStats.avgSetLatency = (existingSetLatencySum + newSetLatencySum) / updatedStats.sets;
                } else {
                    updatedStats.avgSetLatency = 0;
                }

                // Weighted average for delete latency
                if (updatedStats.deletes > 0) {
                    const existingDeleteLatencySum = existingHourly.avgDeleteLatency * existingHourly.deletes;
                    const newDeleteLatencySum = stats.avgDeleteLatency * stats.deletes;
                    updatedStats.avgDeleteLatency = (existingDeleteLatencySum + newDeleteLatencySum) / updatedStats.deletes;
                } else {
                    updatedStats.avgDeleteLatency = 0;
                }

                // Calculate cache efficiency from weighted averages
                if (updatedStats.avgHitLatency > 0 && updatedStats.avgMissLatency > 0) {
                    updatedStats.cacheEfficiency = updatedStats.avgMissLatency / updatedStats.avgHitLatency;
                }

                // Update percentiles (use max of existing and current)
                updatedStats.p95Latency = Math.max(existingHourly.p95Latency, stats.p95Latency);
                updatedStats.p99Latency = Math.max(existingHourly.p99Latency, stats.p99Latency);
                updatedStats.maxLatency = Math.max(existingHourly.maxLatency, stats.maxLatency);
                updatedStats.p95HitLatency = Math.max(existingHourly.p95HitLatency, stats.p95HitLatency);
                updatedStats.p99HitLatency = Math.max(existingHourly.p99HitLatency, stats.p99HitLatency);
                updatedStats.maxHitLatency = Math.max(existingHourly.maxHitLatency, stats.maxHitLatency);
                updatedStats.p95MissLatency = Math.max(existingHourly.p95MissLatency, stats.p95MissLatency);
                updatedStats.p99MissLatency = Math.max(existingHourly.p99MissLatency, stats.p99MissLatency);
                updatedStats.maxMissLatency = Math.max(existingHourly.maxMissLatency, stats.maxMissLatency);

                await UPDATE('plugin_cds_caching_Statistics')
                    .set(updatedStats)
                    .where({ ID: hourlyId, cache: this.options.cache });
                this.log.info(`Updated existing hourly stats for cache ${this.options.cache}`);
            }

            // Similar logic for daily stats...
            // (keeping the existing daily stats logic for brevity)

            // Persist key access data if key tracking is enabled
            if (this.options.enableKeyTracking && this.stats.current.keyAccess.size > 0) {
                this.log.info(`Persisting ${this.stats.current.keyAccess.size} key access records for cache ${this.options.cache}`);
                
                for (const [key, keyStats] of this.stats.current.keyAccess) {
                    const keyId = `key:${this.options.cache}:${key}`;
                    
                    const existingKey = await SELECT.one.from("plugin_cds_caching_KeyAccesses")
                        .where({ ID: keyId, cache: this.options.cache, keyName: key });

                    if (!existingKey) {
                        await INSERT.into('plugin_cds_caching_KeyAccesses').entries([{
                            ID: keyId,
                            cache: this.options.cache,
                            keyName: key,
                            hits: keyStats.hits,
                            misses: keyStats.misses,
                            sets: keyStats.sets,
                            deletes: keyStats.deletes,
                            total: keyStats.hits + keyStats.misses + keyStats.sets + keyStats.deletes,
                            lastAccess: new Date(keyStats.lastAccess).toISOString(),
                            period: 'current',
                            dataType: keyStats.metadata.dataType,
                            serviceName: keyStats.metadata.serviceName,
                            entityName: keyStats.metadata.entityName,
                            operation: keyStats.metadata.operation,
                            metadata: keyStats.metadata.metadata
                        }]);
                    } else {
                        await UPDATE('plugin_cds_caching_KeyAccesses')
                            .set({
                                hits: existingKey.hits + keyStats.hits,
                                misses: existingKey.misses + keyStats.misses,
                                sets: existingKey.sets + keyStats.sets,
                                deletes: existingKey.deletes + keyStats.deletes,
                                total: existingKey.total + keyStats.hits + keyStats.misses + keyStats.sets + keyStats.deletes,
                                lastAccess: new Date(keyStats.lastAccess).toISOString()
                            })
                            .where({ ID: keyId, cache: this.options.cache, keyName: key });
                    }
                }
            }

            // Reset current stats after successful persistence
            this.resetCurrentStats();
            this.stats.lastPersisted = Date.now();
            
            this.log.info(`Successfully persisted stats for cache ${this.options.cache}`);
        } catch (error) {
            this.log.error(`Failed to persist stats for cache ${this.options.cache}:`, error);
        }
    }

    async calculateStats() {
        const latencies = this.stats.current.latencies;
        const hitLatencies = this.stats.current.hitLatencies;
        const missLatencies = this.stats.current.missLatencies;
        const setLatencies = this.stats.current.setLatencies;
        const deleteLatencies = this.stats.current.deleteLatencies;
        const totalRequests = this.stats.current.hits + this.stats.current.misses;
        const uptimeMs = Date.now() - this.stats.current.startTime;

        // Enhanced latency calculations for all operations
        const avgLatency = latencies.length > 0
            ? latencies.reduce((a, b) => a + b, 0) / latencies.length
            : 0;

        const avgHitLatency = hitLatencies.length > 0
            ? hitLatencies.reduce((a, b) => a + b, 0) / hitLatencies.length
            : 0;

        const avgMissLatency = missLatencies.length > 0
            ? missLatencies.reduce((a, b) => a + b, 0) / missLatencies.length
            : 0;

        const avgSetLatency = setLatencies.length > 0
            ? setLatencies.reduce((a, b) => a + b, 0) / setLatencies.length
            : 0;

        const avgDeleteLatency = deleteLatencies.length > 0
            ? deleteLatencies.reduce((a, b) => a + b, 0) / deleteLatencies.length
            : 0;

        let p95Latency = 0, p99Latency = 0, minLatency = 0, maxLatency = 0;
        let p95HitLatency = 0, p99HitLatency = 0, minHitLatency = 0, maxHitLatency = 0;
        let p95MissLatency = 0, p99MissLatency = 0, minMissLatency = 0, maxMissLatency = 0;

        if (latencies.length > 0) {
            const sortedLatencies = [...latencies].sort((a, b) => a - b);
            p95Latency = sortedLatencies[Math.floor(latencies.length * 0.95)];
            p99Latency = sortedLatencies[Math.floor(latencies.length * 0.99)];
            minLatency = sortedLatencies[0];
            maxLatency = sortedLatencies[sortedLatencies.length - 1];
        }

        if (hitLatencies.length > 0) {
            const sortedHitLatencies = [...hitLatencies].sort((a, b) => a - b);
            p95HitLatency = sortedHitLatencies[Math.floor(hitLatencies.length * 0.95)];
            p99HitLatency = sortedHitLatencies[Math.floor(hitLatencies.length * 0.99)];
            minHitLatency = sortedHitLatencies[0];
            maxHitLatency = sortedHitLatencies[sortedHitLatencies.length - 1];
        }

        if (missLatencies.length > 0) {
            const sortedMissLatencies = [...missLatencies].sort((a, b) => a - b);
            p95MissLatency = sortedMissLatencies[Math.floor(missLatencies.length * 0.95)];
            p99MissLatency = sortedMissLatencies[Math.floor(missLatencies.length * 0.99)];
            minMissLatency = sortedMissLatencies[0];
            maxMissLatency = sortedMissLatencies[sortedMissLatencies.length - 1];
        }

        // Cache efficiency metrics
        const cacheEfficiency = (hitLatencies.length > 0 && missLatencies.length > 0 && avgHitLatency > 0)
            ? avgMissLatency / avgHitLatency // How much faster hits are than misses
            : 0;

        return {
            hits: this.stats.current.hits,
            misses: this.stats.current.misses,
            sets: this.stats.current.sets,
            deletes: this.stats.current.deletes,
            errors: this.stats.current.errors,
            totalRequests,

            // Overall latency metrics
            avgLatency,
            p95Latency,
            p99Latency,
            minLatency,
            maxLatency,

            // Hit-specific latency metrics
            avgHitLatency,
            p95HitLatency,
            p99HitLatency,
            minHitLatency,
            maxHitLatency,

            // Miss-specific latency metrics
            avgMissLatency,
            p95MissLatency,
            p99MissLatency,
            minMissLatency,
            maxMissLatency,

            // Set/Delete latency metrics
            avgSetLatency,
            avgDeleteLatency,

            // Performance metrics
            memoryUsage: process.memoryUsage().heapUsed,
            itemCount: await this.options.getItemCount?.() || 0,
            hitRatio: totalRequests > 0 ? this.stats.current.hits / totalRequests : 0,
            throughput: uptimeMs > 0 ? (totalRequests / uptimeMs) * 1000 : 0, // requests per second
            errorRate: totalRequests > 0 ? this.stats.current.errors / totalRequests : 0,
            cacheEfficiency,
            uptimeMs
        };
    }

    getTopAccessedKeys(limit = 10) {
        const entries = Array.from(this.stats.current.keyAccess.entries());
        return entries
            .sort((a, b) => {
                const totalA = a[1].hits + a[1].misses + a[1].sets + a[1].deletes;
                const totalB = b[1].hits + b[1].misses + b[1].sets + b[1].deletes;
                return totalB - totalA;
            })
            .slice(0, limit)
            .map(([key, stats]) => ({
                key,
                hits: stats.hits,
                misses: stats.misses,
                sets: stats.sets,
                deletes: stats.deletes,
                total: stats.hits + stats.misses + stats.sets + stats.deletes,
                lastAccess: new Date(stats.lastAccess),
                dataType: stats.metadata.dataType,
                serviceName: stats.metadata.serviceName,
                entityName: stats.metadata.entityName,
                operation: stats.metadata.operation,
                metadata: stats.metadata.metadata
            }));
    }

    getColdKeys(limit = 10) {
        const entries = Array.from(this.stats.current.keyAccess.entries());
        return entries
            .sort((a, b) => a[1].lastAccess - b[1].lastAccess)
            .slice(0, limit)
            .map(([key, stats]) => ({
                key,
                hits: stats.hits,
                misses: stats.misses,
                sets: stats.sets,
                deletes: stats.deletes,
                total: stats.hits + stats.misses + stats.sets + stats.deletes,
                lastAccess: new Date(stats.lastAccess),
                dataType: stats.metadata.dataType,
                serviceName: stats.metadata.serviceName,
                entityName: stats.metadata.entityName,
                operation: stats.metadata.operation,
                metadata: stats.metadata.metadata
            }));
    }

    resetCurrentStats() {
        this.stats.current = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            latencies: [],
            hitLatencies: [],
            missLatencies: [],
            setLatencies: [],
            deleteLatencies: [],
            keyAccess: new Map(),
            startTime: Date.now(),
            lastReset: Date.now()
        };
        this.stats.lastPersisted = Date.now();
    }

    async getStats(period = 'hourly', from, to) {
        if (!this.options.enabled) return null;

        const query = SELECT.from("plugin_cds_caching_Statistics")
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
        const hitLatencies = current.hitLatencies;
        const missLatencies = current.missLatencies;
        const setLatencies = current.setLatencies;
        const deleteLatencies = current.deleteLatencies;
        const totalRequests = current.hits + current.misses;
        const uptimeMs = Date.now() - current.startTime;

        // Enhanced latency calculations for all operations
        const avgLatency = latencies.length > 0
            ? latencies.reduce((a, b) => a + b, 0) / latencies.length
            : 0;

        const avgHitLatency = hitLatencies.length > 0
            ? hitLatencies.reduce((a, b) => a + b, 0) / hitLatencies.length
            : 0;

        // Debug log for hit latencies
        this.log.info(`[DEBUG] getCurrentStats: avgHitLatency=${avgHitLatency}, hitLatencies=[${hitLatencies.join(', ')}]`);

        const avgMissLatency = missLatencies.length > 0
            ? missLatencies.reduce((a, b) => a + b, 0) / missLatencies.length
            : 0;

        const avgSetLatency = setLatencies.length > 0
            ? setLatencies.reduce((a, b) => a + b, 0) / setLatencies.length
            : 0;

        const avgDeleteLatency = deleteLatencies.length > 0
            ? deleteLatencies.reduce((a, b) => a + b, 0) / deleteLatencies.length
            : 0;

        let p95Latency = 0, p99Latency = 0, minLatency = 0, maxLatency = 0;
        let p95HitLatency = 0, p99HitLatency = 0, minHitLatency = 0, maxHitLatency = 0;
        let p95MissLatency = 0, p99MissLatency = 0, minMissLatency = 0, maxMissLatency = 0;

        if (latencies.length > 0) {
            const sortedLatencies = [...latencies].sort((a, b) => a - b);
            p95Latency = sortedLatencies[Math.floor(latencies.length * 0.95)];
            p99Latency = sortedLatencies[Math.floor(latencies.length * 0.99)];
            minLatency = sortedLatencies[0];
            maxLatency = sortedLatencies[sortedLatencies.length - 1];
        }

        if (hitLatencies.length > 0) {
            const sortedHitLatencies = [...hitLatencies].sort((a, b) => a - b);
            p95HitLatency = sortedHitLatencies[Math.floor(hitLatencies.length * 0.95)];
            p99HitLatency = sortedHitLatencies[Math.floor(hitLatencies.length * 0.99)];
            minHitLatency = sortedHitLatencies[0];
            maxHitLatency = sortedHitLatencies[sortedHitLatencies.length - 1];
        }

        if (missLatencies.length > 0) {
            const sortedMissLatencies = [...missLatencies].sort((a, b) => a - b);
            p95MissLatency = sortedMissLatencies[Math.floor(missLatencies.length * 0.95)];
            p99MissLatency = sortedMissLatencies[Math.floor(missLatencies.length * 0.99)];
            minMissLatency = sortedMissLatencies[0];
            maxMissLatency = sortedMissLatencies[sortedMissLatencies.length - 1];
        }

        // Cache efficiency metrics
        const cacheEfficiency = (hitLatencies.length > 0 && missLatencies.length > 0 && avgHitLatency > 0)
            ? avgMissLatency / avgHitLatency // How much faster hits are than misses
            : 0;

        return {
            hits: current.hits,
            misses: current.misses,
            sets: current.sets,
            deletes: current.deletes,
            errors: current.errors,

            // Overall latency metrics
            avgLatency,
            p95Latency,
            p99Latency,
            minLatency,
            maxLatency,

            // Hit-specific latency metrics
            avgHitLatency,
            p95HitLatency,
            p99HitLatency,
            minHitLatency,
            maxHitLatency,

            // Miss-specific latency metrics
            avgMissLatency,
            p95MissLatency,
            p99MissLatency,
            minMissLatency,
            maxMissLatency,

            // Set/Delete latency metrics
            avgSetLatency,
            avgDeleteLatency,

            // Performance metrics
            memoryUsage: process.memoryUsage().heapUsed,
            itemCount: await this.options.getItemCount?.() || 0,
            hitRatio: totalRequests > 0 ? current.hits / totalRequests : 0,
            throughput: uptimeMs > 0 ? (totalRequests / uptimeMs) * 1000 : 0,
            errorRate: totalRequests > 0 ? current.errors / totalRequests : 0,
            cacheEfficiency,
            uptimeMs
        };
    }

    dispose() {
        if (this.persistInterval) {
            clearInterval(this.persistInterval);
        }
    }

    /**
     * Manually trigger persistence (for testing and debugging)
     */
    async triggerPersistence() {
        this.log.info(`Manually triggering persistence for cache ${this.options.cache}, enabled: ${this.options.enabled}`);
        if (this.options.enabled) {
            await this.persistStats();
        } else {
            this.log.info(`Persistence skipped - statistics are disabled for cache ${this.options.cache}`);
        }
    }

    /**
     * Get current persistence interval status
     */
    getPersistenceStatus() {
        return {
            enabled: this.options.enabled,
            intervalExists: this.persistInterval !== null,
            lastPersisted: this.stats.lastPersisted,
            persistenceInterval: this.options.persistenceInterval
        };
    }

    /**
     * Delete persisted statistics from the database
     * @param {Object} options - Delete options
     * @param {string} options.cache - Cache name to delete stats for (optional, defaults to current cache)
     * @param {string} options.period - Period to delete ('hourly', 'daily', or 'all')
     * @param {Date|string} options.from - Start date for deletion range (optional)
     * @param {Date|string} options.to - End date for deletion range (optional)
     * @param {boolean} options.includeKeyAccess - Whether to also delete key access records (default: true)
     * @returns {Promise<Object>} - Deletion result with counts
     */
    async deletePersistedStats(options = {}) {
        if (!this.options.enabled) {
            this.log.info(`DeletePersistedStats called but statistics are disabled for cache ${this.options.cache}`);
            return { deletedStats: 0, deletedKeyAccess: 0 };
        }

        const cacheName = options.cache || this.options.cache;
        const period = options.period || 'all';
        const includeKeyAccess = options.includeKeyAccess !== false; // Default to true

        this.log.info(`Deleting persisted stats for cache ${cacheName}, period: ${period}`);

        try {
            let deletedStats = 0;
            let deletedKeyAccess = 0;

            // Build query for statistics deletion
            let statsQuery = DELETE.from("plugin_cds_caching_Statistics")
                .where({ cache: cacheName });

            // Add period filter if specified
            if (period !== 'all') {
                statsQuery.and({ period: period });
            }

            // Add date range filters if specified
            if (options.from) {
                const fromDate = options.from instanceof Date ? options.from.toISOString() : options.from;
                statsQuery.and({ timestamp: { '>=': fromDate } });
            }

            if (options.to) {
                const toDate = options.to instanceof Date ? options.to.toISOString() : options.to;
                statsQuery.and({ timestamp: { '<=': toDate } });
            }

            // Execute statistics deletion
            const statsResult = await statsQuery;
            deletedStats = statsResult.affectedRows || 0;

            // Delete key access records if requested
            if (includeKeyAccess) {
                let keyAccessQuery = DELETE.from("plugin_cds_caching_KeyAccesses")
                    .where({ cache: cacheName });

                // Add period filter if specified
                if (period !== 'all') {
                    keyAccessQuery.and({ period: period });
                }

                // Add date range filters if specified
                if (options.from) {
                    const fromDate = options.from instanceof Date ? options.from.toISOString() : options.from;
                    keyAccessQuery.and({ lastAccess: { '>=': fromDate } });
                }

                if (options.to) {
                    const toDate = options.to instanceof Date ? options.to.toISOString() : options.to;
                    keyAccessQuery.and({ lastAccess: { '<=': toDate } });
                }

                const keyAccessResult = await keyAccessQuery;
                deletedKeyAccess = keyAccessResult.affectedRows || 0;
            }

            this.log.info(`Successfully deleted ${deletedStats} statistics records and ${deletedKeyAccess} key access records for cache ${cacheName}`);

            return {
                deletedStats,
                deletedKeyAccess,
                totalDeleted: deletedStats + deletedKeyAccess
            };

        } catch (error) {
            this.log.error(`Failed to delete persisted stats for cache ${cacheName}:`, error);
            throw error;
        }
    }

    /**
     * Delete all persisted statistics for the current cache
     * @returns {Promise<Object>} - Deletion result
     */
    async deleteAllPersistedStats() {
        return this.deletePersistedStats({ period: 'all' });
    }

    /**
     * Delete hourly statistics for the current cache
     * @param {Date|string} from - Start date (optional)
     * @param {Date|string} to - End date (optional)
     * @returns {Promise<Object>} - Deletion result
     */
    async deleteHourlyStats(from, to) {
        return this.deletePersistedStats({ 
            period: 'hourly', 
            from, 
            to 
        });
    }

    /**
     * Delete daily statistics for the current cache
     * @param {Date|string} from - Start date (optional)
     * @param {Date|string} to - End date (optional)
     * @returns {Promise<Object>} - Deletion result
     */
    async deleteDailyStats(from, to) {
        return this.deletePersistedStats({ 
            period: 'daily', 
            from, 
            to 
        });
    }
}

module.exports = CacheStatisticsHandler; 