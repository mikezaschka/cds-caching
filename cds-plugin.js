const cds = require('@sap/cds')
const { fs, path } = cds.utils;
const CachingService = require('./lib/CachingService')
const { scanCachingAnnotations } = require('./lib/util')

// Auto-register plugin entity models based on service configuration.
// Pushes absolute file paths (without extension) into cds.env.roots so that
// cds.resolve('*') picks them up during model compilation — before cds.model is set.
const cachingConfigs = Object.values(cds.env.requires ?? {}).filter(r => r?.impl === 'cds-caching');
if (cachingConfigs.some(c => c.store === 'cds')) {
    cds.env.roots.push(path.join(__dirname, 'db', 'cache-store'));
}
if (cachingConfigs.some(c => c.statistics)) {
    cds.env.roots.push(path.join(__dirname, 'db', 'statistics'));
}

cds.add?.register?.('caching-dashboard', require('./lib/add'))

cds.on('served', scanCachingAnnotations)
const LOG = cds.log("cds-caching");

// Register HANA build plugin to generate .hdbtable artifacts during `cds build`
cds.build?.register?.('cds-caching', class CachingBuildPlugin extends cds.build.Plugin {
    static taskDefaults = { src: cds.env.folders.db }

    init() { }
    clean() { }

    static hasTask() {
        const requires = cds.env.requires || {};
        return Object.values(requires).some(
            r => r.impl === 'cds-caching' && r.store === 'hana'
        );
    }

    async build() {
        const requires = cds.env.requires || {};
        for (const [, config] of Object.entries(requires)) {
            if (config.impl === 'cds-caching' && config.store === 'hana') {
                const table = config.credentials?.table || 'KEYV';
                const keySize = config.credentials?.keySize || 255;
                const content = [
                    `COLUMN TABLE "${table}" (`,
                    `  "ID" NVARCHAR(${keySize}) PRIMARY KEY,`,
                    `  "VALUE" NCLOB`,
                    `)`,
                ].join('\n');
                await this.write(content).to(`src/gen/${table}.hdbtable`);
                LOG.info('Building cds-caching hana table', { table, keySize });
            }
            // For store: 'cds' with HANA, the CacheStore entity from db/cache-store.cds
            // is loaded via cds.env.roots and deployed automatically by the HDI deployer —
            // no manual .hdbtable needed. For SQLite/Postgres, CAP's cds deploy handles
            // table creation from the CDS model.
        }
    }
});

module.exports = cds.service.impl(CachingService)