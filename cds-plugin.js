const cds = require('@sap/cds')
const CachingService = require('./lib/CachingService')
const { scanCachingAnnotations } = require('./lib/util')

cds.on('served', scanCachingAnnotations)

// Register HANA build plugin to generate .hdbtable artifacts during `cds build`
cds.build?.register?.('cds-caching-hana', class CachingHanaBuildPlugin extends cds.build.Plugin {
    static hasTask() {
        const requires = cds.env.requires || {};
        return Object.values(requires).some(
            r => r.impl === 'cds-caching' && r.store === 'hana'
        );
    }

    static taskDefaults = { src: cds.env.folders.db }

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