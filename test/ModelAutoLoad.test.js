const cds = require('@sap/cds')
const { GET, expect } = cds.test().in(__dirname + '/app')

describe('Model Auto-Loading', () => {

    // The test app has:
    //   caching        → statistics configured  → should auto-load db/statistics.cds
    //   caching-cds    → store: 'cds'           → should auto-load db/cache-store.cds
    //   app-service.cds → using from index.cds  → should load CachingApiService

    let cache;

    beforeAll(async () => {
        cache = await cds.connect.to('caching');
    })

    describe('statistics entities (auto-loaded via statistics config)', () => {

        it('should include Caches entity in cds.model', () => {
            expect(cds.model.definitions).to.have.property('plugin.cds_caching.Caches');
            const entity = cds.model.definitions['plugin.cds_caching.Caches'];
            expect(entity.kind).to.equal('entity');
            expect(entity.elements).to.have.property('name');
            expect(entity.elements).to.have.property('metricsEnabled');
            expect(entity.elements).to.have.property('keyMetricsEnabled');
        })

        it('should include Metrics entity in cds.model', () => {
            expect(cds.model.definitions).to.have.property('plugin.cds_caching.Metrics');
            const entity = cds.model.definitions['plugin.cds_caching.Metrics'];
            expect(entity.kind).to.equal('entity');
            expect(entity.elements).to.have.property('hits');
            expect(entity.elements).to.have.property('misses');
            expect(entity.elements).to.have.property('hitRatio');
        })

        it('should include KeyMetrics entity in cds.model', () => {
            expect(cds.model.definitions).to.have.property('plugin.cds_caching.KeyMetrics');
            const entity = cds.model.definitions['plugin.cds_caching.KeyMetrics'];
            expect(entity.kind).to.equal('entity');
            expect(entity.elements).to.have.property('keyName');
            expect(entity.elements).to.have.property('operationType');
        })

        it('should be resolvable via cds.entities', () => {
            const entities = cds.entities('plugin.cds_caching');
            expect(entities).to.have.property('Caches');
            expect(entities).to.have.property('Metrics');
            expect(entities).to.have.property('KeyMetrics');
        })
    })

    describe('CacheStore entity (auto-loaded via store: cds config)', () => {

        it('should include CacheStore entity in cds.model', () => {
            expect(cds.model.definitions).to.have.property('plugin.cds_caching.CacheStore');
            const entity = cds.model.definitions['plugin.cds_caching.CacheStore'];
            expect(entity.kind).to.equal('entity');
            expect(entity.elements).to.have.property('ID');
            expect(entity.elements).to.have.property('value');
            expect(entity.elements).to.have.property('expiresAt');
        })

        it('should be resolvable via cds.entities', () => {
            const entities = cds.entities('plugin.cds_caching');
            expect(entities).to.have.property('CacheStore');
        })
    })

    describe('CachingApiService (opt-in via using from)', () => {

        it('should include CachingApiService in cds.model', () => {
            expect(cds.model.definitions).to.have.property('plugin.cds_caching.CachingApiService');
            const service = cds.model.definitions['plugin.cds_caching.CachingApiService'];
            expect(service.kind).to.equal('service');
        })

        it('should expose Caches projection with bound actions', () => {
            const caches = cds.model.definitions['plugin.cds_caching.CachingApiService.Caches'];
            expect(caches).to.exist;
            expect(caches.kind).to.equal('entity');
            expect(caches.actions).to.have.property('getEntries');
            expect(caches.actions).to.have.property('setEntry');
            expect(caches.actions).to.have.property('clear');
            expect(caches.actions).to.have.property('setMetricsEnabled');
        })

        it('should expose Metrics and KeyMetrics as readonly projections', () => {
            expect(cds.model.definitions).to.have.property('plugin.cds_caching.CachingApiService.Metrics');
            expect(cds.model.definitions).to.have.property('plugin.cds_caching.CachingApiService.KeyMetrics');
        })
    })

    describe('no model property required on requires entries', () => {

        it('should not have model property on any caching requires entry', () => {
            for (const [name, config] of Object.entries(cds.env.requires)) {
                if (config.impl === 'cds-caching') {
                    expect(config.model, `requires.${name} should not have model property`).to.not.exist;
                }
            }
        })

        it('should still allow cds.connect.to for configured caching services', async () => {
            expect(cache).to.exist;
            expect(cache.constructor.name).to.equal('CachingService');
        })
    })
})
