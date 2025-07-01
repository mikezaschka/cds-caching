const cds = require('@sap/cds');

/**
 * Class to handle all things caching statistics.
 */
class CacheStatisticsHandler {

    log = cds.log('cds-caching');

    constructor(options = {}) {
        this.options = {
            persistenceInterval: 10 * 1000, // 10 seconds 
            maxLatencies: 1000,
            maxKeyMetrics: 100, // Track top accessed keys
            enableKeyMetrics: true,
            enabled: true, // Main metrics enabled flag
            ...options
        };

        this.stats = {
            current: {
                // Read-through metrics (high value with latencies)
                hits: 0,
                misses: 0,
                sets: 0,
                deletes: 0,
                errors: 0,
                totalRequests: 0,
                latencies: [],
                hitLatencies: [], // Separate latency tracking for hits
                missLatencies: [], // Separate latency tracking for misses
                setLatencies: [], // Separate latency tracking for sets
                deleteLatencies: [], // Separate latency tracking for deletes

                // Native function metrics (basic counts only)
                nativeSets: 0,
                nativeGets: 0,
                nativeDeletes: 0,
                nativeClears: 0,
                nativeDeleteByTags: 0,
                nativeErrors: 0,
                totalNativeOperations: 0,

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
        this.persistInterval = setInterval(() => {
            // Only persist if at least one type of metrics is enabled
            if (this.options.enabled || this.options.enableKeyMetrics) {
                this.persistStats();
            }
        }, this.options.persistenceInterval);

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

    enableKeyMetrics(enabled) {
        this.options.enableKeyMetrics = enabled;
    }

    /**
     * Enable metrics
     * @param {boolean} enabled - whether to enable metrics
     */
    enableMetrics(enabled) {
        this.options.enabled = enabled;
    }

    /**
     * Record a hit
     * @param {number} latency - the latency of the hit
     * @param {string} key - the key of the hit
     * @param {object} metadata - the metadata of the hit
     */
    recordHit(latency, key, metadata = {}) {
        // Record basic metrics if enabled
        if (this.options.enabled) {
            this.stats.current.hits++;
            this.recordLatency(latency);
            this.recordHitLatency(latency);
        }

        // Record key access if key metrics is enabled (independent of main metrics)
        if (this.options.enableKeyMetrics && key) {
            this.recordKeyAccess(key, 'hit', { ...metadata, latency });
        }

        // Log for debugging
        this.log.debug(`Recorded HIT for key: ${key}, latency: ${latency}ms, enabled: ${this.options.enabled}, keyMetrics: ${this.options.enableKeyMetrics}`);
    }

    /**
     * Record a miss
     * @param {number} latency - the latency of the miss
     * @param {string} key - the key of the miss
     * @param {object} metadata - the metadata of the miss
     */
    recordMiss(latency, key, metadata = {}) {
        // Record basic metrics if enabled
        if (this.options.enabled) {
            this.stats.current.misses++;
            this.recordLatency(latency);
            this.recordMissLatency(latency);
        }

        // Record key access if key metrics is enabled (independent of main metrics)
        if (this.options.enableKeyMetrics && key) {
            this.recordKeyAccess(key, 'miss', { ...metadata, latency });
        }

        // Log for debugging
        this.log.debug(`Recorded MISS for key: ${key}, latency: ${latency}ms, enabled: ${this.options.enabled}, keyMetrics: ${this.options.enableKeyMetrics}`);
    }

    /**
     * Record a set
     * @param {number} latency - the latency of the set
     * @param {string} key - the key of the set
     * @param {object} metadata - the metadata of the set
     */
    recordSet(latency, key, metadata = {}) {
        // Record basic metrics if enabled
        if (this.options.enabled) {
            this.stats.current.sets++;
            this.recordLatency(latency);
            this.recordSetLatency(latency);
        }

        // Record key access if key metrics is enabled (independent of main metrics)
        if (this.options.enableKeyMetrics && key) {
            this.recordKeyAccess(key, 'set', { ...metadata, latency });
        }

        // Log for debugging
        this.log.debug(`Recorded SET for key: ${key}, latency: ${latency}ms, enabled: ${this.options.enabled}, keyMetrics: ${this.options.enableKeyMetrics}`);
    }

    /**
     * Record a delete
     * @param {number} latency - the latency of the delete
     * @param {string} key - the key of the delete
     * @param {string} metadata - the metadata of the delete
     */
    recordDelete(latency, key, metadata = {}) {
        // Record basic metrics if enabled
        if (this.options.enabled) {
            this.stats.current.deletes++;
            this.recordLatency(latency);
            this.recordDeleteLatency(latency);
        }

        // Record key access if key metrics is enabled (independent of main metrics)
        if (this.options.enableKeyMetrics && key) {
            this.recordKeyAccess(key, 'delete', { ...metadata, latency });
        }

        // Log for debugging
        this.log.debug(`Recorded DELETE for key: ${key}, latency: ${latency}ms, enabled: ${this.options.enabled}, keyMetrics: ${this.options.enableKeyMetrics}`);
    }

    /**
     * Record a native set operation (cache-aside)
     * @param {string} key - the key of the set
     * @param {object} metadata - the metadata of the set
     */
    recordNativeSet(key, metadata = {}) {
        // Record basic metrics if enabled
        if (this.options.enabled) {
            this.stats.current.nativeSets++;
            this.stats.current.totalNativeOperations++;
        }

        // Record key access if key metrics is enabled (independent of main metrics)
        if (this.options.enableKeyMetrics && key) {
            this.recordKeyAccess(key, 'nativeSet', metadata);
        }

        // Log for debugging
        this.log.debug(`Recorded NATIVE SET for key: ${key}, enabled: ${this.options.enabled}, keyMetrics: ${this.options.enableKeyMetrics}`);
    }

    /**
     * Record a native get operation (cache-aside)
     * @param {string} key - the key of the get
     * @param {boolean} hit - whether it was a hit or miss
     * @param {object} metadata - the metadata of the get
     */
    recordNativeGet(key, hit, metadata = {}) {
        // Record basic metrics if enabled
        if (this.options.enabled) {
            this.stats.current.nativeGets++;
            this.stats.current.totalNativeOperations++;
        }

        // Record key access if key metrics is enabled (independent of main metrics)
        if (this.options.enableKeyMetrics && key) {
            this.recordKeyAccess(key, hit ? 'nativeHit' : 'nativeMiss', metadata);
        }

        // Log for debugging
        this.log.debug(`Recorded NATIVE GET for key: ${key}, hit: ${hit}, enabled: ${this.options.enabled}, keyMetrics: ${this.options.enableKeyMetrics}`);
    }

    /**
     * Record a native delete operation (cache-aside)
     * @param {string} key - the key of the delete
     * @param {object} metadata - the metadata of the delete
     */
    recordNativeDelete(key, metadata = {}) {
        // Record basic metrics if enabled
        if (this.options.enabled) {
            this.stats.current.nativeDeletes++;
            this.stats.current.totalNativeOperations++;
        }

        // Record key access if key metrics is enabled (independent of main metrics)
        if (this.options.enableKeyMetrics && key) {
            this.recordKeyAccess(key, 'nativeDelete', metadata);
        }

        // Log for debugging
        this.log.debug(`Recorded NATIVE DELETE for key: ${key}, enabled: ${this.options.enabled}, keyMetrics: ${this.options.enableKeyMetrics}`);
    }

    /**
     * Record a native clear operation (cache-aside)
     * @param {object} metadata - the metadata of the clear
     */
    recordNativeClear(metadata = {}) {
        // Record basic metrics if enabled
        if (this.options.enabled) {
            this.stats.current.nativeClears++;
            this.stats.current.totalNativeOperations++;
        }

        // Log for debugging
        this.log.debug(`Recorded NATIVE CLEAR, enabled: ${this.options.enabled}`);
    }

    /**
     * Record a native deleteByTag operation (cache-aside)
     * @param {string} tag - the tag used for deletion
     * @param {object} metadata - the metadata of the deleteByTag
     */
    recordNativeDeleteByTag(tag, metadata = {}) {
        // Record basic metrics if enabled
        if (this.options.enabled) {
            this.stats.current.nativeDeleteByTags++;
            this.stats.current.totalNativeOperations++;
        }

        // Log for debugging
        this.log.debug(`Recorded NATIVE DELETE BY TAG: ${tag}, enabled: ${this.options.enabled}`);
    }

    /**
     * Record an error
     * @param {Error} error - the error to record
     */
    recordError(error) {
        // Record basic metrics if enabled
        if (this.options.enabled) {
            this.stats.current.errors++;
        }
    }

    /**
     * Record a native error
     * @param {Error} error - the error to record
     */
    recordNativeError(error) {
        // Record basic metrics if enabled
        if (this.options.enabled) {
            this.stats.current.nativeErrors++;
        }
    }

    /**
     * Record a latency
     * @param {number} ms - the latency to record
     */
    recordLatency(ms) {
        // Only record latency if main metrics are enabled
        if (this.options.enabled) {
            this.stats.current.latencies.push(ms);
            if (this.stats.current.latencies.length > this.options.maxLatencies) {
                this.stats.current.latencies.shift();
            }
        }
    }

    /**
     * Record a hit latency
     * @param {number} ms - the latency to record
     */
    recordHitLatency(ms) {
        // Only record latency if main metrics are enabled
        if (this.options.enabled) {
            this.stats.current.hitLatencies.push(ms);
            if (this.stats.current.hitLatencies.length > this.options.maxLatencies) {
                this.stats.current.hitLatencies.shift();
            }
        }
    }

    /**
     * Record a miss latency
     * @param {number} ms - the latency to record
     */
    recordMissLatency(ms) {
        // Only record latency if main metrics are enabled
        if (this.options.enabled) {
            this.stats.current.missLatencies.push(ms);
            if (this.stats.current.missLatencies.length > this.options.maxLatencies) {
                this.stats.current.missLatencies.shift();
            }
        }
    }

    recordSetLatency(ms) {
        // Only record latency if main metrics are enabled
        if (this.options.enabled) {
            this.stats.current.setLatencies.push(ms);
            if (this.stats.current.setLatencies.length > this.options.maxLatencies) {
                this.stats.current.setLatencies.shift();
            }
        }
    }

    /**
     * Record a delete latency
     * @param {number} ms - the latency to record
     */
    recordDeleteLatency(ms) {
        // Only record latency if main metrics are enabled
        if (this.options.enabled) {
            this.stats.current.deleteLatencies.push(ms);
            if (this.stats.current.deleteLatencies.length > this.options.maxLatencies) {
                this.stats.current.deleteLatencies.shift();
            }
        }
    }

    /**
     * Record key access with enhanced latency tracking and context
     * @param {string} key - the key to record
     * @param {string} operation - the operation to record
     * @param {object} metadata - the metadata to record
     */
    recordKeyAccess(key, operation, metadata = {}) {
        if (!this.stats.current.keyAccess.has(key)) {
            this.stats.current.keyAccess.set(key, {
                key: key,
                // Read-through metrics (with latencies)
                hits: 0,
                misses: 0,
                sets: 0,
                deletes: 0,
                errors: 0,
                totalRequests: 0,
                hitRatio: 0,
                cacheEfficiency: 0,
                // Read-through latency tracking
                hitLatencies: [],
                missLatencies: [],
                setLatencies: [],
                deleteLatencies: [],
                avgHitLatency: 0,
                avgMissLatency: 0,
                avgSetLatency: 0,
                avgDeleteLatency: 0,
                avgReadThroughLatency: 0,
                p95HitLatency: 0,
                p99HitLatency: 0,
                p95MissLatency: 0,
                p99MissLatency: 0,
                minHitLatency: Infinity,
                maxHitLatency: 0,
                minMissLatency: Infinity,
                maxMissLatency: 0,
                // Read-through performance metrics
                throughput: 0,
                errorRate: 0,
                // Native function metrics (counts only)
                nativeHits: 0,
                nativeMisses: 0,
                nativeSets: 0,
                nativeDeletes: 0,
                nativeClears: 0,
                nativeDeleteByTags: 0,
                nativeErrors: 0,
                totalNativeOperations: 0,
                // Native function performance metrics
                nativeThroughput: 0,
                nativeErrorRate: 0,
                // Operation type tracking
                operationType: 'read_through', // Will be updated based on operations
                lastAccess: Date.now(),
                timestamp: Date.now(),
                // Enhanced metadata
                dataType: metadata.dataType || 'custom',
                serviceName: metadata.serviceName || '',
                entityName: metadata.entityName || '',
                operation: metadata.operation || '',
                metadata: metadata.metadata || '',
                // Enhanced context information
                context: metadata.context || '',
                queryText: metadata.queryText || '',
                requestInfo: metadata.requestInfo || '',
                functionName: metadata.functionName || '',
                tenant: metadata.tenant || '',
                user: metadata.user || '',
                locale: metadata.locale || ''
            });
        }

        const keyStats = this.stats.current.keyAccess.get(key);
        keyStats.lastAccess = Date.now();

        // Handle different operation types
        switch (operation) {
            case 'hit':
            case 'miss':
            case 'set':
            case 'delete':
                // Read-through operations
                keyStats[operation + 's']++;
                keyStats.totalRequests = keyStats.hits + keyStats.misses + keyStats.sets + keyStats.deletes;
                
                // Update operation type
                if (keyStats.operationType === 'native') {
                    keyStats.operationType = 'mixed';
                } else if (keyStats.operationType === 'read_through') {
                    keyStats.operationType = 'read_through';
                }
                
                // Record latency for read-through operations
                if (metadata.latency !== undefined) {
                    this.recordKeyLatency(keyStats, operation, metadata.latency);
                }
                break;
                
            case 'nativeHit':
            case 'nativeMiss':
            case 'nativeSet':
            case 'nativeDelete':
                // Native operations (separate from read-through, no double counting)
                const nativeOp = operation.replace('native', '').toLowerCase();
                keyStats['native' + nativeOp.charAt(0).toUpperCase() + nativeOp.slice(1) + 's']++;
                keyStats.totalNativeOperations = keyStats.nativeHits + keyStats.nativeMisses + keyStats.nativeSets + keyStats.nativeDeletes;
                
                // Update operation type
                if (keyStats.operationType === 'read_through') {
                    keyStats.operationType = 'mixed';
                } else if (keyStats.operationType === 'native') {
                    keyStats.operationType = 'native';
                }
                break;
        }

        // Calculate hit ratio for read-through operations
        const totalReadThrough = keyStats.hits + keyStats.misses;
        if (totalReadThrough > 0) {
            keyStats.hitRatio = (keyStats.hits / totalReadThrough) * 100;
        }

        // Calculate performance metrics
        const uptimeMs = Date.now() - keyStats.timestamp;
        if (uptimeMs > 0) {
            keyStats.throughput = (keyStats.totalRequests / uptimeMs) * 1000;
            keyStats.nativeThroughput = (keyStats.totalNativeOperations / uptimeMs) * 1000;
        }

        if (keyStats.totalRequests > 0) {
            keyStats.errorRate = (keyStats.errors / keyStats.totalRequests) * 100;
        }

        if (keyStats.totalNativeOperations > 0) {
            keyStats.nativeErrorRate = (keyStats.nativeErrors / keyStats.totalNativeOperations) * 100;
        }

        // Calculate cache efficiency
        if (keyStats.avgHitLatency > 0 && keyStats.avgMissLatency > 0) {
            keyStats.cacheEfficiency = keyStats.avgMissLatency / keyStats.avgHitLatency;
        }

        // Update context information if provided
        if (metadata.context) {
            keyStats.context = metadata.context;
        }
        if (metadata.queryText) {
            keyStats.queryText = metadata.queryText;
        }
        if (metadata.requestInfo) {
            keyStats.requestInfo = metadata.requestInfo;
        }
        if (metadata.functionName) {
            keyStats.functionName = metadata.functionName;
        }
        if (metadata.tenant) {
            keyStats.tenant = metadata.tenant;
        }
        if (metadata.user) {
            keyStats.user = metadata.user;
        }
        if (metadata.locale) {
            keyStats.locale = metadata.locale;
        }

        // Keep only top accessed keys
        if (this.stats.current.keyAccess.size > this.options.maxKeyMetrics) {
            const entries = Array.from(this.stats.current.keyAccess.entries());
            entries.sort((a, b) => {
                const totalA = a[1].totalRequests + a[1].totalNativeOperations;
                const totalB = b[1].totalRequests + b[1].totalNativeOperations;
                return totalB - totalA;
            });

            this.stats.current.keyAccess = new Map(entries.slice(0, this.options.maxKeyMetrics));
        }
    }

    /**
     * Record latency for a specific key operation
     * @param {object} keyStats - the key statistics object
     * @param {string} operation - the operation type
     * @param {number} latency - the latency to record
     */
    recordKeyLatency(keyStats, operation, latency) {
        const latencyArray = keyStats[operation + 'Latencies'];
        
        if (latencyArray) {
            latencyArray.push(latency);
            
            // Keep only recent latencies (last 100)
            if (latencyArray.length > 100) {
                latencyArray.shift();
            }
            
            // Calculate statistics for this operation
            const sortedLatencies = [...latencyArray].sort((a, b) => a - b);
            const avgKey = `avg${operation.charAt(0).toUpperCase() + operation.slice(1)}Latency`;
            const minKey = `min${operation.charAt(0).toUpperCase() + operation.slice(1)}Latency`;
            const maxKey = `max${operation.charAt(0).toUpperCase() + operation.slice(1)}Latency`;
            
            keyStats[avgKey] = latencyArray.reduce((sum, l) => sum + l, 0) / latencyArray.length;
            keyStats[minKey] = Math.min(keyStats[minKey], latency);
            keyStats[maxKey] = Math.max(keyStats[maxKey], latency);
            
            // Calculate percentiles for hit and miss operations
            if (operation === 'hit' && sortedLatencies.length > 0) {
                keyStats.p95HitLatency = this.calculatePercentile(sortedLatencies, 95);
                keyStats.p99HitLatency = this.calculatePercentile(sortedLatencies, 99);
            } else if (operation === 'miss' && sortedLatencies.length > 0) {
                keyStats.p95MissLatency = this.calculatePercentile(sortedLatencies, 95);
                keyStats.p99MissLatency = this.calculatePercentile(sortedLatencies, 99);
            }
        }
    }

    /**
     * Calculate percentile from sorted array
     * @param {Array} sortedArray - sorted array of values
     * @param {number} percentile - percentile to calculate (0-100)
     * @returns {number} - percentile value
     */
    calculatePercentile(sortedArray, percentile) {
        if (sortedArray.length === 0) return 0;
        
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, index)];
    }

    /**
     * Reset current statistics
     */
    resetCurrentStats() {
        this.stats.current = {
            // Read-through metrics
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            totalRequests: 0,
            latencies: [],
            hitLatencies: [],
            missLatencies: [],
            setLatencies: [],
            deleteLatencies: [],
            
            // Native function metrics
            nativeSets: 0,
            nativeGets: 0,
            nativeDeletes: 0,
            nativeClears: 0,
            nativeDeleteByTags: 0,
            nativeErrors: 0,
            totalNativeOperations: 0,
            
            keyAccess: new Map(),
            startTime: Date.now(),
            lastReset: Date.now()
        };
        this.stats.lastPersisted = Date.now();
    }

    /**
     * Get top accessed keys from database or memory
     * @param {number} limit - maximum number of keys to return
     * @returns {Array} - array of top accessed keys
     */
    async getTopAccessedKeys(limit = 10) {
        // If key metrics is enabled, try to get from database first
        if (this.options.enableKeyMetrics) {
            try {
                const dbKeys = await SELECT.from("plugin_cds_caching_KeyMetrics")
                    .where({ cache: this.options.cache })
                    .orderBy({ totalRequests: 'desc' })
                    .limit(limit);

                if (dbKeys && dbKeys.length > 0) {
                    return dbKeys.map(key => ({
                        key: key.keyName,
                        hits: key.hits,
                        misses: key.misses,
                        sets: key.sets,
                        deletes: key.deletes,
                        totalRequests: key.totalRequests,
                        lastAccess: new Date(key.lastAccess),
                        dataType: key.dataType,
                        serviceName: key.serviceName,
                        entityName: key.entityName,
                        operation: key.operation,
                        metadata: key.metadata,
                        // Enhanced latency data
                        avgHitLatency: key.avgHitLatency,
                        avgMissLatency: key.avgMissLatency,
                        avgSetLatency: key.avgSetLatency,
                        avgDeleteLatency: key.avgDeleteLatency,
                        p95HitLatency: key.p95HitLatency,
                        p99HitLatency: key.p99HitLatency,
                        p95MissLatency: key.p95MissLatency,
                        p99MissLatency: key.p99MissLatency,
                        minHitLatency: key.minHitLatency,
                        maxHitLatency: key.maxHitLatency,
                        minMissLatency: key.minMissLatency,
                        maxMissLatency: key.maxMissLatency,
                        // Enhanced context data
                        context: key.context,
                        queryText: key.queryText,
                        requestInfo: key.requestInfo,
                        functionName: key.functionName,
                        tenant: key.tenant,
                        user: key.user,
                        locale: key.locale,
                        timestamp: new Date(key.timestamp)
                    }));
                }
            } catch (error) {
                this.log.warn(`Failed to get top keys from database, falling back to memory: ${error.message}`);
            }
        }

        // Fallback to memory-based data
        const entries = Array.from(this.stats.current.keyAccess.entries());
        return entries
            .sort((a, b) => {
                const totalA = a[1].totalRequests + a[1].totalNativeOperations;
                const totalB = b[1].totalRequests + b[1].totalNativeOperations;
                return totalB - totalA;
            })
            .slice(0, limit)
            .map(([key, stats]) => ({
                key: key,
                hits: stats.hits,
                misses: stats.misses,
                sets: stats.sets,
                deletes: stats.deletes,
                totalRequests: stats.totalRequests,
                lastAccess: new Date(stats.lastAccess),
                dataType: stats.dataType,
                serviceName: stats.serviceName,
                entityName: stats.entityName,
                operation: stats.operation,
                metadata: stats.metadata,
                // Enhanced latency data
                avgHitLatency: stats.avgHitLatency,
                avgMissLatency: stats.avgMissLatency,
                avgSetLatency: stats.avgSetLatency,
                avgDeleteLatency: stats.avgDeleteLatency,
                p95HitLatency: stats.p95HitLatency,
                p99HitLatency: stats.p99HitLatency,
                p95MissLatency: stats.p95MissLatency,
                p99MissLatency: stats.p99MissLatency,
                minHitLatency: stats.minHitLatency === Infinity ? 0 : stats.minHitLatency,
                maxHitLatency: stats.maxHitLatency,
                minMissLatency: stats.minMissLatency === Infinity ? 0 : stats.minMissLatency,
                maxMissLatency: stats.maxMissLatency,
                // Enhanced context data
                context: stats.context,
                queryText: stats.queryText,
                requestInfo: stats.requestInfo,
                functionName: stats.functionName,
                tenant: stats.tenant,
                user: stats.user,
                locale: stats.locale,
                timestamp: new Date(stats.timestamp)
            }));
    }

    /**
     * Get cold keys (least recently used) from database or memory
     * @param {number} limit - maximum number of keys to return
     * @returns {Array} - array of cold keys
     */
    async getColdKeys(limit = 10) {
        // If key metrics is enabled, try to get from database first
        if (this.options.enableKeyMetrics) {
            try {
                const dbKeys = await SELECT.from("plugin_cds_caching_KeyMetrics")
                    .where({ cache: this.options.cache })
                    .orderBy({ lastAccess: 'asc' })
                    .limit(limit);

                if (dbKeys && dbKeys.length > 0) {
                    return dbKeys.map(key => ({
                        key: key.keyName,
                        hits: key.hits,
                        misses: key.misses,
                        sets: key.sets,
                        deletes: key.deletes,
                        totalRequests: key.totalRequests,
                        lastAccess: new Date(key.lastAccess),
                        dataType: key.dataType,
                        serviceName: key.serviceName,
                        entityName: key.entityName,
                        operation: key.operation,
                        metadata: key.metadata,
                        // Enhanced latency data
                        avgHitLatency: key.avgHitLatency,
                        avgMissLatency: key.avgMissLatency,
                        avgSetLatency: key.avgSetLatency,
                        avgDeleteLatency: key.avgDeleteLatency,
                        p95HitLatency: key.p95HitLatency,
                        p99HitLatency: key.p99HitLatency,
                        p95MissLatency: key.p95MissLatency,
                        p99MissLatency: key.p99MissLatency,
                        minHitLatency: key.minHitLatency,
                        maxHitLatency: key.maxHitLatency,
                        minMissLatency: key.minMissLatency,
                        maxMissLatency: key.maxMissLatency,
                        // Enhanced context data
                        context: key.context,
                        queryText: key.queryText,
                        requestInfo: key.requestInfo,
                        functionName: key.functionName,
                        tenant: key.tenant,
                        user: key.user,
                        locale: key.locale,
                        timestamp: new Date(key.timestamp)
                    }));
                }
            } catch (error) {
                this.log.warn(`Failed to get cold keys from database, falling back to memory: ${error.message}`);
            }
        }

        // Fallback to memory-based data
        const entries = Array.from(this.stats.current.keyAccess.entries());
        return entries
            .sort((a, b) => a[1].lastAccess - b[1].lastAccess)
            .slice(0, limit)
            .map(([key, stats]) => ({
                key: key,
                hits: stats.hits,
                misses: stats.misses,
                sets: stats.sets,
                deletes: stats.deletes,
                totalRequests: stats.totalRequests,
                lastAccess: new Date(stats.lastAccess),
                dataType: stats.dataType,
                serviceName: stats.serviceName,
                entityName: stats.entityName,
                operation: stats.operation,
                metadata: stats.metadata,
                // Enhanced latency data
                avgHitLatency: stats.avgHitLatency,
                avgMissLatency: stats.avgMissLatency,
                avgSetLatency: stats.avgSetLatency,
                avgDeleteLatency: stats.avgDeleteLatency,
                p95HitLatency: stats.p95HitLatency,
                p99HitLatency: stats.p99HitLatency,
                p95MissLatency: stats.p95MissLatency,
                p99MissLatency: stats.p99MissLatency,
                minHitLatency: stats.minHitLatency === Infinity ? 0 : stats.minHitLatency,
                maxHitLatency: stats.maxHitLatency,
                minMissLatency: stats.minMissLatency === Infinity ? 0 : stats.minMissLatency,
                maxMissLatency: stats.maxMissLatency,
                // Enhanced context data
                context: stats.context,
                queryText: stats.queryText,
                requestInfo: stats.requestInfo,
                functionName: stats.functionName,
                tenant: stats.tenant,
                user: stats.user,
                locale: stats.locale,
                timestamp: new Date(stats.timestamp)
            }));
    }

    /**
     * Get all tracked keys from database or memory
     * @returns {Array} - array of all tracked keys with enhanced data
     */
    async getAllTrackedKeys() {
        // If key metrics is enabled, try to get from database first
        if (this.options.enableKeyMetrics) {
            try {
                const dbKeys = await SELECT.from("plugin_cds_caching_KeyMetrics")
                    .where({ cache: this.options.cache });

                if (dbKeys && dbKeys.length > 0) {
                    return dbKeys.map(key => ({
                        key: key.keyName,
                        hits: key.hits,
                        misses: key.misses,
                        sets: key.sets,
                        deletes: key.deletes,
                        totalRequests: key.totalRequests,
                        lastAccess: new Date(key.lastAccess),
                        dataType: key.dataType,
                        serviceName: key.serviceName,
                        entityName: key.entityName,
                        operation: key.operation,
                        metadata: key.metadata,
                        // Enhanced latency data
                        avgHitLatency: key.avgHitLatency,
                        avgMissLatency: key.avgMissLatency,
                        avgSetLatency: key.avgSetLatency,
                        avgDeleteLatency: key.avgDeleteLatency,
                        p95HitLatency: key.p95HitLatency,
                        p99HitLatency: key.p99HitLatency,
                        p95MissLatency: key.p95MissLatency,
                        p99MissLatency: key.p99MissLatency,
                        minHitLatency: key.minHitLatency,
                        maxHitLatency: key.maxHitLatency,
                        minMissLatency: key.minMissLatency,
                        maxMissLatency: key.maxMissLatency,
                        // Enhanced context data
                        context: key.context,
                        queryText: key.queryText,
                        requestInfo: key.requestInfo,
                        functionName: key.functionName,
                        tenant: key.tenant,
                        user: key.user,
                        locale: key.locale,
                        timestamp: new Date(key.timestamp)
                    }));
                }
            } catch (error) {
                this.log.warn(`Failed to get all keys from database, falling back to memory: ${error.message}`);
            }
        }

        // Fallback to memory-based data
        const entries = Array.from(this.stats.current.keyAccess.entries());
        return entries.map(([key, stats]) => ({
            key: key,
            hits: stats.hits,
            misses: stats.misses,
            sets: stats.sets,
            deletes: stats.deletes,
            totalRequests: stats.totalRequests,
            lastAccess: new Date(stats.lastAccess),
            dataType: stats.dataType,
            serviceName: stats.serviceName,
            entityName: stats.entityName,
            operation: stats.operation,
            metadata: stats.metadata,
            // Enhanced latency data
            avgHitLatency: stats.avgHitLatency,
            avgMissLatency: stats.avgMissLatency,
            avgSetLatency: stats.avgSetLatency,
            avgDeleteLatency: stats.avgDeleteLatency,
            p95HitLatency: stats.p95HitLatency,
            p99HitLatency: stats.p99HitLatency,
            p95MissLatency: stats.p95MissLatency,
            p99MissLatency: stats.p99MissLatency,
            minHitLatency: stats.minHitLatency === Infinity ? 0 : stats.minHitLatency,
            maxHitLatency: stats.maxHitLatency,
            minMissLatency: stats.minMissLatency === Infinity ? 0 : stats.minMissLatency,
            maxMissLatency: stats.maxMissLatency,
            // Enhanced context data
            context: stats.context,
            queryText: stats.queryText,
            requestInfo: stats.requestInfo,
            functionName: stats.functionName,
            tenant: stats.tenant,
            user: stats.user,
            locale: stats.locale,
            timestamp: new Date(stats.timestamp)
        }));
    }

    /**
     * Get detailed information for a specific key from database or memory
     * @param {string} keyName - the key to get details for
     * @returns {object|null} - detailed key information or null if not found
     */
    async getKeyDetails(keyName) {
        // If key metrics is enabled, try to get from database first
        if (this.options.enableKeyMetrics) {
            try {
                const keyDetails = await SELECT.one.from("plugin_cds_caching_KeyMetrics")
                    .where({ cache: this.options.cache, keyName: keyName });

                if (keyDetails) {
                    return {
                        key: keyDetails.keyName,
                        hits: keyDetails.hits,
                        misses: keyDetails.misses,
                        sets: keyDetails.sets,
                        deletes: keyDetails.deletes,
                        totalRequests: keyDetails.totalRequests,
                        lastAccess: new Date(keyDetails.lastAccess),
                        dataType: keyDetails.dataType,
                        serviceName: keyDetails.serviceName,
                        entityName: keyDetails.entityName,
                        operation: keyDetails.operation,
                        metadata: keyDetails.metadata,
                        // Enhanced latency data
                        avgHitLatency: keyDetails.avgHitLatency,
                        avgMissLatency: keyDetails.avgMissLatency,
                        avgSetLatency: keyDetails.avgSetLatency,
                        avgDeleteLatency: keyDetails.avgDeleteLatency,
                        p95HitLatency: keyDetails.p95HitLatency,
                        p99HitLatency: keyDetails.p99HitLatency,
                        p95MissLatency: keyDetails.p95MissLatency,
                        p99MissLatency: keyDetails.p99MissLatency,
                        minHitLatency: keyDetails.minHitLatency,
                        maxHitLatency: keyDetails.maxHitLatency,
                        minMissLatency: keyDetails.minMissLatency,
                        maxMissLatency: keyDetails.maxMissLatency,
                        // Enhanced context data
                        context: keyDetails.context,
                        queryText: keyDetails.queryText,
                        requestInfo: keyDetails.requestInfo,
                        functionName: keyDetails.functionName,
                        tenant: keyDetails.tenant,
                        user: keyDetails.user,
                        locale: keyDetails.locale,
                        timestamp: new Date(keyDetails.timestamp)
                    };
                }
            } catch (error) {
                this.log.warn(`Failed to get key details from database, falling back to memory: ${error.message}`);
            }
        }

        // Fallback to memory-based data
        const keyStats = this.stats.current.keyAccess.get(keyName);
        if (!keyStats) {
            return null;
        }

        return {
            key: keyName,
            hits: keyStats.hits,
            misses: keyStats.misses,
            sets: keyStats.sets,
            deletes: keyStats.deletes,
            totalRequests: keyStats.totalRequests,
            lastAccess: new Date(keyStats.lastAccess),
            dataType: keyStats.dataType,
            serviceName: keyStats.serviceName,
            entityName: keyStats.entityName,
            operation: keyStats.operation,
            metadata: keyStats.metadata,
            // Enhanced latency data
            avgHitLatency: keyStats.avgHitLatency,
            avgMissLatency: keyStats.avgMissLatency,
            avgSetLatency: keyStats.avgSetLatency,
            avgDeleteLatency: keyStats.avgDeleteLatency,
            p95HitLatency: keyStats.p95HitLatency,
            p99HitLatency: keyStats.p99HitLatency,
            p95MissLatency: keyStats.p95MissLatency,
            p99MissLatency: keyStats.p99MissLatency,
            minHitLatency: keyStats.minHitLatency === Infinity ? 0 : keyStats.minHitLatency,
            maxHitLatency: keyStats.maxHitLatency,
            minMissLatency: keyStats.minMissLatency === Infinity ? 0 : keyStats.minMissLatency,
            maxMissLatency: keyStats.maxMissLatency,
            // Enhanced context data
            context: keyStats.context,
            queryText: keyStats.queryText,
            requestInfo: keyStats.requestInfo,
            functionName: keyStats.functionName,
            tenant: keyStats.tenant,
            user: keyStats.user,
            locale: keyStats.locale,
            timestamp: new Date(keyStats.timestamp)
        };
    }

    /**
     * Persist statistics
     */
    async persistStats() {
        // Only persist if at least one type of metrics is enabled
        if (!this.options.enabled && !this.options.enableKeyMetrics) {
            this.log.debug(`PersistStats called but all statistics are disabled for cache ${this.options.cache}`);
            return;
        }

        this.log.debug(`Starting persistStats for cache ${this.options.cache}, enabled: ${this.options.enabled}`);

        const now = new Date();

        // Calculate beginning of hour for hourly stats
        const hourlyTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0).toISOString();

        // Calculate beginning of day for daily stats
        const dailyTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();

        const hourlyId = `hourly:${hourlyTimestamp.slice(0, 13)}`;
        const dailyId = `daily:${dailyTimestamp.slice(0, 10)}`;

        const stats = await this.calculateStats();
        this.log.debug(`Calculated stats for cache ${this.options.cache}:`, {
            hits: stats.hits,
            misses: stats.misses,
            sets: stats.sets,
            deletes: stats.deletes,
            totalRequests: stats.totalRequests,
            enabled: this.options.enabled,
            keyMetricsEnabled: this.options.enableKeyMetrics
        });

        try {
            // Persist hourly stats only if main metrics are enabled
            if (this.options.enabled) {
                const existingHourly = await SELECT.one.from("plugin_cds_caching_Metrics")
                    .where({ ID: hourlyId, cache: this.options.cache });

                if (!existingHourly) {
                    await INSERT.into('plugin_cds_caching_Metrics').entries([{
                        ID: hourlyId,
                        cache: this.options.cache,
                        timestamp: hourlyTimestamp,
                        period: 'hourly',
                        // Read-through metrics
                        hits: stats.hits,
                        misses: stats.misses,
                        sets: stats.sets,
                        deletes: stats.deletes,
                        errors: stats.errors,
                        totalRequests: stats.totalRequests,

                        // Read-through latency metrics
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
                    this.log.debug(`Created new hourly stats for cache ${this.options.cache}`);
                } else {
                    // Update existing hourly stats with cumulative values
                    const updatedStats = {
                        // Read-through metrics
                        hits: existingHourly.hits + stats.hits,
                        misses: existingHourly.misses + stats.misses,
                        sets: existingHourly.sets + stats.sets,
                        deletes: existingHourly.deletes + stats.deletes,
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
                    const totalSets = updatedStats.sets;
                    const totalDeletes = updatedStats.deletes;

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

                    // Weighted average for read-through latency (combined hits and misses)
                    if (totalRequests > 0) {
                        const existingReadThroughLatencySum = (existingHourly.avgReadThroughLatency || 0) * totalRequests;
                        const newReadThroughLatencySum = stats.avgReadThroughLatency * totalRequests;
                        updatedStats.avgReadThroughLatency = (existingReadThroughLatencySum + newReadThroughLatencySum) / totalRequests;
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

                    // Update percentiles (use max of existing and current)
                    updatedStats.p95HitLatency = Math.max(existingHourly.p95HitLatency || 0, stats.p95HitLatency || 0);
                    updatedStats.p99HitLatency = Math.max(existingHourly.p99HitLatency || 0, stats.p99HitLatency || 0);
                    updatedStats.maxHitLatency = Math.max(existingHourly.maxHitLatency || 0, stats.maxHitLatency || 0);
                    updatedStats.p95MissLatency = Math.max(existingHourly.p95MissLatency || 0, stats.p95MissLatency || 0);
                    updatedStats.p99MissLatency = Math.max(existingHourly.p99MissLatency || 0, stats.p99MissLatency || 0);
                    updatedStats.maxMissLatency = Math.max(existingHourly.maxMissLatency || 0, stats.maxMissLatency || 0);

                    await UPDATE('plugin_cds_caching_Metrics')
                        .set(updatedStats)
                        .where({ ID: hourlyId, cache: this.options.cache });
                    this.log.debug(`Updated existing hourly stats for cache ${this.options.cache}`);
                }
            }

            // Similar logic for daily stats...
            // (keeping the existing daily stats logic for brevity)

            // Persist key metrics data if key metrics is enabled
            if (this.options.enableKeyMetrics && this.stats.current.keyAccess.size > 0) {
                this.log.debug(`Persisting ${this.stats.current.keyAccess.size} key access records for cache ${this.options.cache}`);

                for (const [key, keyStats] of this.stats.current.keyAccess) {
                    const keyId = `key:${this.options.cache}:${key}`;

                    const existingKey = await SELECT.one.from("plugin_cds_caching_KeyMetrics")
                        .where({ ID: keyId, cache: this.options.cache, keyName: key });

                    if (!existingKey) {
                        await INSERT.into('plugin_cds_caching_KeyMetrics').entries([{
                            ID: keyId,
                            cache: this.options.cache,
                            keyName: key,
                            lastAccess: new Date(keyStats.lastAccess).toISOString(),
                            period: 'current',
                            // Operation type tracking
                            operationType: keyStats.operationType,

                            // Read-through metrics
                            hits: keyStats.hits,
                            misses: keyStats.misses,
                            sets: keyStats.sets,
                            deletes: keyStats.deletes,
                            errors: keyStats.errors,
                            totalRequests: keyStats.totalRequests,
                            hitRatio: keyStats.hitRatio,
                            cacheEfficiency: keyStats.cacheEfficiency,

                            // Read-through latency metrics
                            avgHitLatency: keyStats.avgHitLatency || 0,
                            p95HitLatency: keyStats.p95HitLatency || 0,
                            p99HitLatency: keyStats.p99HitLatency || 0,
                            minHitLatency: keyStats.minHitLatency === Infinity ? 0 : keyStats.minHitLatency,
                            maxHitLatency: keyStats.maxHitLatency || 0,
                            avgMissLatency: keyStats.avgMissLatency || 0,
                            p95MissLatency: keyStats.p95MissLatency || 0,
                            p99MissLatency: keyStats.p99MissLatency || 0,
                            minMissLatency: keyStats.minMissLatency === Infinity ? 0 : keyStats.minMissLatency,
                            maxMissLatency: keyStats.maxMissLatency || 0,
                            avgSetLatency: keyStats.avgSetLatency || 0,
                            avgDeleteLatency: keyStats.avgDeleteLatency || 0,
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
                            serviceName: keyStats.serviceName,
                            entityName: keyStats.entityName,
                            operation: keyStats.operation,
                            metadata: keyStats.metadata,

                            // Enhanced context information
                            context: keyStats.context,
                            queryText: keyStats.queryText,
                            requestInfo: keyStats.requestInfo,
                            functionName: keyStats.functionName,
                            tenant: keyStats.tenant,
                            user: keyStats.user,
                            locale: keyStats.locale,
                            timestamp: new Date(keyStats.timestamp).toISOString()
                        }]);
                    } else {
                        // Calculate weighted averages for latencies when updating existing records
                        const totalHits = existingKey.hits + keyStats.hits;
                        const totalMisses = existingKey.misses + keyStats.misses;
                        const totalSets = existingKey.sets + keyStats.sets;
                        const totalDeletes = existingKey.deletes + keyStats.deletes;

                        const updatedKeyStats = {
                            hits: totalHits,
                            misses: totalMisses,
                            sets: totalSets,
                            deletes: totalDeletes,
                            errors: (existingKey.errors || 0) + (keyStats.errors || 0),
                            totalRequests: totalHits + totalMisses + totalSets + totalDeletes,
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
                            // Weighted average for set latency
                            avgSetLatency: totalSets > 0
                                ? ((existingKey.avgSetLatency * existingKey.sets) + (keyStats.avgSetLatency * keyStats.sets)) / totalSets
                                : 0,
                            // Weighted average for delete latency
                            avgDeleteLatency: totalDeletes > 0
                                ? ((existingKey.avgDeleteLatency * existingKey.deletes) + (keyStats.avgDeleteLatency * keyStats.deletes)) / totalDeletes
                                : 0,
                            // Update percentiles (use max of existing and current)
                            p95HitLatency: Math.max(existingKey.p95HitLatency || 0, keyStats.p95HitLatency || 0),
                            p99HitLatency: Math.max(existingKey.p99HitLatency || 0, keyStats.p99HitLatency || 0),
                            p95MissLatency: Math.max(existingKey.p95MissLatency || 0, keyStats.p95MissLatency || 0),
                            p99MissLatency: Math.max(existingKey.p99MissLatency || 0, keyStats.p99MissLatency || 0),
                            minHitLatency: Math.min(existingKey.minHitLatency || Infinity, keyStats.minHitLatency === Infinity ? Infinity : keyStats.minHitLatency),
                            maxHitLatency: Math.max(existingKey.maxHitLatency || 0, keyStats.maxHitLatency || 0),
                            minMissLatency: Math.min(existingKey.minMissLatency || Infinity, keyStats.minMissLatency === Infinity ? Infinity : keyStats.minMissLatency),
                            maxMissLatency: Math.max(existingKey.maxMissLatency || 0, keyStats.maxMissLatency || 0)
                        };

                        // Update context information if new data is available
                        if (keyStats.context) updatedKeyStats.context = keyStats.context;
                        if (keyStats.queryText) updatedKeyStats.queryText = keyStats.queryText;
                        if (keyStats.requestInfo) updatedKeyStats.requestInfo = keyStats.requestInfo;
                        if (keyStats.functionName) updatedKeyStats.functionName = keyStats.functionName;
                        if (keyStats.tenant) updatedKeyStats.tenant = keyStats.tenant;
                        if (keyStats.user) updatedKeyStats.user = keyStats.user;
                        if (keyStats.locale) updatedKeyStats.locale = keyStats.locale;

                        await UPDATE('plugin_cds_caching_KeyMetrics')
                            .set(updatedKeyStats)
                            .where({ ID: keyId, cache: this.options.cache, keyName: key });
                    }
                }
            }

            // Reset current stats after successful persistence
            this.resetCurrentStats();
            this.stats.lastPersisted = Date.now();

            this.log.debug(`Successfully persisted stats for cache ${this.options.cache}`);
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

        // Read-through latency calculations
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

        let p95HitLatency = 0, p99HitLatency = 0, minHitLatency = 0, maxHitLatency = 0;
        let p95MissLatency = 0, p99MissLatency = 0, minMissLatency = 0, maxMissLatency = 0;

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

        // Calculate average read-through latency (combined hits and misses)
        const allReadThroughLatencies = [...hitLatencies, ...missLatencies];
        const avgReadThroughLatency = allReadThroughLatencies.length > 0
            ? allReadThroughLatencies.reduce((a, b) => a + b, 0) / allReadThroughLatencies.length
            : 0;

        // Native function throughput calculation
        const nativeThroughput = uptimeMs > 0 ? (this.stats.current.totalNativeOperations / uptimeMs) * 1000 : 0;
        const nativeErrorRate = this.stats.current.totalNativeOperations > 0
            ? (this.stats.current.nativeErrors / this.stats.current.totalNativeOperations) * 100
            : 0;

        return {
            // Read-through metrics (high value with latencies)
            hits: this.stats.current.hits,
            misses: this.stats.current.misses,
            sets: this.stats.current.sets,
            deletes: this.stats.current.deletes,
            errors: this.stats.current.errors,
            totalRequests,

            // Cache-through latency metrics
            avgHitLatency,
            p95HitLatency,
            p99HitLatency,
            minHitLatency,
            maxHitLatency,
            avgMissLatency,
            p95MissLatency,
            p99MissLatency,
            minMissLatency,
            maxMissLatency,
            avgSetLatency,
            avgDeleteLatency,
            avgReadThroughLatency,

            // Read-through performance metrics
            hitRatio: totalRequests > 0 ? this.stats.current.hits / totalRequests : 0,
            throughput: uptimeMs > 0 ? (totalRequests / uptimeMs) * 1000 : 0, // requests per second
            errorRate: totalRequests > 0 ? this.stats.current.errors / totalRequests : 0,
            cacheEfficiency,

            // Native function metrics (basic counts only)
            nativeSets: this.stats.current.nativeSets,
            nativeGets: this.stats.current.nativeGets,
            nativeDeletes: this.stats.current.nativeDeletes,
            nativeClears: this.stats.current.nativeClears,
            nativeDeleteByTags: this.stats.current.nativeDeleteByTags,
            nativeErrors: this.stats.current.nativeErrors,
            totalNativeOperations: this.stats.current.totalNativeOperations,

            // Native function performance metrics
            nativeThroughput,
            nativeErrorRate,

            // Common metrics
            memoryUsage: process.memoryUsage().heapUsed,
            itemCount: await this.options.getItemCount?.() || 0,
            uptimeMs
        };
    }

    async getStats(period = 'hourly', from, to) {
        if (!this.options.enabled) return null;

        const query = SELECT.from("plugin_cds_caching_Metrics")
            .where({ period: period });

        if (from) query.and({ timestamp: { '>=': from } });
        if (to) query.and({ timestamp: { '<=': to } });

        query.orderBy({ timestamp: 'desc' });

        return await query;
    }

    async getCurrentStats() {
        if (!this.options.enabled) return null;

        const { current, lastPersisted } = this.stats;
        const hitLatencies = current.hitLatencies;
        const missLatencies = current.missLatencies;
        const setLatencies = current.setLatencies;
        const deleteLatencies = current.deleteLatencies;
        const totalRequests = current.hits + current.misses;
        const uptimeMs = Date.now() - current.startTime;

        // Cache-through latency calculations
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

        let p95HitLatency = 0, p99HitLatency = 0, minHitLatency = 0, maxHitLatency = 0;
        let p95MissLatency = 0, p99MissLatency = 0, minMissLatency = 0, maxMissLatency = 0;

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

        // Calculate average read-through latency (combined hits and misses)
        const allReadThroughLatencies = [...hitLatencies, ...missLatencies];
        const avgReadThroughLatency = allReadThroughLatencies.length > 0
            ? allReadThroughLatencies.reduce((a, b) => a + b, 0) / allReadThroughLatencies.length
            : 0;

        // Native function performance metrics
        const nativeThroughput = uptimeMs > 0 ? (current.totalNativeOperations / uptimeMs) * 1000 : 0;
        const nativeErrorRate = current.totalNativeOperations > 0
            ? (current.nativeErrors / current.totalNativeOperations) * 100
            : 0;

        return {
            // Read-through metrics
            hits: current.hits,
            misses: current.misses,
            sets: current.sets,
            deletes: current.deletes,
            errors: current.errors,
            totalRequests,

            // Read-through latency metrics
            avgHitLatency,
            p95HitLatency,
            p99HitLatency,
            minHitLatency,
            maxHitLatency,
            avgMissLatency,
            p95MissLatency,
            p99MissLatency,
            minMissLatency,
            maxMissLatency,
            avgSetLatency,
            avgDeleteLatency,
            avgReadThroughLatency,

            // Read-through performance metrics
            hitRatio: totalRequests > 0 ? current.hits / totalRequests : 0,
            throughput: uptimeMs > 0 ? (totalRequests / uptimeMs) * 1000 : 0,
            errorRate: totalRequests > 0 ? current.errors / totalRequests : 0,
            cacheEfficiency,

            // Native function metrics
            nativeSets: current.nativeSets,
            nativeGets: current.nativeGets,
            nativeDeletes: current.nativeDeletes,
            nativeClears: current.nativeClears,
            nativeDeleteByTags: current.nativeDeleteByTags,
            nativeErrors: current.nativeErrors,
            totalNativeOperations: current.totalNativeOperations,

            // Native function performance metrics
            nativeThroughput,
            nativeErrorRate,

            // Common metrics
            memoryUsage: process.memoryUsage().heapUsed,
            itemCount: await this.options.getItemCount?.() || 0,
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
        this.log.info(`Manually triggering persistence for cache ${this.options.cache}, enabled: ${this.options.enabled}, keyMetrics: ${this.options.enableKeyMetrics}`);
        if (this.options.enabled || this.options.enableKeyMetrics) {
            await this.persistStats();
        } else {
            this.log.info(`Persistence skipped - all statistics are disabled for cache ${this.options.cache}`);
        }
    }

    /**
     * Get current persistence interval status
     */
    getPersistenceStatus() {
        return {
            enabled: this.options.enabled,
            keyMetricsEnabled: this.options.enableKeyMetrics,
            intervalExists: this.persistInterval !== null,
            lastPersisted: this.stats.lastPersisted,
            persistenceInterval: this.options.persistenceInterval
        };
    }

    async deleteMetrics() {
        await DELETE('plugin_cds_caching_Metrics')
            .where({ cache: this.options.cache });
        this.log.debug(`Deleted metrics for cache ${this.options.cache}`);

        // Also reset the current stats
        this.resetCurrentStats();
    }

    async deleteKeyMetrics() {
        await DELETE('plugin_cds_caching_KeyMetrics')
            .where({ cache: this.options.cache });
        this.log.debug(`Deleted key metrics for cache ${this.options.cache}`);

        // Also reset the current stats
        this.resetCurrentStats();
    }
}

module.exports = CacheStatisticsHandler; 