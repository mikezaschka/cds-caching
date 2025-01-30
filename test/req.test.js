const cds = require('@sap/cds');
const { scanCachingAnnotations } = require('./../srv/util')

describe('CachingService', () => {

    const { GET, expect } = cds.test(__dirname + '/app/')
    const cachingOptions = {
        kind: 'caching',
        impl: "cds-caching"
    }
    let cache;
    let annotationInitialized = false;

    describe('req caching', () => {

        let AppService
        let Foo
        let ManualCachedFoo

        beforeAll(async () => {
            // Scan and register the caching annotations
            if (!annotationInitialized) {
                //await scanCachingAnnotations(cds.services);
                annotationInitialized = true;
            }
        })

        beforeEach(async () => {
            cache = await cds.connect.to(cachingOptions);
            await cache.clear();
            AppService = await cds.connect.to('AppService')
            Foo = AppService.entities.Foo
            ManualCachedFoo = AppService.entities.ManualCachedFoo
            CachedFoo = AppService.entities.CachedFoo
        })

        it('should cache a request that has been manually cached in an event handler', async () => {

            // Cache the request
            const cachedData = new Promise(async (resolve, reject) => {
                AppService.prepend(function () {
                    this.on('READ', ManualCachedFoo, async (req, next) => {
                        const data = await cache.run(req, next);
                        cacheKey = req.cacheKey;
                        req.reply(data);
                    })
                    this.after('READ', ManualCachedFoo, async (event, req) => {
                        const cacheData = await cache.get(req.cacheKey);
                        resolve(cacheData)
                    })
                })
            })

            //const data = await AppService.read(ManualCachedFoo)
            const { headers, status, data } = await GET`/odata/v4/app/ManualCachedFoo`
            expect(data.value).to.deep.equal(await cachedData);
        })

        it("should add the cache key to the response header", async () => {
            const { headers } = await GET`/odata/v4/app/CachedFoo`
            expect(headers).to.have.property('x-sap-cap-cache-key');
        })

        it("should cache a request for an annotated entity of an ApplicationService", async () => {
            // IMPORTANT: Have to connect to the same instance as the cache
            const cache = await cds.connect.to('caching'); 

            const { data, headers } = await GET`/odata/v4/app/CachedFoo`
            const cacheData = await cache.get(headers['x-sap-cap-cache-key']);
            

            expect(data.value).to.deep.equal(cacheData);
        })

        it("should cache a request for an annotated entity of an RemoteService", async () => {
            const bpCache = await cds.connect.to("caching-bp");
            const { data, headers } = await GET(`/odata/v4/app/BusinessPartners`, {
                params: {
                    $top: 2
                }
            })
            const cacheData = await bpCache.get(headers['x-sap-cap-cache-key']);
            expect(data.value).to.deep.equal(cacheData);
        })

        it('should cache a request that has been manually cached for a function', async () => {
            // Cache the request
            const cache = await cds.connect.to('caching'); 
            const cachedData = new Promise(async (resolve, reject) => {
                AppService.prepend(function () {
                    this.on('manualCachedValue', async (req, next) => {
                        const data = await cache.run(req, next, { key: { template: "my:{hash}" }});
                        cacheKey = req.cacheKey;
                        req.reply(data);
                    })
                    this.after('manualCachedValue', async (event, req) => {
                        console.log(req.cacheKey);
                        const cacheData = await cache.get(req.cacheKey);
                        resolve(cacheData)
                    })
                })
            })

            // const req = new cds.Request({
            //     locale: "en",
            //     tenant: "t0",
            //     user: cds.User.Privileged,
            //     event: 'manualCachedValue',
            //     params: { param1: 'test' }
            // })
            // const data = await AppService.send(req)
            // console.log(data);

            const { headers, status, data } = await GET`/odata/v4/app/manualCachedValue(param1='test')`
            expect(data.value).to.deep.equal(await cachedData);
        })

        it("should cache a annotated function call", async () => {
            // IMPORTANT: Have to connect to the same instance as the cache
            const cache = await cds.connect.to('caching'); 
            const { data, headers } = await GET`/odata/v4/app/getCachedValue(param1='test')`
            const cacheData = await cache.get(headers['x-sap-cap-cache-key']);
            
            expect(headers).to.have.property('x-sap-cap-cache-key');
            expect(data.value).to.equal("cached value");
            expect(data.value).to.equal(cacheData);
        })

        it("should cache a request for a bound annotated function", async () => {
            // IMPORTANT: Have to connect to the same instance as the cache
            const cache = await cds.connect.to('caching'); 
            const { data, headers } = await GET`/odata/v4/app/Foo(1)/getBoundCachedValue(param1='test')`
            
            const cacheData = await cache.get(headers['x-sap-cap-cache-key']);
            //console.log(headers['x-sap-cap-cache-key']);
            
            expect(data.value).to.equal("cached value");
            expect(data.value).to.equal(cacheData);
        })

    })

})