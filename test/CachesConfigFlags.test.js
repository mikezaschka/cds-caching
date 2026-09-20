const cds = require('@sap/cds')
const test = cds.test().in(__dirname + '/app/')
const { GET, expect, axios } = test
const { describeFromCds } = require('./helpers/cds-version')

// CachingApiService requires an authenticated user.
const ADMIN = { username: 'cacheadmin', password: 'cacheadmin' }

/**
 * Config-driven metrics flags must land on the Caches row. Collection already
 * respected package.json; the OData projection did not (UPDATE-only persist +
 * seed omitted the columns). Do not call setMetricsEnabled here — that would
 * mask the bug.
 */
describeFromCds(9, 'Caches metrics flags from config', () => {

	before(() => {
		axios.defaults.auth = ADMIN
	})

	it('reflects metrics.enabled and tagMetricsEnabled from package.json on Caches', async () => {
		const { data } = await GET("/odata/v4/caching-api/Caches('caching')")

		expect(data.metricsEnabled).to.equal(true)
		expect(data.tagMetricsEnabled).to.equal(true)
		expect(data.keyMetricsEnabled).to.equal(false)
	})

	it('re-seeds flags from config when the Caches row is missing', async () => {
		const { Caches } = cds.entities('plugin.cds_caching')
		await DELETE.from(Caches).where({ name: 'caching' })

		// Non-MTX: recreate via RuntimeConfigurationManager upsert (same path as
		// CachingService.init when metrics.enabled is true).
		const cache = await cds.connect.to('caching')
		await cache.setMetricsEnabled(true)
		await cache.setTagMetricsEnabled(true)

		const { data } = await GET("/odata/v4/caching-api/Caches('caching')")
		expect(data.metricsEnabled).to.equal(true)
		expect(data.tagMetricsEnabled).to.equal(true)
	})
})
