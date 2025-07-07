const cds = require('@sap/cds');
const StatisticsPersistenceManager = require('./StatisticsPersistenceManager');
const { query } = require('@sap/cds/lib/env/defaults');

/**
 * Class to handle all things caching statistics.
 */
class CacheStatisticsHandler {

    log = cds.log('cds-caching');

    constructor(options = {}) {
        this.options = {
            persistenceInterval: 10 * 1000, // 10 seconds 
            maxLatencies: 2000,
            maxKeyMetrics: 1000, // Track top accessed keys
            keyMetricsEnabled: false,
            metricsEnabled: false, // Main metrics enabled flag
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

        // Initialize persistence manager
        this.persistenceManager = new StatisticsPersistenceManager(this.options.cache, this.log);

        // Always set up persistence interval, but control execution based on metricsEnabled flag
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
        this.persistInterval = setInterval(async () => {
            // Only persist if at least one type of metrics is enabled
            if (this.options.metricsEnabled || this.options.keyMetricsEnabled) {
                await this.persistMetrics();
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
        this.options.keyMetricsEnabled = enabled;
    }


    enableMetrics(enabled) {
        this.options.metricsEnabled = enabled;
    }

    /**
     * Record a hit
     * @param {number} latency - the latency of the hit
     * @param {string} key - the key of the hit
     * @param {object} metadata - the metadata of the hit
     */
    recordHit(latency, key, metadata = {}) {
        // Record basic metrics if enabled
        if (this.options.metricsEnabled) {
            this.stats.current.hits++;
            this.recordLatency(latency);
            this.recordHitLatency(latency);
        }

        // Record key access if key metrics is enabled (independent of main metrics)
        if (this.options.keyMetricsEnabled && key) {
            this.recordKeyAccess(key, 'hit', { ...metadata, latency });
        }

        // Log for debugging
        this.log.debug(`Recorded HIT for key: ${key}, latency: ${latency}ms, enabled: ${this.options.metricsEnabled}, keyMetrics: ${this.options.keyMetricsEnabled}`);
    }

    /**
     * Record a miss
     * @param {number} latency - the latency of the miss
     * @param {string} key - the key of the miss
     * @param {object} metadata - the metadata of the miss
     */
    recordMiss(latency, key, metadata = {}) {
        // Record basic metrics if enabled
        if (this.options.metricsEnabled) {
            this.stats.current.misses++;
            this.recordLatency(latency);
            this.recordMissLatency(latency);
        }

        // Record key access if key metrics is enabled (independent of main metrics)
        if (this.options.keyMetricsEnabled && key) {
            this.recordKeyAccess(key, 'miss', { ...metadata, latency });
        }

        // Log for debugging
        this.log.debug(`Recorded MISS for key: ${key}, latency: ${latency}ms, enabled: ${this.options.metricsEnabled}, keyMetrics: ${this.options.keyMetricsEnabled}`);
    }

    /**
     * Record a set
     * @param {number} latency - the latency of the set
     * @param {string} key - the key of the set
     * @param {object} metadata - the metadata of the set
     */
    recordSet(latency, key, metadata = {}) {
        // Record basic metrics if enabled
        if (this.options.metricsEnabled) {
            this.stats.current.sets++;
            this.recordLatency(latency);
            this.recordSetLatency(latency);
        }

        // Record key access if key metrics is enabled (independent of main metrics)
        if (this.options.keyMetricsEnabled && key) {
            this.recordKeyAccess(key, 'set', { ...metadata, latency });
        }

        // Log for debugging
        this.log.debug(`Recorded SET for key: ${key}, latency: ${latency}ms, enabled: ${this.options.metricsEnabled}, keyMetrics: ${this.options.keyMetricsEnabled}`);
    }

    /**
     * Record a delete
     * @param {number} latency - the latency of the delete
     * @param {string} key - the key of the delete
     * @param {string} metadata - the metadata of the delete
     */
    recordDelete(latency, key, metadata = {}) {
        // Record basic metrics if enabled
        if (this.options.metricsEnabled) {
            this.stats.current.deletes++;
            this.recordLatency(latency);
            this.recordDeleteLatency(latency);
        }

        // Record key access if key metrics is enabled (independent of main metrics)
        if (this.options.keyMetricsEnabled && key) {
            this.recordKeyAccess(key, 'delete', { ...metadata, latency });
        }

        // Log for debugging
        this.log.debug(`Recorded DELETE for key: ${key}, latency: ${latency}ms, enabled: ${this.options.metricsEnabled}, keyMetrics: ${this.options.keyMetricsEnabled}`);
    }

    /**
     * Record a native set operation (cache-aside)
     * @param {string} key - the key of the set
     * @param {object} metadata - the metadata of the set
     */
    recordNativeSet(key, metadata = {}) {
        this.log.debug(`recordNativeSet called with key: ${key}, enabled: ${this.options.metricsEnabled}, keyMetrics: ${this.options.keyMetricsEnabled}`);
        
        // Record basic metrics if enabled
        if (this.options.metricsEnabled) {
            this.stats.current.nativeSets++;
            this.stats.current.totalNativeOperations++;
        }

        // Record key access if key metrics is enabled (independent of main metrics)
        if (this.options.keyMetricsEnabled && key) {
            this.recordKeyAccess(key, 'nativeSet', metadata);
        }

        // Log for debugging
        this.log.debug(`Recorded NATIVE SET for key: ${key}, enabled: ${this.options.metricsEnabled}, keyMetrics: ${this.options.keyMetricsEnabled}`);
    }

    /**
     * Record a native get operation (cache-aside)
     * @param {string} key - the key of the get
     * @param {boolean} hit - whether it was a hit or miss
     * @param {object} metadata - the metadata of the get
     */
    recordNativeGet(key, hit, metadata = {}) {
        this.log.debug(`recordNativeGet called with key: ${key}, hit: ${hit}, enabled: ${this.options.metricsEnabled}, keyMetrics: ${this.options.keyMetricsEnabled}`);
        
        // Record basic metrics if enabled
        if (this.options.metricsEnabled) {
            this.stats.current.nativeGets++;
            this.stats.current.totalNativeOperations++;
        }

        // Record key access if key metrics is enabled (independent of main metrics)
        if (this.options.keyMetricsEnabled && key) {
            this.recordKeyAccess(key, hit ? 'nativeHit' : 'nativeMiss', metadata);
        }

        // Log for debugging
        this.log.debug(`Recorded NATIVE GET for key: ${key}, hit: ${hit}, enabled: ${this.options.metricsEnabled}, keyMetrics: ${this.options.keyMetricsEnabled}`);
    }

    /**
     * Record a native delete operation (cache-aside)
     * @param {string} key - the key of the delete
     * @param {object} metadata - the metadata of the delete
     */
    recordNativeDelete(key, metadata = {}) {
        this.log.debug(`recordNativeDelete called with key: ${key}, enabled: ${this.options.metricsEnabled}, keyMetrics: ${this.options.keyMetricsEnabled}`);
        
        // Record basic metrics if enabled
        if (this.options.metricsEnabled) {
            this.stats.current.nativeDeletes++;
            this.stats.current.totalNativeOperations++;
        }

        // Record key access if key metrics is enabled (independent of main metrics)
        if (this.options.keyMetricsEnabled && key) {
            this.recordKeyAccess(key, 'nativeDelete', metadata);
        }

        // Log for debugging
        this.log.debug(`Recorded NATIVE DELETE for key: ${key}, enabled: ${this.options.metricsEnabled}, keyMetrics: ${this.options.keyMetricsEnabled}`);
    }

    /**
     * Record a native clear operation (cache-aside)
     * @param {object} metadata - the metadata of the clear
     */
    recordNativeClear(metadata = {}) {
        // Record basic metrics if enabled
        if (this.options.metricsEnabled) {
            this.stats.current.nativeClears++;
            this.stats.current.totalNativeOperations++;
        }

        // Log for debugging
        this.log.debug(`Recorded NATIVE CLEAR, enabled: ${this.options.metricsEnabled}`);
    }

    /**
     * Record a native deleteByTag operation (cache-aside)
     * @param {string} tag - the tag used for deletion
     * @param {object} metadata - the metadata of the deleteByTag
     */
    recordNativeDeleteByTag(tag, metadata = {}) {
        // Record basic metrics if enabled
        if (this.options.metricsEnabled) {
            this.stats.current.nativeDeleteByTags++;
            this.stats.current.totalNativeOperations++;
        }

        // Log for debugging
        this.log.debug(`Recorded NATIVE DELETE BY TAG: ${tag}, enabled: ${this.options.metricsEnabled}`);
    }

    /**
     * Record an error
     * @param {Error} error - the error to record
     */
    recordError(error) {
        // Record basic metrics if enabled
        if (this.options.metricsEnabled) {
            this.stats.current.errors++;
        }
    }

    /**
     * Record a native error
     * @param {Error} error - the error to record
     */
    recordNativeError(error) {
        // Record basic metrics if enabled
        if (this.options.metricsEnabled) {
            this.stats.current.nativeErrors++;
        }
    }

    /**
     * Record a latency
     * @param {number} ms - the latency to record
     */
    recordLatency(ms) {
        // Only record latency if main metrics are enabled
        if (this.options.metricsEnabled) {
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
        if (this.options.metricsEnabled) {
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
        if (this.options.metricsEnabled) {
            this.stats.current.missLatencies.push(ms);
            if (this.stats.current.missLatencies.length > this.options.maxLatencies) {
                this.stats.current.missLatencies.shift();
            }
        }
    }

    recordSetLatency(ms) {
        // Only record latency if main metrics are enabled
        if (this.options.metricsEnabled) {
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
        if (this.options.metricsEnabled) {
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
        this.log.debug(`recordKeyAccess called with key: ${key}, operation: ${operation}, enabled: ${this.options.keyMetricsEnabled}`);
        
        if (!key) {
            this.log.warn('recordKeyAccess called with null/undefined key');
            return;
        }

        if (!this.stats.current.keyAccess.has(key)) {
            this.log.debug(`Creating new key stats for: ${key}`);
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
                avgReadThroughLatency: 0,
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
                operationType: metadata.operationType || 'UNKNOWN',
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
                query: metadata.query || '',
                subject: metadata.subject || '',
                target: metadata.target || '',
                tenant: metadata.tenant || '',
                user: metadata.user || '',
                locale: metadata.locale || '',
                cacheOptions: metadata.cacheOptions || ''
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
                const pluralMap = { hit: 'hits', miss: 'misses', set: 'sets', delete: 'deletes' };
                const prop = pluralMap[operation];
                if (prop) keyStats[prop]++;
                // Recalculate totalRequests to ensure accuracy
                keyStats.totalRequests = keyStats.hits + keyStats.misses;
                
                this.log.debug(`Read-through operation ${operation} for key ${key}: ${prop}=${keyStats[prop]}, totalRequests=${keyStats.totalRequests}`);
                
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
                // Use a more robust approach to avoid string manipulation issues
                let nativeProperty;
                switch (operation) {
                    case 'nativeHit':
                        nativeProperty = 'nativeHits';
                        break;
                    case 'nativeMiss':
                        nativeProperty = 'nativeMisses';
                        break;
                    case 'nativeSet':
                        nativeProperty = 'nativeSets';
                        break;
                    case 'nativeDelete':
                        nativeProperty = 'nativeDeletes';
                        break;
                    default:
                        this.log.warn(`Unknown native operation: ${operation}`);
                        return;
                }
                
                keyStats[nativeProperty]++;
                // Recalculate totalNativeOperations to ensure accuracy
                keyStats.totalNativeOperations = keyStats.nativeHits + keyStats.nativeMisses + keyStats.nativeSets + keyStats.nativeDeletes;
                
                this.log.debug(`Native operation ${operation} for key ${key}: ${nativeProperty}=${keyStats[nativeProperty]}, totalNativeOperations=${keyStats.totalNativeOperations}`);
              
                break;
                
            default:
                this.log.warn(`Unknown operation type: ${operation}`);
                return;
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
        if (metadata.query) {
            keyStats.query = metadata.query;
        }
        if (metadata.subject) {
            keyStats.subject = metadata.subject;
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
        if (metadata.target) {
            keyStats.target = metadata.target;
        }
        if (metadata.cacheOptions) {
            keyStats.cacheOptions = metadata.cacheOptions;
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
            
            // No percentiles needed - just min/max tracking
        }
    }



    /**
     * Reset current statistics
     */
    resetCurrentStats() {
        this.stats.current = {
            // Read-through metrics (hits and misses only)
            hits: 0,
            misses: 0,
            errors: 0,
            totalRequests: 0,
            latencies: [],
            hitLatencies: [],
            missLatencies: [],
            
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
     * Get all tracked keys from database or memory
     * @returns {Array} - array of all tracked keys with enhanced data
     */
    async getAllTrackedKeys() {
        // If key metrics is enabled, try to get from database first
        if (this.options.keyMetricsEnabled) {
            try {
                const dbKeys = await SELECT.from("plugin_cds_caching_KeyMetrics")
                    .where({ cache: this.options.cache });

                if (dbKeys && dbKeys.length > 0) {
                    return dbKeys.map(key => ({
                        key: key.keyName,
                        hits: key.hits,
                        misses: key.misses,
                        totalRequests: key.totalRequests,
                        lastAccess: new Date(key.lastAccess),
                        dataType: key.dataType,
                        operation: key.operation,
                        metadata: key.metadata,
                        // Enhanced latency data
                        avgHitLatency: key.avgHitLatency,
                        avgMissLatency: key.avgMissLatency,
                        minHitLatency: key.minHitLatency,
                        maxHitLatency: key.maxHitLatency,
                        minMissLatency: key.minMissLatency,
                        maxMissLatency: key.maxMissLatency,
                        // Enhanced context data
                        context: key.context,
                        query: key.query,
                        subject: key.subject,
                        target: key.target,
                        tenant: key.tenant,
                        user: key.user,
                        locale: key.locale,
                        timestamp: new Date(key.timestamp),
                        cacheOptions: key.cacheOptions
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
            totalRequests: stats.totalRequests,
            lastAccess: new Date(stats.lastAccess),
            dataType: stats.dataType,
            operation: stats.operation,
            metadata: stats.metadata,
            // Enhanced latency data
            avgHitLatency: stats.avgHitLatency,
            avgMissLatency: stats.avgMissLatency,
            minHitLatency: stats.minHitLatency === Infinity ? 0 : stats.minHitLatency,
            maxHitLatency: stats.maxHitLatency,
            minMissLatency: stats.minMissLatency === Infinity ? 0 : stats.minMissLatency,
            maxMissLatency: stats.maxMissLatency,
            // Enhanced context data
            context: stats.context,
            query: stats.query,
            subject: stats.subject,
            target: stats.target,
            tenant: stats.tenant,
            user: stats.user,
            locale: stats.locale,
            timestamp: new Date(stats.timestamp),
            cacheOptions: stats.cacheOptions
        }));
    }

    /**
     * Get detailed information for a specific key from database or memory
     * @param {string} keyName - the key to get details for
     * @returns {object|null} - detailed key information or null if not found
     */
    async getKeyDetails(keyName) {
        // If key metrics is enabled, try to get from database first
        if (this.options.keyMetricsEnabled) {
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
                        operation: keyDetails.operation,
                        metadata: keyDetails.metadata,
                        // Enhanced latency data
                        avgHitLatency: keyDetails.avgHitLatency,
                        avgMissLatency: keyDetails.avgMissLatency,
                        minHitLatency: keyDetails.minHitLatency,
                        maxHitLatency: keyDetails.maxHitLatency,
                        minMissLatency: keyDetails.minMissLatency,
                        maxMissLatency: keyDetails.maxMissLatency,
                        // Enhanced context data
                        context: keyDetails.context,
                        query: keyDetails.query,
                        subject: keyDetails.subject,
                        target: keyDetails.target,
                        tenant: keyDetails.tenant,
                        user: keyDetails.user,
                        locale: keyDetails.locale,
                        timestamp: new Date(keyDetails.timestamp),
                        cacheOptions: keyDetails.cacheOptions
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
            totalRequests: keyStats.totalRequests,
            lastAccess: new Date(keyStats.lastAccess),
            dataType: keyStats.dataType,
            operation: keyStats.operation,
            metadata: keyStats.metadata,
            // Enhanced latency data
            avgHitLatency: keyStats.avgHitLatency,
            avgMissLatency: keyStats.avgMissLatency,
            minHitLatency: keyStats.minHitLatency === Infinity ? 0 : keyStats.minHitLatency,
            maxHitLatency: keyStats.maxHitLatency,
            minMissLatency: keyStats.minMissLatency === Infinity ? 0 : keyStats.minMissLatency,
            maxMissLatency: keyStats.maxMissLatency,
            // Enhanced context data
            context: keyStats.context,
            query: keyStats.query,
            subject: keyStats.subject,
            target: keyStats.target,
            tenant: keyStats.tenant,
            user: keyStats.user,
            locale: keyStats.locale,
            timestamp: new Date(keyStats.timestamp),
            cacheOptions: keyStats.cacheOptions
        };
    }

    /**
     * Persist statistics
     */
    async persistMetrics() {
        // Only persist if at least one type of metrics is enabled
        if (!this.options.metricsEnabled && !this.options.keyMetricsEnabled) {
            this.log.debug(`PersistStats called but all statistics are disabled for cache ${this.options.cache}`);
            return;
        }

        this.log.debug(`Starting persistStats for cache ${this.options.cache}, enabled: ${this.options.metricsEnabled}`);

        const now = new Date();

        // Calculate beginning of hour for hourly stats
        const hourlyTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0).toISOString();

        // Calculate beginning of day for daily stats
        const dailyTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();

        const hourlyId = `hourly:${hourlyTimestamp.slice(0, 13)}`;
        const dailyId = `daily:${dailyTimestamp.slice(0, 10)}`;

        const stats = await this.calculateStats();
        this.log.debug(`Calculated stats for cache ${this.options.cache}:`);

        try {
            // Use persistence manager to handle database operations
            await this.persistenceManager.persistHourlyStats(stats, hourlyId, hourlyTimestamp, this.options.metricsEnabled);
            await this.persistenceManager.persistKeyMetrics(this.stats.current.keyAccess, this.options.keyMetricsEnabled);

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
        const totalRequests = this.stats.current.hits + this.stats.current.misses;
        const uptimeMs = Date.now() - this.stats.current.startTime;

        // Read-through latency calculations
        const avgHitLatency = hitLatencies.length > 0
            ? hitLatencies.reduce((a, b) => a + b, 0) / hitLatencies.length
            : 0;

        const avgMissLatency = missLatencies.length > 0
            ? missLatencies.reduce((a, b) => a + b, 0) / missLatencies.length
            : 0;

        let minHitLatency = 0, maxHitLatency = 0;
        let minMissLatency = 0, maxMissLatency = 0;

        if (hitLatencies.length > 0) {
            const sortedHitLatencies = [...hitLatencies].sort((a, b) => a - b);
            minHitLatency = sortedHitLatencies[0];
            maxHitLatency = sortedHitLatencies[sortedHitLatencies.length - 1];
        }

        if (missLatencies.length > 0) {
            const sortedMissLatencies = [...missLatencies].sort((a, b) => a - b);
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
            // Read-through metrics (hits and misses only)
            hits: this.stats.current.hits,
            misses: this.stats.current.misses,
            errors: this.stats.current.errors,
            totalRequests,

            // Read-through latency metrics (hits and misses only)
            avgHitLatency,
            minHitLatency,
            maxHitLatency,
            avgMissLatency,
            minMissLatency,
            maxMissLatency,
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

    async getMetrics(period = 'hourly', from, to) {
        if (!this.options.metricsEnabled) return null;

        const query = SELECT.from("plugin_cds_caching_Metrics")
            .where({ period: period });

        if (from) query.and({ timestamp: { '>=': from.toISOString() } });
        if (to) query.and({ timestamp: { '<=': to.toISOString() } });

        query.orderBy({ timestamp: 'desc' });

        return await query;
    }

    async getKeyMetrics(key, from, to) {
        if (!this.options.keyMetricsEnabled) return null;
        const query = SELECT.from("plugin_cds_caching_KeyMetrics")
            .where({ cache: this.options.cache, keyName: key });

        if (from) query.and({ timestamp: { '>=': from.toISOString() } });
        if (to) query.and({ timestamp: { '<=': to.toISOString() } });

        query.orderBy({ timestamp: 'desc' });

        return await query;
    }   

    async getCurrentKeyMetrics() {
        if (!this.options.keyMetricsEnabled) return null;
        return this.stats.current.keyAccess;
    }

    async getCurrentStats() {
        if (!this.options.metricsEnabled) return null;

        const { current, lastPersisted } = this.stats;
        const hitLatencies = current.hitLatencies;
        const missLatencies = current.missLatencies;
        const totalRequests = current.hits + current.misses;
        const uptimeMs = Date.now() - current.startTime;

        // Cache-through latency calculations
        const avgHitLatency = hitLatencies.length > 0
            ? hitLatencies.reduce((a, b) => a + b, 0) / hitLatencies.length
            : 0;

        const avgMissLatency = missLatencies.length > 0
            ? missLatencies.reduce((a, b) => a + b, 0) / missLatencies.length
            : 0;

        let minHitLatency = 0, maxHitLatency = 0;
        let minMissLatency = 0, maxMissLatency = 0;

        if (hitLatencies.length > 0) {
            const sortedHitLatencies = [...hitLatencies].sort((a, b) => a - b);
            minHitLatency = sortedHitLatencies[0];
            maxHitLatency = sortedHitLatencies[sortedHitLatencies.length - 1];
        }

        if (missLatencies.length > 0) {
            const sortedMissLatencies = [...missLatencies].sort((a, b) => a - b);
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
            // Read-through metrics (hits and misses only - sets/deletes are redundant)
            hits: current.hits,
            misses: current.misses,
            errors: current.errors,
            totalRequests,

            // Read-through latency metrics (hits and misses only)
            avgHitLatency,
            minHitLatency,
            maxHitLatency,
            avgMissLatency,
            minMissLatency,
            maxMissLatency,
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
        this.log.info(`Manually triggering persistence for cache ${this.options.cache}, enabled: ${this.options.metricsEnabled}, keyMetrics: ${this.options.keyMetricsEnabled}`);
        if (this.options.metricsEnabled || this.options.keyMetricsEnabled) {
            await this.persistMetrics();
        } else {
            this.log.info(`Persistence skipped - all statistics are disabled for cache ${this.options.cache}`);
        }
    }

    /**
     * Get current persistence interval status
     */
    getPersistenceStatus() {
        return {
            metricsEnabled: this.options.metricsEnabled,
            keyMetricsEnabled: this.options.keyMetricsEnabled,
            intervalExists: this.persistInterval !== null,
            lastPersisted: this.stats.lastPersisted,
            persistenceInterval: this.options.persistenceInterval
        };
    }

    async clearMetrics() {
        await this.persistenceManager.deleteMetrics();
        // Also reset the current stats
        this.resetCurrentStats();
    }

    async clearKeyMetrics() {
        await this.persistenceManager.deleteKeyMetrics();
        // Also reset the current stats
        this.resetCurrentStats();
    }

    /**
     * Delete metrics (alias for clearMetrics for compatibility)
     * @returns {Promise<void>}
     */
    async deleteMetrics() {
        return this.clearMetrics();
    }

    /**
     * Delete key metrics (alias for clearKeyMetrics for compatibility)
     * @returns {Promise<void>}
     */
    async deleteKeyMetrics() {
        return this.clearKeyMetrics();
    }
}

module.exports = CacheStatisticsHandler; 