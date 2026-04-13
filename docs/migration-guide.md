# Migration Guide

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
