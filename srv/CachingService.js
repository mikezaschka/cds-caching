const cds = require('@sap/cds');
const { Keyv } = require('keyv');
const { default: KeyvRedis } = require('@keyv/redis');
const { default: KeyvSqlite } = require('@keyv/sqlite');
const { default: KeyvLz4 } = require('@keyv/compress-lz4');
const { default: KeyvGzip } = require('@keyv/compress-gzip');
const crypto = require('crypto');
const CacheStatisticsHandler = require('./CacheStatisticsHandler');

class CachingService extends cds.Service {

    // Store annotated functions with metadata as requests do not contain a target
    cacheAnnotatedFunctions = {
        bound: [],
        unbound: []
    };

    init() {
        super.init()
        this.log = cds.log('cds-caching')
        this.options = this.options || {
            store: null,
            compression: null,
            credentials: {}
        };

        let store;

        switch (this.options.store) {
            case "sqlite":
                store = new KeyvSqlite({
                    url: this.options.credentials?.url,
                    table: this.options.credentials?.table || 'cache',
                    busyTimeout: this.options.credentials?.busyTimeout || 10000
                });
                break;
            case "redis":
                store = new KeyvRedis({
                    ...this.options.credentials,
                    // Redis, Hyperscaler Option on BTP provides a URI
                    ...(this.options.credentials?.uri ? { url: this.options.credentials?.uri } : {}),
                });

                cds.once("shutdown", async () => {
                    if (this.cache.store?.disconnect) {
                        await this.cache.store.disconnect().catch((err) => {
                            this.LOG._error && this.LOG.error('Error disconnecting from Redis', err);
                        });
                    }
                });
                break;
            default:
                store = new Map();
                break;
        }

        let cacheOptions = {
            namespace: this.options.namespace || this.name,
            store: store,
            compression: this.options.compression === "lz4" ? new KeyvLz4() : this.options.compression === "gzip" ? new KeyvGzip() : undefined
        }


        this.cache = new Keyv(cacheOptions);
        this.log.info(`Caching service ${this.name} initialized with namespace ${cacheOptions.namespace}`);

        this.cache.on('error', err => {
            this.log.error('Cache error', err);
        });

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
                return JSON.parse(value);
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
                await this.statistics.deleteAllPersistedStats();
            }
        }

        // Initialize cache operations
        this.on('SET', handleSet);
        this.on('GET', handleGet);
        this.on('DELETE', handleDelete);
        this.on('CLEAR', handleClear);

        // Initialize statistics with runtime configuration support
        this.statistics = new CacheStatisticsHandler({
            cache: this.name,
            ...(this.options.statistics ? { ...this.options.statistics } : {}),
            enabled: false, // Start disabled, will be updated from runtime config
            getItemCount: async () => {
                let count = 0;
                for await (const _ of this.iterator()) {
                    count++;
                }
                return count;
            }
        });

        // Load runtime configuration from database
        this.loadRuntimeConfiguration().catch(error => {
            this.log.warn(`Failed to load runtime configuration for cache ${this.name}:`, error);
        });

        // Always set up statistics hooks, but they will be controlled by the enabled flag
        this.setupStatisticsHooks();
    }

    /**
     * Set up statistics hooks for all cache operations
     */
    setupStatisticsHooks() {
        // Enhance methods with statistics
        this.before('GET', (req) => {
            req.startTime = process.hrtime();
        });

        this.after('GET', async (result, req) => {
            // Skip statistics recording here as it's handled manually in the get method
            return;
        });

        this.before('SET', (req) => {
            req.startTime = process.hrtime();
        });

        this.after('SET', (result, req) => {
            // Skip statistics recording here as it's handled manually in the set method
            // to include tag resolution and value wrapping time
            return;
        });

        this.before('DELETE', (req) => {
            req.startTime = process.hrtime();
        });

        this.after('DELETE', (result, req) => {
            // Skip statistics recording here as it's handled manually in the delete method
            return;
        });
    }

    /**
     * Load runtime configuration from database
     */
    async loadRuntimeConfiguration() {
        try {
            this.log.info(`Loading runtime configuration for cache ${this.name}...`);

            const cacheConfig = await SELECT.one.from("plugin_cds_caching_Caches")
                .where({ name: this.name });

            if (cacheConfig) {
                // Update statistics configuration
                if (this.statistics) {
                    const oldEnabled = this.statistics.options.enabled;
                    const oldKeyTracking = this.statistics.options.enableKeyTracking;

                    this.statistics.options.enabled = cacheConfig.enableStatistics || false;
                    this.statistics.options.enableKeyTracking = cacheConfig.enableKeyTracking || false;

                    // Restart persistence interval if statistics were enabled/disabled
                    if (oldEnabled !== this.statistics.options.enabled) {
                        this.statistics.restartPersistenceInterval();
                        this.log.info(`Restarted persistence interval for cache ${this.name} (enabled: ${this.statistics.options.enabled})`);
                    }

                    this.log.info(`Runtime configuration loaded for cache ${this.name}:`);
                    this.log.info(`  - Statistics: ${oldEnabled} -> ${this.statistics.options.enabled}`);
                    this.log.info(`  - Key Tracking: ${oldKeyTracking} -> ${this.statistics.options.enableKeyTracking}`);
                } else {
                    this.log.warn(`Statistics handler not initialized for cache ${this.name}`);
                }
            } else {
                this.log.warn(`No cache configuration found for cache ${this.name}`);
            }
        } catch (error) {
            this.log.warn(`Failed to load runtime configuration for cache ${this.name}:`, error);
        }
    }

    /**
     * Reload runtime configuration from database
     */
    async reloadRuntimeConfiguration() {
        await this.loadRuntimeConfiguration();
    }

    /**
     * Enable or disable statistics at runtime
     */
    async setStatisticsEnabled(enabled) {
        try {
            await UPDATE('plugin_cds_caching_Caches')
                .set({ enableStatistics: enabled })
                .where({ name: this.name });

            if (this.statistics) {
                const oldEnabled = this.statistics.options.enabled;
                this.statistics.options.enabled = enabled;

                // Restart persistence interval if the enabled state changed
                if (oldEnabled !== enabled) {
                    this.statistics.restartPersistenceInterval();
                    this.log.info(`Restarted persistence interval for cache ${this.name} (enabled: ${enabled})`);
                }
            }

            this.log.info(`Statistics ${enabled ? 'enabled' : 'disabled'} for cache ${this.name}`);
            return true;
        } catch (error) {
            this.log.error(`Failed to update statistics configuration for cache ${this.name}:`, error);
            return false;
        }
    }

    /**
     * Enable or disable key tracking at runtime
     */
    async setKeyTrackingEnabled(enabled) {
        try {
            await UPDATE('plugin_cds_caching_Caches')
                .set({ enableKeyTracking: enabled })
                .where({ name: this.name });

            if (this.statistics) {
                this.statistics.options.enableKeyTracking = enabled;
            }

            this.log.info(`Key tracking ${enabled ? 'enabled' : 'disabled'} for cache ${this.name}`);
            return true;
        } catch (error) {
            this.log.error(`Failed to update key tracking configuration for cache ${this.name}:`, error);
            return false;
        }
    }

    /**
     * Get current runtime configuration
     */
    async getRuntimeConfiguration() {
        try {
            const cacheConfig = await SELECT.one.from("plugin_cds_caching_Caches")
                .where({ name: this.name });

            return {
                enableStatistics: cacheConfig?.enableStatistics || false,
                enableKeyTracking: cacheConfig?.enableKeyTracking || false
            };
        } catch (error) {
            this.log.warn(`Failed to get runtime configuration for cache ${this.name}:`, error);
            return {
                enableStatistics: false,
                enableKeyTracking: false
            };
        }
    }

    addCachableFunction(name, options, isBound = false) {
        this.cacheAnnotatedFunctions[isBound ? 'bound' : 'unbound'].push({ name, options });
    }

    getElapsedMs(startTime) {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        return seconds * 1000 + nanoseconds / 1000000;
    }

    async getStats(period, from, to) {
        return this.statistics?.getStats(period, from, to);
    }

    async getCurrentStats() {
        return this.statistics?.getCurrentStats();
    }

    async dispose() {
        this.statistics?.dispose();
        await super.dispose();
    }

    /**
     * Overloaded send method that caches the response of a remote service.
     * 
     * @returns {Promise<any>} - the result
     */
    async send() {
        const arg1 = arguments[0];
        const service = arguments[1];
        const options = {
            ttl: 0,
            ...(arguments[2] || {}),
        }

        if (typeof arg1 !== "object" || !service.send || typeof options !== "object" || arg1.method !== "GET") {
            return super.send(...arguments);
        }

        const key = this.createKey(arg1, options.key);
        const startTime = process.hrtime();

        if (await this.has(key)) {
            const latency = this.getElapsedMs(startTime);
            if (this.statistics?.options.enabled) {
                const metadata = {
                    dataType: 'request',
                    serviceName: service.name || '',
                    operation: 'SEND',
                    metadata: JSON.stringify({ method: arg1.method, url: arg1.url })
                };
                this.statistics.recordHit(latency, key, metadata);
            }
            return this.get(key);
        } else {
            const backendStartTime = process.hrtime();
            const response = await service.send(arg1);
            const backendLatency = this.getElapsedMs(backendStartTime);
            const totalLatency = this.getElapsedMs(startTime);

            // Track the miss with total latency (cache lookup + backend operation)
            if (this.statistics?.options.enabled) {
                const metadata = {
                    dataType: 'request',
                    serviceName: service.name || '',
                    operation: 'SEND',
                    metadata: JSON.stringify({ method: arg1.method, url: arg1.url })
                };
                this.statistics.recordMiss(totalLatency, key, metadata);
            }

            await this.set(key, response, options);
            return response;
        }
    }

    // Function to extract the cache options from the request
    extractFunctionCacheOptions(req, options) {
        const functionType = req.query ? 'bound' : 'unbound';
        const functionOptions = this.cacheAnnotatedFunctions[functionType].find(f => f.name === req.event);

        return {
            ttl: functionOptions?.['@cache.ttl'] || 0,
            key: functionOptions?.['@cache.key'] || { template: '{tenant}-{user}-{locale}-{hash}' },
            tags: functionOptions?.['@cache.tags'] || [],
            ...(options || {}),
        }
    }

    extractEntityCacheOptions(req, options) {
        return {
            ttl: req.target?.['@cache.ttl'] || 0,
            key: req.target?.['@cache.key'] || { template: '{tenant}-{user}-{locale}-{hash}' },
            tags: req.target?.['@cache.tags'] || [],
            ...(options || {}),
        }
    }

    extractMetadataFromRequest(req) {
        if (!req) return {};

        let dataType = 'custom';
        let serviceName = '';
        let entityName = '';
        let operation = '';
        let metadata = '';

        if (req.event) {
            // Function call
            dataType = 'function';
            serviceName = req.target?.name || req.service?.name || '';
            operation = req.event;
            metadata = JSON.stringify({
                params: req.params,
                user: req.user?.id,
                tenant: req.tenant
            });
        } else if (req.query) {
            // Query operation
            if (req.query.SELECT) {
                dataType = 'query';
                operation = 'SELECT';
            } else if (req.query.READ) {
                dataType = 'query';
                operation = 'READ';
            } else if (req.query.UPDATE) {
                dataType = 'request';
                operation = 'UPDATE';
            } else if (req.query.INSERT) {
                dataType = 'request';
                operation = 'INSERT';
            } else if (req.query.DELETE) {
                dataType = 'request';
                operation = 'DELETE';
            }

            serviceName = req.target?.name || req.service?.name || '';
            entityName = req.target?.name || '';
            metadata = JSON.stringify({
                query: req.query,
                user: req.user?.id,
                tenant: req.tenant
            });
        }

        return {
            dataType,
            serviceName,
            entityName,
            operation,
            metadata
        };
    }

    /**
     * Overloaded run method that caches multiple things magically in the background
     * 
     * @param {cds.ql} query - the query to run
     * @param {Service} service - service instance to run the query on
     * @param {object} options - additional options
     * 
     * 
     * @param {Request} request - the request to run
     * @param {next} function - the next fuction
     * @param {object} options - additional options

     * @returns {Promise<any>} - the result
     */

    async run() {

        const arg1 = arguments[0];
        if (typeof arg1 === "object") {
            switch (arg1.constructor.name) {
                case "Request":
                case "ODataRequest":
                case "NoaRequest":
                    const req = arg1;
                    const next = arguments[1];

                    if (req.query?.UPDATE || req.query?.INSERT || req.query?.DELETE) {
                        return next();
                    }

                    req.cacheOptions = req.event ? this.extractFunctionCacheOptions(req, arguments[2]) : this.extractEntityCacheOptions(req, arguments[2]);
                    req.cacheKey = this.createKey(req, req.cacheOptions.key);
                    req.res?.setHeader('x-sap-cap-cache-key', req.cacheKey);

                    // Track cache operation timing
                    const startTime = process.hrtime();
                    const hasCachedValue = await this.has(req.cacheKey);
                    const cacheLatency = this.getElapsedMs(startTime);

                    if (hasCachedValue) {
                        // Cache hit
                        if (this.statistics?.options.enabled) {
                            const metadata = this.extractMetadataFromRequest(req);
                            this.statistics.recordHit(cacheLatency, req.cacheKey, metadata);
                        }
                        return this._getRaw(req.cacheKey);
                    } else {
                        // Cache miss - track the backend operation
                        const backendStartTime = process.hrtime();
                        const response = await next();
                        const totalLatency = this.getElapsedMs(startTime);

                        // Track the miss with total latency (cache lookup + backend operation)
                        if (this.statistics?.options.enabled) {
                            const metadata = this.extractMetadataFromRequest(req);
                            this.statistics.recordMiss(totalLatency, req.cacheKey, metadata);
                        }

                        req.cacheOptions.tags = this.resolveTags(req.cacheOptions.tags, response, { ...req.params, user: req.user.id, tenant: req.tenant, locale: req.locale, hash: this.createKey(req, { template: '{hash}' }) });
                        await this.set(req.cacheKey, response, req.cacheOptions);
                        return response;
                    }
                case "cds.ql":
                    const query = arg1;
                    const srv = arguments[1];

                    if (query.SELECT) {
                        let options = {
                            ttl: 0,
                            tags: [],
                            key: { template: '{hash}' },
                            ...(arguments[2] || {}),
                        };
                        query.cacheKey = this.createKey(query, options.key);

                        // Track cache operation timing
                        const startTime = process.hrtime();
                        const hasCachedValue = await this.has(query.cacheKey);
                        const cacheLatency = this.getElapsedMs(startTime);

                        if (hasCachedValue) {
                            // Cache hit
                            if (this.statistics?.options.enabled) {
                                const metadata = {
                                    dataType: 'query',
                                    serviceName: srv.name || '',
                                    operation: 'SELECT',
                                    metadata: JSON.stringify({ query: query.SELECT })
                                };
                                this.statistics.recordHit(cacheLatency, query.cacheKey, metadata);
                            }
                            return this.get(query.cacheKey);
                        } else {
                            // Cache miss
                            const backendStartTime = process.hrtime();
                            const data = await srv.run(query);
                            const totalLatency = this.getElapsedMs(startTime);

                            // Track the miss with total latency (cache lookup + backend operation)
                            if (this.statistics?.options.enabled) {
                                const metadata = {
                                    dataType: 'query',
                                    serviceName: srv.name || '',
                                    operation: 'SELECT',
                                    metadata: JSON.stringify({ query: query.SELECT })
                                };
                                this.statistics.recordMiss(totalLatency, query.cacheKey, metadata);
                            }

                            options.tags = this.resolveTags(options.tags, data, { ...query.params, hash: this.createKey(query, { template: '{hash}' }) });
                            await this.set(query.cacheKey, data, options);
                            return data;
                        }
                    } else {
                        return srv.run(query);
                    }
            }
        }
        return super.run(...arguments);
    }

    /**
     * Wraps an async function and caches the result
     * 
     * @param {string} key - the key to cache
     * @param {function} asyncFunction - the async function to cache
     * @param {object} options - additional options
     * @returns {function} - the wrapped function
     */
    wrap(key, asyncFunction, options = {}) {
        const cacheKey = this.createKey(key, options.key);
        return async (...args) => {
            const startTime = process.hrtime();
            if (await this.has(cacheKey)) {
                const latency = this.getElapsedMs(startTime);
                if (this.statistics?.options.enabled) {
                    const metadata = {
                        dataType: 'function',
                        serviceName: this.name || '',
                        operation: 'WRAP',
                        metadata: JSON.stringify({ functionName: asyncFunction.name || 'anonymous', args: args.length })
                    };
                    this.statistics.recordHit(latency, cacheKey, metadata);
                }
                return this.get(cacheKey);
            } else {
                const backendStartTime = process.hrtime();
                const response = await asyncFunction(...args);
                const totalLatency = this.getElapsedMs(startTime);

                // Track the miss with total latency (cache lookup + backend operation)
                if (this.statistics?.options.enabled) {
                    const metadata = {
                        dataType: 'function',
                        serviceName: this.name || '',
                        operation: 'WRAP',
                        metadata: JSON.stringify({ functionName: asyncFunction.name || 'anonymous', args: args.length })
                    };
                    this.statistics.recordMiss(totalLatency, cacheKey, metadata);
                }

                await this.set(cacheKey, response, options);
                return response;
            }
        }
    }

    async set(key, value, options = {}) {
        const startTime = process.hrtime();
        const wrappedValue = {
            value,
            tags: this.resolveTags(options.tags, value, options.params) || [],
            timestamp: Date.now()
        };
        await this.send('SET', {
            key: this.createKey(key, options.key),
            value: wrappedValue,
            ttl: options.ttl || 0
        });
        
        // Record the total set latency (including tag resolution and wrapping)
        if (this.statistics?.options.enabled) {
            const totalLatency = this.getElapsedMs(startTime);
            const metadata = {
                dataType: 'operation',
                serviceName: this.name || '',
                operation: 'SET',
                metadata: JSON.stringify({ key: this.createKey(key, options.key), ttl: options.ttl || 0 })
            };
            this.statistics.recordSet(totalLatency, this.createKey(key, options.key), metadata);
        }
    }

    async get(key) {
        const startTime = process.hrtime();
        try {
            const wrappedValue = await this.send('GET', { key: this.createKey(key) });
            // Record the total get latency
            if (this.statistics?.options.enabled) {
                const totalLatency = this.getElapsedMs(startTime);
                const metadata = {
                    dataType: 'operation',
                    serviceName: this.name || '',
                    operation: 'GET',
                    metadata: JSON.stringify({ key: this.createKey(key) })
                };
                if (wrappedValue === undefined || wrappedValue === null) {
                    this.statistics.recordMiss(totalLatency, this.createKey(key), metadata);
                } else {
                    this.statistics.recordHit(totalLatency, this.createKey(key), metadata);
                }
            }
            return wrappedValue?.value;
        } catch (error) {
            if (this.statistics?.options.enabled) {
                this.statistics.recordError(error);
            }
            throw error;
        }
    }

    async has(key) {
        return this.cache.has(this.createKey(key));
    }

    async delete(key) {
        const startTime = process.hrtime();
        await this.send('DELETE', { key: this.createKey(key) });
        
        // Record the total delete latency
        if (this.statistics?.options.enabled) {
            const totalLatency = this.getElapsedMs(startTime);
            const metadata = {
                dataType: 'operation',
                serviceName: this.name || '',
                operation: 'DELETE',
                metadata: JSON.stringify({ key: this.createKey(key) })
            };
            this.statistics.recordDelete(totalLatency, this.createKey(key), metadata);
        }
    }

    async clear() {
        await this.send('CLEAR');
    }


    async deleteByTag(tag) {
        for await (const [key, wrappedValue] of this.iterator()) {
            if (wrappedValue?.tags?.includes(tag)) {
                await this.delete(key);
            }
        }
    }

    // Metadata
    async metadata(key) {
        const wrappedValue = await this.send('GET', { key: this.createKey(key) });
        if (!wrappedValue) return null;

        const { value, ...metadata } = wrappedValue;
        return metadata;
    }

    async tags(key) {
        const wrappedValue = await this.send('GET', { key: this.createKey(key) });
        return wrappedValue?.tags || [];
    }

    // Iterators
    async *iterator() {
        for await (const [key, value] of this.cache.iterator()) {
            if (typeof value === "string") {
                yield [key, JSON.parse(value)];
            } else {
                yield [key, value];
            }
        }
    }

    /**
     * Resolves tags from tag configurations and data
     * @param {Array} tagConfigs - Array of tag configuration objects
     * @param {Object|Array} data - Data object(s) to extract data values from
     * @param {Object} params - Parameters object to extract values from
     * @returns {string[]} Array of resolved tags
     */
    resolveTags(tagConfigs = [], data, params = {}) {
        // Handle empty/invalid configs
        if (!tagConfigs?.length) return [];

        // Convert data to array if single object or string
        const dataArray = !data ? [] :
            Array.isArray(data) ? data :
                typeof data === 'string' ? [data] : [data];

        // Process each tag configuration
        const resolvedTags = tagConfigs.flatMap(config => {
            // Handle string tags
            if (typeof config === 'string') {
                return [config];
            }

            // Handle invalid/empty config objects
            if (!config || typeof config !== 'object') {
                return [];
            }

            // Handle static value tags
            if (config.value) {
                const tag = [
                    config.prefix,
                    config.value,
                    config.suffix
                ].filter(Boolean).join('');
                return [tag];
            }

            // Handle template-based tags
            if (config.template) {
                const createHash = (data) => crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');

                const hashParts = [
                    ...(data ? [data] : []),
                    ...(params ? [params] : [])
                ];

                const contextVars = {
                    tenant: params.tenant || 'global',
                    user: params.user || 'anonymous',
                    locale: params.locale || 'en',
                    hash: createHash(hashParts)
                };

                const value = config.template.replace(
                    /\{(tenant|user|locale|hash)\}/g,
                    (match, variable) => contextVars[variable]
                );

                const tag = [
                    config.prefix,
                    value,
                    config.suffix
                ].filter(Boolean).join('');

                return [tag];
            }

            // Handle data-based tags
            if (config.data && dataArray.length) {
                return dataArray.flatMap(item => {
                    if (typeof item !== 'object') return [];

                    const dataFields = Array.isArray(config.data) ? config.data : [config.data];
                    const values = dataFields
                        .map(field => item[field])
                        .filter(Boolean);

                    if (!values.length) return [];

                    const value = values.join(config.separator || ':');
                    const tag = [
                        config.prefix,
                        value,
                        config.suffix
                    ].filter(Boolean).join('');
                    return [tag];
                });
            }

            // Handle param-based tags
            if (config.param) {
                const paramFields = Array.isArray(config.param) ? config.param : [config.param];
                const values = paramFields
                    .map(field => params[field])
                    .filter(Boolean);

                if (!values.length) return [];

                const value = values.join(config.separator || ':');
                const tag = [
                    config.prefix,
                    value,
                    config.suffix
                ].filter(Boolean).join('');
                return [tag];
            }

            return [];
        });

        // Remove duplicates
        return [...new Set(resolvedTags)];
    }

    // Basic cache operations
    createKey(keyOrObject, options = {}) {

        // If the key is a string, use it
        if (typeof keyOrObject === "string") {
            return keyOrObject;
        }

        // Otherwise, create a key based on the object
        if (typeof keyOrObject === "object") {

            // If the key is provided in the options, use it
            if (keyOrObject.cacheKey) {
                return keyOrObject.cacheKey;
            }

            switch (keyOrObject.constructor.name) {
                case "Request":
                case "NoaRequest":
                case "ODataRequest":

                    return this.createCacheKey((!options.value && !options.template) ? { template: '{tenant}:{user}:{locale}:{hash}' } : options, {
                        req: keyOrObject,
                        params: keyOrObject.params,
                        data: keyOrObject.data,
                        locale: keyOrObject.locale,
                        user: keyOrObject.user.id,
                        tenant: keyOrObject.tenant
                    });
                case "cds.ql":
                    if (keyOrObject.SELECT) {
                        return this.createCacheKey((!options.value && !options.template) ? { template: '{hash}' } : options, { query: keyOrObject });
                    } else {
                        return undefined;
                    }
                default:
                    return this.createCacheKey((!options.value && !options.template) ? { template: '{hash}' } : options, { data: keyOrObject });
            }
        }
    }

    /**
     * Creates a cache key based on configuration and context
     * @param {Object} keyConfig - Key configuration object
     * @param {Object} context - Context containing data, params, and request info
     * @returns {string} Generated cache key
     */
    createCacheKey(keyConfig = {}, context = {}) {
        const { data, params, req, query, locale, user, tenant } = context;

        // If a static key value is provided, use it
        if (keyConfig.value) {
            return keyConfig.value;
        }

        let keyValue = '';

        const hashParts = [
            ...(data ? [data] : []),
            ...(params ? [params] : []),
            ...(query ? [query] : [])
        ];

        const createHash = (data) => crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');

        // Handle template with placeholders
        if (keyConfig.template) {
            const contextVars = {
                tenant: tenant || 'global',
                user: user || 'anonymous',
                locale: locale || 'en',
                hash: createHash(hashParts)
            };

            keyValue = keyConfig.template.replace(
                /\{(tenant|user|locale|hash)\}/g,
                (match, variable) => contextVars[variable]
            );
        }

        // If no key value generated, create hash from input
        if (!keyValue) {
            keyValue = createHash(hashParts);
        }

        // Combine with prefix/suffix
        return [
            keyConfig.prefix,
            keyValue,
            keyConfig.suffix
        ].filter(Boolean).join('');
    }

    /**
     * Executes an async function and caches its result
     * 
     * @param {string} key - the key to cache
     * @param {function} asyncFunction - the async function to execute
     * @param {object} options - additional options
     * @returns {Promise<any>} - the result
     */
    async exec(key, asyncFunction, options = {}) {
        const cacheKey = this.createKey(key, options.key);
        const startTime = process.hrtime();

        if (await this.has(cacheKey)) {
            const latency = this.getElapsedMs(startTime);
            if (this.statistics?.options.enabled) {
                const metadata = {
                    dataType: 'function',
                    serviceName: this.name || '',
                    operation: 'EXEC',
                    metadata: JSON.stringify({ functionName: asyncFunction.name || 'anonymous' })
                };
                this.statistics.recordHit(latency, cacheKey, metadata);
            }
            return this.get(cacheKey);
        } else {
            const cacheLatency = this.getElapsedMs(startTime);
            if (this.statistics?.options.enabled) {
                const metadata = {
                    dataType: 'function',
                    serviceName: this.name || '',
                    operation: 'EXEC',
                    metadata: JSON.stringify({ functionName: asyncFunction.name || 'anonymous' })
                };
                this.statistics.recordMiss(cacheLatency, cacheKey, metadata);
            }

            const backendStartTime = process.hrtime();
            const response = await asyncFunction();
            const backendLatency = this.getElapsedMs(backendStartTime);

            // Track the backend operation as a miss with combined latency
            if (this.statistics?.options.enabled) {
                const metadata = {
                    dataType: 'function',
                    serviceName: this.name || '',
                    operation: 'EXEC',
                    metadata: JSON.stringify({ functionName: asyncFunction.name || 'anonymous' })
                };
                this.statistics.recordMiss(cacheLatency + backendLatency, cacheKey, metadata);
            }

            await this.set(cacheKey, response, options);
            return response;
        }
    }

    // Fetch a cache value without recording statistics
    async _getRaw(key) {
        const wrappedValue = await this.send('GET', { key: this.createKey(key) });
        return wrappedValue?.value;
    }

}

module.exports = CachingService;