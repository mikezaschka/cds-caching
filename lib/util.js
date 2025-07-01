const cds = require("@sap/cds")

const extractCacheProperties = (entity, prefix) => {
    const result = {};
    for (const key of Object.keys(entity)) {
        if (key.startsWith(`@cache.${prefix}.`)) {
            const subKey = key.substring(`@cache.${prefix}.`.length);
            result[subKey] = entity[key];
        }
    }
    // If there are no subproperties but the main property exists, use it directly
    if (Object.keys(result).length === 0 && entity[`@cache.${prefix}`]) {
        return entity[`@cache.${prefix}`];
    }
    return Object.keys(result).length > 0 ? result : undefined;
};


const getCachingServicesFromConfig = (srvs) => {
    const cachingServices = [];

    for (const [serviceName, serviceConfig] of Object.entries(srvs)) {
        if (serviceConfig && serviceConfig.constructor && serviceConfig.constructor.name === "CachingService") {

            const statistics = { ...serviceConfig.statistics } || {};
            delete statistics.stats;

            cachingServices.push({
                name: serviceName,
                impl: serviceConfig.impl || 'cds-caching',
                store: serviceConfig.store || 'memory',
                namespace: serviceConfig.namespace || serviceName,
                //statistics: statistics,
                //credentials: serviceConfig.credentials || {},
                //...serviceConfig
            })
        }
    };

    for (const [name, config] of Object.entries(cds.env.requires)) {
        if (config.impl === 'cds-caching') {
            if (cachingServices.find(service => service.name === name)) {
                continue;
            }

            const statistics = { ...config.statistics } || {};
            delete statistics.stats;

            cachingServices.push({
                name: name,
                impl: config.impl || 'cds-caching',
                store: config.store || 'memory',
                namespace: config.namespace || name,
                statistics: statistics,
            })
        }
    }

    return cachingServices;
}

const bindFunction = async (service, action, isBound = false) => {
    const cache = await cds.connect.to(action['@cache.service'] || "caching");
    cache.addCachableFunction(action.name.split('.').pop(), action, isBound);

    service.prepend(function () {
        service.on(action.name.split('.').pop(), async (req, next) => {
            const cache = await cds.connect.to(action['@cache.service'] || "caching");
            const data = await cache.run(req, next, {
                ttl: action['@cache.ttl'],
                tags: action['@cache.tags'],
                key: extractCacheProperties(action, 'key')
            });
            return data;
        })
    })
}

const bindEntity = async (service, entity) => {
    service.prepend(function () {
        service.on('READ', entity.name, async (req, next) => {
            const cache = await cds.connect.to(entity['@cache.service'] || "caching");
            const data = await cache.run(req, next, {
                ttl: entity['@cache.ttl'],
                tags: entity['@cache.tags'],
                key: extractCacheProperties(entity, 'key')
            });
            return data;
        })
    })
}

const createCacheEntry = async (cacheName, serviceConfig = {}) => {
    try {
        const db = await cds.connect.to('db');
        const { Caches } = db.entities('plugin.cds_caching');

        // Check if cache entry already exists
        const existingCache = await db.read(Caches).where({ name: cacheName });

        if (existingCache.length === 0) {
            // Create new cache entry
            const cacheEntry = {
                name: cacheName,
                config: JSON.stringify(serviceConfig)
            };

            await db.create(Caches).entries(cacheEntry);
            cds.log('cds-caching').info(`Created cache entry for: ${cacheName}`);
        } else {
            // Update existing cache entry
            await db.update(Caches)
                .set({ config: JSON.stringify(serviceConfig) })
                .where({ name: cacheName });
            cds.log('cds-caching').info(`Updated cache entry for: ${cacheName}`);
        }
    } catch (error) {
        cds.log('cds-caching').error(`Failed to create/update cache entry for ${cacheName}:`, error);
    }
};

const scanCachingAnnotations = async (srvs) => {
    LOG = cds.log('cds-caching')

    // Grep all app services
    const services = [];
    for (const [name, config] of Object.entries(srvs)) {

        const service = await cds.connect.to(name);
        if (service.definition?.kind === 'service') {
            services.push(service);
        }
    }

    // Grep all external services
    for (const [name, config] of Object.entries(cds.env.requires)) {
        if (config.kind === 'odata-v2' || config.kind === 'odata' || config.kind === 'rest') {
            const service = await cds.connect.to(name);
            services.push(service);
        }
    }

    for (const service of services) {
        let cacheConfig = {};

        // functions
        for (const [name, action] of Object.entries(service.actions)) {
            if (Object.keys(action).some(key => key.startsWith('@cache')) && action.kind === 'function') {
                LOG._debug && LOG.debug(`Caching enabled for function ${action.name}`);
                await bindFunction(service, action);

                // Collect cache configuration
                cacheConfig.functions = cacheConfig.functions || {};
                cacheConfig.functions[action.name] = {
                    ttl: action['@cache.ttl'],
                    tags: action['@cache.tags'],
                    key: extractCacheProperties(action, 'key')
                };
            }
        }

        // entities
        for (const entity of service.entities) {
            if (Object.keys(entity).some(key => key.startsWith('@cache'))) {
                await bindEntity(service, entity);
                LOG._debug && LOG.debug(`Caching enabled for entity ${entity.name}`);

                // Collect cache configuration
                cacheConfig.entities = cacheConfig.entities || {};
                cacheConfig.entities[entity.name] = {
                    ttl: entity['@cache.ttl'],
                    tags: entity['@cache.tags'],
                    key: extractCacheProperties(entity, 'key')
                };
            }

            // bound functions
            for (const [name, action] of Object.entries(entity.actions || {})) {
                if (Object.keys(action).some(key => key.startsWith('@cache')) && action.kind === 'function') {
                    bindFunction(service, action, true);
                    LOG._debug && LOG.debug(`Caching enabled for bound function ${action.name}`);

                    // Collect cache configuration
                    cacheConfig.boundFunctions = cacheConfig.boundFunctions || {};
                    cacheConfig.boundFunctions[`${entity.name}.${action.name}`] = {
                        ttl: action['@cache.ttl'],
                        tags: action['@cache.tags'],
                        key: extractCacheProperties(action, 'key')
                    };
                }
            }
        }
    }

    const cachingServices = getCachingServicesFromConfig(srvs);
    for (const service of cachingServices) {
        await createCacheEntry(service.name, service);
    }
}

module.exports = { scanCachingAnnotations }