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

cds.on('served', scanCachingAnnotations)
const LOG = cds.log("cds-caching");

// Register HANA build plugin to generate .hdbtable artifacts during `cds build`
cds.build?.register?.('cds-caching', class CachingBuildPlugin extends cds.build.Plugin {
    static taskDefaults = { src: cds.env.folders.db }

    init() { }
    clean() { }

    static hasTask() {
        cds.log('cds-caching').info('hasTask', cds.env.requires);
        const requires = cds.env.requires || {};
        const dbKind = requires.db?.kind || '';
        const isHanaDB = dbKind === 'hana' || dbKind === 'sql';
        return Object.values(requires).some(
            r => r.impl === 'cds-caching' && (r.store === 'hana' || (r.store === 'cds' && isHanaDB))
        );
    }

    async build() {
        const requires = cds.env.requires || {};
            const compileOpts = { ...this.options(), sql_mapping: cds.env.sql.names };
            let wroteCacheStore = false;

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

            if (config.store === 'cds' && !wroteCacheStore) {
                await this._buildCacheStoreHdbtables(compileOpts);
                wroteCacheStore = true;
            }
            // For store: 'cds' with HANA, the CacheStore entity from index.cds
            // is deployed automatically by the HDI deployer — no manual .hdbtable needed.
            // For SQLite/Postgres, CAP's cds deploy handles table creation from the CDS model.

        }
    }

    /**
         * The HANA build task compiles only the app `db/` folder, so `plugin.cds_caching.CacheStore`
         * from env.roots is not part of that CSN. Emit matching .hdbtable files here.
         * Non-HANA DBs still get the table via normal CDS deploy / DDL.
         */
    async _buildCacheStoreHdbtables(compileOpts) {
        const modelPath = path.join(__dirname, 'db', 'cache-store');
        const model = await cds.load(modelPath, { ...compileOpts, cwd: cds.root });
        const artifacts = cds.compile.to.hdbtable(model, compileOpts);
        for (const [content, key] of artifacts) {
            const file = key.file || `${key.name}${key.suffix || ''}`;
            await this.write(content).to(path.join('src/gen', file));
        }
        LOG.info('Built cds-caching CacheStore HANA artifacts from cache-store model');
    }
});