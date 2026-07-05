import { defineConfig } from 'vitest/config'

// cds.test() boots a full CAP server and shares global state (cds.model,
// connections, the cds context). Tests must therefore run in a single,
// non-parallel process — the Vitest equivalent of `jest --runInBand`.
// The test app must use db credentials url ":memory:" so each server boot runs
// a full cds.deploy (including projection views). Seed data lives in db/init.js
// (physical INSERTs) because service-level CSV INSERT fails on CDS 8. Call
// cds.test().in(...) before any other @sap/cds import that touches cds.env.
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
