const cds = require('@sap/cds');
const { PATCH, expect } = cds.test().in(__dirname + '/app')
const { describeFromCds } = require('./helpers/cds-version')

/**
 * MCP Protocol Adapter integration.
 *
 * The CAP MCP adapter (@cap-js/mcp, see the "Protocols > MCP" guide) exposes a
 * service as "just another protocol", identical in spirit to @odata / @rest /
 * @hcql. It serves three tools:
 *   - `query`       -> builds a CQN SELECT and runs it via `service.run(query)`
 *   - `call_action` -> invokes unbound actions/functions on the service
 *   - `describe`    -> pure metadata (not data, nothing to cache)
 *
 * cds-caching binds at the CAP service-handler level (READ events and
 * action/function events, installed via `service.prepend()`), NOT at any HTTP
 * layer. Because MCP dispatches through those same handlers, `@cache`
 * annotations apply to MCP traffic implicitly — with no MCP-specific code.
 *
 * These tests exercise the exact dispatch path the MCP adapter uses:
 *   - a plain `AppService.run(SELECT ...)` for the `query` tool, and
 *   - `AppService.send(<event>, <data>)` for the `call_action` tool,
 * without the caller ever touching a cds-caching API. This proves caching is
 * implicit for MCP and guards against regressions. It also covers the
 * URL-less key hashing that MCP relies on (no OData query string is present).
 */
describeFromCds(10, 'MCP Protocol Adapter - Implicit Caching', () => {

    let cache;
    let AppService;
    let CachedFoo;
    let AutoInvalidatedFoo;

    beforeEach(async () => {
        cache = await cds.connect.to('caching');
        await cache.clear();
        await cache.setMetricsEnabled(true);
        await cache.clearMetrics();

        AppService = await cds.connect.to('AppService');
        CachedFoo = AppService.entities.CachedFoo;
        AutoInvalidatedFoo = AppService.entities.AutoInvalidatedFoo;
    })

    describe("`query` tool (entity reads via service.run)", () => {

        it("caches an @cache-annotated entity read dispatched like the MCP query tool", async () => {
            // Simulate the MCP `query` tool: build a CQN and run it on the service.
            const first = await AppService.run(SELECT.from(CachedFoo));
            const second = await AppService.run(SELECT.from(CachedFoo));

            expect(second).to.deep.equal(first);

            // One miss (populate) + one hit (served from cache), proving the
            // read went through cds-caching without any explicit cache call.
            const stats = await cache.getCurrentMetrics();
            expect(stats.misses).to.equal(1);
            expect(stats.hits).to.equal(1);
        })

        it("stores the actual query result under the generated cache key", async () => {
            // Capture the key the annotation handler generated for this read.
            const captured = new Promise((resolve) => {
                AppService.prepend(function () {
                    this.after('READ', CachedFoo, (_data, req) => resolve(req.cacheKey));
                })
            })

            const result = await AppService.run(SELECT.from(CachedFoo));
            const cacheKey = await captured;

            expect(cacheKey).to.be.a('string');
            expect(await cache.get(cacheKey)).to.deep.equal(result);
        })

        it("caches different MCP queries under different keys (URL-less hashing)", async () => {
            // MCP requests carry no OData query string, so the CQN itself must
            // drive the cache key. Two different filters must NOT collide.
            const foo1 = await AppService.run(SELECT.from(CachedFoo).where({ ID: 1 }));
            const foo2 = await AppService.run(SELECT.from(CachedFoo).where({ ID: 2 }));

            expect(foo1).to.not.deep.equal(foo2);

            // Both were misses — if the keys had collided, the second would be a hit
            // and would wrongly return foo1's data.
            const stats = await cache.getCurrentMetrics();
            expect(stats.misses).to.equal(2);
            expect(stats.hits).to.equal(0);

            // Repeating each query now hits its own entry.
            const foo1Again = await AppService.run(SELECT.from(CachedFoo).where({ ID: 1 }));
            const foo2Again = await AppService.run(SELECT.from(CachedFoo).where({ ID: 2 }));
            expect(foo1Again).to.deep.equal(foo1);
            expect(foo2Again).to.deep.equal(foo2);

            const stats2 = await cache.getCurrentMetrics();
            expect(stats2.hits).to.equal(2);
        })
    })

    describe("`call_action` tool (unbound functions via service.send)", () => {

        it("caches an @cache-annotated unbound function invoked like call_action", async () => {
            // Simulate the MCP `call_action` tool dispatching an unbound function.
            const first = await AppService.send('getCachedValue', { param1: 'mcp' });
            const second = await AppService.send('getCachedValue', { param1: 'mcp' });

            expect(first).to.equal('cached value mcp');
            expect(second).to.equal(first);

            const stats = await cache.getCurrentMetrics();
            expect(stats.misses).to.equal(1);
            expect(stats.hits).to.equal(1);
        })

        it("caches function calls with different parameters separately", async () => {
            await AppService.send('getCachedValue', { param1: 'a' });
            await AppService.send('getCachedValue', { param1: 'b' });

            const stats = await cache.getCurrentMetrics();
            expect(stats.misses).to.equal(2);
            expect(stats.hits).to.equal(0);
        })
    })

    describe('cross-protocol invalidation', () => {

        it("invalidates an MCP-populated entry when a write arrives via another protocol", async () => {
            // Populate the cache the "MCP way" (programmatic read on the service).
            await AppService.run(SELECT.from(AutoInvalidatedFoo));
            await AppService.run(SELECT.from(AutoInvalidatedFoo)); // hit

            let stats = await cache.getCurrentMetrics();
            expect(stats.misses).to.equal(1);
            expect(stats.hits).to.equal(1);

            // A write over a different protocol (OData HTTP PATCH) shares the same
            // cache and invalidates the entry via @cache.invalidateOnWrite.
            // (OData's read-after-write may itself touch the cache, so we measure
            // the miss delta of the final read rather than an absolute count.)
            await PATCH(`/odata/v4/app/AutoInvalidatedFoo(1)`, { name: 'ChangedViaOData' });

            const missesBeforeFinal = (await cache.getCurrentMetrics()).misses;

            // The next MCP-style collection read must be a miss (invalidated) and
            // return fresh data.
            const refreshed = await AppService.run(SELECT.from(AutoInvalidatedFoo));
            expect(refreshed.some(f => f.name === 'ChangedViaOData')).to.be.true;

            const missesAfterFinal = (await cache.getCurrentMetrics()).misses;
            expect(missesAfterFinal).to.equal(missesBeforeFinal + 1);

            // Restore for other suites.
            await PATCH(`/odata/v4/app/AutoInvalidatedFoo(1)`, { name: 'Foo1' });
        })
    })
})
