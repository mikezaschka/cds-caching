const cds = require('@sap/cds');
const CacheStoreManager = require('./support/CacheStoreManager');
const KeyManager = require('./support/KeyManager');
const TagResolver = require('./support/TagResolver');
const RuntimeConfigurationManager = require('./support/RuntimeConfigurationManager');
const CacheStatisticsHandler = require('./support/CacheStatisticsHandler');
const BasicOperations = require('./operations/BasicOperations');
const CapOperations = require('./operations/CapOperations');
const AsyncOperations = require('./operations/AsyncOperations');

class CachingService extends cds.Service {

    async init() {
        super.init()
        this.log = cds.log('cds-caching')
        this.options = {
            store: null,
            compression: null,
            credentials: {},
            namespace: null,
            throwOnErrors: false,
            // When enabled, basic cache operations (`get`, `set`, `delete`, ...)
            // will be executed in a dedicated cache transaction (`cache.tx()`),
            // isolating them from the caller's request transaction (e.g. concurrent BEFORE handlers).
            transactionalOperations: false,
            ...(this.options || {})
        };
        this.options.credentials = this.options.credentials || {};

        // Initialize managers
        this.storeManager = new CacheStoreManager();
        this.runtimeConfigManager = new RuntimeConfigurationManager(this.name, this.log, this.options);
        this.keyManager = new KeyManager(this.runtimeConfigManager);
        this.tagResolver = new TagResolver();

        // Create cache store
        const { cache, cleanup } = this.storeManager.createStore(this.options, this.name);
        this.cache = cache;
        this.log.info(`Caching service ${this.name} initialized with namespace ${this.options.namespace || this.name}`);

        // Set up cleanup on shutdown
        cds.once("shutdown", cleanup);

        /**
         * Internal event handlers
         */
        const handleSet = async (event) => {
            this.log.debug(`SET ${event.data.key}`);
            if (typeof event.data.value === "object") {
                event.data.value = JSON.stringify(event.data.value);
            }
            await this.cache.set(event.data.key, event.data.value, (event.data.ttl || 0))
        }

        const handleGet = async (event) => {
            const value = await this.cache.get(event.data.key);
            this.log.debug(`GET ${event.data.key}`);
            if (typeof value === "string") {
                try {
                    return JSON.parse(value);
                } catch (error) {
                    return value;
                }
            }
            return value;
        }

        const handleDelete = async (event) => {
            this.log.debug(`DELETE ${event.data.key}`);
            await this.cache.delete(event.data.key);
        }

        const handleClear = async (event) => {
            this.log.debug(`CLEAR`);
            await this.cache.clear();

            // Also clear statistics
            if (this.statistics) {
                await this.statistics.resetCurrentStats();

                try {
                    await this.statistics.deleteMetrics();
                    await this.statistics.deleteKeyMetrics();
                } catch (error) {
                    this.log.warn(`Failed to clear statistics for cache ${this.name}:`, error);
                }
            }
        }

        // Those support before/after hooks
        this.on('SET', handleSet.bind(this));
        this.on('GET', handleGet.bind(this));
        this.on('DELETE', handleDelete.bind(this));
        this.on('CLEAR', handleClear.bind(this));

        const config = await this.runtimeConfigManager.getRuntimeConfiguration();

        // Initialize statistics with runtime configuration support
        this.statistics = new CacheStatisticsHandler({
            cache: this.name
        });
        this.statistics.enableKeyMetrics(config.keyMetricsEnabled);
        this.statistics.enableMetrics(config.metricsEnabled);

        // Initialize operation managers
        this.basicOperations = new BasicOperations(
            this,
            this.keyManager,
            this.tagResolver,
            this.statistics,
        );

        this.capOperations = new CapOperations(
            this,
            this.keyManager,
            this.statistics,
            this.log,
            this.runtimeConfigManager
        );

        this.asyncOperations = new AsyncOperations(
            this,
            this.keyManager,
            this.statistics,
            this.runtimeConfigManager
        );


        // Always set up statistics hooks, but they will be controlled by the enabled flag
        this.setupStatisticsHooks();
    }

    // ============================================================================
    // PUBLIC API - Core Cache Operations
    // ============================================================================

    createKey(...args) { return this.keyManager.createKey(...args); }

