/**
 * Manages async cache operations for function wrapping and execution
 */
class AsyncOperations {
    constructor(cache, keyManager, statistics, runtimeConfigManager) {
        this.cache = cache;
        this.keyManager = keyManager;
        this.statistics = statistics;
        this.runtimeConfigManager = runtimeConfigManager;
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

            if (await this.cache.has(cacheKey)) {
                const latency = this.getElapsedMs(startTime);
                this.statistics.recordHit(latency, cacheKey, metadata);

                const result = await this.cache.send("GET", { key: cacheKey });
                return { result: result?.value || result, cacheKey, metadata: { hit: true, latency } };
            } else {
                const response = await asyncFunction(...args);
                const latency = this.getElapsedMs(startTime);
                this.statistics.recordMiss(latency, cacheKey, metadata);

                const wrappedValue = {
                    value: response,
                    tags: options.tags || [],
                    timestamp: Date.now()
                };
                await this.cache.send("SET", { key: cacheKey, value: wrappedValue, ttl: options.ttl || 0 });

                return { result: response, cacheKey, metadata: { hit: false, latency } };
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

        if (await this.cache.has(cacheKey)) {
            const latency = this.getElapsedMs(startTime);
            this.statistics.recordHit(latency, cacheKey, metadata);
            const result = await this.cache.send("GET", { key: cacheKey });
            return { result: result?.value || result, cacheKey, metadata: { hit: true, latency } };
        } else {
            const response = await asyncFunction(...args);
            const latency = this.getElapsedMs(startTime);
            this.statistics.recordMiss(latency, cacheKey, metadata);

            const wrappedValue = {
                value: response,
                tags: options.tags || [],
                timestamp: Date.now()
            };
            await this.cache.send("SET", { key: cacheKey, value: wrappedValue, ttl: options.ttl || 0 });

            return { result: response, cacheKey, metadata: { hit: false, latency } };
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