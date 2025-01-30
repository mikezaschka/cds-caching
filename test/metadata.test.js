const cds = require('@sap/cds')
const { GET, expect } = cds.test(__dirname + '/app/')

describe('CachingService Metadata', () => {
    const cachingOptions = {
        kind: 'caching',
        impl: "cds-caching"
    }
    let cache;

    beforeEach(async () => {
        cache = await cds.connect.to(cachingOptions);
        await cache.clear();
    })

    describe('tags', () => {
        it('should store and retrieve tags', async () => {
            await cache.set('key', "value", { tags: ['tag1', 'tag2'] });

            // Verify tags are stored
            const tags = await cache.getTags('key');

            
            expect(tags).to.have.members(['tag1', 'tag2']);
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

            await cache.deleteByTag('group1');

            // Only tagged item should be invalidated
            expect(await cache.has('key1')).to.be.false;
            expect(await cache.has('key2')).to.be.true;
        })
    })

    describe('timestamps', () => {
        it('should store creation timestamp', async () => {
            const beforeTime = Date.now();
            await cache.set('key', 'value');
            const afterTime = Date.now();

            const metadata = await cache.getMetadata('key');
            expect(metadata.timestamp).to.be.at.least(beforeTime);
            expect(metadata.timestamp).to.be.at.most(afterTime);
        })

    })

}) 