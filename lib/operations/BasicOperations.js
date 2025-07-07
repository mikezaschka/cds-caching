/**
 * Manages basic cache operations with statistics tracking
 */
class BasicOperations {
    constructor(cache, keyManager, tagResolver, statistics) {
        this.cache = cache;
        this.keyManager = keyManager;
        this.tagResolver = tagResolver;
        this.statistics = statistics;
    }

    /**
     * Set a value in the cache
     * @param {string|object} key - the key to set
     * @param {any} value - the value to cache
     * @param {object} options - cache options
     * @returns {Promise<void>}
     */
    async set(key, value, options = {}) {
        const wrappedValue = {
            value,
            tags: this.tagResolver.resolveTags(options.tags, value, options.params) || [],
            timestamp: Date.now()
        };
        const createdKey = this.keyManager.createKey(key, {}, options.key);
        await this.cache.send('SET', {
            key: createdKey,
            value: wrappedValue,
            ttl: options.ttl || 0
        });

        const metadata = {
            dataType: 'Operation',
            operation: 'SET',
            operationType: 'BASIC',
            metadata: JSON.stringify({ key: createdKey, ttl: options.ttl || 0 }),
            cacheOptions: JSON.stringify(options)
        };
        this.statistics.recordNativeSet(createdKey, metadata);
    }

    /**
     * Get a value from the cache
     * @param {string|object} key - the key to get
     * @returns {Promise<any>} - the cached value
     */
    async get(key) {
        const createdKey = this.keyManager.createKey(key);
        const wrappedValue = await this.cache.send('GET', {
            key: createdKey
        });

        // Record the native get operation
        const metadata = {
            dataType: 'Operation',
            operation: 'GET',
            operationType: 'BASIC',
            metadata: JSON.stringify({ key: createdKey })
        };
        const isHit = wrappedValue !== undefined && wrappedValue !== null;
        this.statistics.recordNativeGet(createdKey, isHit, metadata);

        return wrappedValue?.value;
    }

    /**
     * Check if a key exists in the cache
     * @param {string|object} key - the key to check
     * @returns {Promise<boolean>} - whether the key exists
     */
    async has(key) {
        const createdKey = this.keyManager.createKey(key);
        return this.cache.cache.has(createdKey);
    }

    /**
     * Delete a key from the cache
     * @param {string|object} key - the key to delete
     * @returns {Promise<boolean>} - whether the key was deleted
     */
    async delete(key) {
        const createdKey = this.keyManager.createKey(key);
        const result = await this.cache.send('DELETE', {
            key: createdKey
        });

        // Record the native delete operation
        const metadata = {
            dataType: 'Operation',
            operation: 'DELETE',
            operationType: 'BASIC',
            metadata: JSON.stringify({ key: createdKey })
        };
        this.statistics.recordNativeDelete(createdKey, metadata);

        return result;
    }

    /**
     * Clear all cache entries
     * @returns {Promise<void>}
     */
    async clear() {
        await this.cache.send('CLEAR');

        // Record the native clear operation
        const metadata = {
            dataType: 'Operation',
            operation: 'CLEAR',
            operationType: 'BASIC',
            metadata: JSON.stringify({ cache: this.cache.name })
        };
        this.statistics.recordNativeClear(metadata);

    }

    /**
     * Delete all keys that have a specific tag
     * @param {string} tag - the tag to match
     * @returns {Promise<void>}
     */
    async deleteByTag(tag) {
        for await (const [key, wrappedValue] of this.iterator()) {
            if (wrappedValue?.tags?.includes(tag)) {
                await this.delete(key);
            }
        }

        // Record the native deleteByTag operation
        const metadata = {
            dataType: 'Operation',
            operation: 'DELETE_BY_TAG',
            operationType: 'BASIC',
            metadata: JSON.stringify({ tag: tag, cache: this.cache.name })
        };
        this.statistics.recordNativeDeleteByTag(tag, metadata);

    }

    /**
     * Get metadata for a key
     * @param {string|object} key - the key to get metadata for
     * @returns {Promise<object|null>} - the metadata or null if not found
     */
    async metadata(key) {
        const createdKey = this.keyManager.createKey(key);
        const wrappedValue = await this.cache.send('GET', {
            key: createdKey
        });
        if (!wrappedValue) return null;

        const { value, ...metadata } = wrappedValue;
        return metadata;
    }

    /**
     * Get tags for a key
     * @param {string|object} key - the key to get tags for
     * @returns {Promise<string[]>} - the tags
     */
    async tags(key) {
        const createdKey = this.keyManager.createKey(key);
        const wrappedValue = await this.cache.send('GET', {
            key: createdKey
        });
        return wrappedValue?.tags || [];
    }

    /**
     * Get a raw value from the cache without statistics tracking
     * @param {string|object} key - the key to get
     * @returns {Promise<any>} - the raw cached value
     */
    async getRaw(key) {
        const createdKey = this.keyManager.createKey(key);
        const wrappedValue = await this.cache.send('GET', {
            key: createdKey
        });
        return wrappedValue?.value;
    }

    /**
     * Iterator for all cache entries
     * @returns {AsyncIterator} - iterator for cache entries
     */
    async *iterator() {
        for await (const [key, value] of this.cache.cache.iterator()) {
            if (typeof value === "string") {
                try {
                    yield [key, JSON.parse(value)];
                } catch (error) {
                    yield [key, value];
                }
            } else {
                yield [key, value];
            }
        }
    }
}

module.exports = BasicOperations; 