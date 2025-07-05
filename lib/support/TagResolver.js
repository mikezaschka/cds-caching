const crypto = require('crypto');

/**
 * Manages cache tag resolution and generation
 */
class TagResolver {
    constructor() {
        this.createHash = (data) => crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
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
                const hashParts = [
                    ...(data ? [data] : []),
                    ...(params ? [params] : [])
                ];

                const contextVars = {
                    tenant: params.tenant || 'global',
                    user: params.user || 'anonymous',
                    locale: params.locale || 'en',
                    hash: this.createHash(hashParts)
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
}

module.exports = TagResolver; 