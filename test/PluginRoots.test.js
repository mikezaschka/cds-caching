const { path } = require('@sap/cds').utils
const {
    resolvePluginRoots,
    statisticsRoot,
    indexRoot,
    cacheStoreRoot,
} = require('../lib/plugin-roots')
const { normalizeCachingConfig } = require('../lib/config-normalizer')

const pluginDir = path.join(__dirname, '..')
const testAppRoot = path.join(__dirname, 'app')

describe('resolvePluginRoots', () => {

    it('loads index only when metrics.reuse.dashboard (no separate statistics root)', () => {
        const normalized = normalizeCachingConfig({
            metrics: { enabled: true, reuse: { api: true, dashboard: true } },
        })
        const { roots, reuseDashboard, warnings } = resolvePluginRoots({
            pluginDir,
            projectRoot: '/tmp/no-srv',
            normalizedConfigs: [normalized],
        })
        expect(reuseDashboard).toBe(true)
        expect(warnings).toEqual([])
        expect(roots).toEqual([indexRoot(pluginDir)])
    })

    it('loads statistics only when metrics configured without reuse API', () => {
        const normalized = normalizeCachingConfig({
            metrics: { enabled: true },
        })
        const { roots } = resolvePluginRoots({
            pluginDir,
            projectRoot: '/tmp/no-srv',
            normalizedConfigs: [normalized],
        })
        expect(roots).toEqual([statisticsRoot(pluginDir)])
    })

    it('skips statistics root when srv/ already imports index.cds', () => {
        const normalized = normalizeCachingConfig({
            metrics: { enabled: true },
        })
        const { roots } = resolvePluginRoots({
            pluginDir,
            projectRoot: testAppRoot,
            normalizedConfigs: [normalized],
        })
        expect(roots).not.toContain(statisticsRoot(pluginDir))
        expect(roots).toEqual([])
    })

    it('warns when reuse API overlaps manual using import', () => {
        const normalized = normalizeCachingConfig({
            metrics: { reuse: { api: true } },
        })
        const { roots, warnings } = resolvePluginRoots({
            pluginDir,
            projectRoot: testAppRoot,
            normalizedConfigs: [normalized],
        })
        expect(roots).toEqual([indexRoot(pluginDir)])
        expect(warnings.some(w => w.includes('metrics.reuse'))).toBe(true)
    })

    it('maps v1 dashboard:true via normalizer to reuse dashboard', () => {
        const normalized = normalizeCachingConfig({ dashboard: true })
        const { roots, reuseDashboard } = resolvePluginRoots({
            pluginDir,
            projectRoot: '/tmp/no-srv',
            normalizedConfigs: [normalized],
        })
        expect(reuseDashboard).toBe(true)
        expect(roots).toEqual([indexRoot(pluginDir)])
    })

    it('adds cache-store root for store:cds independently', () => {
        const normalized = normalizeCachingConfig({ store: 'cds' })
        const { roots } = resolvePluginRoots({
            pluginDir,
            projectRoot: '/tmp/no-srv',
            normalizedConfigs: [normalized],
        })
        expect(roots).toEqual([cacheStoreRoot(pluginDir)])
    })

    it('combines cache-store with reuse index without statistics duplicate', () => {
        const normalized = normalizeCachingConfig({
            store: 'cds',
            metrics: { enabled: true, reuse: { api: true, dashboard: true } },
        })
        const { roots } = resolvePluginRoots({
            pluginDir,
            projectRoot: '/tmp/no-srv',
            normalizedConfigs: [normalized],
        })
        expect(roots).toEqual([cacheStoreRoot(pluginDir), indexRoot(pluginDir)])
    })
})