    async set(key, value, options = {}, tx = null) {
        if (tx) return this.basicOperations.set(key, value, options, tx);
        if (this.options.transactionalOperations) return this.basicOperations.setInTx(key, value, options);
        return this.basicOperations.set(key, value, options);
    }

    async get(key, tx = null) {
        if (tx) return this.basicOperations.get(key, tx);
        if (this.options.transactionalOperations) return this.basicOperations.getInTx(key);
        return this.basicOperations.get(key);
    }

    async has(key, tx = null) {
        // `has()` bypasses CAP tx handling in BasicOperations, so the `tx` argument is ignored.
        // It is accepted here for API symmetry.
        return this.basicOperations.has(key, tx);
    }

    async delete(key, tx = null) {
        if (tx) return this.basicOperations.delete(key, tx);
        if (this.options.transactionalOperations) return this.basicOperations.deleteInTx(key);
        return this.basicOperations.delete(key);
    }

    async clear(tx = null) {
        if (tx) return this.basicOperations.clear(tx);
        if (this.options.transactionalOperations) return this.basicOperations.clearInTx();
        return this.basicOperations.clear();
    }

    async deleteByTag(tag, tx = null) {
        if (tx) return this.basicOperations.deleteByTag(tag, tx);
        if (this.options.transactionalOperations) return this.basicOperations.deleteByTagInTx(tag);
        return this.basicOperations.deleteByTag(tag);
    }

    async metadata(key, tx = null) {
        if (tx) return this.basicOperations.metadata(key, tx);
        if (this.options.transactionalOperations) return this.basicOperations.metadataInTx(key);
        return this.basicOperations.metadata(key);
    }

    async tags(key, tx = null) {
        if (tx) return this.basicOperations.tags(key, tx);
        if (this.options.transactionalOperations) return this.basicOperations.tagsInTx(key);
        return this.basicOperations.tags(key);
    }

    async getRaw(key, tx = null) {
        if (tx) return this.basicOperations.getRaw(key, tx);
        if (this.options.transactionalOperations) return this.basicOperations.getRawInTx(key);
        return this.basicOperations.getRaw(key);
    }

    async *iterator(tx = null) { return yield* this.basicOperations.iterator(tx); }

    // ============================================================================
    // PUBLIC API - Read Through Operations
    // ============================================================================

    get rt() {
        return {
            send: (...args) => this.capOperations.send(...args),
            run: (...args) => this.capOperations.run(...args),
            wrap: (...args) => this.asyncOperations.wrap(...args),
            exec: (...args) => this.asyncOperations.exec(...args),
        }
    }

    // ============================================================================
    // PUBLIC API - Deprecated Shortcut Read Through Methods
    // ============================================================================

    /**
     * @deprecated Use cache.rt.send() instead. The rt.send() method provides enhanced functionality including read-through metadata, dynamic cache keys, and detailed mode options.
     * @param  {...any} args 
     * @returns {Promise<object>} - the result of the request
     */
    async send(...args) {
        if (typeof args[0] !== "object" || !args[1].send || typeof args[1] !== "object" || args[0].method !== "GET") {
            return super.send(...args);
        } else {
            const result = await this.rt.send(...args);
            return result.result;
        }
    }

    /**
     * @deprecated Use cache.rt.run() instead. The rt.run() method provides enhanced functionality including read-through metadata, dynamic cache keys, and detailed mode options.
     * @param  {...any} args 
     * @returns {Promise<object>} - the result of the request
     */
    async run(...args) {
        if (typeof args[0] !== "object" && !["Request", "NoaRequest", "ODataRequest", "cds.ql"].includes(args[0].constructor.name)) {
            return super.run(...args);
        } else {
            const result = await this.rt.run(...args);  
            return result.result;
        }
    }

    /**
     * @deprecated Use cache.rt.wrap() instead. The rt.wrap() method provides enhanced functionality including read-through metadata, dynamic cache keys, and detailed mode options.
     * @param  {...any} args 
     * @returns {Promise<object>} - the result of the request
     */
    wrap(...args) {
        const wrappedFunction = this.rt.wrap(...args);
        return async (...args) => {
            const result = await wrappedFunction(...args);
            return result.result;
        }
    }

