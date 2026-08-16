const { expect } = require('chai')
const { join } = require('path')
const {
	DEFAULT_UI5_URL,
	isValidUi5Url,
	resolveUi5Url,
	renderIndexHtml,
	createIndexHandler,
} = require('../lib/dashboard-bootstrap')

const entry = (name, ui5Url) => ({ name, normalized: { metrics: ui5Url === undefined ? {} : { ui5Url } } })

describe('dashboard UI5 bootstrap', () => {

	describe('resolveUi5Url', () => {

		it('falls back to the pinned CDN version when nothing is configured', () => {
			expect(resolveUi5Url([]).url).to.equal(DEFAULT_UI5_URL)
			expect(resolveUi5Url([entry('caching')]).url).to.equal(DEFAULT_UI5_URL)
		})

		it('pins a version rather than tracking the latest release', () => {
			expect(DEFAULT_UI5_URL).to.match(/^https:\/\/ui5\.sap\.com\/\d+\.\d+\.\d+\//)
		})

		it('uses a configured URL', () => {
			const { url, warnings } = resolveUi5Url([entry('caching', 'https://ui5.example.com/resources/sap-ui-core.js')])

			expect(url).to.equal('https://ui5.example.com/resources/sap-ui-core.js')
			expect(warnings).to.be.empty
		})

		it('accepts an absolute path, for deployments serving UI5 themselves', () => {
			expect(resolveUi5Url([entry('caching', '/ui5/resources/sap-ui-core.js')]).url)
				.to.equal('/ui5/resources/sap-ui-core.js')
		})

		it('reports a conflict instead of silently picking one', () => {
			const { url, warnings } = resolveUi5Url([
				entry('a', 'https://one.example.com/sap-ui-core.js'),
				entry('b', 'https://two.example.com/sap-ui-core.js'),
			])

			expect(url).to.equal('https://one.example.com/sap-ui-core.js')
			expect(warnings.join(' ')).to.include('different metrics.ui5Url')
		})

		it('does not warn when caches agree', () => {
			const url = 'https://ui5.example.com/sap-ui-core.js'
			expect(resolveUi5Url([entry('a', url), entry('b', url)]).warnings).to.be.empty
		})

		it('rejects values that could break out of the attribute', () => {
			for (const bad of ['java script:alert(1)', 'https://x/"onload="y', 'not a url', '', 42, null]) {
				expect(isValidUi5Url(bad), String(bad)).to.be.false
			}

			const { url, warnings } = resolveUi5Url([entry('caching', 'https://x/"onload="y')])
			expect(url).to.equal(DEFAULT_UI5_URL)
			expect(warnings.join(' ')).to.include('ignoring metrics.ui5Url')
		})
	})

	describe('renderIndexHtml', () => {

		const url = 'https://ui5.example.com/resources/sap-ui-core.js'

		it('replaces the bootstrap src', () => {
			const html = '<script id="sap-ui-bootstrap" src="resources/sap-ui-custom.js" data-sap-ui-async="true"></script>'
			const out = renderIndexHtml(html, url)

			expect(out).to.include(`src="${url}"`)
			expect(out).to.not.include('sap-ui-custom.js')
			expect(out).to.include('data-sap-ui-async="true"')
		})

		it('handles src appearing before id', () => {
			const html = '<script src="resources/sap-ui-core.js" id="sap-ui-bootstrap"></script>'
			expect(renderIndexHtml(html, url)).to.include(`src="${url}"`)
		})

		it('adds a src when the tag has none', () => {
			const html = '<script id="sap-ui-bootstrap" data-sap-ui-async="true"></script>'
			expect(renderIndexHtml(html, url)).to.include(`src="${url}"`)
		})

		it('leaves other script tags alone', () => {
			const html = '<script src="other.js"></script><script id="sap-ui-bootstrap" src="old.js"></script>'
			const out = renderIndexHtml(html, url)

			expect(out).to.include('src="other.js"')
			expect(out).to.not.include('src="old.js"')
		})

		it('rewrites the real built index.html', () => {
			const html = require('fs').readFileSync(join(__dirname, '..', 'app', 'dashboard', 'index.html'), 'utf8')
			const out = renderIndexHtml(html, url)

			expect(out).to.include(`src="${url}"`)
			expect(out.match(/id="sap-ui-bootstrap"/g)).to.have.lengthOf(1)
			expect(out).to.include('data-sap-ui-component')
		})
	})

	describe('createIndexHandler', () => {

		const dashboardPath = join(__dirname, '..', 'app', 'dashboard')
		const url = 'https://ui5.example.com/resources/sap-ui-core.js'

		/** Minimal express-like response recorder. */
		const fakeRes = () => {
			const res = { body: undefined, contentType: undefined }
			res.type = (value) => { res.contentType = value; return res }
			res.send = (value) => { res.body = value; return res }
			return res
		}

		it('serves the entry page with the configured runtime', () => {
			const res = fakeRes()
			createIndexHandler(dashboardPath, url)({}, res, () => { throw new Error('should not fall through') })

			expect(res.contentType).to.equal('html')
			expect(res.body).to.include(`src="${url}"`)
		})

		it('renders once and reuses the result', () => {
			const handler = createIndexHandler(dashboardPath, url)
			const first = fakeRes()
			const second = fakeRes()

			handler({}, first, () => {})
			handler({}, second, () => {})

			expect(second.body).to.equal(first.body)
		})

		it('delegates to the error handler when the page is missing', () => {
			let forwarded
			createIndexHandler(join(dashboardPath, 'does-not-exist'), url)({}, fakeRes(), (err) => { forwarded = err })

			expect(forwarded).to.be.an('error')
		})
	})
})
