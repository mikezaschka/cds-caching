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

/**
 * Append plugin model roots to each HANA build task's `options.model`.
 * The default hana task only loads db/srv/app, so plugin entities/views would
 * otherwise be missing from gen/db.
 *
 * @param {Array<{ for?: string, options?: { model?: string|string[] } }>} tasks
 * @param {string[]} roots
 * @returns {boolean} whether any task's model was modified
 */
function injectPluginRootsIntoHanaTasks(tasks, roots) {
    if (!roots?.length) return false
    let changedAny = false
    for (const task of tasks || []) {
        if (task?.for !== 'hana') continue
        task.options ??= {}
        const model = Array.isArray(task.options.model)
            ? [...task.options.model]
            : (task.options.model ? [task.options.model] : [])
        let changed = false
        for (const root of roots) {
            if (!model.includes(root)) {
                model.push(root)
                changed = true
            }
        }
        if (changed) {
            task.options.model = model
            changedAny = true
        }
    }
    return changedAny
}

/**
 * Inject roots into hana tasks already on the list, and into any task pushed later
 * (cds-caching's build plugin is often constructed before the hana task).
 *
 * @param {Array & { push: Function, _cdsCachingRootsHooked?: boolean }} tasks
 * @param {string[]} roots
 * @returns {boolean} whether any existing task was modified by the initial inject
 */
function ensureHanaTasksIncludePluginRoots(tasks, roots) {
    if (!tasks) return false
    const changed = injectPluginRootsIntoHanaTasks(tasks, roots)
    if (tasks._cdsCachingRootsHooked) return changed
    const origPush = tasks.push.bind(tasks)
    tasks.push = (...args) => {
        const n = origPush(...args)
        injectPluginRootsIntoHanaTasks(args, roots)
        return n
    }
    tasks._cdsCachingRootsHooked = true
    return changed
}

module.exports = {
    resolvePluginRoots,
    projectImportsCachingApi,
    injectPluginRootsIntoHanaTasks,
    ensureHanaTasksIncludePluginRoots,
    statisticsRoot,
    cacheStoreRoot,
    indexRoot,
}
