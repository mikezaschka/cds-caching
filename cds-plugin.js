const cds = require('@sap/cds')
const { fs, path } = cds.utils;
const CachingService = require('./lib/CachingService')
const { scanCachingAnnotations } = require('./lib/util')
const { getCachingRequiresEntries } = require('./lib/config-normalizer')
const { resolvePluginRoots } = require('./lib/plugin-roots')

const LOG = cds.log("cds-caching");

// Auto-register plugin entity models based on service configuration.
// See docs/feature-activation.md for reuse vs project-owned activation.
const cachingEntries = getCachingRequiresEntries(cds.env.requires ?? {})
const normalizedConfigs = cachingEntries.map(e => e.normalized)
const { roots: pluginRoots, reuseDashboard, warnings } = resolvePluginRoots({
    pluginDir: __dirname,
    projectRoot: cds.root,
    srvFolder: cds.env.folders?.srv || 'srv',
    normalizedConfigs,
})
for (const root of pluginRoots) {
    if (!cds.env.roots.includes(root)) cds.env.roots.push(root)
}
for (const message of warnings) LOG.warn(message)

cds.on('served', scanCachingAnnotations)

if (reuseDashboard) {
    const dashboardPath = path.join(__dirname, 'app', 'dashboard');
    const dashboardProbe = path.join(dashboardPath, 'resources', 'sap', 'ui', 'core', 'cldr', 'en.json');
    if (!fs.existsSync(dashboardProbe)) {
        LOG.warn(
            'cds-caching dashboard static resources are incomplete (missing UI5 runtime files). ' +
            'Upgrade cds-caching to a release that includes the full pre-built dashboard, ' +
            'or run "npm run build:dashboard" in the cds-caching package before using metrics.reuse.dashboard.'
        );
    }
    cds.once('bootstrap', (app) => {
        app.use('/caching-dashboard', require('express').static(dashboardPath));
        (app._app_links ??= []).push('/caching-dashboard');
        LOG.info("Serving cds-caching dashboard at /caching-dashboard");
    });
}

// Register `cds add` facets. `cds.add` is only present under @sap/cds-dk.
if (cds.add?.register) {
    const addFacet = require('./lib/add');
    cds.add.register('caching-dashboard', addFacet);
    cds.add.register('caching-metrics', addFacet);
}

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

// CAP resolves `impl: 'cds-caching'` to this file; the main export must be the service class
// so `cds.connect.to('<cache>')` returns CachingService (e.g. addCachableFunction).
module.exports = CachingService
