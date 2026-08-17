const fs = require('fs')
const path = require('path')

/**
 * UI5 runtime the hosted dashboard bootstraps from.
 *
 * The dashboard used to ship a self-contained UI5 build, which accounted for
 * over 99% of the published package and for the same runtime being copied into
 * every consumer project. It now loads UI5 from a pinned CDN version instead.
 *
 * The version is pinned rather than floating: an unpinned URL silently upgrades
 * the runtime under a released dashboard, so a UI5 regression would surface as a
 * broken dashboard in deployments that changed nothing.
 */
const DEFAULT_UI5_VERSION = '1.136.1'
const DEFAULT_UI5_URL = `https://ui5.sap.com/${DEFAULT_UI5_VERSION}/resources/sap-ui-core.js`

/** Matches the bootstrap script tag, whatever order its attributes are in. */
const BOOTSTRAP_TAG = /<script\b[^>]*\bid=["']sap-ui-bootstrap["'][^>]*>/i

/**
 * Whether a configured URL is safe to inject into the bootstrap tag.
 * Absolute http(s) URLs and same-origin absolute paths are allowed; the latter
 * covers deployments that serve UI5 themselves instead of reaching a CDN.
 * @param {any} url - Configured value
 * @returns {boolean}
 */
function isValidUi5Url(url) {
    if (typeof url !== 'string' || !url.trim()) return false
    if (/["'<>\s]/.test(url)) return false
    return /^https?:\/\//i.test(url) || url.startsWith('/')
}

/**
 * Resolve the UI5 bootstrap URL from normalized caching configs.
 *
 * Any cache may carry the setting, since the dashboard is enabled per cache, but
 * only one dashboard is served. The first configured value wins and a conflict
 * is reported rather than silently resolved.
 *
 * @param {Array<{ name: string, normalized: object }>} [entries=[]] - Normalized config entries
 * @returns {{ url: string, warnings: string[] }}
 */
function resolveUi5Url(entries = []) {
    const warnings = []
    const configured = []

    for (const { name, normalized } of entries) {
        const value = normalized?.metrics?.ui5Url
        if (value === undefined) continue

        if (!isValidUi5Url(value)) {
            warnings.push(
                `cds-caching: ignoring metrics.ui5Url of cache "${name}": expected an http(s) URL or an absolute path, got ${JSON.stringify(value)}.`
            )
            continue
        }
        configured.push({ name, value })
    }

    const distinct = [...new Set(configured.map(c => c.value))]
    if (distinct.length > 1) {
        warnings.push(
            `cds-caching: caches configure different metrics.ui5Url values (${distinct.join(', ')}); using ${distinct[0]} for the dashboard.`
        )
    }

    return { url: distinct[0] || DEFAULT_UI5_URL, warnings }
}

/**
 * Point the bootstrap script of a dashboard index.html at the given UI5 runtime.
 * @param {string} html - Dashboard index.html
 * @param {string} ui5Url - UI5 bootstrap URL
 * @returns {string} Rendered HTML
 */
function renderIndexHtml(html, ui5Url) {
    return html.replace(BOOTSTRAP_TAG, tag => (
        /\bsrc=/i.test(tag)
            ? tag.replace(/\bsrc=["'][^"']*["']/i, `src="${ui5Url}"`)
            : tag.replace(/^<script\b/i, `<script src="${ui5Url}"`)
    ))
}

/**
 * Build an Express handler serving the dashboard entry page with the configured
 * UI5 runtime substituted. The result is rendered once and reused, since neither
 * the file nor the configuration changes while the process runs.
 *
 * @param {string} dashboardPath - Directory holding the built dashboard
 * @param {string} ui5Url - UI5 bootstrap URL
 * @returns {(req: object, res: object, next: Function) => void}
 */
function createIndexHandler(dashboardPath, ui5Url) {
    const indexPath = path.join(dashboardPath, 'index.html')
    let rendered

    return (req, res, next) => {
        try {
            if (rendered === undefined) {
                rendered = renderIndexHtml(fs.readFileSync(indexPath, 'utf8'), ui5Url)
            }
            res.type('html').send(rendered)
        } catch (err) {
            next(err)
        }
    }
}

module.exports = {
    DEFAULT_UI5_VERSION,
    DEFAULT_UI5_URL,
    isValidUi5Url,
    resolveUi5Url,
    renderIndexHtml,
    createIndexHandler,
}
