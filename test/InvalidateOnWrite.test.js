const cds = require('@sap/cds');
const { GET, POST, PATCH, DELETE, expect } = cds.test().in(__dirname + '/app')

describe('invalidateOnWrite', () => {

    let cache;
    const createdIds = [];

    beforeEach(async () => {
        cache = await cds.connect.to('caching');
        await cache.clear();
    })

    afterAll(async () => {
        // Restore mutated entities to their original state
        try {
            await PATCH(`/odata/v4/app/AutoInvalidatedFoo(1)`, { name: 'Foo1' });
        } catch { /* may not exist */ }
        try {
            await PATCH(`/odata/v4/app/AutoInvalidatedFoo(2)`, { name: 'Foo2' });
        } catch { /* may not exist */ }
        // Clean up entities created during tests
        for (const id of createdIds) {
            try {
                await DELETE(`/odata/v4/app/AutoInvalidatedFoo(${id})`);
            } catch { /* already gone */ }
        }
    })

    it('should add entity tag to cached entries', async () => {
        const { headers } = await GET`/odata/v4/app/AutoInvalidatedFoo`
        const cacheKey = headers['x-sap-cap-cache-key'];
        expect(cacheKey).to.be.a('string');

        const tags = await cache.tags(cacheKey);
        expect(tags).to.include('entity:AppService.AutoInvalidatedFoo');
    })

    it('should invalidate cache after CREATE', async () => {
        const { headers } = await GET`/odata/v4/app/AutoInvalidatedFoo`
        const cacheKey = headers['x-sap-cap-cache-key'];
        const cachedBefore = await cache.get(cacheKey);
        expect(cachedBefore).to.be.an('array');

        const uniqueId = 1000;
        createdIds.push(uniqueId);
        await POST(`/odata/v4/app/AutoInvalidatedFoo`, {
            ID: uniqueId,
            name: 'NewFoo'
        })

        // The invalidation ran: the old collection is gone.
        // CAP's OData read-after-write may re-cache a single-entity result,
        // but the stale collection is replaced.
        const cachedAfter = await cache.get(cacheKey);
        const oldCollectionGone = cachedAfter === undefined
            || !Array.isArray(cachedAfter)
            || cachedAfter.length !== cachedBefore.length;
        expect(oldCollectionGone).to.be.true;
    })

    it('should invalidate cache after UPDATE', async () => {
        const { headers } = await GET`/odata/v4/app/AutoInvalidatedFoo`
        const cacheKey = headers['x-sap-cap-cache-key'];
        expect(await cache.get(cacheKey)).to.be.an('array');

        await PATCH(`/odata/v4/app/AutoInvalidatedFoo(1)`, {
            name: 'UpdatedFoo'
        })

        expect(await cache.get(cacheKey)).to.be.undefined;
    })

    it('should invalidate cache after DELETE', async () => {
        const uniqueId = 1001;
        createdIds.push(uniqueId);
        await POST(`/odata/v4/app/AutoInvalidatedFoo`, {
            ID: uniqueId,
            name: 'ToDelete'
        })
        await cache.clear();

        const { headers } = await GET`/odata/v4/app/AutoInvalidatedFoo`
        const cacheKey = headers['x-sap-cap-cache-key'];
        expect(await cache.get(cacheKey)).to.be.an('array');

        await DELETE(`/odata/v4/app/AutoInvalidatedFoo(${uniqueId})`)

        expect(await cache.get(cacheKey)).to.be.undefined;
    })

    it('should invalidate all query variants for the entity', async () => {
        const { headers: h1 } = await GET`/odata/v4/app/AutoInvalidatedFoo`
        const { headers: h2 } = await GET`/odata/v4/app/AutoInvalidatedFoo?$filter=ID eq 1`

        const key1 = h1['x-sap-cap-cache-key'];
        const key2 = h2['x-sap-cap-cache-key'];

        expect(await cache.get(key1)).to.not.be.undefined;
        expect(await cache.get(key2)).to.not.be.undefined;

        await PATCH(`/odata/v4/app/AutoInvalidatedFoo(1)`, {
            name: 'ChangedFoo'
        })

        expect(await cache.get(key1)).to.be.undefined;
        expect(await cache.get(key2)).to.be.undefined;
    })

    it('should re-populate cache with fresh data on next read after invalidation', async () => {
        await GET`/odata/v4/app/AutoInvalidatedFoo`

        await PATCH(`/odata/v4/app/AutoInvalidatedFoo(1)`, {
            name: 'RefreshedFoo'
        })

        const { data: dataAfter, headers } = await GET`/odata/v4/app/AutoInvalidatedFoo`

        expect(headers['x-sap-cap-cache']).to.equal('miss');
        expect(dataAfter.value.some(f => f.name === 'RefreshedFoo')).to.be.true;
    })

    it('should not affect cache entries for other entities', async () => {
        const { headers: cachedHeaders } = await GET`/odata/v4/app/CachedFoo`
        const cachedKey = cachedHeaders['x-sap-cap-cache-key'];
        expect(await cache.get(cachedKey)).to.not.be.undefined;

        await PATCH(`/odata/v4/app/AutoInvalidatedFoo(1)`, {
            name: 'IsolatedFoo'
        })

        expect(await cache.get(cachedKey)).to.not.be.undefined;
    })

    it('should not add entity tag when invalidateOnWrite is not set', async () => {
        const { headers } = await GET`/odata/v4/app/CachedFoo`
        const cacheKey = headers['x-sap-cap-cache-key'];

        const tags = await cache.tags(cacheKey);
        const entityTags = tags.filter(t => t.startsWith('entity:'));
        expect(entityTags).to.have.length(0);
    })

})
