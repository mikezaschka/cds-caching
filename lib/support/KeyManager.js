const crypto = require('crypto');

/**
 * Manages cache key generation and creation
 */
class KeyManager {
    constructor() {
        this.createHash = (data) => crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    }

    /**
     * Create a cache key from various input types
     * @param {string|object} keyOrObject - Key string or object to create key from
     * @param {object} additionalContext - Additional context to include in the key
     * @param {object} options - Key generation options
     * @returns {string} - Generated cache key
     */
    createKey(keyOrObject, additionalContext = {}, options = {}) {
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
                    return this.createCacheKey(
                        (!options.value && !options.template) ? { template: '{tenant}:{user}:{locale}:{hash}' } : options,
                        {
                            ...additionalContext,
                            req: keyOrObject,
                            params: keyOrObject.params,
                            data: keyOrObject.data,
                            locale: keyOrObject.locale,
                            user: keyOrObject.user?.id,
                            tenant: keyOrObject.tenant,
                            query: { ...(keyOrObject.query?.SELECT ? keyOrObject.query.SELECT : {}) }
                        }
                    );
                case "cds.ql":
                    if (keyOrObject.SELECT) {
                        return this.createCacheKey(
                            (!options.value && !options.template) ? { template: '{hash}' } : options,
                            { ...additionalContext, query: keyOrObject }
                        );
                    } else {
                        return undefined;
                    }
                default:
                    return this.createCacheKey(
                        (!options.value && !options.template) ? { template: '{hash}' } : options,
                        { ...additionalContext, data: keyOrObject }
                    );
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
        const { locale, user, tenant, req, args, functionName, baseKey, ...rest } = context;

        // If a static key value is provided, use it
        if (keyConfig.value) {
            return keyConfig.value;
        }

        let keyValue = '';

        // Handle template with placeholders
        if (keyConfig.template) {
            const contextVars = {
                ...(tenant ? { tenant: tenant } : { tenant: 'global' }),
                ...(user ? { user: user } : { user: 'anonymous' }),
                ...(locale ? { locale: locale } : { locale: 'en' }),
                ...(functionName ? { functionName: functionName } : {}),
                ...(baseKey ? { baseKey: baseKey } : {}),
                hash: this.createHash(rest)
            };

            // Handle argument placeholders for async functions
            if (args && Array.isArray(args)) {
                args.forEach((arg, index) => {
                    contextVars[`args[${index}]`] = this.serializeArgument(arg);
                });
            }

            keyValue = keyConfig.template.replace(
                /\{(tenant|user|locale|hash|functionName|baseKey|args\[\d+\])\}/g,
                (match, variable) => {
                    if (variable.startsWith('args[')) {
                        return contextVars[variable] || '';
                    }
                    return contextVars[variable] || '';
                }
            );
        }

        // If no key value generated, create hash from input
        if (!keyValue) {
            keyValue = this.createHash(rest);
        }

        // Combine with prefix/suffix
        return [
            keyConfig.prefix,
            keyValue,
            keyConfig.suffix
        ].filter(Boolean).join('');
    }

    /**
     * Serialize function arguments for cache key generation
     * @param {any} arg - argument to serialize
     * @returns {string} serialized argument
     */
    serializeArgument(arg) {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'number') return arg.toString();
        if (typeof arg === 'boolean') return arg.toString();
        if (Array.isArray(arg)) return `[${arg.map(a => this.serializeArgument(a)).join(',')}]`;
        if (typeof arg === 'object') {
            // For objects, create a stable string representation
            try {
                return this.createHash(arg);
            } catch (e) {
                return 'object';
            }
        }
        return String(arg);
    }
}

module.exports = KeyManager; 