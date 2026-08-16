const crypto = require('crypto');
const { canonicalizeQuery } = require('./queryCanonicalizer');

/**
 * Manages cache key generation and creation
 */
class KeyManager {
    constructor(runtimeConfigManager) {
        this.createHash = (data) => crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
        this.runtimeConfigManager = runtimeConfigManager;
    }

    /**
     * Create a cache key from various input types
     * @param {string|object} keyOrObject - Key string or object to create key from
     * @param {object} additionalContext - Additional context to include in the key
     * @param {string} key - Optional key string to override default
     * @returns {string} - Generated cache key
     */
    createKey(keyOrObject, additionalContext = {}, key = null) {
        // Use provided key or get default from configuration
        const keyTemplate = key || this.runtimeConfigManager.getDefaultKeyTemplate();
        
        // Create content hash from the object being cached
        let contentHash = '';
        if (typeof keyOrObject === "string") {
            // For strings, use the string itself as the hash
            contentHash = keyOrObject;
        } else if (typeof keyOrObject === "object" && keyOrObject !== null) {
            contentHash = this.createContentHash(keyOrObject);
            // If contentHash is undefined, the object should not be cached
            if (contentHash === undefined) {
                return undefined;
            }
        } else {
            contentHash = this.createHash({ content: keyOrObject });
        }

        // Get context values
        const contextVars = {
            tenant: additionalContext.tenant || cds.context?.tenant || 'global',
            user: additionalContext.user || (cds.context?.user?.id || cds.context?.user) || 'anonymous',
            locale: additionalContext.locale || cds.context?.locale || 'en',
            hash: contentHash,
            baseKey: additionalContext.baseKey || ''
        };

        // Handle argument placeholders for async functions
        if (additionalContext.args && Array.isArray(additionalContext.args)) {
            additionalContext.args.forEach((arg, index) => {
                contextVars[`args[${index}]`] = this.serializeArgument(arg);
            });
        }

        // Replace placeholders in template
        return keyTemplate.replace(
            /\{(tenant|user|locale|hash|baseKey|args\[\d+\])\}/g,
            (match, variable) => {
                if (variable.startsWith('args[')) {
                    return contextVars[variable] || '';
                }
                return contextVars[variable] || '';
            }
        );
    }

    /**
     * Create a hash from the content being cached (without context)
     * @param {object} keyOrObject - Object to create hash from
     * @returns {string} - Generated hash
     */
    createContentHash(keyOrObject) {
        if (typeof keyOrObject === "string") {
            return this.createHash({ content: keyOrObject });
        }

        if (typeof keyOrObject === "object" && keyOrObject !== null) {
            switch (keyOrObject.constructor.name) {
                case "Request":
                case "NoaRequest":
                case "ODataRequest":
                    // Both the HTTP URL and the effective query contribute.
                    //
                    // The URL carries the OData query options ($filter, $select,
                    // $orderby) as a plain string. It is not sufficient on its
                    // own: a `where` clause contributed by @restrict or by a
                    // custom handler exists only in the CQN, so hashing the URL
                    // alone makes two users' differently-filtered reads of the
                    // same URL collide on one entry.
                    //
                    // The CQN is not sufficient either. For HCQL and MCP the
                    // query travels in the request body and the URL is just the
                    // endpoint path, while for OData the adapter may keep SELECT
                    // clauses on the prototype chain where JSON.stringify cannot
                    // see them. `canonicalizeQuery` reads the clauses explicitly
                    // and orders them deterministically; see queryCanonicalizer.
                    const url = this.normalizeUrl(keyOrObject._?.req?.url || keyOrObject.http?.req?.url);
                    return this.createHash({
                        method: keyOrObject.method,
                        path: keyOrObject.path || keyOrObject.http?.req?.path,
                        url,
                        data: keyOrObject.data,
                        params: keyOrObject.params,
                        query: canonicalizeQuery(keyOrObject.query),
                        event: keyOrObject.event,
                        target: keyOrObject.target?.name
                    });
                case "cds.ql":
                    if (keyOrObject.SELECT) {
                        return this.createHash({ query: canonicalizeQuery(keyOrObject) });
                    } else {
                        // Non-SELECT queries should not be cached
                        return undefined;
                    }
                default:
                    // A CQN-shaped plain object is not a cds.ql instance but still
                    // has to hash by its clauses, so a prototype-borne where is
                    // not lost on this path either.
                    if (keyOrObject.SELECT !== undefined) {
                        return this.createHash({ query: canonicalizeQuery(keyOrObject) });
                    }
                    return this.createHash({ content: keyOrObject });
            }
        }

        return this.createHash({ content: keyOrObject });
    }

    /**
     * Normalize a URL by sorting its query parameters alphabetically by key.
     * Ensures the same parameters in different order produce the same cache key.
     * @param {string} url - URL string to normalize
     * @returns {string|undefined} - Normalized URL or undefined if input is falsy
     */
    normalizeUrl(url) {
        if (!url) return undefined;
        try {
            const urlObj = new URL(url, 'http://localhost');
            urlObj.searchParams.sort();
            return urlObj.pathname + (urlObj.searchParams.size ? '?' + urlObj.searchParams.toString() : '');
        } catch {
            return url;
        }
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