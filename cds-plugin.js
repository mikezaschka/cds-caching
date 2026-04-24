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

// Node.js runtime CSN is compiled from db/srv/app without `*` roots, so `plugin.cds_caching.CacheStore`
// is often missing — then `cds.entities(...).CacheStore` is undefined and the KeyvCDS adapter never
// issues SQL (no physical table use). Merge the entity into every runtime CSN.
function mergeCacheStoreIntoRuntimeModel(csn) {
    if (!csn?.definitions) return;
    // Feature-toggle / extension CSNs reference the base csn via `requires` — definitions are merged
    // by the compiler; injecting CacheStore here duplicates plugin.cds_caching.CacheStore.
    if (csn.requires?.length) return;
    const usesCdsStore = Object.values(cds.env.requires ?? {}).some(
        (r) => r?.impl === 'cds-caching' && r.store === 'cds',
    );
    if (!usesCdsStore) return;
    if (csn.definitions['plugin.cds_caching.CacheStore']) return;
    const file = path.join(__dirname, 'db', 'cache-store.cds');
    const patch = cds.parse.cdl(fs.readFileSync(file, 'utf8'));
    Object.assign(csn.definitions, patch.definitions);
}

function attachCompileForRuntimeMerge(targetCds) {
    if (!targetCds?.on) return;
    targetCds.on('compile.for.runtime', (csn) => {
        try {
            mergeCacheStoreIntoRuntimeModel(csn);
        } catch (e) {
            LOG.warn('cds-caching: could not merge CacheStore into runtime CSN:', e.message);
        }
    });
}

// `cds build` loads `@sap/cds` from inside `@sap/cds-dk/node_modules` — a different module instance than
// the project's hoisted `@sap/cds`. compile.for.runtime is emitted on whichever instance the CLI uses.
attachCompileForRuntimeMerge(cds);
try {
    const dkCds = require(require.resolve('@sap/cds-dk/lib/cds', {
        paths: [cds.root || process.cwd(), path.join(__dirname, '..')],
    }));
    if (dkCds !== cds) attachCompileForRuntimeMerge(dkCds);
} catch {
    /* @sap/cds-dk not installed */
}

// Register HANA build plugin via @sap/cds-dk — `cds.build` on `require('@sap/cds')` is only
// present when the CLI loads cds-dk's entry, so `cds.build?.register` here would no-op during `cds build`.
try {
    const { register, Plugin } = require(require.resolve('@sap/cds-dk/lib/build', {
        paths: [cds.root || process.cwd(), path.join(__dirname, '..')],
    }));

    register('cds-caching', class CachingBuildPlugin extends Plugin {
        static taskDefaults = { src: cds.env.folders.db }

        /**
         * Run after built-in HANA build (internal priority 262). Custom plugins must not use 0..512;
         * negative priorities run after higher numeric priorities.
         */
        get priority() {
            return -1;
        }

        init() { }
        clean() { }

        static hasTask() {
            const requires = cds.env.requires || {};
            const configs = Object.values(requires).filter((r) => r?.impl === 'cds-caching');
            if (!configs.length) return false;
            const dbKind = requires.db?.kind || '';
            const forHana = typeof dbKind === 'string' && /hana/i.test(dbKind);
            const wantsKeyv = configs.some((c) => c.store === 'hana');
            const wantsCdsStore = configs.some((c) => c.store === 'cds');
            return wantsKeyv || (forHana && wantsCdsStore);
        }

        async build() {
            const requires = cds.env.requires || {};
            const compileOpts = { ...this.options(), sql_mapping: cds.env.sql.names };
            let wroteCacheStore = false;

            for (const [, config] of Object.entries(requires)) {
                if (config.impl !== 'cds-caching') continue;
                if (config.store === 'hana') {
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
} catch {
    // @sap/cds-dk not installed (e.g. minimal test project) — skip optional build contribution
}

module.exports = cds.service.impl(CachingService)