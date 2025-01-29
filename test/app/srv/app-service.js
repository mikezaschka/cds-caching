const cds = require('@sap/cds');

class AppService extends cds.ApplicationService {
    async init() {
        const { BusinessPartners } = this.entities;
        const bupa = await cds.connect.to("API_BUSINESS_PARTNER");
        this.on('READ', BusinessPartners, async (req) => {
            return bupa.run(req.query);
        });
        this.on('getCachedValue', async (req) => {
            return "cached value";
        });
        this.on('getBoundCachedValue', async (req) => {
            return "cached value";
        });
        return super.init()
    }
}

module.exports = AppService