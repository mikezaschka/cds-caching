// Tests for the gen/srv CSN detection and root-injection guard introduced to
// prevent CDS 10 duplicate entity errors on BTP deployments.
//
// The failure mode (reproduced with `cds compile "*"` from gen/srv):
//
//   [ERROR] .../change-tracking/index.cds: Duplicate definition of artifact "sap.changelog.aspect"
//   [ERROR] .../cds/common.cds:            Duplicate definition of artifact "Language"
//   [ERROR] .../cds/common.cds:            Duplicate definition of artifact "sap.common.Countries"
//   [ERROR] .../cds-caching/db/cache-store.cds: Duplicate definition of artifact "plugin.cds_caching.CacheStore"
//   [ERROR] .../cds-caching/db/statistics.cds:  Duplicate definition of artifact "plugin.cds_caching.Caches"
//   ... (dozens more)
//
// Root cause:
//   `cds build` compiles srv/ + using-chain to gen/srv/srv/csn.json.
//   The app on BTP runs from gen/srv with cds.root = gen/srv.
//   At startup the plugin pushes absolute node_modules paths into cds.env.roots.
//   CDS 10's is_csn_json guard fires only when resolve.all() sees a SINGLE CSN
//   as the root; adding absolute paths bypasses the guard and causes every model
//   already baked into the CSN to be compiled again from source — producing the
//   "Duplicate definition of artifact" errors above.
//
// Fix:
//   isGenSrvMode()  — detects whether srv/csn.json exists
//   injectRootsUnlessGenSrvMode() — skips root injection in gen/srv mode
//
// Backwards compatibility requirement:
//   Normal source mode (no csn.json) MUST continue to inject roots exactly as
//   before so that CacheStore and statistics entities are available via
//   cds.env.roots for local dev / unit test runs.

const { path, fs } = require('@sap/cds').utils
const cds = require('@sap/cds')
const os = require('os')
const { execSync } = require('child_process')

const {
    isGenSrvMode,
    injectRootsUnlessGenSrvMode,
    cacheStoreRoot,
    statisticsRoot,
    indexRoot,
} = require('../lib/plugin-roots')

const pluginDir = path.join(__dirname, '..')
const appPath = path.join(__dirname, 'app')
const cdsMajor = Number.parseInt(require('@sap/cds/package.json').version.split('.')[0], 10)

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeTmp() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'cds-caching-gen-'))
}

function writeCsn(dir, srvFolder = 'srv') {
    const srvDir = path.join(dir, srvFolder)
    fs.mkdirSync(srvDir, { recursive: true })
    fs.writeFileSync(path.join(srvDir, 'csn.json'), '{"definitions":{}}')
}

/** Compile the test app srv/ to a CSN string (mirrors what cds build --profile production does). */
function compileSrvToCsn() {
    return execSync('npx cds compile srv --to json', {
        cwd: appPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
    })
}

// ─── isGenSrvMode ─────────────────────────────────────────────────────────────

describe('isGenSrvMode()', () => {
    let tmp

    beforeEach(() => { tmp = makeTmp() })
    afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }) })

    it('returns false when srv/csn.json does not exist', () => {
        expect(isGenSrvMode(tmp, 'srv')).toBe(false)
    })

    it('returns true when srv/csn.json exists', () => {
        writeCsn(tmp, 'srv')
        expect(isGenSrvMode(tmp, 'srv')).toBe(true)
    })

    it('defaults srvFolder to "srv"', () => {
        writeCsn(tmp, 'srv')
        expect(isGenSrvMode(tmp)).toBe(true)
    })

    it('respects a custom srvFolder name', () => {
        writeCsn(tmp, 'services')
        expect(isGenSrvMode(tmp, 'services')).toBe(true)
        expect(isGenSrvMode(tmp, 'srv')).toBe(false)
    })

    it('returns false for a non-existent projectRoot', () => {
        expect(isGenSrvMode('/does/not/exist', 'srv')).toBe(false)
    })
})

// ─── injectRootsUnlessGenSrvMode ──────────────────────────────────────────────

