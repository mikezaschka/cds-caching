const { existsSync, readFileSync, readdirSync } = require('fs')
const { join } = require('path')

const dashboardRoot = join(__dirname, '..', 'app', 'dashboard')

/** Files the dashboard needs in order to start. */
const REQUIRED_ASSETS = [
	'index.html',
	'manifest.json',
	'Component.js',
	'Component-preload.js',
	'controller/App.controller.js',
	'i18n/i18n.properties',
]

describe('pre-built dashboard bundle', () => {

	for (const asset of REQUIRED_ASSETS) {
		it(`includes ${asset}`, () => {
			expect(existsSync(join(dashboardRoot, asset))).toBe(true)
		})
	}

	it('bootstraps UI5 from a pinned version, so a runtime release cannot change it', () => {
		const html = readFileSync(join(dashboardRoot, 'index.html'), 'utf8')
		const src = html.match(/<script\b[^>]*id="sap-ui-bootstrap"[^>]*\bsrc="([^"]+)"/)?.[1]
			?? html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*id="sap-ui-bootstrap"/)?.[1]

		expect(src).toMatch(/^https:\/\/ui5\.sap\.com\/\d+\.\d+\.\d+\/resources\/sap-ui-core\.js$/)
	})

	it('does not bundle the UI5 runtime, which dwarfed the rest of the package', () => {
		expect(existsSync(join(dashboardRoot, 'resources'))).toBe(false)
		expect(existsSync(join(dashboardRoot, 'test-resources'))).toBe(false)
	})

	it('stays small enough to ship', () => {
		const count = (dir) => readdirSync(dir, { withFileTypes: true })
			.reduce((total, entry) => total + (entry.isDirectory() ? count(join(dir, entry.name)) : 1), 0)

		expect(count(dashboardRoot)).toBeLessThan(200)
	})
})
