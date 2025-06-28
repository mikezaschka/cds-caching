const cds = require('@sap/cds')
const { expect } = cds.test().in(__dirname + '/app')

describe('CachingService Metadata', () => {
    const cachingOptions = {
        impl: "cds-caching"
    }
    let cache;

    beforeEach(async () => {
        cache = await cds.connect.to(cachingOptions);
        await cache.clear();
    })

    describe('tags', () => {
        it('should store and retrieve tags', async () => {
            await cache.set('key', "value", { tags: [ { value: "tag1" }, { value: "tag2" } ] });

            // Verify tags are stored
            const tags = await cache.tags('key');

            expect(tags).to.have.members(['tag1', 'tag2']);
        })

        it("should support tags with different types", async () => {
            await cache.set('key1', "value1", { tags: [ { value: "tag1" } ] });
            await cache.set('key2', "value2", { tags: [ { value: "tag", prefix: "my" } ] });
            
            const tags = await cache.tags('key1');
            expect(tags).to.have.members(['tag1']);

            const tags2 = await cache.tags('key2');
            expect(tags2).to.have.members(['mytag']);
            
            
        })

        it('should invalidate by tag', async () => {
            await cache.set('key1', "value1", { tags: ['group1', 'group2'] });
            await cache.set('key2', "value2", { tags: ['group1'] });
            // Invalidate by tag
            await cache.deleteByTag('group1');

            // Both should be invalidated
            expect(await cache.has('key1')).to.be.false;
            expect(await cache.has('key2')).to.be.false;
        })
   
        it('should invalidate only tagged items', async () => {
            await cache.set('key1', 'value1', { tags: ['group1'] });
            await cache.set('key2', 'value2'); // No tags
            await cache.set('key3', "value3", { tags: ['group2'] });

            await cache.deleteByTag('group1');

            // Only tagged item should be invalidated
            expect(await cache.has('key1')).to.be.false;
            expect(await cache.has('key2')).to.be.true;
            expect(await cache.has('key3')).to.be.true;
        })
    })

    describe('timestamps', () => {
        it('should store creation timestamp', async () => {
            const beforeTime = Date.now();
            await cache.set('key', 'value');
            const afterTime = Date.now();

            const metadata = await cache.metadata('key');
            expect(metadata.timestamp).to.be.at.least(beforeTime);
            expect(metadata.timestamp).to.be.at.most(afterTime);
        })

    })

}) 