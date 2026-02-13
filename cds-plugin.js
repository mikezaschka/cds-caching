const cds = require('@sap/cds')
const { fs, path } = cds.utils;
const CachingService = require('./lib/CachingService')
const { scanCachingAnnotations } = require('./lib/util')

cds.on('served', scanCachingAnnotations)
const LOG = cds.log("cds-caching");

// Register HANA build plugin to generate .hdbtable artifacts during `cds build`
cds.build?.register?.('cds-caching', class CachingBuildPlugin extends cds.build.Plugin {
    static taskDefaults = { src: cds.env.folders.db }

    init() {}
    clean () {}

    static hasTask() {
        const requires = cds.env.requires || {};
        LOG.info('Registering cds-caching build plugin');
        return Object.values(requires).some(
            r => r.impl === 'cds-caching' && r.store === 'hana'
        );
    }

    async build() {
        const requires = cds.env.requires || {};
        for (const [, config] of Object.entries(requires)) {
            if (config.impl !== 'cds-caching' || config.store !== 'hana') continue;
            const table = config.credentials?.table || 'KEYV';
            const keySize = config.credentials?.keySize || 255;
            const content = [
                `COLUMN TABLE "${table}" (`,
                `  "ID" NVARCHAR(${keySize}) PRIMARY KEY,`,
                `  "VALUE" NCLOB`,
                `)`,
            ].join('\n');
            await this.write(content).to(`src/gen/${table}.hdbtable`);
        }
    }
});

module.exports = cds.service.impl(CachingService)