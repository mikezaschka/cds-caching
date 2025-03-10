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

            console.log(entity);

            const data = await cache.run(req, next, {
                ttl: entity['@cache.ttl'], 
                tags: entity['@cache.tags'], 
                key: extractCacheProperties(entity, 'key')
            });
            return data;
        })
    })
}

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

        // functions
        for (const [name, action] of Object.entries(service.actions)) {
            if (Object.keys(action).some(key => key.startsWith('@cache')) && action.kind === 'function') {
                LOG._debug && LOG.debug(`Caching enabled for function ${action.name}`);
                await bindFunction(service, action);
            }
        }

        // entities
        for (const entity of service.entities) {
            if (Object.keys(entity).some(key => key.startsWith('@cache'))) {
                await bindEntity(service, entity);
                LOG._debug && LOG.debug(`Caching enabled for entity ${entity.name}`);
            }

            // bound functions
            for (const [name, action] of Object.entries(entity.actions || {})) {
                if (Object.keys(action).some(key => key.startsWith('@cache')) && action.kind === 'function') {
                    bindFunction(service, action, true);
                    LOG._debug && LOG.debug(`Caching enabled for bound function ${action.name}`);
                }
            }
        }
    }
}

module.exports = { scanCachingAnnotations }