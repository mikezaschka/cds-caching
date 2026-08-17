const cds = require('@sap/cds')
const { fs, path } = cds.utils;
const CachingService = require('./lib/CachingService')
const { scanCachingAnnotations } = require('./lib/util')
const { getCachingRequiresEntries, detectMisplacedKeyManagement } = require('./lib/config-normalizer')
const { resolvePluginRoots } = require('./lib/plugin-roots')

const LOG = cds.log("cds-caching");

/**
 * Parsed project package.json, or an empty object when unreadable.
 * @returns {object}
 */
function readProjectPackage() {
    try {
        const pkgPath = path.join(cds.root, 'package.json')
        if (!fs.existsSync(pkgPath)) return {}
        return JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    } catch {
        return {}
    }
}

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

const misplacedKeyManagement = detectMisplacedKeyManagement(cds.env, readProjectPackage())
if (misplacedKeyManagement) LOG.warn(misplacedKeyManagement)

cds.on('served', scanCachingAnnotations)

if (reuseDashboard) {
    const dashboardPath = path.join(__dirname, 'app', 'dashboard');
    const { resolveUi5Url, createIndexHandler } = require('./lib/dashboard-bootstrap');

    // The dashboard is a UI5 build without the framework itself, so what has to
    // be present is the built application, not a bundled runtime.
    if (!fs.existsSync(path.join(dashboardPath, 'Component.js'))) {
        LOG.warn(
            'cds-caching dashboard is not built (missing app/dashboard/Component.js). ' +
            'Reinstall cds-caching, or run "npm run build:dashboard" in the cds-caching package ' +
            'before using metrics.reuse.dashboard.'
        );
    }

    const { url: ui5Url, warnings: ui5Warnings } = resolveUi5Url(cachingEntries);
    for (const message of ui5Warnings) LOG.warn(message);

    cds.once('bootstrap', (app) => {
        // Run CAP's middlewares first so cds.context.user is populated, then gate
        // the static assets on it.
        const { requireAuthenticatedUser, capRequestMiddlewares } = require('./lib/dashboard-guard');
        const serveIndex = createIndexHandler(dashboardPath, ui5Url);

        app.use(
            '/caching-dashboard',
            ...capRequestMiddlewares(),
            requireAuthenticatedUser,
            // Ahead of the static handler, so the entry page is served with the
            // configured UI5 runtime rather than whatever the build wrote.
            (req, res, next) => (
                req.path === '/' || req.path === '/index.html' ? serveIndex(req, res, next) : next()
            ),
            require('express').static(dashboardPath)
        );
        (app._app_links ??= []).push('/caching-dashboard');
        LOG.info(`Serving cds-caching dashboard at /caching-dashboard (UI5 from ${ui5Url})`);
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
        const requires = cds.env.requires || {};
        const dbKind = requires.db?.kind || '';
        // hana-mt is used in MTX hybrid / production profiles
        const isHanaDB = dbKind === 'hana' || dbKind === 'sql' || dbKind === 'hana-mt';
        if (!isHanaDB) return false;

        const cachingConfigs = Object.values(requires).filter(r => r?.impl === 'cds-caching');
        if (cachingConfigs.length === 0) return false;

        const { getCachingRequiresEntries, isMetricsConfigured } = require('./lib/config-normalizer');
        const { projectImportsCachingApi } = require('./lib/plugin-roots');
        const entries = getCachingRequiresEntries(requires);

        const needsStoreArtifacts = cachingConfigs.some(r => r.store === 'hana' || r.store === 'cds');
        const needsStatistics = entries.some(e => isMetricsConfigured(e.normalized) || e.normalized.reuse?.api || e.normalized.reuse?.dashboard)
            || projectImportsCachingApi(cds.root, cds.env.folders?.srv || 'srv');

        return needsStoreArtifacts || needsStatistics;
    }

    async build() {
        const requires = cds.env.requires || {};
        const compileOpts = { ...this.options(), sql_mapping: cds.env.sql.names };
        let wroteCacheStore = false;
        let wroteStatistics = false;

        const { getCachingRequiresEntries, isMetricsConfigured } = require('./lib/config-normalizer');
        const { projectImportsCachingApi } = require('./lib/plugin-roots');
        const entries = getCachingRequiresEntries(requires);
        const needsStatistics = entries.some(e => isMetricsConfigured(e.normalized) || e.normalized.reuse?.api || e.normalized.reuse?.dashboard)
            || projectImportsCachingApi(cds.root, cds.env.folders?.srv || 'srv');

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

        if (needsStatistics && !wroteStatistics) {
            await this._buildStatisticsHdbtables(compileOpts);
            wroteStatistics = true;
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

    /**
     * Same gap as CacheStore: Caches / Metrics / KeyMetrics live in env.roots and are
     * missing from the HANA CSN. Compile index.cds (statistics entities + CachingApiService
     * projections) so we emit both the base .hdbtable files and the service .hdbview files
     * CAP queries at runtime (e.g. plugin_cds_caching_CachingApiService_Caches).
     */
    async _buildStatisticsHdbtables(compileOpts) {
        const modelPath = path.join(__dirname, 'index');
        const model = await cds.load(modelPath, { ...compileOpts, cwd: cds.root });
        const artifacts = cds.compile.to.hdbtable(model, compileOpts);
        for (const [content, key] of artifacts) {
            const file = key.file || `${key.name}${key.suffix || ''}`;
            await this.write(content).to(path.join('src/gen', file));
        }
        LOG.info('Built cds-caching Caches/Metrics HANA tables and CachingApiService views from index model');
    }
});

// CAP resolves `impl: 'cds-caching'` to this file; the main export must be the service class
// so `cds.connect.to('<cache>')` returns CachingService (e.g. addCachableFunction).
module.exports = CachingService
