const cds = require("@sap/cds")
const { isMultitenantMode } = require("./support/MultitenancyDetector")

let _modelAvailable = null;

const isPluginModelAvailable = () => {
    if (_modelAvailable !== null) return _modelAvailable;
    _modelAvailable = !!cds.model?.definitions?.['plugin.cds_caching.Caches'];
    return _modelAvailable;
};

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
            const { result, cacheKey } = await cache.rt.run(req, next, {
                ttl: action['@cache.ttl'],
                tags: action['@cache.tags'],
                key: extractCacheProperties(action, 'key')
            });
            return result;
        })
    })
}

const ENTITY_TAG_PREFIX = 'entity:';

const getEntityTag = (entity) => `${ENTITY_TAG_PREFIX}${entity.name}`;

const bindEntity = async (service, entity) => {
    const invalidateOnWrite = entity['@cache.invalidateOnWrite'];
    const entityTag = invalidateOnWrite ? getEntityTag(entity) : null;

    service.prepend(function () {
        service.on('READ', entity.name, async (req, next) => {
            const cache = await cds.connect.to(entity['@cache.service'] || "caching");

            const tags = [...(entity['@cache.tags'] || [])];
            if (entityTag) tags.push({ value: entityTag });

            const { result, cacheKey } = await cache.rt.run(req, next, {
                ttl: entity['@cache.ttl'],
                tags,
                key: extractCacheProperties(entity, 'key')
            });
            return result;
        })

        if (invalidateOnWrite) {
            const cudHandler = async (data, req) => {
                try {
                    const cache = await cds.connect.to(entity['@cache.service'] || "caching");
                    await cache.deleteByTag(entityTag);
                } catch (error) {
                    cds.log('cds-caching').warn(`Cache invalidation failed for ${entity.name}:`, error);
                }
            };
            service.after('CREATE', entity.name, cudHandler);
            service.after('UPDATE', entity.name, cudHandler);
            service.after('DELETE', entity.name, cudHandler);
        }
    })
}

const createCacheEntry = async (cacheName, serviceConfig = {}) => {
    if (!isPluginModelAvailable()) return;
    try {
        const db = await cds.connect.to('db');
        const { Caches } = cds.entities('plugin.cds_caching');

        const existingCache = await db.read(Caches).where({ name: cacheName });

        if (existingCache.length === 0) {
            await db.create(Caches).entries({
                name: cacheName,
                config: JSON.stringify(serviceConfig)
            });
            cds.log('cds-caching').info(`Created cache entry for: ${cacheName}`);
        } else {
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

    if (!isPluginModelAvailable()) {
        LOG.warn(
            `Plugin data model not compiled into cds.model. Database features (dashboard, metrics persistence, CDS store) are disabled. ` +
            `The model auto-loads when 'statistics' is configured or 'store: cds' is used. ` +
            `For the dashboard, add: using {plugin.cds_caching.CachingApiService} from 'cds-caching/index.cds';`
        );
    }

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
                    key: extractCacheProperties(entity, 'key'),
                    invalidateOnWrite: entity['@cache.invalidateOnWrite'] || false
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

    // In MTX mode, skip DB persistence at startup — no tenant context available.
    // Cache entries are informational (mirrors package.json config) and will be
    // created lazily via CachingApiService when a tenant accesses the dashboard.
    if (!isMultitenantMode()) {
        const cachingServices = getCachingServicesFromConfig(srvs);
        for (const service of cachingServices) {
            await createCacheEntry(service.name, service);
        }
    }
}

module.exports = { scanCachingAnnotations, isPluginModelAvailable }