describe('injectRootsUnlessGenSrvMode()', () => {
    let tmp

    beforeEach(() => { tmp = makeTmp() })
    afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }) })

    // ── backwards compatibility: normal source-mode must still inject ─────────

    it('injects roots into envRoots in normal (non-gen/srv) mode', () => {
        const envRoots = []
        const roots = [cacheStoreRoot(pluginDir)]
        injectRootsUnlessGenSrvMode(tmp, 'srv', roots, envRoots)
        expect(envRoots).toEqual(roots)
    })

    it('injects multiple roots in normal mode', () => {
        const envRoots = []
        const roots = [cacheStoreRoot(pluginDir), statisticsRoot(pluginDir)]
        injectRootsUnlessGenSrvMode(tmp, 'srv', roots, envRoots)
        expect(envRoots).toEqual(roots)
    })

    it('does not duplicate a root already present in envRoots', () => {
        const root = cacheStoreRoot(pluginDir)
        const envRoots = [root]
        injectRootsUnlessGenSrvMode(tmp, 'srv', [root], envRoots)
        expect(envRoots).toEqual([root])
    })

    it('returns true when roots were injected', () => {
        expect(
            injectRootsUnlessGenSrvMode(tmp, 'srv', [cacheStoreRoot(pluginDir)], [])
        ).toBe(true)
    })

    // ── gen/srv mode: injection must be skipped ───────────────────────────────

    it('does NOT inject cacheStoreRoot when srv/csn.json exists', () => {
        writeCsn(tmp, 'srv')
        const envRoots = []
        injectRootsUnlessGenSrvMode(tmp, 'srv', [cacheStoreRoot(pluginDir)], envRoots)
        expect(envRoots).toEqual([])
    })

    it('does NOT inject statisticsRoot when srv/csn.json exists', () => {
        writeCsn(tmp, 'srv')
        const envRoots = []
        injectRootsUnlessGenSrvMode(tmp, 'srv', [statisticsRoot(pluginDir)], envRoots)
        expect(envRoots).toEqual([])
    })

    it('does NOT inject indexRoot when srv/csn.json exists', () => {
        writeCsn(tmp, 'srv')
        const envRoots = []
        injectRootsUnlessGenSrvMode(tmp, 'srv', [indexRoot(pluginDir)], envRoots)
        expect(envRoots).toEqual([])
    })

    it('returns false when skipped due to gen/srv mode', () => {
        writeCsn(tmp, 'srv')
        expect(
            injectRootsUnlessGenSrvMode(tmp, 'srv', [cacheStoreRoot(pluginDir)], [])
        ).toBe(false)
    })

    it('preserves pre-existing roots in envRoots when skipping in gen/srv mode', () => {
        writeCsn(tmp, 'srv')
        const existing = '/already/present'
        const envRoots = [existing]
        injectRootsUnlessGenSrvMode(tmp, 'srv', [cacheStoreRoot(pluginDir)], envRoots)
        expect(envRoots).toEqual([existing])
    })

    // ── edge cases ────────────────────────────────────────────────────────────

    it('returns false for an empty roots array regardless of mode', () => {
        expect(injectRootsUnlessGenSrvMode(tmp, 'srv', [], [])).toBe(false)
        writeCsn(tmp, 'srv')
        expect(injectRootsUnlessGenSrvMode(tmp, 'srv', [], [])).toBe(false)
    })
})

// ─── duplicate definition error — the exact BTP failure ──────────────────────
//
// This describe block DOCUMENTS and REPRODUCES the error that triggered the fix.
// The "error reproduction" test always passes (it proves the bug is real).
// The "fix prevents the error" test requires injectRootsUnlessGenSrvMode to exist
// and is the key RED → GREEN test.

