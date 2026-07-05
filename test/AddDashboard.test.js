const { mkdtempSync, rmSync, readFileSync, existsSync, mkdirSync, writeFileSync } = require('fs')
const { join } = require('path')
const { tmpdir } = require('os')

describe('cds add caching-dashboard', () => {
	let tempRoot
	let copySpy
	let writeSpy
	let AddPlugin
	let cds

	beforeEach(() => {
		tempRoot = mkdtempSync(join(tmpdir(), 'cds-add-dashboard-'))
		mkdirSync(join(tempRoot, 'srv'), { recursive: true })

		cds = require('@sap/cds-dk')
		cds.root = tempRoot
		cds.add = {
			Plugin: class {},
			readProject: vi.fn().mockReturnValue({ name: 'my-cap-app' }),
		}
		writeFileSync(join(tempRoot, 'package.json'), JSON.stringify({ name: 'my-cap-app' }))

		copySpy = vi.spyOn(cds.utils, 'copy').mockImplementation((src) => ({
			to: vi.fn().mockResolvedValue(undefined),
			_src: src,
		}))
		writeSpy = vi.spyOn(cds.utils, 'write').mockImplementation((content) => ({
			to: vi.fn(async (target) => {
				const filePath = join(tempRoot, target)
				mkdirSync(join(filePath, '..'), { recursive: true })
				writeFileSync(filePath, content)
			}),
		}))

		delete require.cache[require.resolve('../lib/add.js')]
		AddPlugin = require('../lib/add.js')
	})

	afterEach(() => {
		copySpy.mockRestore()
		writeSpy.mockRestore()
		rmSync(tempRoot, { recursive: true, force: true })
	})

	async function runWithOptions(options = {}) {
		cds.cli = { options: { source: false, ...options } }
		const plugin = new AddPlugin()
		await plugin.run()
	}

	it('exposes a --source option', () => {
		const plugin = new AddPlugin()
		expect(plugin.options().source).toMatchObject({
			type: 'boolean',
			default: false,
		})
	})

	it('copies the pre-built dashboard by default', async () => {
		await runWithOptions()
		expect(copySpy).toHaveBeenCalledWith(
			expect.stringMatching(/app[/\\]dashboard$/),
		)
	})

	it('copies TypeScript source with --source', async () => {
		await runWithOptions({ source: true })
		expect(copySpy).toHaveBeenCalledWith(
			expect.stringMatching(/app[/\\]dashboard-src$/),
		)
	})

	it('writes built scaffold files by default', async () => {
		await runWithOptions()

		const ui5 = readFileSync(join(tempRoot, 'app/caching-dashboard/ui5.yaml'), 'utf8')
		const pkg = JSON.parse(readFileSync(join(tempRoot, 'app/caching-dashboard/package.json'), 'utf8'))

		expect(ui5).not.toContain('ui5-tooling-transpile-middleware')
		expect(pkg.devDependencies).not.toHaveProperty('typescript')
		expect(existsSync(join(tempRoot, 'app/caching-dashboard/tsconfig.json'))).toBe(false)
	})

	it('writes source scaffold files with --source', async () => {
		await runWithOptions({ source: true })

		const ui5 = readFileSync(join(tempRoot, 'app/caching-dashboard/ui5.yaml'), 'utf8')
		const pkg = JSON.parse(readFileSync(join(tempRoot, 'app/caching-dashboard/package.json'), 'utf8'))
		const tsconfig = JSON.parse(readFileSync(join(tempRoot, 'app/caching-dashboard/tsconfig.json'), 'utf8'))

		expect(ui5).toContain('ui5-tooling-transpile-middleware')
		expect(ui5).toContain('moduleId: my-cap-app')
		expect(pkg.devDependencies).toHaveProperty('typescript')
		expect(pkg.devDependencies).toHaveProperty('ui5-tooling-transpile')
		expect(tsconfig.compilerOptions.rootDir).toBe('./webapp')
	})

	it('creates srv/caching-api.cds when missing', async () => {
		await runWithOptions()

		expect(readFileSync(join(tempRoot, 'srv/caching-api.cds'), 'utf8')).toContain(
			"using {plugin.cds_caching.CachingApiService} from 'cds-caching/index.cds';",
		)
	})

	it('does not overwrite existing scaffold files', async () => {
		mkdirSync(join(tempRoot, 'app/caching-dashboard'), { recursive: true })
		writeFileSync(join(tempRoot, 'app/caching-dashboard/ui5.yaml'), 'custom: true\n')

		await runWithOptions({ source: true })

		expect(readFileSync(join(tempRoot, 'app/caching-dashboard/ui5.yaml'), 'utf8')).toBe('custom: true\n')
	})

	it('builds different scaffold files for built vs source', () => {
		const built = AddPlugin.getScaffoldFiles(false, 'my-app')
		const source = AddPlugin.getScaffoldFiles(true, 'my-app')

		expect(Object.keys(built)).not.toContain('app/caching-dashboard/tsconfig.json')
		expect(Object.keys(source)).toContain('app/caching-dashboard/tsconfig.json')
		expect(built['app/caching-dashboard/ui5.yaml']).not.toContain('ui5-tooling-transpile-task')
		expect(source['app/caching-dashboard/ui5.yaml']).toContain('ui5-tooling-transpile-task')
		expect(source['app/caching-dashboard/ui5.yaml']).toContain('moduleId: my-app')
	})
})
