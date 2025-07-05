const cds = require('@sap/cds');

class AppService extends cds.ApplicationService {
    async init() {
        const { Products, ManualCachedFoo } = this.entities;
        
        // Foo('...')?$expand=products
        this.on('READ', 'Foo', async (req, next) => {
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

            const northwind = await cds.connect.to("Northwind");
            const northwindCache = await cds.connect.to('caching-northwind');
            await northwindCache.rt.send({ path: "/Products", method: "GET" }, northwind);

            const myAsyncFunction = async (param1, param2) => {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return `cached value ${param1} ${param2}`;
            }
            const myWrappedFunction = await northwindCache.rt.wrap("myCachedValue", myAsyncFunction, [1, 2], { ttl: 1000 });

            const result = await myWrappedFunction(3, 4);
            await myWrappedFunction(3, 4);
            await myWrappedFunction(3, 4)
            return myWrappedFunction(3, 4);
        });

        this.on('getDetailedCachedValue', async (req) => {
            const data = req.data;
            
            // Example of using detailed mode to get cache key and metadata
            const expensiveOperation = async (userId, filter) => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return {
                    userId,
                    filter,
                    data: `expensive data for ${userId} with filter ${filter}`,
                    timestamp: new Date().toISOString()
                };
            };

            const cachedOperation = await cds.connect.to('caching').rt.wrap("detailed-user-data", expensiveOperation, { 
                detailed: true,
                ttl: 3600000 
            });

            // First call - will execute the function
            const { result, cacheKey, metadata } = await cachedOperation(data.userId, data.filter);
            
            console.log('Generated cache key:', cacheKey);
            console.log('Cache hit:', metadata.hit);
            console.log('Latency:', metadata.latency, 'ms');

            // Second call with same parameters - will use cache
            const { result: result2, cacheKey: cacheKey2, metadata: metadata2 } = await cachedOperation(data.userId, data.filter);
            
            console.log('Second call - Cache hit:', metadata2.hit);
            console.log('Second call - Latency:', metadata2.latency, 'ms');
            console.log('Same cache key:', cacheKey === cacheKey2);

            return {
                firstCall: { result, cacheKey, metadata },
                secondCall: { result: result2, cacheKey: cacheKey2, metadata: metadata2 }
            };
        });

        this.on('getDetailedExecValue', async (req) => {
            const data = req.data;
            
            // Example of using detailed mode with rt.exec
            const expensiveOperation = async (param1, param2, param3) => {
                await new Promise(resolve => setTimeout(resolve, 500));
                return {
                    param1,
                    param2,
                    param3,
                    computed: `${param1}_${param2}_${param3}`,
                    timestamp: new Date().toISOString()
                };
            };

            const cache = await cds.connect.to('caching');

            // First execution - will execute the function
            const { result, cacheKey, metadata } = await cache.rt.exec("detailed-exec-test", expensiveOperation, 
                [data.param1, data.param2, data.param3], 
                { detailed: true, ttl: 1800000 }
            );

            console.log('Exec generated cache key:', cacheKey);
            console.log('Exec cache hit:', metadata.hit);
            console.log('Exec latency:', metadata.latency, 'ms');

            // Second execution with same parameters - will use cache
            const { result: result2, cacheKey: cacheKey2, metadata: metadata2 } = await cache.rt.exec("detailed-exec-test", expensiveOperation, 
                [data.param1, data.param2, data.param3], 
                { detailed: true, ttl: 1800000 }
            );

            console.log('Second exec - Cache hit:', metadata2.hit);
            console.log('Second exec - Latency:', metadata2.latency, 'ms');
            console.log('Same exec cache key:', cacheKey === cacheKey2);

            return {
                firstExec: { result, cacheKey, metadata },
                secondExec: { result: result2, cacheKey: cacheKey2, metadata: metadata2 }
            };
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