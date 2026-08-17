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
        expect(files.some(f => /Caches/i.test(f))).toBe(true);
        expect(/Metrics/i.test(joined)).toBe(true);
        expect(/KeyMetrics/i.test(joined)).toBe(true);
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
