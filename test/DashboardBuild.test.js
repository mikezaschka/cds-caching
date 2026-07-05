const { existsSync } = require('fs')
const { join } = require('path')

const dashboardRoot = join(__dirname, '..', 'app', 'dashboard')

/** Files UI5 loads at runtime in addition to sap-ui-custom.js (self-contained build with --all). */
const REQUIRED_ASSETS = [
	'resources/sap-ui-custom.js',
	'resources/sap/ui/core/cldr/en.json',
	'resources/sap/ui/core/cldr/de.json',
	'resources/sap/ui/core/date/Gregorian.js',
	'resources/sap/ui/core/messagebundle_en.properties',
	'resources/sap/ui/core/themes/sap_horizon_dark/library.css',
	'controller/App.controller.js',
	'index.html',
]

describe('pre-built dashboard bundle', () => {
	for (const asset of REQUIRED_ASSETS) {
		it(`includes ${asset}`, () => {
			expect(existsSync(join(dashboardRoot, asset))).toBe(true)
		})
	}
})
