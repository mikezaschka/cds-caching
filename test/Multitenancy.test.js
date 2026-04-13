const cds = require('@sap/cds');
const { GET, POST, expect } = cds.test().in(__dirname + '/app/')
const { isMultitenantMode, hasTenantContext } = require('../lib/support/MultitenancyDetector')

describe('Multi-Tenancy Support', () => {

    let cache;
    let appService;
    let originalMultitenancy;

    beforeEach(async () => {
        cache = await cds.connect.to("caching-in-memory");
        appService = await cds.connect.to("AppService");
        // Save original state
        originalMultitenancy = cds.env.requires?.multitenancy;
        await cache.clear();
    })

    afterEach(() => {
        // Restore original state
        if (originalMultitenancy !== undefined) {
            cds.env.requires.multitenancy = originalMultitenancy;
        } else {
            delete cds.env.requires.multitenancy;
        }
        // Reset context
        cds.context = {};
    })

    describe('MTX Mode Detection', () => {
        it('should return false when multitenancy not configured', () => {
            delete cds.env.requires.multitenancy;
            expect(isMultitenantMode()).to.be.false
        })

        it('should return true when cds.env.requires.multitenancy is set', () => {
            cds.env.requires.multitenancy = true;
            expect(isMultitenantMode()).to.be.true
        })

        it('should return true when multitenancy is a config object', () => {
            cds.env.requires.multitenancy = { kind: 'saas-registry' };
            expect(isMultitenantMode()).to.be.true
        })

        it('should return false when cds.context.tenant is not set', () => {
            cds.context = {};
            expect(hasTenantContext()).to.be.false
        })

        it('should return true when cds.context.tenant is set', () => {
            cds.context = { tenant: 't1' };
            expect(hasTenantContext()).to.be.true
        })
    })

    describe('Startup Behavior in MTX Mode', () => {
        it('should complete cache init without errors in MTX mode', async () => {
            cds.env.requires.multitenancy = true;
            // Re-connect to trigger init path — should not crash
            const cache2 = await cds.connect.to("caching");
            expect(cache2).to.exist
        })

        it('should allow cache operations after init in MTX mode', async () => {
            cds.env.requires.multitenancy = true;
            await cache.set('mtx-test', 'value')
            const result = await cache.get('mtx-test')
            expect(result).to.equal('value')
        })
    })

    describe('Auto Tenant-Aware Keys in MTX Mode', () => {

        beforeEach(async () => {
            // Reset keyManagement to let auto-detection work
            cache.runtimeConfigManager.options.keyManagement = {};
            await cache.reloadRuntimeConfiguration();
        })

        it('should auto-enable isTenantAware in MTX mode', async () => {
            cds.env.requires.multitenancy = true;
            const config = await cache.getRuntimeConfiguration();
            expect(config.keyManagement.isTenantAware).to.be.true
        })

        it('should NOT auto-enable isTenantAware when not in MTX mode', async () => {
            delete cds.env.requires.multitenancy;
            cache.runtimeConfigManager.options.keyManagement = {};
            await cache.reloadRuntimeConfiguration();
            const config = await cache.getRuntimeConfiguration();
            expect(config.keyManagement.isTenantAware).to.be.false
        })

        it('should include tenant prefix in keys when MTX mode is active', async () => {
            cds.env.requires.multitenancy = true;
            cds.context = { tenant: 'tenant-abc' };
            await cache.reloadRuntimeConfiguration();
            const key = cache.createKey("test-data")
            expect(key).to.include('tenant-abc')
        })

        it('should use global when tenant is not set in MTX mode', async () => {
            cds.env.requires.multitenancy = true;
            cds.context = {};
            await cache.reloadRuntimeConfiguration();
            const key = cache.createKey("test-data")
            expect(key).to.include('global')
        })

        it('should respect explicit isTenantAware: false override', async () => {
            cds.env.requires.multitenancy = true;
            cache.runtimeConfigManager.options.keyManagement = { isTenantAware: false };
            cds.context = { tenant: 'tenant-xyz' };
            await cache.reloadRuntimeConfiguration();
            const key = cache.createKey("test-data")
            expect(key).to.not.include('tenant-xyz')
            expect(key).to.equal('test-data')
        })

        it('should respect explicit isTenantAware: true in non-MTX mode', async () => {
            delete cds.env.requires.multitenancy;
            cache.runtimeConfigManager.options.keyManagement = { isTenantAware: true };
            cds.context = { tenant: 'manual-tenant' };
            await cache.reloadRuntimeConfiguration();
            const key = cache.createKey("test-data")
            expect(key).to.include('manual-tenant')
        })
    })

    describe('Cross-Tenant Key Isolation', () => {

        beforeEach(async () => {
            cds.env.requires.multitenancy = true;
            cache.runtimeConfigManager.options.keyManagement = {};
            await cache.reloadRuntimeConfiguration();
            await cache.clear();
        })

        it('should NOT expose tenant-1 cached data to tenant-2', async () => {
            // Tenant 1 sets a value
            cds.context = { tenant: 't1' };
            await cache.set('shared-key', 'tenant-1-data')

            // Tenant 2 should not see it
            cds.context = { tenant: 't2' };
            const result = await cache.get('shared-key')
            expect(result).to.be.undefined
        })

        it('should allow tenant to read its own cached data', async () => {
            cds.context = { tenant: 't1' };
            await cache.set('my-key', 'my-data')

            // Same tenant should see it
            cds.context = { tenant: 't1' };
            const result = await cache.get('my-key')
            expect(result).to.equal('my-data')
        })

        it('should use different cache keys for tagged entries per tenant', async () => {
            // Tenant 1 sets tagged data
            cds.context = { tenant: 't1' };
            await cache.set('tagged-key', 'val-t1', { tags: ['products'] })

            // Tenant 2 sets same key — different tenant key
            cds.context = { tenant: 't2' };
            await cache.set('tagged-key', 'val-t2', { tags: ['products'] })

            // Each tenant reads its own data
            cds.context = { tenant: 't1' };
            expect(await cache.get('tagged-key')).to.equal('val-t1')

            cds.context = { tenant: 't2' };
            expect(await cache.get('tagged-key')).to.equal('val-t2')
        })
    })

    describe('Cross-Tenant Isolation with Read-Through', () => {

        beforeEach(async () => {
            cds.env.requires.multitenancy = true;
            cache.runtimeConfigManager.options.keyManagement = {};
            await cache.reloadRuntimeConfiguration();
            await cache.clear();
        })

        it('should generate different cache keys for different tenants', async () => {
            // Verify key generation includes tenant prefix
            cds.context = { tenant: 't1' };
            const k1 = cache.createKey('same-query-hash')

            cds.context = { tenant: 't2' };
            const k2 = cache.createKey('same-query-hash')

            // Keys should differ due to tenant prefix
            expect(k1).to.not.equal(k2)
            expect(k1).to.include('t1')
            expect(k2).to.include('t2')
        })

        it('should generate different rt.exec() keys per tenant', async () => {
            let execCount = 0;
            const expensiveFn = async (param) => {
                execCount++;
                return `result_${param}_${execCount}`
            }

            // Tenant 1 calls with tenant-aware key template
            cds.context = { tenant: 't1' };
            const { cacheKey: k1 } = await cache.rt.exec('exec-iso', expensiveFn, ['arg'], {
                key: '{tenant}:{baseKey}:{args[0]}'
            })
            expect(k1).to.equal('t1:exec-iso:arg')

            // Tenant 2 calls same function — different tenant key
            cds.context = { tenant: 't2' };
            const { cacheKey: k2 } = await cache.rt.exec('exec-iso', expensiveFn, ['arg'], {
                key: '{tenant}:{baseKey}:{args[0]}'
            })
            expect(k2).to.equal('t2:exec-iso:arg')

            // Both tenants executed separately (no cross-tenant cache hit)
            expect(execCount).to.equal(2)
        })
    })

    describe('RuntimeConfigurationManager in MTX Mode', () => {
        it('should return defaults without tenant context (no DB error)', async () => {
            cds.env.requires.multitenancy = true;
            cds.context = {}; // no tenant
            const config = await cache.getRuntimeConfiguration();
            expect(config).to.have.property('keyManagement')
            expect(config).to.have.property('metricsEnabled')
        })

        it('should return isTenantAware: true in MTX mode config', async () => {
            cds.env.requires.multitenancy = true;
            cache.runtimeConfigManager.options.keyManagement = {};
            const config = await cache.getRuntimeConfiguration();
            expect(config.keyManagement.isTenantAware).to.be.true
        })

        it('should return {tenant}:{hash} template in MTX mode', async () => {
            cds.env.requires.multitenancy = true;
            cache.runtimeConfigManager.options.keyManagement = {};
            const template = cache.runtimeConfigManager.getDefaultKeyTemplate();
            expect(template).to.equal('{tenant}:{hash}')
        })

        it('should handle setMetricsEnabled without tenant context safely', async () => {
            cds.env.requires.multitenancy = true;
            cds.context = {};
            // Should not throw
            await cache.setMetricsEnabled(true);
        })

        it('should handle setKeyMetricsEnabled without tenant context safely', async () => {
            cds.env.requires.multitenancy = true;
            cds.context = {};
            // Should not throw
            await cache.setKeyMetricsEnabled(true);
        })
    })

    describe('Statistics in MTX Mode', () => {
        it('should still collect in-memory statistics', async () => {
            cds.env.requires.multitenancy = true;
            await cache.setMetricsEnabled(true);

            cds.context = { tenant: 't1' };
            await cache.set('stats-key', 'value')
            await cache.get('stats-key')

            const metrics = await cache.getCurrentMetrics();
            expect(metrics).to.exist
        })
    })

    describe('Backward Compatibility (Non-MTX Mode)', () => {

        beforeEach(async () => {
            delete cds.env.requires.multitenancy;
            cache.runtimeConfigManager.options.keyManagement = {
                isUserAware: false,
                isTenantAware: false,
                isLocaleAware: false
            };
            await cache.reloadRuntimeConfiguration();
        })

        it('should default isTenantAware to false', async () => {
            const config = await cache.getRuntimeConfiguration();
            expect(config.keyManagement.isTenantAware).to.be.false
        })

        it('should NOT include tenant prefix in keys by default', async () => {
            cds.context = { tenant: 'some-tenant' };
            const key = cache.createKey("test-data")
            expect(key).to.not.include('some-tenant')
            expect(key).to.equal('test-data')
        })

        it('should still read from DB for runtime configuration', async () => {
            const config = await cache.getRuntimeConfiguration();
            expect(config).to.have.property('keyManagement')
            expect(config).to.have.property('throwOnErrors')
        })

        it('should support all existing cache operations', async () => {
            await cache.set('compat-key', 'value')
            expect(await cache.get('compat-key')).to.equal('value')
            expect(await cache.has('compat-key')).to.be.true
            await cache.delete('compat-key')
            expect(await cache.has('compat-key')).to.be.false
        })
    })
})
