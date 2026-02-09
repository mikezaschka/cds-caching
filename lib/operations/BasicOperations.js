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

    _keyv() {
        // The underlying Keyv instance is stored on the CachingService as `this.cache`
        // (see `CachingService.init()` where `this.cache = new Keyv(...)`).
        const keyv = this.cache?.cache;
        if (!keyv) {
            throw new Error('cds-caching: Keyv store not initialized on caching service');
        }
        return keyv;
    }

    /**
     * Set a value in the cache
     * @param {string|object} key - the key to set
     * @param {any} value - the value to cache
     * @param {object} options - cache options
     * @returns {Promise<void>}
     */
    async set(key, value, options = {}, tx = null) {
        const wrappedValue = {
            value,
            tags: this.tagResolver.resolveTags(options.tags, value, options.params) || [],
            timestamp: Date.now()
        };
        const createdKey = this.keyManager.createKey(key, {}, options.key);
        // If no key was created, the input should not be cached (e.g. non-SELECT CQN)
        if (!createdKey) return;
        const srv = tx || this.cache;
        await srv.send('SET', {
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
    async get(key, tx = null) {
        const createdKey = this.keyManager.createKey(key);
        
        // If not key was created, return undefined
        if(!createdKey) {
            return undefined;
        }

        const srv = tx || this.cache;
        const wrappedValue = await srv.send('GET', {
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
    async has(key, tx = null) {
        const createdKey = this.keyManager.createKey(key);
        if (!createdKey) return false;
        try {
            // Intentionally bypass CAP service/transaction handling here.
            // This avoids coupling to the caller's request tx (which might already be rolled back)
            // and makes `has()` safe to call even in concurrent BEFORE handlers.
            return await this._keyv().has(createdKey);
        } catch (error) {
            if (this.cache.options.throwOnErrors) {
                throw error;
            } else {
                return false; // We don't want to throw errors here
            }
        }
    }

    /**
     * Delete a key from the cache
     * @param {string|object} key - the key to delete
     * @returns {Promise<boolean>} - whether the key was deleted
     */
    async delete(key, tx = null) {
        const createdKey = this.keyManager.createKey(key);
        if (!createdKey) return false;
        const srv = tx || this.cache;
        const result = await srv.send('DELETE', {
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
    async clear(tx = null) {
        const srv = tx || this.cache;
        await srv.send('CLEAR', {
            deleteAll: true
        });

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
    async deleteByTag(tag, tx = null) {
        // Iterate directly on the underlying store to avoid recursion via CachingService.iterator()
        for await (const [key, wrappedValue] of this.iterator()) {
            if (wrappedValue?.tags?.includes(tag)) {
                await this.delete(key, tx);
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
    async metadata(key, tx = null) {
        const createdKey = this.keyManager.createKey(key);
        if (!createdKey) return null;
        const srv = tx || this.cache;
        const wrappedValue = await srv.send('GET', {
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
    async tags(key, tx = null) {
        const createdKey = this.keyManager.createKey(key);
        if (!createdKey) return [];
        const srv = tx || this.cache;
        const wrappedValue = await srv.send('GET', {
            key: createdKey
        });
        return wrappedValue?.tags || [];
    }

    /**
     * Get a raw value from the cache without statistics tracking
     * @param {string|object} key - the key to get
     * @returns {Promise<any>} - the raw cached value
     */
    async getRaw(key, tx = null) {
        const createdKey = this.keyManager.createKey(key);
        if (!createdKey) return undefined;
        const srv = tx || this.cache;
        const wrappedValue = await srv.send('GET', {
            key: createdKey
        });
        return wrappedValue?.value;
    }

    /**
     * Iterator for all cache entries
     * @returns {AsyncIterator} - iterator for cache entries
     */
    async *iterator(tx = null) {
        // Iterate directly on Keyv to avoid recursion via CachingService.iterator()
        for await (const [key, value] of this._keyv().iterator()) {
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

    async setInTx(key, value, options = {}) {
        const tx = await this.cache.tx();
        try {
            await this.set(key, value, options, tx);
            await tx.commit();
            return;
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    }

    async getInTx(key) {
        const tx = await this.cache.tx();
        try {
            const value = await this.get(key, tx);
            await tx.commit();
            return value;
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    }

    async hasInTx(key) {
        // `has()` bypasses CAP tx handling on purpose, so opening a new transaction is unnecessary.
        return this.has(key);
    }

    async deleteInTx(key) {
        const tx = await this.cache.tx();
        try {
            const value = await this.delete(key, tx);
            await tx.commit();
            return value;
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    }

    async clearInTx() {
        const tx = await this.cache.tx();
        try {
            await this.clear(tx);
            await tx.commit();
            return;
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    }

    async deleteByTagInTx(tag) {
        const tx = await this.cache.tx();
        try {
            await this.deleteByTag(tag, tx);
            await tx.commit();
            return;
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    }

    async metadataInTx(key) {
        const tx = await this.cache.tx();
        try {
            const value = await this.metadata(key, tx);
            await tx.commit();
            return value;
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    }

    async tagsInTx(key) {
        const tx = await this.cache.tx();
        try {
            const value = await this.tags(key, tx);
            await tx.commit();
            return value;
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    }

    async getRawInTx(key) {
        const tx = await this.cache.tx();
        try {
            const value = await this.getRaw(key, tx);
            await tx.commit();
            return value;
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    }
}

module.exports = BasicOperations; 