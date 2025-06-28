const cds = require('@sap/cds');

class AppService extends cds.ApplicationService {
    async init() {
        const { BusinessPartners, CachedFoo } = this.entities;
        const bupa = await cds.connect.to("API_BUSINESS_PARTNER");

        // this.prepend(() => {
        //     const { ManualCachedFoo } = this.entities;
        //     this.on('READ', ManualCachedFoo, async (req, next) => {
        //         const cache = await cds.connect.to('caching');
        //         const data = await cache.run(req, next);
        //         req.reply(data);
        //     });
        // });

        this.prepend(() => {
            this.on('READ', CachedFoo, async (req, next) => {
                await new Promise(resolve => setTimeout(resolve, 5000));
                return next();
            });
        });

        this.on('READ', BusinessPartners, async (req) => {
            return bupa.run(req.query);
        });
        this.on('getCachedValue', async (req) => {
            return "cached value";
        });
        this.on('getBoundCachedValue', async (req) => {
            return "cached value";
        });
        this.on('manualCachedValue', async (req) => {
            return "cached value";
        });
        return super.init()
    }
}

module.exports = AppService