# Migration Guide

## Upgrading to 2.0

Version 2.0 aligns monitoring configuration around a single `metrics` object and CAP-style **reuse** flags ([reuse & compose](https://cap.cloud.sap/docs/guides/integration/reuse-and-compose#reuse-uis)). Cache runtime behavior, store types, and programmatic APIs are unchanged.

### What changed

Monitoring is no longer spread across top-level `statistics`, `dashboard`, and manual `using`/`cds add` choices without a clear model. Instead:

| Concern | v2 approach |
|---------|-------------|
| Metrics collection & DB persistence | `metrics.enabled`, `metrics.persistenceInterval`, … |
| OData API from the plugin package | `metrics.reuse.api: true` |
| Dashboard UI from the plugin package | `metrics.reuse.dashboard: true` (implies `reuse.api`) |
| Project-owned API | `using {plugin.cds_caching.CachingApiService} from 'cds-caching/index.cds';` |
| Project-owned UI (BTP) | `cds add caching-metrics` |

`metrics.enabled` and persistence options are now applied at service init (previously documented but not consistently wired from config).

### Configuration mapping

| v1 (deprecated) | v2 (preferred) |
|-----------------|----------------|
| `"statistics": { "enabled": true, … }` | `"metrics": { "enabled": true, … }` |
| `"dashboard": true` | `"metrics": { "reuse": { "api": true, "dashboard": true } }` |
| `cds add caching-dashboard` | `cds add caching-metrics` (alias — old name still works) |

### Example migration

**Local dev (reuse API + dashboard from the plugin):**

```diff
  "caching": {
    "impl": "cds-caching",
    "store": "redis",
-   "dashboard": true,
-   "statistics": {
+   "metrics": {
      "enabled": true,
-     "persistenceInterval": 60000
+     "persistenceInterval": 60000,
+     "reuse": {
+       "api": true,
+       "dashboard": true
+     }
    }
  }
```

**Metrics only (no API/UI reuse):**

```diff
-   "statistics": {
+   "metrics": {
      "enabled": true,
      "persistenceInterval": 60000
    }
```

**BTP production (own the UI, optional reuse API):**

```json
"metrics": {
  "enabled": true,
  "persistenceInterval": 60000
}
```

```bash
cds add caching-metrics
cds add html5-repo && cds add mta
```

Do **not** set `metrics.reuse.dashboard` when deploying to the HTML5 Application Repository — use the copied `app/caching-dashboard/` project instead.

### Reuse vs own

| Mode | When | How |
|------|------|-----|
| **Reuse (config)** | Zero project files; CAP serves static UI | `metrics.reuse.api`, `metrics.reuse.dashboard` |
| **Own (manual)** | BTP HTML5 repo, customization | `using … index.cds` and/or `cds add caching-metrics` |

Do not combine reuse flags with their manual equivalent for the same concern (e.g. `metrics.reuse.api` + `using … index.cds` causes duplicate `CachingApiService`). See [Feature Activation](feature-activation.md).

### Deprecation shims (v2.x → removed in v3.0)

v1 config still works with **one-time startup warnings**:

- `statistics` → normalized to `metrics`
- `dashboard: true` → normalized to `metrics.reuse.dashboard` + `metrics.reuse.api`

Migrate at your convenience before v3.0.

### Upgrade checklist

1. Update `package.json`: replace `statistics` with `metrics`; replace `dashboard: true` with `metrics.reuse.*`.
2. Run `cds deploy` if you use database-backed metrics or `store: cds`.
3. Remove redundant `using … index.cds` if you enable `metrics.reuse.api`.
4. Remove `metrics.reuse.dashboard` if you use `cds add caching-metrics` (or the deprecated `cds add caching-dashboard`).
5. Secure production APIs: `annotate plugin.cds_caching.CachingApiService with @requires: 'authenticated-user';`

### No changes needed

- Cache runtime API (`cache.rt.run`, `get`/`set`, `@cache` annotations)
- Store types (`memory`, `redis`, `cds`, etc.)
- OData API paths and entity names
- Existing `using {plugin.cds_caching.CachingApiService} from 'cds-caching/index.cds'` in projects that do not also set `metrics.reuse.api`

---

## Using cds-caching with cds 8

cds-caching supports **SAP CAP cds 8** for core caching (read-through, memory/SQLite/Redis/Postgres stores, annotations, and programmatic API). Run `npm run test:cds8` to verify in an isolated Docker container (`@cap-js/sqlite ^1`).

### cds 8 notes

- **`express` dev dependency** — cds 8 does not bundle `express` for `cds.test()`; the repo includes it for the test harness.
- **`@cap-js/sqlite ^1`** — use `@cap-js/sqlite ^1` with cds 8 (see `test/docker/install-cds.sh`).
- **Database-backed metrics / CDS store** — persisting metrics or using `store: 'cds'` relies on `@cap-js/db-service` deep CQN handling that differs on cds 8; full coverage for those features starts with cds 9 in CI (`test:cds9` / `test:matrix`).
- **HCQL / MCP protocol tests** — skipped below cds 10 (those adapters ship with newer CAP releases).

---

## Using cds-caching with cds 10 (June 2026 release)

cds-caching is compatible with **SAP CAP cds 10** while continuing to support cds 9. The plugin runtime is unchanged — the notes below cover the environment requirements introduced by cds 10.

### Action Required

- **Node.js 22+** — cds 10 drops support for Node 20 (EOL). Use Node.js `>= 22` (v24 recommended). The plugin's `engines.node` is `>= 22`.
- **`@cap-js/sqlite ^3`** — On cds 10, upgrade the SQLite driver from `^2` to `^3` (cds 10 ships `@cap-js/sqlite@3`, which uses Node's native SQLite instead of `better-sqlite3`). This only affects apps that use the SQLite database or the `store: 'sqlite'` cache backend.
- **`@sap/cds-dk 10`** — If you build HANA artifacts (`store: 'hana'` or `store: 'cds'` on HANA), use a matching `@sap/cds-dk@10`. The plugin's `cds build` task (`.hdbtable` generation) works unchanged on cds 10.

### No changes needed

- **Configuration** — Cache store, TTL, tags, and `@cache` annotations are unchanged on cds 10. If you use cds-caching 2.x, monitoring uses the `metrics` block (see [Upgrading to 2.0](#upgrading-to-20)).
- **APIs** — The read-through (`rt.run`/`rt.wrap`/`rt.send`), basic (`get`/`set`/`has`/`delete`), and invalidation APIs behave identically. cds 10's consolidated write-result shape (`{ affected }`) does not affect cache invalidation, which reacts to CUD events rather than their return payloads.
- **Drafts** — cds 10's "bypass drafts by default" change is handled at the CAP/OData layer; the plugin caches reads transparently and has no draft-specific logic.

### Note for contributors

The test suite was migrated from Jest to **Vitest** (see `vitest.config.js`). Run tests locally with `npm test` on Node 22+ (CDS 10). To verify all supported CAP versions in isolated containers, use `npm run test:matrix` (`test:cds8` / `test:cds9` / `test:cds10` via Docker). Docker-backed store tests (Redis/Postgres) run via `npm run test:all`.

## Upgrading from 1.2.x to 1.3.0

Version 1.3.0 adds **multi-tenancy support** and a new **CDS database store adapter**. These are additive features — existing configurations continue to work without changes.

### What's New

- **`store: 'cds'`** — A new storage backend that uses CAP's managed DB connection (`cds.connect.to('db')`). Works with any database CAP supports (HANA, PostgreSQL, SQLite) without separate credentials or adapter packages.
- **Multi-tenancy (MTX) support** — The plugin now detects `@sap/cds-mtxs` automatically and enables tenant-aware caching. No startup crashes in MTX mode anymore.
- **Auto tenant-aware keys** — When multitenancy is configured, `isTenantAware` defaults to `true` automatically, prefixing all cache keys with `{tenant}:`.

### Action Required

**None for most users.** All changes are backward compatible. However, review the following if applicable:

#### If you use `store: 'hana'` in a multi-tenant deployment

The `keyv-hana` adapter creates direct HANA connections that bypass CAP's tenant-aware connection management. This does not work correctly with `@sap/cds-mtxs`.

**Recommended**: Switch to `store: 'cds'`, which uses CAP's DB layer and routes to the correct tenant HDI container automatically:

```diff
  "caching": {
    "impl": "cds-caching",
-   "store": "hana",
-   "credentials": {
-     "host": "...",
-     "port": 30015,
-     "uid": "...",
-     "pwd": "..."
-   }
+   "store": "cds"
  }
```

No credentials or adapter packages needed — the cache table is deployed as part of your CDS model.

#### If you rely on `isTenantAware: false` in an MTX app

In 1.2.x, `isTenantAware` always defaulted to `false`. In 1.3.0, it defaults to `true` when `cds.requires.multitenancy` is set. If you explicitly need tenant-unaware keys in an MTX deployment, set it explicitly:

```json
{
  "cds": {
    "requires": {
      "caching": {
        "keyManagement": {
          "isTenantAware": false
        }
      }
    }
  }
}
```

#### If you use the CachingApiService dashboard in an MTX app

Cache configuration entries (`Caches` table) are no longer written at startup in MTX mode — they're created lazily on first dashboard access within a tenant context. This means the dashboard will show cache entries only after a tenant has accessed the API at least once. This is expected behavior; no action needed.

### New Store Comparison

| Store | MTX Support | Credentials | DB Backends |
|-------|-------------|-------------|-------------|
| `cds` (new) | Automatic via HDI | None (uses app's DB) | Any CAP supports |
| `redis` | Tenant-prefixed keys | Redis URI | Redis only |
| `hana` | Not supported | Separate host/port/uid/pwd | HANA only |

---

## Upgrading from 1.1.0 to 1.2.0

From **1.2.0** onwards, storage/compression adapters are treated as **optional peer dependencies** and must be installed **explicitly in your consuming CAP project** (i.e. *your app*, not `cds-caching`). This avoids relying on transitive dependencies and makes adapter usage deterministic.

### Required adapter packages (add to your app's `package.json`)

Install the package(s) matching your configured `store` / `compression`:

| Config | Value | Install in your app |
|---|---|---|
| `store` | `"redis"` | `@keyv/redis` |
| `store` | `"sqlite"` | `@resolid/keyv-sqlite` (recommended) **or** `@keyv/sqlite` |
| `store` | `"postgres"` | `@keyv/postgres` |
| `store` | `"hana"` | `keyv-hana` |
| `compression` | `"lz4"` | `@keyv/compress-lz4` |
| `compression` | `"gzip"` | `@keyv/compress-gzip` |

Example:

```bash
npm i @keyv/redis
# or: npm i @resolid/keyv-sqlite
# and optionally: npm i @keyv/compress-gzip
```

## Upgrading from 0.x to 1.x

### API Changes for read-through methods

Version 1.x introduces new methods that provide more insights into the read-through caching as they also directly return the generated cache `key` and some caching `metadata`.

| **Old Method** | **New Method** | **Key Differences** |
|----------------|----------------|---------------------|
| `cache.run()` | `cache.rt.run()` | Returns `{result, cacheKey, metadata}` instead of just `result` |
| `cache.send()` | `cache.rt.send()` | Returns `{result, cacheKey, metadata}` instead of just `result` |
| `cache.wrap()` | `cache.rt.wrap()` | Returns `{result, cacheKey, metadata}` instead of just `result` |
| `cache.exec()` | `cache.rt.exec()` | Returns `{result, cacheKey, metadata}` instead of just `result` |

### Key Template Changes

**Before (0.x):**
```javascript
// Old syntax - object with template property
await cache.set(query, result, { 
  key: { template: "user:{user}:{hash}" }
})
```

**After (1.x):**
```javascript
// New syntax - direct string template
await cache.set(query, result, { 
  key: "user:{user}:{hash}"
})
```

### Context Awareness Changes

**Default Behavior Changed:**
- **0.x:** Context (user, tenant, locale) was automatically included in some cache keys (ODataRequests)
- **1.x:** Context is **disabled by default** and can be enabled for **ALL** keys (unless overwritten)

**To Enable Context Awareness:**
```json
{
  "cds": {
    "requires": {
      "caching": {
        "keyManagement": {
          "isUserAware": true,
          "isTenantAware": true,
          "isLocaleAware": false
        }
      }
    }
  }
} 
```

### Migration Examples

**Example 1: Basic Caching**
```javascript
// Old way (deprecated, but will still work)
const result = await cache.run(query, db)

// New way
const { result, cacheKey, metadata } = await cache.rt.run(query, db)
```

**Example 2: Function Wrapping**
```javascript
// Old way (deprecated, but will still work)
const cachedFn = cache.wrap("key", expensiveOperation)
const result = await cachedFn("param1", "param2")

// New way
const cachedFn = cache.rt.wrap("key", expensiveOperation)
const { result, cacheKey, metadata } = await cachedFn("param1", "param2")
```

**Example 3: Custom Key Templates**
```javascript
// Old way (will not work anymore)
await cache.set(data, value, { 
  key: { template: "user:{user}:{hash}" }
})

// New way
await cache.set(data, value, { 
  key: "user:{user}:{hash}"
})
```

### What's New in 1.x

- **Enhanced Metadata:** All read-through operations now return cache keys and performance metadata
- **Better Performance:** Context awareness is opt-in, reducing unnecessary key complexity
- **Improved Debugging:** Access to generated cache keys for troubleshooting
- **Flexible Configuration:** Global and per-operation key template control

For detailed API documentation, see [Programmatic API Reference](programmatic-api.md).
