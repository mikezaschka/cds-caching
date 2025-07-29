const { Keyv } = require('keyv');
const { default: KeyvRedis } = require('@keyv/redis');
const { default: KeyvSqlite } = require('@keyv/sqlite');
const { default: KeyvLz4 } = require('@keyv/compress-lz4');
const { default: KeyvGzip } = require('@keyv/compress-gzip');

/**
 * Manages cache store initialization and configuration
 */
class CacheStoreManager {
    constructor(options = {}) {
        this.options = options;
        this.log = cds.log('cds-caching')
    }

    /**
     * Create and configure the cache store based on options
     * @param {object} options - Cache configuration options
     * @param {string} cacheName - Name of the cache for logging
     * @returns {object} - Configured Keyv instance and cleanup function
     */
    createStore(options, cacheName) {
        const store = this._createStoreInstance(options);
        const cacheOptions = this._createCacheOptions(options, cacheName);
        const cache = new Keyv(cacheOptions);
        cache.throwOnErrors = options.throwOnErrors;

        // Set up error handling
        cache.on('error', err => {
            this.log.error(`Cache error for ${cacheName}:`, err);
        });

        // Set up cleanup function
        const cleanup = this._createCleanupFunction(store, cacheName);

        return { cache, cleanup };
    }

    /**
     * Create the appropriate store instance based on configuration
     * @private
     */
    _createStoreInstance(options) {
        switch (options.store) {
            case "sqlite":
                return new KeyvSqlite({
                    url: options.credentials?.url,
                    table: options.credentials?.table || 'cache',
                    busyTimeout: options.credentials?.busyTimeout || 10000
                });
            case "redis":
                const store = new KeyvRedis({
                    ...options.credentials,
                    ...(options.credentials?.uri ? { url: options.credentials?.uri } : {}),
                    ...{ throwOnConnectErrors: options.throwOnErrors, useKeyPrefix: false, throwOnErrors: options.throwOnErrors }
                });

                if (options.throwOnErrors) {
                    store.throwOnConnectErrors = false; // We want to handle the errors ourselves
                    store.throwOnErrors = true;
                    const redisClient = store.client;
                    if (redisClient.options) {
                        redisClient.options.disableOfflineQueue = true;
                        if (redisClient.options.socket) {
                            redisClient.options.socket.reconnectStrategy = false;
                        }
                    }
                }

                return store;
            default:
                return new Map();
        }
    }

    /**
     * Create cache options object
     * @private
     */
    _createCacheOptions(options, cacheName) {
        return {
            namespace: options.namespace || cacheName,
            store: this._createStoreInstance(options),
            compression: this._createCompression(options.compression)
        };
    }

    /**
     * Create compression instance if specified
     * @private
     */
    _createCompression(compressionType) {
        switch (compressionType) {
            case "lz4":
                return new KeyvLz4();
            case "gzip":
                return new KeyvGzip();
            default:
                return undefined;
        }
    }

    /**
     * Create cleanup function for the store
     * @private
     */
    _createCleanupFunction(store, cacheName) {
        return async () => {
            if (store?.disconnect) {
                try {
                    await store.disconnect();
                } catch (err) {
                    this.log.error(`Error disconnecting from store for ${cacheName}:`, err);
                }
            }
        };
    }
}

module.exports = CacheStoreManager; 