const TagResolver = require('../support/TagResolver');
/**
 * Manages CAP-specific cache operations
 */
class CapOperations {

    cacheAnnotatedFunctions = {
        bound: [],
        unbound: []
    };

    constructor(cache, keyManager, statistics, log, runtimeConfigManager) {
        this.cache = cache;
        this.keyManager = keyManager;
        this.statistics = statistics;
        this.tagResolver = new TagResolver();
        this.runtimeConfigManager = runtimeConfigManager;
        this.log = log || console;
    }

    /**
     * Safely execute cache operations with error handling
     * @param {Function} operation - The cache operation to execute
     * @param {string} operationName - Name of the operation for logging
     * @param {object} context - Context information for logging
     * @returns {Promise<object>} - The result with error information
     */
    async safeCacheOperation(operation, operationName, context = {}) {
        try {
            const result = await operation();
            this.log.info('REEEESULT', { result });
            return { success: true, result, error: null };
        } catch (error) {
            this.log.warn(`Cache ${operationName} failed:`, {
                error: error.message,
                stack: error.stack,
                context: context
            });
            
            return { 
                success: false, 
                result: null, 
                error: {
                    message: error.message,
                    operation: operationName,
                    context: context
                }
            };
        }
    }

    /**
     * Send a request with caching with read-through capabilities.
     * 
     * @param {object} arg1 - the request object
     * @param {Service} service - the service to send the request to
     * @param {object} options - the options for the request
     * @returns {Promise<any>} - the result
     */
    async send(request, service, options) {
        const requestOptions = {
            ttl: 0,
            ...(options || {}),
        }

        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method?.toUpperCase()) || !service.send) {
            return { result: null, cacheKey: null, metadata: { hit: false, latency: 0 }, cacheErrors: [] };
        }

        const keyParts = {
            user: cds.context?.user?.id || cds.context?.user,
            tenant: cds.context?.tenant,
            locale: cds.context?.locale,
            serviceName: service.name,
            path: request.path || request.http?.req?.path,
            method: request.method,
            data: request.data,
            params: request.params,
            query: request.query,
            event: request.event,
        };

        const key = this.keyManager.createKey(request, keyParts, requestOptions.key);
        const startTime = process.hrtime();

        // Track the miss with total latency (cache lookup + backend operation)
        const metadata = {
            dataType: request.send ? request.constructor.name : 'SendRequest',
            operation: 'SEND',
            operationType: 'READ_THROUGH',
            tenant: request.tenant || cds.context?.tenant,
            user: request.user?.id || cds.context?.user?.id,
            locale: request.locale || cds.context?.locale,
            target: request.target?.name,
            query: request.query ? JSON.stringify(request.query) : undefined,
            subject: request.subject ? JSON.stringify(request.subject) : undefined,
            metadata: JSON.stringify({
                serviceName: service.name,
                path: request.path || request.http?.req?.path,
                method: request.method,
                url: request.url,
                data: request.data,
                params: request.params,
                subject: request.subject,
                query: request.query,
                event: request.event,
                headers: request.headers,
            }),
            cacheOptions: JSON.stringify(requestOptions)
        };

        // Safely check if key exists in cache
        const hasKeyResult = await this.safeCacheOperation(
            () => this.cache.has(key),
            'has',
            { key, serviceName: service.name }
        );

        const hasKey = hasKeyResult.success && hasKeyResult.result;
        const cacheErrors = [];

        if (hasKey) {
            const latency = this.getElapsedMs(startTime);

            // Safely record hit statistics
            const hitStatsResult = await this.safeCacheOperation(
                () => this.statistics.recordHit(latency, key, metadata),
                'recordHit',
                { key, latency }
            );
            if (!hitStatsResult.success) {
                cacheErrors.push(hitStatsResult.error);
            }

            // Safely get value from cache
            const getResult = await this.safeCacheOperation(
                () => this.cache.send("GET", { key }),
                'get',
                { key }
            );

            if (getResult.success && getResult.result?.value !== undefined) {
                return { 
                    result: getResult.result.value, 
                    cacheKey: key, 
                    metadata: { hit: true, latency: latency },
                    cacheErrors: cacheErrors
                };
            }
        }

        // Cache miss or cache error - delegate to underlying service
        try {
            const response = await service.send(request);
            const totalLatency = this.getElapsedMs(startTime);
            
            // Safely record miss statistics
            const missStatsResult = await this.safeCacheOperation(
                () => this.statistics.recordMiss(totalLatency, key, metadata),
                'recordMiss',
                { key, latency: totalLatency }
            );
            if (!missStatsResult.success) {
                cacheErrors.push(missStatsResult.error);
            }

            // Safely store in cache
            const wrappedValue = {
                value: response,
                tags: this.tagResolver.resolveTags(requestOptions.tags, response, { ...request.params, user: request.user?.id, tenant: request.tenant, locale: request.locale, hash: this.keyManager.createContentHash(request) }),
                timestamp: Date.now()
            };
            
            const setResult = await this.safeCacheOperation(
                () => this.cache.send("SET", { key, value: wrappedValue, ttl: requestOptions.ttl || 0 }),
                'set',
                { key, ttl: requestOptions.ttl }
            );
            if (!setResult.success) {
                cacheErrors.push(setResult.error);
            }

            return { 
                result: response, 
                cacheKey: key, 
                metadata: { hit: false, latency: totalLatency },
                cacheErrors: cacheErrors
            };
        } catch (serviceError) {
            // If the underlying service fails, throw the error
            this.log.error('Service operation failed:', {
                error: serviceError.message,
                serviceName: service.name,
                key: key
            });
            throw serviceError;
        }
    }

    /**
     * Run a cached operation with automatic key generation
     * @param {object} req - the request object
     * @param {function} handler - the handler function
     * @param {object} options - cache options
     * @param {object} cache - the cache instance
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

                    req.cacheKey = this.keyManager.createKey(req, {}, req.cacheOptions.key);
                    req.res?.setHeader('x-sap-cap-cache-key', req.cacheKey);

                    // Track cache operation timing
                    const startTime = process.hrtime();
                    
                    // Safely get value from cache
                    const getResult = await this.safeCacheOperation(
                        () => this.cache.send("GET", { key: req.cacheKey }),
                        'get',
                        { key: req.cacheKey, serviceName: req.target?.name }
                    );
                    
                    const cacheHit = getResult.success && getResult.result?.value !== undefined;
                    const cacheLatency = this.getElapsedMs(startTime);
                    const metadata = this.extractMetadataFromRequest(req);
                    const cacheErrors = [];

                    if (cacheHit) {
                        // Cache hit
                        const hitStatsResult = await this.safeCacheOperation(
                            () => this.statistics.recordHit(cacheLatency, req.cacheKey, metadata),
                            'recordHit',
                            { key: req.cacheKey, latency: cacheLatency }
                        );
                        if (!hitStatsResult.success) {
                            cacheErrors.push(hitStatsResult.error);
                        }
                        
                        req.res?.setHeader('x-sap-cap-cache', "hit");
                        return { 
                            result: getResult.result.value, 
                            cacheKey: req.cacheKey, 
                            metadata: { hit: true, latency: cacheLatency },
                            cacheErrors: cacheErrors
                        };
                    } else {
                        // Cache miss - track the backend operation
                        try {
                            const response = await next();
                            const totalLatency = this.getElapsedMs(startTime);

                            // Safely record miss statistics
                            const missStatsResult = await this.safeCacheOperation(
                                () => this.statistics.recordMiss(totalLatency, req.cacheKey, metadata),
                                'recordMiss',
                                { key: req.cacheKey, latency: totalLatency }
                            );
                            if (!missStatsResult.success) {
                                cacheErrors.push(missStatsResult.error);
                            }
                            
                            req.res?.setHeader('x-sap-cap-cache', "miss");

                            // Safely store in cache
                            const wrappedValue = {
                                value: response,
                                tags: this.tagResolver.resolveTags(req.cacheOptions.tags, response, { ...req.params, hash: this.keyManager.createContentHash(req) }),
                                timestamp: Date.now()
                            };
                            
                            const setResult = await this.safeCacheOperation(
                                () => this.cache.send("SET", { key: req.cacheKey, value: wrappedValue, ttl: req.cacheOptions.ttl || 0 }),
                                'set',
                                { key: req.cacheKey, ttl: req.cacheOptions.ttl }
                            );

                            if (!setResult.success) {
                                cacheErrors.push(setResult.error);
                            }
                            
                            return { 
                                result: response, 
                                cacheKey: req.cacheKey, 
                                metadata: { hit: false, latency: totalLatency },
                                cacheErrors: cacheErrors
                            };
                        } catch (serviceError) {
                            // If the underlying service fails, throw the error
                            this.log.error('Service operation failed:', {
                                error: serviceError.message,
                                serviceName: req.target?.name,
                                key: req.cacheKey
                            });
                            throw serviceError;
                        }
                    }
                case "cds.ql":
                    const query = arg1;
                    let srv = arguments[1] || cds;

                    if (query.SELECT) {
                        let options = {
                            ttl: 0,
                            tags: [],
                            ...(arguments[2] || {}),
                        };

                        query.cacheKey = this.keyManager.createKey(query, { serviceName: srv?.name }, options.key);

                        // Track cache operation timing
                        const startTime = process.hrtime();
                        
                        // Safely check if key exists in cache
                        const hasCachedValueResult = await this.safeCacheOperation(
                            () => this.cache.has(query.cacheKey),
                            'has',
                            { key: query.cacheKey, serviceName: srv?.name }
                        );
                        
                        const hasCachedValue = hasCachedValueResult.success && hasCachedValueResult.result;
                        const cacheLatency = this.getElapsedMs(startTime);
                        const metadata = {
                            dataType: 'Query',
                            operation: 'SELECT',
                            operationType: 'READ_THROUGH',
                            user: cds.context?.user?.id,
                            tenant: cds.context?.tenant,
                            locale: cds.context?.locale,
                            query: JSON.stringify(query.SELECT),
                            metadata: JSON.stringify({
                                query: query.SELECT,
                                user: cds.context?.user?.id,
                                tenant: cds.context?.tenant,
                                locale: cds.context?.locale,
                                serviceName: srv?.name,
                                path: query.path,
                            }),
                            cacheOptions: JSON.stringify(options)
                        };
                        const cacheErrors = [];

                        if (hasCachedValue) {
                            // Cache hit
                            const hitStatsResult = await this.safeCacheOperation(
                                () => this.statistics.recordHit(cacheLatency, query.cacheKey, metadata),
                                'recordHit',
                                { key: query.cacheKey, latency: cacheLatency }
                            );
                            if (!hitStatsResult.success) {
                                cacheErrors.push(hitStatsResult.error);
                            }

                            const getResult = await this.safeCacheOperation(
                                () => this.cache.send("GET", { key: query.cacheKey }),
                                'get',
                                { key: query.cacheKey }
                            );
                            
                            if (getResult.success && getResult.result?.value !== undefined) {
                                                            return { 
                                result: getResult.result.value, 
                                cacheKey: query.cacheKey, 
                                metadata: { hit: true, latency: cacheLatency },
                                cacheErrors: cacheErrors
                            };
                            }
                        }

                        // Cache miss or cache error
                        try {
                            const data = await srv.run(query);
                            const totalLatency = this.getElapsedMs(startTime);

                            // Safely record miss statistics
                            const missStatsResult = await this.safeCacheOperation(
                                () => this.statistics.recordMiss(totalLatency, query.cacheKey, metadata),
                                'recordMiss',
                                { key: query.cacheKey, latency: totalLatency }
                            );
                            if (!missStatsResult.success) {
                                cacheErrors.push(missStatsResult.error);
                            }

                            // Safely store in cache
                            const wrappedValue = {
                                value: data,
                                tags: this.tagResolver.resolveTags(options.tags, data, { ...query.params, hash: this.keyManager.createKey(query, { serviceName: srv?.name, template: '{hash}' }) }),
                                timestamp: Date.now()
                            };
                            
                            const setResult = await this.safeCacheOperation(
                                () => this.cache.send("SET", { key: query.cacheKey, value: wrappedValue, ttl: options.ttl || 0 }),
                                'set',
                                { key: query.cacheKey, ttl: options.ttl }
                            );
                            if (!setResult.success) {
                                cacheErrors.push(setResult.error);
                            }

                            this.log.info('REEEESULT', { setResult, cacheErrors, wrappedValue });
                            
                            return { 
                                result: data, 
                                cacheKey: query.cacheKey, 
                                metadata: { hit: false, latency: totalLatency },
                                cacheErrors: cacheErrors
                            };
                        } catch (serviceError) {
                            // If the underlying service fails, throw the error
                            this.log.error('Service operation failed:', {
                                error: serviceError.message,
                                serviceName: srv?.name,
                                key: query.cacheKey
                            });
                            throw serviceError;
                        }
                    } else {
                        return srv.run(query);
                    }
            }
        }
        return { result: null, cacheKey: null, metadata: { hit: false, latency: 0 }, cacheErrors: [] };
    }

    /**
     * Extract cache options from request
     * @param {object} req - the request object
     * @param {object} options - default options
     * @returns {object} - cache options
     */
    extractCacheOptions(req, options = {}) {
        const extractedOptions = { ...options };

        // Extract from function annotations
        if (req.target && req.target.name) {
            const functionOptions = this.extractFunctionCacheOptions(req, options);
            Object.assign(extractedOptions, functionOptions);
        }

        // Extract from entity annotations
        if (req.target && req.target.name) {
            const entityOptions = this.extractEntityCacheOptions(req, options);
            Object.assign(extractedOptions, entityOptions);
        }

        return extractedOptions;
    }

    /**
     * Extract function cache options from request
     * @param {object} req - the request object
     * @param {object} options - default options
     * @returns {object} - function cache options
     */
    extractFunctionCacheOptions(req, options = {}) {
        const functionType = req.query ? 'bound' : 'unbound';
        const functionOptions = this.cacheAnnotatedFunctions[functionType].find(f => f.name === req.event);

        return {
            ttl: functionOptions?.['@cache.ttl'] || 0,
            key: functionOptions?.['@cache.key'] || null,
            tags: functionOptions?.['@cache.tags'] || [],
            ...(options || {}),
        };
    }

    /**
     * Extract entity cache options from request
     * @param {object} req - the request object
     * @param {object} options - default options
     * @returns {object} - entity cache options
     */
    extractEntityCacheOptions(req, options = {}) {
        return {
            ttl: req.target?.['@cache.ttl'] || 0,
            key: req.target?.['@cache.key'] || null,
            tags: req.target?.['@cache.tags'] || [],
            ...(options || {}),
        }
    }

    /**
     * Extract metadata from request for statistics
     * @param {object} req - the request object
     * @returns {object} - metadata object
     */
    extractMetadataFromRequest(req) {

        console.log(JSON.stringify(req.http?.req, null, 2));

        const metadata = {
            dataType: req.constructor.name,
            serviceName: req.target?.name || '',
            operation: 'RUN',
            operationType: 'READ_THROUGH',
            tenant: req.tenant,
            user: req.user?.id,
            locale: req.locale,
            target: req.target?.name,
            subject: req.subject ? JSON.stringify(req.subject) : undefined,
            query: req.query?.SELECT ? JSON.stringify(req.query?.SELECT) : undefined,
            metadata: JSON.stringify({
                method: req.method,
                data: req.data,
                params: req.params,
                path: req.http?.req?.path,
                url: req.http?.req?.url
            }),
            cacheOptions: JSON.stringify(req.cacheOptions)
        };

        return metadata;
    }

    /**
     * Get elapsed time in milliseconds
     * @param {[number, number]} startTime - start time from process.hrtime()
     * @returns {number} - elapsed time in milliseconds
     */
    getElapsedMs(startTime) {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        return (seconds * 1000) + (nanoseconds / 1000000);
    }
}

module.exports = CapOperations; 