import { defineConfig } from 'vitest/config'

// cds.test() boots a full CAP server and shares global state (cds.model,
// connections, the cds context). Tests must therefore run in a single,
// non-parallel process — the Vitest equivalent of `jest --runInBand`.
// The test app must use db credentials url ":memory:" so each server boot runs
// a full cds.deploy (including projection views). Vitest isolate alone does not
// reset global.cds or on-disk SQLite files.
export default defineConfig({
    test: {
        globals: true,
        include: ['test/**/*.test.js'],
        setupFiles: ['./test/setup.js'],
        // Serialize execution: a single worker with no cross-file parallelism,
        // the Vitest equivalent of `jest --runInBand`.
        pool: 'forks',
        maxWorkers: 1,
        fileParallelism: false,
        silent: true,
        testTimeout: 60000,
        hookTimeout: 60000,
    },
})
