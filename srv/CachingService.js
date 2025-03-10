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
        this.LOG = cds.log('cds-caching')
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
        this.LOG._info && this.LOG.info(`Caching service initialized with namespace ${cacheOptions.namespace}`);

        this.cache.on('error', err => {
            this.LOG._error && this.LOG.error('Cache error', err);
        });


        this.on('SET', async (event) => {
            this.LOG._debug && this.LOG.debug(`SET ${event.data.key}`);
            if (typeof event.data.value === "object") {
                event.data.value = JSON.stringify(event.data.value);
            }

            console.log(event.data);

            await this.cache.set(event.data.key, event.data.value, (event.data.ttl || 0))
        });

        this.on('GET', async (event) => {
            const value = await this.cache.get(event.data.key);
            this.LOG._debug && this.LOG.debug(`GET ${event.data.key}`);
            if (typeof value === "string") {
                return JSON.parse(value);
            }
            return value;
        });

        this.on('DELETE', async (event) => {
            this.LOG._debug && this.LOG.debug(`DELETE ${event.data.key}`);
            await this.cache.delete(event.data.key);
        });

        this.on('CLEAR', async (event) => {
            this.LOG._debug && this.LOG.debug(`CLEAR`);
            await this.cache.clear();
        });

        // Initialize statistics if enabled
        if (this.options.statistics?.enabled) {
            this.statistics = new CacheStatisticsHandler({
                enabled: true,
                ...(this.options.statistics.persistenceInterval ? { persistenceInterval: this.options.statistics.persistenceInterval } : {}),
                ...(this.options.statistics.maxLatencies ? { maxLatencies: this.options.statistics.maxLatencies } : {}),
                getItemCount: async () => {
                    let count = 0;
                    for await (const _ of this.iterator()) {
                        count++;
                    }
                    return count;
                }
            });

            // Enhance methods with statistics
            this.after('GET', async (result, req) => {
                const startTime = process.hrtime();
                try {
                    if (result === undefined) {
                        this.statistics.recordMiss();
                    } else {
                        this.statistics.recordHit(this.getElapsedMs(startTime));
                    }
                } catch (error) {
                    this.statistics.recordError();
                    throw error;
                }
            });

            this.after('SET', () => this.statistics.recordSet());
            this.after('DELETE', () => this.statistics.recordDelete());
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

        if (await this.has(key)) {
            return this.get(key);
        }
        const response = await service.send(arg1);
        await this.set(key, response, options);
        return response;
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
                case "NoaRequest":
                    const req = arg1;
                    const next = arguments[1];

                    if (req.query?.UPDATE || req.query?.INSERT || req.query?.DELETE) {
                        return next();
                    }

                    req.cacheOptions = req.event ? this.extractFunctionCacheOptions(req, arguments[2]) : this.extractEntityCacheOptions(req, arguments[2]);
                    req.cacheKey = this.createKey(req, req.cacheOptions.key);
                    req.res?.setHeader('x-sap-cap-cache-key', req.cacheKey);
                    const cachedValue = await this.get(req.cacheKey);
                    if (cachedValue) {
                        return cachedValue;
                    }
                    const response = await next();
                    req.cacheOptions.tags = this.resolveTags(req.cacheOptions.tags, response, { ...req.params, user: req.user.id, tenant: req.tenant, locale: req.locale, hash: this.createKey(req, { template: '{hash}' }) });
                    await this.set(req.cacheKey, response, req.cacheOptions);
                    return response;
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
                        if (await this.has(query.cacheKey)) {
                            return this.get(query.cacheKey);
                        }
                        const data = await srv.run(query);
                        options.tags = this.resolveTags(options.tags, data, { ...query.params, hash: this.createKey(query, { template: '{hash}' }) });
                        await this.set(query.cacheKey, data, options);
                        return data;
                    } else {
                        return srv.run(query);
                    }

            }
        }
        return super.run(arg1);
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
            if (await this.has(cacheKey)) {
                return this.get(cacheKey);
            }
            const response = await asyncFunction(...args);
            await this.set(cacheKey, response, options);
            return response;
        }
    }

    async set(key, value, options = {}) {
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
    }

    async get(key) {
        const wrappedValue = await this.send('GET', { key: this.createKey(key) });
        return wrappedValue?.value;
    }

    async has(key) {
        return this.cache.has(this.createKey(key));
    }

    async delete(key) {
        await this.send('DELETE', { key: this.createKey(key) });
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
        if (await this.has(cacheKey)) {
            return this.get(cacheKey);
        }
        const response = await asyncFunction();
        await this.set(cacheKey, response, options);
        return response;
    }

}

module.exports = CachingService;