const {
    normalizeCachingConfig,
    getStatisticsHandlerOptions,
    detectMisplacedKeyManagement,
    resetDeprecationWarnings,
} = require('../lib/config-normalizer')

describe('normalizeCachingConfig', () => {

    beforeEach(() => resetDeprecationWarnings())

    it('returns null metrics when only impl is configured', () => {
        const { metrics, reuse } = normalizeCachingConfig({ impl: 'cds-caching' })
        expect(metrics).toBeNull()
        expect(reuse).toEqual({ api: false, dashboard: false })
    })

    it('maps v2 metrics block', () => {
        const { metrics, reuse } = normalizeCachingConfig({
            impl: 'cds-caching',
            metrics: {
                enabled: true,
                persistenceInterval: 60000,
                reuse: { api: true, dashboard: true },
            },
        })
        expect(metrics.enabled).toBe(true)
        expect(metrics.persistenceInterval).toBe(60000)
        expect(reuse).toEqual({ api: true, dashboard: true })
    })

    it('rejects removed statistics key', () => {
        expect(() => normalizeCachingConfig({
            statistics: { enabled: true, persistenceInterval: 10000 },
        })).toThrow(/statistics.*removed in 3\.0/)
    })

    it('rejects removed dashboard key', () => {
        expect(() => normalizeCachingConfig({ dashboard: true })).toThrow(/dashboard.*removed in 3\.0/)
        expect(() => normalizeCachingConfig({ dashboard: false })).toThrow(/dashboard.*removed in 3\.0/)
    })

    it('dashboard reuse flag implies reuse.api', () => {
        const { reuse } = normalizeCachingConfig({
            metrics: { reuse: { dashboard: true } },
        })
        expect(reuse).toEqual({ api: true, dashboard: true })
    })
})

describe('getStatisticsHandlerOptions', () => {

    it('extracts handler options from metrics config', () => {
        const opts = getStatisticsHandlerOptions({
            enabled: true,
            persistenceInterval: 60000,
            maxLatencies: 500,
            keyMetricsEnabled: true,
        })
        expect(opts).toEqual({
            metricsEnabled: true,
            persistenceInterval: 60000,
            maxLatencies: 500,
            keyMetricsEnabled: true,
        })
    })

    it('passes through the metric field length cap', () => {
        const opts = getStatisticsHandlerOptions({ maxMetricFieldLength: 512 })
        expect(opts).toEqual({ maxMetricFieldLength: 512 })
    })
})

describe('detectMisplacedKeyManagement', () => {

    beforeEach(() => resetDeprecationWarnings())

    it('returns null when keyManagement is correctly nested under requires', () => {
        const env = { requires: { caching: { impl: 'cds-caching', keyManagement: { isUserAware: true } } } }
        expect(detectMisplacedKeyManagement(env, {})).toBeNull()
    })

    it('warns about a top-level block in package.json', () => {
        const pkg = { 'cds-caching': { keyManagement: { isUserAware: true } } }
        const warning = detectMisplacedKeyManagement({}, pkg)
        expect(warning).toMatch(/ignored/)
        expect(warning).toMatch(/keyManagement/)
    })

    it('warns about a block reaching cds.env via .cdsrc.json', () => {
        const env = { 'cds-caching': { keyManagement: { isTenantAware: true } } }
        expect(detectMisplacedKeyManagement(env, {})).toMatch(/ignored/)
    })

    it('warns only once', () => {
        const pkg = { 'cds-caching': { keyManagement: { isUserAware: true } } }
        expect(detectMisplacedKeyManagement({}, pkg)).toMatch(/ignored/)
        expect(detectMisplacedKeyManagement({}, pkg)).toBeNull()
    })

    it('ignores an unrelated cds-caching block without keyManagement', () => {
        const pkg = { 'cds-caching': { somethingElse: true } }
        expect(detectMisplacedKeyManagement({}, pkg)).toBeNull()
    })

    it('tolerates missing arguments', () => {
        expect(detectMisplacedKeyManagement()).toBeNull()
    })
})
