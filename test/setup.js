'use strict';

const fs = require('fs');
const path = require('path');

// Safety net: remove stale file-based SQLite DB so cds.test() never reuses a
// partial schema across Vitest workers when db credentials are not :memory:.
const testAppDir = path.join(__dirname, 'app');
for (const suffix of ['', '-shm', '-wal']) {
    const dbFile = path.join(testAppDir, `db.sqlite${suffix}`);
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
}

// @cap-js/cds-test exposes `expect` via real chai and normally registers the
// chai-as-promised and chai-subset plugins itself. However, it first checks for
// an existing `global.chai` and reuses it if present. Vitest injects its own
// `global.chai` (without those plugins), so cds-test returns that bare instance
// and assertions like `.rejectedWith` / `.containSubset` are missing.
//
// This setup file registers the missing plugins onto whichever chai instance is
// active, restoring the assertions the test suite relies on.
const chaiAsPromised = require('chai-as-promised');
const chaiSubset = require('chai-subset');

function applyPlugins(chai) {
    if (!chai || typeof chai.use !== 'function') return false;
    chai.use(chaiAsPromised.default ?? chaiAsPromised);
    chai.use(chaiSubset.default ?? chaiSubset);
    return true;
}

// Prefer the chai instance Vitest exposes globally (the one cds-test reuses),
// and also patch the directly-required chai as a belt-and-braces fallback.
applyPlugins(globalThis.chai);
applyPlugins(require('chai'));