describe('duplicate definition error (CDS 10 + gen/srv mode)', () => {
    // Compile test app srv to a real CSN once for all tests in this block.
    // The CSN must include statistics entities (plugin.cds_caching.Caches etc.)
    // so there is something to duplicate when statisticsRoot is also loaded.
    let csnStr

    beforeAll(() => {
        csnStr = compileSrvToCsn()
        const csn = JSON.parse(csnStr)
        // Sanity: the compiled CSN must include statistics entities
        // (they arrive via app-service.cds → cds-caching/index.cds → db/statistics)
        if (!csn.definitions['plugin.cds_caching.Caches']) {
            throw new Error('Test setup: compiled CSN is missing plugin.cds_caching.Caches — check test app srv imports')
        }
    })

    it('reproduces the underlying CDS 10 error: loading a CSN + its source file produces Duplicate definition', () => {
        // This test demonstrates the raw CDS 10 behaviour that the fix prevents.
        // It loads a compiled CSN alongside the source .cds file that was already
        // compiled into that CSN — the same overlap that occurs on BTP when the
        // plugin injects absolute roots while a srv/csn.json is already present.
        // The test runs in a fresh child process to avoid module-cache interference.
        if (cdsMajor < 10) return

        const tmp = makeTmp()
        fs.mkdirSync(path.join(tmp, 'srv'))
        const csnPath = path.join(tmp, 'srv', 'csn.json')
        fs.writeFileSync(csnPath, csnStr)

        // Write a small script that calls cds.load([csn, sourceFile]) directly
        // — bypassing the plugin fix so we always reproduce the raw CDS 10 error.
        // Embed the absolute require path so module resolution works regardless
        // of where the script file lives.
        const cdsAbsPath = path.dirname(require.resolve('@sap/cds/package.json'))
        const scriptPath = path.join(tmp, 'repro.js')
        fs.writeFileSync(scriptPath, `
const cds = require(${JSON.stringify(cdsAbsPath)})
cds.load(${JSON.stringify([csnPath, statisticsRoot(pluginDir)])})
    .then(() => process.exit(0))
    .catch(e => { process.stderr.write(e.message); process.exit(1) })
`)
        let threw = false
        let output = ''
        try {
            execSync(`node ${JSON.stringify(scriptPath)}`, {
                cwd: pluginDir,
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe'],
            })
        } catch (err) {
            threw = true
            output = (err.stderr || '') + (err.stdout || '')
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true })
        }

        expect(threw).toBe(true)
        expect(output).toMatch(/Duplicate definition/)
    })

    it('fix: cds compile from a gen/srv directory (srv/csn.json present) succeeds without Duplicate definition errors', () => {
        // This is the key regression test for the fix.
        //
        // BEFORE the fix: cds compile "*" from the test app with srv/csn.json
        // present would fail — the plugin injected absolute roots, CDS 10 compiled
        // them on top of the CSN, producing "Duplicate definition of artifact ..."
        // errors for every entity already in the CSN.
        //
        // AFTER the fix: injectRootsUnlessGenSrvMode detects srv/csn.json and skips
        // root injection — cds compile succeeds cleanly.

        const csnJSONPath = path.join(appPath, 'srv', 'csn.json')
        fs.writeFileSync(csnJSONPath, csnStr)

        let compileOutput = ''
        let threw = false
        try {
            execSync('npx cds compile "*"', {
                cwd: appPath,
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe'],
            })
        } catch (err) {
            threw = true
            compileOutput = (err.stderr || '') + (err.stdout || '')
        } finally {
            fs.rmSync(csnJSONPath, { force: true })
        }

        // Fix must prevent ALL duplicate definition errors
        expect(compileOutput).not.toMatch(/Duplicate definition/)
        expect(threw).toBe(false)
    })

    it('fix: injectRootsUnlessGenSrvMode returns false and leaves envRoots untouched in gen/srv mode', () => {
        const tmp = makeTmp()
        writeCsn(tmp)
        try {
            const envRoots = []
            const result = injectRootsUnlessGenSrvMode(
                tmp, 'srv',
                [statisticsRoot(pluginDir), cacheStoreRoot(pluginDir)],
                envRoots
            )
            expect(result).toBe(false)
            expect(envRoots).toEqual([])
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true })
        }
    })
})

// ─── build output: srv/csn.json must include CacheStore ───────────────────────
//
// cds build's nodejs task compiles srv/ and its using-chain to gen/srv/srv/csn.json.
// It does NOT use cds.env.roots — only explicit `using from` imports are followed.
// CacheStore therefore only ends up in the CSN when the srv folder imports
// cds-caching/db/cache-store explicitly.
//
// This test compiles the test app's srv/ with `cds compile --to json` to simulate
// what `cds build --profile production` emits, and asserts CacheStore is present.

describe('build output — compiled CSN contains CacheStore', () => {
    it('srv/csn.json includes plugin.cds_caching.CacheStore when using from is present', () => {
        const appPath = path.join(__dirname, 'app')

        // cds compile srv --to json emulates what the nodejs build task produces
        const stdout = execSync('npx cds compile srv --to json', {
            cwd: appPath,
            encoding: 'utf8',
            // stderr to null so test output stays clean
            stdio: ['pipe', 'pipe', 'ignore'],
        })

        const csn = JSON.parse(stdout)
        expect(csn.definitions).toHaveProperty('plugin.cds_caching.CacheStore')
    })
})
