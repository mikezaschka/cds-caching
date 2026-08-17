const { expect } = require('chai')
require('@sap/cds') // CacheStoreManager logs through the global cds

const {
	withTimeout,
	resolveOperationTimeout,
	CacheTimeoutError,
	DEFAULT_OPERATION_TIMEOUT,
} = require('../lib/support/withTimeout')
const CacheStoreManager = require('../lib/support/CacheStoreManager')

const never = () => new Promise(() => { })

describe('cache operation timeout', () => {

	describe('the bound itself', () => {

		it('abandons an operation that never settles', async () => {
			const started = Date.now()

			try {
				await withTimeout(never, 60, 'caching.get')
				expect.fail('expected the bound to fire')
			} catch (error) {
				expect(error).to.be.instanceOf(CacheTimeoutError)
				expect(error.code).to.equal('CACHE_TIMEOUT')
				expect(error.message).to.match(/caching\.get exceeded 60ms/)
			}

			expect(Date.now() - started).to.be.lessThan(2000)
		})

		it('passes a result through untouched', async () => {
			expect(await withTimeout(async () => ({ value: 42 }), 1000, 'caching.get')).to.eql({ value: 42 })
		})

		it('propagates a real store error rather than masking it as a timeout', async () => {
			const boom = new Error('ECONNREFUSED')

			try {
				await withTimeout(async () => { throw boom }, 1000, 'caching.get')
				expect.fail('expected the store error')
			} catch (error) {
				expect(error).to.equal(boom)
			}
		})

		it('runs unbounded when the bound is disabled', async () => {
			expect(await withTimeout(async () => 'ok', 0, 'caching.get')).to.equal('ok')
		})

		// An abandoned operation keeps running; if it fails afterwards, that rejection
		// must not escape as an unhandled one and take the process down.
		it('swallows a rejection that arrives after the bound fired', async () => {
			const unhandled = []
			const onUnhandled = reason => unhandled.push(reason)
			process.on('unhandledRejection', onUnhandled)

			try {
				const late = withTimeout(
					() => new Promise((_, reject) => setTimeout(() => reject(new Error('too late')), 40)),
					10,
					'caching.get'
				)
				await late.catch(() => { })
				await new Promise(resolve => setTimeout(resolve, 120))
			} finally {
				process.off('unhandledRejection', onUnhandled)
			}

			expect(unhandled).to.eql([])
		})
	})

	describe('configuration', () => {

		it('bounds operations by default', () => {
			expect(resolveOperationTimeout({})).to.equal(DEFAULT_OPERATION_TIMEOUT)
			expect(DEFAULT_OPERATION_TIMEOUT).to.be.greaterThan(0)
		})

		it('honours an explicit bound', () => {
			expect(resolveOperationTimeout({ operationTimeout: 250 })).to.equal(250)
		})

		it('lets the bound be switched off', () => {
			expect(resolveOperationTimeout({ operationTimeout: 0 })).to.equal(0)
			expect(resolveOperationTimeout({ operationTimeout: false })).to.equal(0)
		})

		it('falls back to the default for nonsense values', () => {
			expect(resolveOperationTimeout({ operationTimeout: -5 })).to.equal(DEFAULT_OPERATION_TIMEOUT)
			expect(resolveOperationTimeout({ operationTimeout: 'soon' })).to.equal(DEFAULT_OPERATION_TIMEOUT)
		})
	})

	describe('stores built by the manager', () => {

		let manager
		beforeEach(() => { manager = new CacheStoreManager() })

		it('bounds a store that stops answering', async () => {
			const { cache } = manager.createStore({ operationTimeout: 60 }, 'wedged')
			cache.store.get = never
			cache.store.has = never

			for (const [operation, call] of [['get', () => cache.get('k')], ['has', () => cache.has('k')]]) {
				try {
					await call()
					expect.fail(`expected ${operation} to be bounded`)
				} catch (error) {
					expect(error.code, error.message).to.equal('CACHE_TIMEOUT')
					expect(error.message).to.match(new RegExp(`wedged\\.${operation} exceeded 60ms`))
				}
			}
		})

		it('leaves a healthy store working', async () => {
			const { cache } = manager.createStore({ operationTimeout: 1000 }, 'healthy')

			await cache.set('k', { value: 'v' })
			expect(await cache.get('k')).to.eql({ value: 'v' })
			expect(await cache.has('k')).to.be.true

			await cache.delete('k')
			expect(await cache.has('k')).to.be.false
		})

		it('leaves iteration unbounded, since one deadline cannot cover a stream', () => {
			const { cache } = manager.createStore({ operationTimeout: 60 }, 'streamed')
			expect(cache.iterator.name).to.not.equal('')
		})

		it('does not bound anything when switched off', async () => {
			const { cache } = manager.createStore({ operationTimeout: 0 }, 'unbounded')

			await cache.set('k', 1)
			expect(await cache.get('k')).to.equal(1)
		})
	})
})
