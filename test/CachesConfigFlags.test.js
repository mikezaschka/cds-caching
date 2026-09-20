const cds = require('@sap/cds')
const test = cds.test().in(__dirname + '/app/')
const { GET, POST, expect, axios } = test
const { describeFromCds } = require('./helpers/cds-version')

// CachingApiService requires an authenticated user.
const ADMIN = { username: 'cacheadmin', password: 'cacheadmin' }

/**
 * Metric flags: package.json seeds when the DB override is null; an explicit
 * operator value wins across restarts. OData Caches.*Enabled is the *effective*
 * value; overrides are on *Override / getConfigView.
 */
describeFromCds(9, 'Caches metrics flags from config', () => {

	before(() => {
		axios.defaults.auth = ADMIN
	})

	beforeEach(async () => {
		const cache = await cds.connect.to('caching')
		// Clear operator overrides so each case starts from config seed.
		await cache.setMetricsEnabled(null)
		await cache.setKeyMetricsEnabled(null)
		await cache.setTagMetricsEnabled(null)
	})

	it('uses package.json as the effective value when no operator override is set', async () => {
		const { data } = await GET("/odata/v4/caching-api/Caches('caching')")

		expect(data.metricsEnabled).to.equal(true)
		expect(data.tagMetricsEnabled).to.equal(true)
		expect(data.keyMetricsEnabled).to.equal(false)
		expect(data.metricsEnabledConfig).to.equal(true)
		expect(data.metricsEnabledOverride).to.equal(null)
		expect(data.tagMetricsEnabledOverride).to.equal(null)
	})

	it('keeps an operator false across reload despite metrics.enabled: true', async () => {
		const cache = await cds.connect.to('caching')
		await cache.setMetricsEnabled(false)

		const before = await cache.getRuntimeConfiguration()
		expect(before.metricsEnabled).to.equal(false)
		expect(before.metricsEnabledOverride).to.equal(false)

		// Simulate process restart: re-read DB + config the same way init does.
		const after = await cache.getRuntimeConfiguration()
		expect(after.metricsEnabled).to.equal(false)
		expect(after.metricsEnabledOverride).to.equal(false)

		const { data } = await GET("/odata/v4/caching-api/Caches('caching')")
		expect(data.metricsEnabled).to.equal(false)
		expect(data.metricsEnabledOverride).to.equal(false)
		expect(data.metricsEnabledConfig).to.equal(true)
	})

	it('follows config again after the operator override is cleared', async () => {
		const cache = await cds.connect.to('caching')
		await cache.setMetricsEnabled(false)
		await cache.setMetricsEnabled(null)

		const config = await cache.getRuntimeConfiguration()
		expect(config.metricsEnabled).to.equal(true)
		expect(config.metricsEnabledOverride).to.equal(null)

		const { data } = await GET("/odata/v4/caching-api/Caches('caching')")
		expect(data.metricsEnabled).to.equal(true)
		expect(data.metricsEnabledOverride).to.equal(null)
	})

	it('exposes config, override and effective via getConfigView', async () => {
		const cache = await cds.connect.to('caching')
		await cache.setTagMetricsEnabled(false)

		const { data } = await GET("/odata/v4/caching-api/Caches('caching')/getConfigView()")
		expect(data.metrics).to.deep.equal({
			config: true,
			override: null,
			effective: true,
		})
		expect(data.tagMetrics).to.deep.equal({
			config: true,
			override: false,
			effective: false,
		})
		expect(data.keyMetrics.effective).to.equal(false)
	})

	it('accepts null through the OData setMetricsEnabled action to clear override', async () => {
		await POST("/odata/v4/caching-api/Caches('caching')/setMetricsEnabled", { enabled: false })
		await POST("/odata/v4/caching-api/Caches('caching')/setMetricsEnabled", { enabled: null })

		const { data } = await GET("/odata/v4/caching-api/Caches('caching')")
		expect(data.metricsEnabled).to.equal(true)
		expect(data.metricsEnabledOverride).to.equal(null)
	})
})
