/**
 * Manages async cache operations for function wrapping and execution
 */
class AsyncOperations {
    constructor(cache, keyManager, statistics, runtimeConfigManager) {
        this.cache = cache;
        this.keyManager = keyManager;
        this.statistics = statistics;
        this.runtimeConfigManager = runtimeConfigManager;
        this.log = console; // Default logger
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
     * Create a dynamic key for async function caching
     * @param {string} baseKey - the base cache key
     * @param {Array} args - function arguments
     * @param {object} options - cache options
     * @param {string} functionName - name of the function
     * @returns {string} - generated cache key
     */
    createDynamicKey(baseKey, args, options, functionName) {
        // If explicit key is provided, use it
        if (options.key) {
            return this.keyManager.createKey(
                { baseKey, args, functionName },
                {
                    baseKey,
                    args,
                    functionName,
                    user: cds.context?.user?.id,
                    tenant: cds.context?.tenant,
                    locale: cds.context?.locale
                },
                options.key
            );
        }

        // Auto-generate template based on arguments
        if (args.length === 0) {
            return this.keyManager.createKey(baseKey);
        }

        // Create argument placeholders
        const argPlaceholders = args.map((_, index) => `{args[${index}]}`).join(':');
        const template = `${baseKey}:${argPlaceholders}`;
        
        return this.keyManager.createKey(
            { baseKey, args, functionName },
            {
                baseKey,
                args,
                functionName,
                user: cds.context?.user?.id,
                tenant: cds.context?.tenant,
                locale: cds.context?.locale
            },
            template
        );
    }

    /**
     * Wrap an async function with caching
     * @param {string} key - the cache key
     * @param {function} asyncFunction - the async function to wrap
     * @param {object} options - cache options
     * @returns {function} - the wrapped function
     */
    wrap(key, asyncFunction, options = {}) {
        return async (...args) => {
            // Create dynamic key based on function arguments
            const cacheKey = this.createDynamicKey(key, args, options, asyncFunction.name || 'anonymous');

            const startTime = process.hrtime();
            const metadata = {
                dataType: 'Function',
                operation: 'WRAP',
                operationType: 'READ_THROUGH',
                user: cds.context?.user?.id,
                tenant: cds.context?.tenant,
                locale: cds.context?.locale,
                metadata: JSON.stringify({
                    functionName: asyncFunction.name || 'anonymous',
                    args: args,
                    cacheKey: cacheKey
                }),
                cacheOptions: JSON.stringify(options)
            };

            // Safely check if key exists in cache
            const hasKeyResult = await this.safeCacheOperation(
                () => this.cache.has(cacheKey),
                'has',
                { key: cacheKey, functionName: asyncFunction.name || 'anonymous' }
            );

            const hasKey = hasKeyResult.success && hasKeyResult.result;
            const cacheErrors = [];

            if (hasKey) {
                const latency = this.getElapsedMs(startTime);
                
                // Safely record hit statistics
                const hitStatsResult = await this.safeCacheOperation(
                    () => this.statistics.recordHit(latency, cacheKey, metadata),
                    'recordHit',
                    { key: cacheKey, latency }
                );
                if (!hitStatsResult.success) {
                    cacheErrors.push(hitStatsResult.error);
                }

                // Safely get value from cache
                const getResult = await this.safeCacheOperation(
                    () => this.cache.send("GET", { key: cacheKey }),
                    'get',
                    { key: cacheKey }
                );

                if (getResult.success && getResult.result?.value !== undefined) {
                    return { 
                        result: getResult.result.value, 
                        cacheKey, 
                        metadata: { hit: true, latency },
                        cacheErrors: cacheErrors
                    };
                }
            }

            // Cache miss or cache error - delegate to underlying function
            try {
                const response = await asyncFunction(...args);
                const latency = this.getElapsedMs(startTime);
                
                // Safely record miss statistics
                const missStatsResult = await this.safeCacheOperation(
                    () => this.statistics.recordMiss(latency, cacheKey, metadata),
                    'recordMiss',
                    { key: cacheKey, latency }
                );
                if (!missStatsResult.success) {
                    cacheErrors.push(missStatsResult.error);
                }

                // Safely store in cache
                const wrappedValue = {
                    value: response,
                    tags: options.tags || [],
                    timestamp: Date.now()
                };
                
                const setResult = await this.safeCacheOperation(
                    () => this.cache.send("SET", { key: cacheKey, value: wrappedValue, ttl: options.ttl || 0 }),
                    'set',
                    { key: cacheKey, ttl: options.ttl }
                );
                if (!setResult.success) {
                    cacheErrors.push(setResult.error);
                }

                return { 
                    result: response, 
                    cacheKey, 
                    metadata: { hit: false, latency },
                    cacheErrors: cacheErrors
                };
            } catch (functionError) {
                // If the underlying function fails, throw the error
                this.log.error('Function execution failed:', {
                    error: functionError.message,
                    functionName: asyncFunction.name || 'anonymous',
                    key: cacheKey
                });
                throw functionError;
            }
        }
    }

    /**
     * Executes an async function and caches its result
     * @param {string} key - the key to cache
     * @param {function} asyncFunction - the async function to execute
     * @param {Array} args - function arguments
     * @param {object} options - additional options
     * @returns {Promise<any>} - the result
     */
    async exec(key, asyncFunction, args = [], options = {}) {
        // Create dynamic key based on function arguments
        const cacheKey = this.createDynamicKey(key, args, options, asyncFunction.name || 'anonymous');

        const startTime = process.hrtime();

        const metadata = {
            dataType: 'Function',
            operation: 'EXEC',
            operationType: 'READ_THROUGH',
            user: cds.context?.user?.id,
            tenant: cds.context?.tenant,
            locale: cds.context?.locale,
            metadata: JSON.stringify({
                functionName: asyncFunction.name || 'anonymous',
                args: args,
                cacheKey: cacheKey
            }),
            cacheOptions: JSON.stringify(options)
        };

        // Safely check if key exists in cache
        const hasKeyResult = await this.safeCacheOperation(
            () => this.cache.has(cacheKey),
            'has',
            { key: cacheKey, functionName: asyncFunction.name || 'anonymous' }
        );

        const hasKey = hasKeyResult.success && hasKeyResult.result;
        const cacheErrors = [];

        if (hasKey) {
            const latency = this.getElapsedMs(startTime);
            
            // Safely record hit statistics
            const hitStatsResult = await this.safeCacheOperation(
                () => this.statistics.recordHit(latency, cacheKey, metadata),
                'recordHit',
                { key: cacheKey, latency }
            );
            if (!hitStatsResult.success) {
                cacheErrors.push(hitStatsResult.error);
            }

            // Safely get value from cache
            const getResult = await this.safeCacheOperation(
                () => this.cache.send("GET", { key: cacheKey }),
                'get',
                { key: cacheKey }
            );

            if (getResult.success && getResult.result?.value !== undefined) {
                return { 
                    result: getResult.result.value, 
                    cacheKey, 
                    metadata: { hit: true, latency },
                    cacheErrors: cacheErrors
                };
            }
        }

        // Cache miss or cache error - delegate to underlying function
        try {
            const response = await asyncFunction(...args);
            const latency = this.getElapsedMs(startTime);
            
            // Safely record miss statistics
            const missStatsResult = await this.safeCacheOperation(
                () => this.statistics.recordMiss(latency, cacheKey, metadata),
                'recordMiss',
                { key: cacheKey, latency }
            );
            if (!missStatsResult.success) {
                cacheErrors.push(missStatsResult.error);
            }

            // Safely store in cache
            const wrappedValue = {
                value: response,
                tags: options.tags || [],
                timestamp: Date.now()
            };
            
            const setResult = await this.safeCacheOperation(
                () => this.cache.send("SET", { key: cacheKey, value: wrappedValue, ttl: options.ttl || 0 }),
                'set',
                { key: cacheKey, ttl: options.ttl }
            );
            if (!setResult.success) {
                cacheErrors.push(setResult.error);
            }

            return { 
                result: response, 
                cacheKey, 
                metadata: { hit: false, latency },
                cacheErrors: cacheErrors
            };
        } catch (functionError) {
            // If the underlying function fails, throw the error
            this.log.error('Function execution failed:', {
                error: functionError.message,
                functionName: asyncFunction.name || 'anonymous',
                key: cacheKey
            });
            throw functionError;
        }
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

module.exports = AsyncOperations; 