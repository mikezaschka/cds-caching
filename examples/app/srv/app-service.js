const cds = require('@sap/cds');

class AppService extends cds.ApplicationService {
    async init() {
        const { Products, CachedFoo, Foo } = this.entities;
        
        // Foo('...')?$expand=products
        this.on('READ', [Foo, CachedFoo], async (req, next) => {
            const select = req.query.SELECT;

            if (!select.columns) return next();
            const expandIndex = select.columns.findIndex(
                ({ expand, ref }) => expand && ref[0] === "products"
            );

            if (expandIndex < 0) return next();
            const expandColumns = select.columns[expandIndex].expand;

            // Remove expand from query
            req.query.SELECT.columns.splice(expandIndex, 1);

            // Make sure ID will be returned
            if (expandColumns.indexOf('*') == -1 &&
                !expandColumns.find(
                    column => column.ref && column.ref.find((ref) => ref == "ID"))
            ) {
                expandColumns.push({ ref: ["ID"] });
            }

            const foos = await next();
            //if (Array.isArray(foos) && foos.length > 0) throw new Error('Expand only allowed when requesting one foo.');
            //const foo = Array.isArray(foos) ? foos[0] : foos;
            if(Array.isArray(foos)) {
                for(const foo of foos) {
                    foo.products = await this.run(SELECT(expandColumns)
                        .from(Products)
                        .where("ID = ", foo.products_ID)
                        .limit(select.limit?.rows?.val, select.limit?.offset?.val));
                }
            }

            return foos;
        });

        this.on('READ', Products, async (req) => {
            //await new Promise(resolve => setTimeout(resolve, 2000));
            const northwind = await cds.connect.to("Northwind");
            return northwind.run(req.query);
        });
        this.on('getCachedValue', async (req) => {
            const data = req.data;
            return `cached value ${data.param1}`;
        });
        this.on('getBoundCachedValue', async (req) => {
            const data = req.data;
            const param = req.params[0];
            return `cached value for ${param.ID} and data ${data.param1}`;
        });
        this.on('manualCachedValue', async (req) => {
            const data = req.data;
            return `cached value ${data.param1}`;
        });
        return super.init()
    }
}

module.exports = AppService