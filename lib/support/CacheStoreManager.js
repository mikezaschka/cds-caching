const { Keyv } = require('keyv');
const { requireOptional, requireAnyOptional } = require('./optionalRequire');

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
        const cacheOptions = this._createCacheOptions(options, cacheName, store);
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
                // Support both adapters:
                // - @keyv/sqlite (default export)
                // - @resolid/keyv-sqlite (named export KeyvSqlite) https://github.com/huijiewei/keyv-sqlite
                const sqliteMod = requireAnyOptional(['@keyv/sqlite', '@resolid/keyv-sqlite'], { feature: 'store', value: 'sqlite' });
                const KeyvSqlite = sqliteMod?.KeyvSqlite ?? sqliteMod?.default ?? sqliteMod;
                return new KeyvSqlite({
                    url: options.credentials?.url,
                    table: options.credentials?.table || 'cache',
                    busyTimeout: options.credentials?.busyTimeout || 10000
                });
            case "redis":
                const KeyvRedis = requireOptional('@keyv/redis', { feature: 'store', value: 'redis' });
                const store = new KeyvRedis({
                    ...options.credentials,
                    ...(options.credentials?.uri ? { url: options.credentials?.uri } : {}),
                    ...{ throwOnConnectErrors: options.throwOnErrors, useKeyPrefix: false, throwOnErrors: options.throwOnErrors }
                });

                // see https://keyv.org/docs/storage-adapters/redis/#gracefully-handling-errors-and-timeouts for more details
                if (options.throwOnErrors) {
                    store.throwOnConnectErrors = false; // We want to handle the errors ourselves
                    store.throwOnErrors = true; // Redis will throw errors for connection issues, etc.
                    const redisClient = store.client;
                    if (redisClient.options) {
                        redisClient.options.disableOfflineQueue = true;
                        if (redisClient.options.socket) {
                            redisClient.options.socket.reconnectStrategy = false; // Disable automatic reconnection
                        }
                    }
                }

                return store;
            case "postgres":
                const KeyvPostgres = requireOptional('@keyv/postgres', { feature: 'store', value: 'postgres' });
                return new KeyvPostgres({
                    ...options.credentials,
                    ...(options.credentials?.url ? { uri: options.credentials?.url } : options.credentials?.uri ? { url: options.credentials?.uri } : {}),
                    ...(options.credentials?.schema ? { schema: options.credentials?.schema } : {}),
                    ...(options.credentials?.table ? { table: options.credentials?.table } : {}),
                    ...{ throwOnConnectErrors: options.throwOnErrors, useKeyPrefix: false, throwOnErrors: options.throwOnErrors }
                });
            case "hana":
                const KeyvHana = requireOptional('keyv-hana', { feature: 'store', value: 'hana' });
                // BTP HANA service bindings use "user"/"password"; keyv-hana expects "uid"/"pwd"
                return new KeyvHana({
                    host: options.credentials?.host,
                    port: options.credentials?.port,
                    uid: options.credentials?.uid || options.credentials?.user,
                    pwd: options.credentials?.pwd || options.credentials?.password,
                    schema: options.credentials?.schema,
                    table: options.credentials?.table || 'KEYV',
                    keySize: options.credentials?.keySize || 255,
                    createTable: options.credentials?.createTable ?? false,
                    connectOptions: {
                        ...(options.credentials?.certificate ? { ca: options.credentials.certificate } : {}),
                        ...(options.credentials?.encrypt !== undefined ? { encrypt: options.credentials.encrypt } : {}),
                        ...(options.credentials?.sslValidateCertificate !== undefined ? { sslValidateCertificate: options.credentials.sslValidateCertificate } : {}),
                        ...options.credentials?.connectOptions,
                    },
                });
            default:
                return new Map();
        }
    }

    /**
     * Create cache options object
     * @private
     */
    _createCacheOptions(options, cacheName, store) {
        return {
            namespace: options.namespace || cacheName,
            store,
            compression: this._createCompression(options.compression),
            useKeyPrefix: store.constructor.name === 'KeyvRedis' ? false : true // see https://github.com/mikezaschka/cds-caching/issues/11
        };
    }

    /**
     * Create compression instance if specified
     * @private
     */
    _createCompression(compressionType) {
        switch (compressionType) {
            case "lz4":
                const KeyvLz4 = requireOptional('@keyv/compress-lz4', { feature: 'compression', value: 'lz4' });
                return new KeyvLz4();
            case "gzip":
                const KeyvGzip = requireOptional('@keyv/compress-gzip', { feature: 'compression', value: 'gzip' });
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