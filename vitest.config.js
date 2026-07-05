import { defineConfig } from 'vitest/config'

// cds.test() boots a full CAP server and shares global state (cds.model,
// connections, the cds context). Tests must therefore run in a single,
// non-parallel process — the Vitest equivalent of `jest --runInBand`.
export default defineConfig({
    test: {
        globals: true,
        include: ['test/**/*.test.js'],
        setupFiles: ['./test/setup.js'],
        // Serialize execution: a single worker with no cross-file parallelism,
        // the Vitest equivalent of `jest --runInBand`. `isolate` stays at its
        // default (true) so every test file gets a fresh module registry, like
        // Jest — cds.test() boots a server and shares global state per file.
        pool: 'forks',
        maxWorkers: 1,
        fileParallelism: false,
        silent: true,
        testTimeout: 60000,
        hookTimeout: 60000,
    },
})
