const { fs, path } = require('@sap/cds').utils
const { isMetricsConfigured } = require('./config-normalizer')

const statisticsRoot = (pluginDir) => path.join(pluginDir, 'db', 'statistics')
const cacheStoreRoot = (pluginDir) => path.join(pluginDir, 'db', 'cache-store')
const indexRoot = (pluginDir) => path.join(pluginDir, 'index')

/**
 * Resolve plugin CDS model roots to inject into cds.env.roots.
 * Deduplicates overlapping paths (index.cds already includes statistics).
 *
 * @param {object} options
 * @param {string} options.pluginDir - Absolute path to the cds-caching package root
 * @param {string} options.projectRoot - Absolute path to the CAP project root
 * @param {string} [options.srvFolder='srv'] - Relative srv folder name
 * @param {Array<ReturnType<import('./config-normalizer').normalizeCachingConfig>>} options.normalizedConfigs
 * @returns {{ roots: string[], reuseDashboard: boolean, warnings: string[] }}
 */
function resolvePluginRoots({ pluginDir, projectRoot, srvFolder = 'srv', normalizedConfigs }) {
    const roots = []
    const warnings = []
    const pushRoot = (root) => {
        if (!roots.includes(root)) roots.push(root)
    }

    const apiImportedInProject = projectImportsCachingApi(projectRoot, srvFolder)
    const projectDashboardDir = path.join(projectRoot, 'app', 'caching-dashboard')

    const reuseApi = normalizedConfigs.some(c => c.reuse?.api)
    const reuseDashboard = normalizedConfigs.some(c => c.reuse?.dashboard)
    const metricsConfigured = normalizedConfigs.some(c => isMetricsConfigured(c))

    if (normalizedConfigs.some(c => c.store === 'cds')) {
        pushRoot(cacheStoreRoot(pluginDir))
    }

    for (const normalized of normalizedConfigs) {
        for (const msg of normalized.legacyWarnings ?? []) {
            if (!warnings.includes(msg)) warnings.push(msg)
        }
    }

    if (reuseApi || reuseDashboard) {
        if (apiImportedInProject) {
            warnings.push(
                'cds-caching: metrics.reuse.api or metrics.reuse.dashboard is set but srv/ already imports cds-caching/index.cds. ' +
                'Remove the using import or disable metrics.reuse to avoid Duplicate definition of CachingApiService. ' +
                'See docs/feature-activation.md.'
            )
        }
        pushRoot(indexRoot(pluginDir))
    } else if (metricsConfigured && !apiImportedInProject) {
        pushRoot(statisticsRoot(pluginDir))
    }

    if (reuseDashboard && fs.existsSync(projectDashboardDir)) {
        warnings.push(
            'cds-caching: metrics.reuse.dashboard serves UI from the plugin package, but app/caching-dashboard/ already exists. ' +
            'Use metrics.reuse for zero-config reuse, or cds add caching-metrics for a project-owned UI — not both. ' +
            'See docs/feature-activation.md.'
        )
    }

    return { roots, reuseDashboard, warnings }
}

function projectImportsCachingApi(projectRoot, srvFolder = 'srv') {
    const srvDir = path.join(projectRoot, srvFolder)
    if (!fs.existsSync(srvDir)) return false
    const apiImport = /from\s+['"]cds-caching\/index\.cds['"]/
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) {
                if (walk(full)) return true
            } else if (entry.name.endsWith('.cds') && apiImport.test(fs.readFileSync(full, 'utf8'))) {
                return true
            }
        }
        return false
    }
    return walk(srvDir)
}

module.exports = {
    resolvePluginRoots,
    projectImportsCachingApi,
    statisticsRoot,
    cacheStoreRoot,
    indexRoot,
}