    /**
     * @deprecated Use cache.rt.exec() instead. The rt.exec() method provides enhanced functionality including read-through metadata, dynamic cache keys, and detailed mode options.
     * @param  {...any} args 
     * @returns {Promise<object>} - the result of the request
     */
    async exec(...args) {
        const result = await this.rt.exec(...args);
        return result.result;
    }

    // ============================================================================
    // PUBLIC API - Statistics and Configuration
    // ============================================================================


    /**
     * Resolve tags for a given query
     * @param {object} query - the query to resolve tags for
     * @returns {Promise<object>} - the resolved tags
     */
    async resolveTags(...args) { return this.tagResolver.resolveTags(...args); }

    /**
     * Get statistics for a specific period
     * @param {string} period - the period to get stats for
     * @param {Date} from - start date
     * @param {Date} to - end date
     * @returns {Promise<object>} - the statistics
     */
    async getMetrics(from, to) {
        return this.statistics.getMetrics("hourly", from, to);
    }

    async getKeyMetrics(key, from, to) {
        return this.statistics.getKeyMetrics(key, from, to);
    }

    /**
     * Get current statistics
     * @returns {Promise<object>} - the current statistics
     */
    async getCurrentMetrics() {
        return this.statistics.getCurrentStats();
    }

    /**
     * Get current key metrics
     * @returns {Promise<object>} - the current key metrics
     */
    async getCurrentKeyMetrics() {
        return this.statistics.getCurrentKeyMetrics();
    }



    /**
     * Clear all metrics
     * @returns {Promise<void>}
     */
    async clearMetrics() {
        return this.statistics.clearMetrics();
    }

    /**
     * Clear key metrics
     * @returns {Promise<void>}
     */
    async clearKeyMetrics() {
        return this.statistics.clearKeyMetrics();
    }

    /**
     * Enable or disable statistics at runtime
     * @param {boolean} enabled - whether to enable statistics
     * @returns {Promise<void>}
     */
    async setMetricsEnabled(enabled) {
        await this.runtimeConfigManager.setMetricsEnabled(enabled);
        this.statistics.enableMetrics(enabled);
    }

    /**
     * Enable or disable key tracking at runtime
     * @param {boolean} enabled - whether to enable key tracking
     * @returns {Promise<void>}
     */
    async setKeyMetricsEnabled(enabled) {
        await this.runtimeConfigManager.setKeyMetricsEnabled(enabled);
        this.statistics.enableKeyMetrics(enabled);
    }

    /**
     * Persist metrics to database
     * @returns {Promise<void>}
     */
    async persistMetrics() {
        return this.statistics.persistMetrics();
    }

    /**
     * Get current runtime configuration
     * @returns {Promise<object>} - the runtime configuration
     */
    async getRuntimeConfiguration() {
        return await this.runtimeConfigManager.getRuntimeConfiguration();
    }

    /**
     * Reload runtime configuration from database
     * @returns {Promise<void>}
     */
    async reloadRuntimeConfiguration() {
        await this.loadRuntimeConfiguration();
    }

    /**
     * Add a cachable function
     * @param {string} name - the function name
     * @param {object} options - the cache options
     * @param {boolean} isBound - whether the function is bound
     */
    addCachableFunction(name, options, isBound = false) {
        this.capOperations.cacheAnnotatedFunctions[isBound ? 'bound' : 'unbound'].push({ name, options });
    }

    /**
     * Dispose of the service
     * @returns {Promise<void>}
     */
    async dispose() {
        await this.statistics.dispose();
    }

    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================

    /**
     * Set up statistics hooks for all cache operations
     * @private
     */
    setupStatisticsHooks() {
        // Enhance methods with statistics
        this.before('GET', (req) => {
            req.startTime = process.hrtime();
        });

        this.before('SET', (req) => {
            req.startTime = process.hrtime();
        });

        this.before('DELETE', (req) => {
            req.startTime = process.hrtime();
        });
    }

    /**
     * Load runtime configuration from database
     * @private
     */
    async loadRuntimeConfiguration() {
        try {
            const config = await this.runtimeConfigManager.loadRuntimeConfiguration();
            this.statistics.enableKeyTracking(config.enableKeyTracking);
            this.statistics.enableStatistics(config.enableStatistics);
        } catch (error) {
            this.log.warn(`Failed to load runtime configuration for cache ${this.name}:`, error);
        }
    }

}

module.exports = CachingService;