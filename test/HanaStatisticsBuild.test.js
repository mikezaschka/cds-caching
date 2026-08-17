const cds = require('@sap/cds');
const { path } = cds.utils;

describe('HANA statistics build artifacts', () => {
    it('compiles db/statistics.cds to hdbtable artifacts for Caches/Metrics/KeyMetrics', async () => {
        const modelPath = path.join(__dirname, '..', 'db', 'statistics');
        const model = await cds.load(modelPath);
        const artifacts = cds.compile.to.hdbtable(model);

        const files = [];
        for (const [content, key] of artifacts) {
            const file = key.file || `${key.name}${key.suffix || ''}`;
            files.push(file);
            expect(content && content.length > 0).toBe(true);
        }

        const joined = files.join(' ');
        expect(files.some(f => /Caches\.hdbtable$/i.test(f) || f.endsWith('Caches.hdbtable'))).toBe(true);
        expect(/Metrics/i.test(joined)).toBe(true);
        expect(/KeyMetrics/i.test(joined)).toBe(true);
        // Service projections are redirected via @cds.persistence.name — no HDI views needed
        expect(files.some(f => /\.hdbview$/i.test(f))).toBe(false);
    });

    it('CachingApiService projections pin persistence to base table names', async () => {
        const modelPath = path.join(__dirname, '..', 'index');
        const model = await cds.load(modelPath);
        const caches = model.definitions['plugin.cds_caching.CachingApiService.Caches'];
        const metrics = model.definitions['plugin.cds_caching.CachingApiService.Metrics'];
        const keyMetrics = model.definitions['plugin.cds_caching.CachingApiService.KeyMetrics'];
        expect(caches['@cds.persistence.name']).toBe('plugin_cds_caching_Caches');
        expect(metrics['@cds.persistence.name']).toBe('plugin_cds_caching_Metrics');
        expect(keyMetrics['@cds.persistence.name']).toBe('plugin_cds_caching_KeyMetrics');
    });

    it('hasTask predicate is true for redis store + metrics on HANA db', () => {
        const prevRequires = cds.env.requires;
        try {
            cds.env.requires = {
                db: { kind: 'hana' },
                caching: {
                    impl: 'cds-caching',
                    store: 'redis',
                    metrics: { enabled: true },
                },
            };

            const { getCachingRequiresEntries, isMetricsConfigured } = require('../lib/config-normalizer');
            const { projectImportsCachingApi } = require('../lib/plugin-roots');
            const requires = cds.env.requires;
            const dbKind = requires.db?.kind || '';
            const isHanaDB = dbKind === 'hana' || dbKind === 'sql' || dbKind === 'hana-mt';
            expect(isHanaDB).toBe(true);

            const cachingConfigs = Object.values(requires).filter(r => r?.impl === 'cds-caching');
            const entries = getCachingRequiresEntries(requires);
            const needsStoreArtifacts = cachingConfigs.some(r => r.store === 'hana' || r.store === 'cds');
            const needsStatistics = entries.some(e => isMetricsConfigured(e.normalized) || e.normalized.reuse?.api || e.normalized.reuse?.dashboard)
                || projectImportsCachingApi(cds.root, cds.env.folders?.srv || 'srv');

            expect(needsStoreArtifacts).toBe(false);
            expect(needsStatistics).toBe(true);
            expect(isHanaDB && (needsStoreArtifacts || needsStatistics)).toBe(true);
        } finally {
            cds.env.requires = prevRequires;
        }
    });
});
