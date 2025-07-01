const cds = require('@sap/cds');
const { scanCachingAnnotations } = require('../lib/util');

describe('CachingService', () => {

    const { GET, expect } = cds.test().in(__dirname + '/app/')
    const cachingOptions = {
        "kind": "caching",
        "impl": "cds-caching",
        "namespace": "myCache",
    }
    let cache;

    describe('remote service caching', () => {

        beforeAll(async () => {
            // Scan and register the caching annotations
            await scanCachingAnnotations(cds.services);
        })

        beforeEach(async () => {
            cache = await cds.connect.to(cachingOptions);
            await cache.clear();
        })

        describe('using send ', () => {

            it("should cache the request to an OData service", async () => {
                const key = "top:2:bupa";
                const bupa = await cds.connect.to("API_BUSINESS_PARTNER");

                const result = await cache.send({
                    method: "GET",
                    path: "A_BusinessPartner?$top=2"
                }, bupa, { key: { value: key } });

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);

            })

            it("should cache the request to a REST service", async () => {
                const key = "restful:objects";
                const rest = await cds.connect.to({
                    "kind": "rest",
                    "credentials": {
                        "url": "https://services.odata.org/V3/Northwind/Northwind.svc/"
                    }
                });

                const result = await cache.send({
                    method: "GET",
                    path: "Products"
                }, rest, { key: { value: key } });

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);

            })
        })

        describe('using run', () => {

            it("should cache the request to an OData service", async () => {
                const key = "top:2:bupa";
                const bupa = await cds.connect.to("API_BUSINESS_PARTNER");
                const { A_BusinessPartner } = bupa.entities;

                const result = await cache.run(SELECT(A_BusinessPartner).limit(2), bupa, { key: { value: key } });

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);

            })

            it("should cache the request to a REST service", async () => {
                const key = "restful:objects";
                const restService = await cds.connect.to({
                    "kind": "rest",
                    "credentials": {
                        "url": "https://services.odata.org/V3/Northwind/Northwind.svc/"
                    }
                });

                const result = await cache.run(restService.get("Products"), restService, { key: { value: key } });

                const cachedData = await cache.get(key);
                expect(cachedData).to.eql(result);
            })
        })

    })

})