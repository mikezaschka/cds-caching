# Welcome to cds-caching
[![npm version](https://img.shields.io/npm/v/cds-caching)](https://www.npmjs.com/package/cds-caching/common)
[![monthly downloads](https://img.shields.io/npm/dm/cds-caching)](https://www.npmjs.com/package/cds-caching)

## Overview

A caching plugin for the [SAP Cloud Application Programming Model (CAP)](https://cap.cloud.sap/docs/) that improves performance by caching slow remote service calls, complex operations, and queries.

Please also read the introduction blog post: [Boosting performance in SAP Cloud Application Programming Model (CAP) applications with cds-caching](https://community.sap.com/t5/technology-blogs-by-members/boosting-performance-in-sap-cloud-application-programming-model-cap/ba-p/14002015).

### Key Features

* **Read-Through Caching** – Transparently cache CQN queries, CAP requests, or function calls
* **Pluggable Storage** – In-memory, SQLite, Redis, PostgreSQL, SAP HANA, or CDS database
* **Multi-Tenancy** – Automatic tenant isolation for SAP BTP MTX deployments
* **TTL & Tag Support** – Time-based expiry and tag-based invalidation
* **Compression** – LZ4 or GZIP compression for cached data
* **Metrics & Monitoring** – Hit rates, latencies, key-level tracking, and an OData API
* **Annotations** – Declarative caching via `@cache` annotations on entities and functions

### Documentation

| Guide | Description |
|-------|-------------|
| [Programmatic API](docs/programmatic-api.md) | Full API reference for cache operations |
| [Protocol Support](docs/protocols.md) | Caching across OData, REST, GraphQL, HCQL, and MCP |
| [Key Management](docs/key-management.md) | Key templates, context awareness, custom keys |
| [Metrics Guide](docs/metrics-guide.md) | Statistics, monitoring, and performance tracking |
| [OpenTelemetry Integration](docs/telemetry.md) | Distributed tracing and metrics export |
| [OData API](docs/odata-api.md) | REST endpoints for management and monitoring |
| [Dashboard](docs/dashboard.md) | Setup and usage of the monitoring dashboard |
| [Feature Activation](docs/feature-activation.md) | Reuse vs own: metrics, API, and dashboard activation |
| [Deployment Guide](docs/deployment-guide.md) | SAP BTP deployment for Redis, PostgreSQL, HANA, CDS |
| [Migration Guide](docs/migration-guide.md) | **Upgrading to 2.0** and earlier releases |
| [Example Application](docs/example-app.md) | Sample app with caching patterns |

## Getting Started

### Installation

```bash
npm install cds-caching
```

### Requirements

| Dependency | Supported versions |
|------------|--------------------|
| SAP CAP (`@sap/cds`) | `>= 8` (including **cds 9** and **cds 10**) |
| Node.js | `>= 22` (cds 10 requires Node 22+, v24 recommended) |
| `@cap-js/sqlite` (SQLite store) | `^1` on cds 8, `^2` on cds 9, `^3` on cds 10 |

> The plugin runtime supports cds 8, cds 9, and cds 10. When running on cds 10, use Node.js 22 or higher and `@cap-js/sqlite ^3`.

### Minimal Configuration

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching"
      }
    }
  }
}
```

This uses the in-memory store — no additional setup needed for development.

> **Upgrading from 1.x?** See [Upgrading to 2.0](docs/migration-guide.md#upgrading-to-20) — monitoring config now uses `metrics` with optional `metrics.reuse` instead of `statistics` / `dashboard: true`.

### Data Model

The plugin ships CDS entity definitions for database-backed features. These load **conditionally** based on your configuration — no manual `model` property needed.

> **Full guide:** [Feature Activation](docs/feature-activation.md) — decision tree, BTP/MTX best practices, and rules for avoiding duplicate model loading.

| Option | Entities loaded | Purpose |
|--------|-----------------|---------|
| `"metrics": { "enabled": true, … }` | `Caches`, `Metrics`, `KeyMetrics` | Metrics persistence (skipped if API loaded via reuse or `using`) |
| `"store": "cds"` | `CacheStore` | CDS-backed cache storage |
| `metrics.reuse.api` or `using … index.cds` | `CachingApiService` + metrics entities | OData API (`/odata/v4/caching-api/`) |
| `metrics.reuse.dashboard` | Same as reuse API + UI at `/caching-dashboard` | Package reuse (see [reuse & compose](https://cap.cloud.sap/docs/guides/integration/reuse-and-compose#reuse-uis)) |
| None of the above | Nothing | External stores only; basic caching still works |

Do **not** combine `metrics.reuse.*` with manual `using … index.cds` or `cds add caching-metrics` for the same concern — see the [Feature Activation guide](docs/feature-activation.md).

The auto-loading injects CDS files into `cds.env.roots` at plugin load time, before CAP compiles the model. Run `cds deploy` after enabling database features.

### Basic Usage

```javascript
const cache = await cds.connect.to("caching")

// Key-value operations
await cache.set("bp:1000001", businessPartnerData, { ttl: 60000 })
const data = await cache.get("bp:1000001")

// Read-through caching for CQN queries
const { result } = await cache.rt.run(query, db, { ttl: 30000 })

// Read-through caching for remote services
const { result } = await cache.rt.send(request, remoteService, { ttl: 10000 })

// Function caching
const cachedFn = cache.rt.wrap("expensive-op", expensiveFunction, { ttl: 3600 })
const { result } = await cachedFn("param1")
```

### Annotation-Based Caching

```cds
service MyService {
  @cache: { ttl: 10000 }
  entity Products as projection on db.Products;

  @cache: { ttl: 10000, invalidateOnWrite: true }
  entity Orders as projection on db.Orders;

  @cache: { ttl: 60000 }
  function getRecommendations() returns array of Products;
}
```

When `invalidateOnWrite` is set, the cache for that entity is automatically cleared after any CREATE, UPDATE, or DELETE operation, so subsequent reads always return fresh data.

Annotations are **protocol-agnostic**: cds-caching binds at the CAP service-handler level, so a single `@cache` annotation applies whether the request arrives via OData, REST, GraphQL, HCQL, or the new [MCP protocol adapter](https://cap.cloud.sap/docs/guides/protocols/mcp) — no protocol-specific configuration required. MCP is read-only, so its reads are cached while writes over other protocols still invalidate the shared entries. See the [Protocol Support guide](docs/protocols.md) for details.

## Configuration

### Store Types

| Store | Config | Use Case | Adapter Package |
|-------|--------|----------|-----------------|
| In-Memory | `"memory"` | Development, small-scale | Built-in |
| SQLite | `"sqlite"` | Medium-size, single instance | `@resolid/keyv-sqlite` or `@keyv/sqlite` |
| Redis | `"redis"` | Production, distributed | `@keyv/redis` |
| PostgreSQL | `"postgres"` | Production, when Redis unavailable | `@keyv/postgres` |
| CDS Database | `"cds"` | Production, HANA, multi-tenant | None (uses app's DB) |
| SAP HANA | `"hana"` | Direct HANA connection | `keyv-hana` |

> **Recommendation**: Use `store: 'cds'` for CAP applications on SAP HANA — it reuses your app's DB connection, requires no extra packages, and supports multi-tenancy automatically. Use `store: 'redis'` for best performance in distributed setups.

### Full Configuration Options

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "namespace": "caching",
        "store": "redis",
        "compression": "lz4",
        "throwOnErrors": false,
        "transactionalOperations": false,
        "credentials": { },
        "metrics": {
          "enabled": true,
          "persistenceInterval": 60000,
          "reuse": {
            "api": false,
            "dashboard": false
          }
        },
        "keyManagement": {
          "isUserAware": false,
          "isTenantAware": false,
          "isLocaleAware": false
        }
      }
    }
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `store` | `"memory"` | Storage backend (`memory`, `sqlite`, `redis`, `postgres`, `hana`, `cds`) |
| `namespace` | service name | Key prefix for store isolation |
| `compression` | none | `"lz4"` or `"gzip"` |
| `throwOnErrors` | `false` | Whether basic operations throw on cache errors |
| `transactionalOperations` | `false` | Isolate basic ops in dedicated cache transactions |
| `metrics` | none | Metrics collection and persistence (see [Feature Activation](docs/feature-activation.md)) |
| `metrics.enabled` | `false` | Enable metrics collection |
| `metrics.persistenceInterval` | `60000` | Interval (ms) for persisting hourly stats to the database |
| `metrics.reuse.api` | `false` | Register `CachingApiService` from the plugin package (alternative: `using … index.cds`) |
| `metrics.reuse.dashboard` | `false` | Serve bundled UI from the plugin (alternative: `cds add caching-metrics`) |
| `statistics` | — | **Deprecated** — use `metrics` (removed in v3.0) |
| `dashboard` | — | **Deprecated** — use `metrics.reuse.dashboard` (removed in v3.0) |
| `keyManagement.isTenantAware` | `false` (auto `true` in MTX) | Include tenant in cache keys |
| `keyManagement.isUserAware` | `false` | Include user in cache keys |
| `keyManagement.isLocaleAware` | `false` | Include locale in cache keys |

### Environment-Specific Configuration

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "store": "redis",
        "[development]": {
          "credentials": { "host": "localhost", "port": 6379 }
        },
        "[production]": {
          "credentials": { "url": "redis://production-redis:6379" }
        }
      }
    }
  }
}
```

### Redis Connection Tuning

For `store: "redis"`, the `credentials` object is passed through to [`@keyv/redis`](https://keyv.org/docs/storage-adapters/redis/) / [`@redis/client`](https://github.com/redis/node-redis). You can use either a connection URL or explicit `socket` options:

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "store": "redis",
        "throwOnErrors": false,
        "credentials": {
          "url": "rediss://your-redis:6380",
          "pingInterval": 30000,
          "socket": { "keepAlive": true }
        }
      }
    }
  }
}
```

Use a `redis://` or `rediss://` URL, or connect via `socket.host` / `socket.port` instead of `url`.

If you see `SocketClosedUnexpectedlyError` in the logs every few minutes — common with TLS Redis, load balancers, or firewalls that drop idle connections — add **`pingInterval`** (milliseconds). The client sends periodic `PING` commands to keep the connection alive. Place it at the **top level** of `credentials`, not inside `socket`. TCP `keepAlive` under `socket` is enabled by default in `@redis/client`; `pingInterval` helps when the network path does not honor it.

With the default **`throwOnErrors: false`**, disconnects are logged but the application continues: cache operations fall back to misses and `@keyv/redis` reconnects automatically. If you set **`throwOnErrors: true`**, reconnection is disabled intentionally — connection errors surface as thrown errors instead.

For detailed key configuration and deployment instructions, see [Key Management](docs/key-management.md) and [Deployment Guide](docs/deployment-guide.md).

### Service Integration

The plugin includes `CachingApiService`, an OData service for managing caches, browsing entries, and viewing metrics. It powers the [dashboard](docs/dashboard.md) and can be consumed by any OData client.

See **[Feature Activation](docs/feature-activation.md)** for reuse vs own activation, BTP/MTX best practices, and API authorization.

**Quick reference:**

| Goal | Approach |
|------|----------|
| Local dev with dashboard | `metrics.reuse.api` + `metrics.reuse.dashboard` + `metrics.enabled` |
| BTP with HTML5 repo | `cds add caching-metrics` + `metrics.enabled` — no `metrics.reuse.dashboard` |
| API only, no UI | `metrics.reuse.api` or `using … index.cds` + `metrics.enabled` |

Restrict access with a fully-qualified annotate — do **not** repeat the `using` import:

```cds
annotate plugin.cds_caching.CachingApiService with @requires: 'authenticated-user';
```

## Multi-Tenancy (MTX)

cds-caching supports SAP BTP multi-tenant applications using `@sap/cds-mtxs`. When multitenancy is detected, the plugin automatically:

- Enables **tenant-aware cache keys** (`{tenant}:{hash}`)
- **Defers database operations** to request-time (avoids startup crashes without tenant context)
- **Guards statistics persistence** to only run within a tenant request context

### Recommended Setup

```json
{
  "cds": {
    "requires": {
      "multitenancy": true,
      "caching": {
        "impl": "cds-caching",
        "store": "cds"
      }
    }
  }
}
```

With `store: 'cds'`, each tenant's cache data lives in its own HDI container — fully isolated by CAP's Service Manager.

Alternatively, use `store: 'redis'` for shared Redis with automatic tenant-prefixed keys:

```json
{
  "cds": {
    "requires": {
      "multitenancy": true,
      "caching": {
        "impl": "cds-caching",
        "store": "redis",
        "credentials": { "socket": { "host": "localhost", "port": 6379 } }
      }
    }
  }
}
```

> `isTenantAware` is automatically set to `true` in MTX mode. Set `"isTenantAware": false` in `keyManagement` to explicitly opt out.

For MTX production setup (dashboard, API authorization, `store: 'cds'`), see the [Feature Activation Guide — Multi-tenancy (MTX)](docs/feature-activation.md#multi-tenancy-mtx).

## Usage Patterns

> **Deprecation Notice**: `cache.run()`, `cache.send()`, `cache.wrap()`, `cache.exec()` are deprecated since v1.0. Use `cache.rt.run()`, `cache.rt.send()`, `cache.rt.wrap()`, `cache.rt.exec()` instead. See [Migration Guide](docs/migration-guide.md).

### Read-Through Query Caching

```javascript
const { result } = await cache.rt.run(
  SELECT.from(BusinessPartners).where({ type: '2' }), 
  db, 
  { ttl: 30000 }
)
```

### Read-Through Remote Service Caching

```javascript
this.on('READ', BusinessPartners, async (req, next) => {
  const bupa = await cds.connect.to('API_BUSINESS_PARTNER')
  const { result } = await cache.rt.run(req, bupa, { ttl: 30000 })
  return result
})
```

### ApplicationService Caching with `prepend`

```javascript
this.prepend(() => {
  this.on('READ', MyEntity, async (req, next) => {
    const cache = await cds.connect.to("caching")
    const { result } = await cache.rt.run(req, next)
    return result
  })
})
```

### Function Caching

```javascript
// Wrap: create a cached version of a function
const cachedFn = cache.rt.wrap("bp-data", fetchBPData, { ttl: 3600, tags: ['bp'] })
const { result } = await cachedFn("1000001", true)

// Exec: immediate one-off execution with caching
const { result } = await cache.rt.exec("product", fetchProduct, ["1000001"], { ttl: 3600 })
```

### Cache Invalidation

```javascript
// Time-based (TTL)
await cache.set("key", value, { ttl: 60000 })

// Key-based
await cache.delete("bp:1000001")

// Tag-based
await cache.set("bp:1000001", data, { tags: [{ value: "bp-list" }] })
await cache.set("bp:1000002", data, { tags: [{ value: "bp-list" }] })
await cache.deleteByTag("bp-list")

// Dynamic tags from data
await cache.set("bp-list", bpArray, { 
  tags: [{ data: "businessPartner", prefix: "bp-" }] 
})
```

#### Automatic Invalidation on Write

For annotation-based entity caching, use `invalidateOnWrite` to automatically clear all cached queries for an entity whenever its data changes:

```cds
@cache: { ttl: 10000, invalidateOnWrite: true }
entity CachedProducts as projection on db.Products;
```

This registers `after` handlers for CREATE, UPDATE, and DELETE that call `deleteByTag` with an entity-level tag. All cached variants (filtered, sorted, paginated, single-entity) are invalidated at once.

For more usage patterns, error handling details, and TypeScript support, see [Programmatic API](docs/programmatic-api.md).

## Statistics & Monitoring

To persist metrics to the database, add a `metrics` block. See the [Feature Activation Guide](docs/feature-activation.md).

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "store": "redis",
        "metrics": {
          "enabled": true,
          "persistenceInterval": 60000
        }
      }
    }
  }
}
```

You can also enable metrics at runtime:

```javascript
const cache = await cds.connect.to("caching")
await cache.setMetricsEnabled(true)
await cache.setKeyMetricsEnabled(true)

const stats = await cache.getCurrentMetrics()
```

To add the monitoring dashboard, use `metrics.reuse.dashboard` for local reuse, or `cds add caching-metrics` for BTP. See the [Feature Activation Guide](docs/feature-activation.md) and [Dashboard Guide](docs/dashboard.md).

![Cache Dashboard](./docs/dashboard.jpg)

[See the full Metrics Guide →](docs/metrics-guide.md)

## API Reference

| API | Description |
|-----|-------------|
| [Programmatic API](docs/programmatic-api.md) | JavaScript methods for cache operations |
| [OData API](docs/odata-api.md) | REST endpoints for monitoring and management |

## Contributing

Contributions are welcome! Please submit pull requests to the [repository](https://github.com/mikezaschka/cds-caching).

Dashboard UI sources live in [`app/dashboard-src/`](app/dashboard-src/). From the repo root, use `npm run start:dashboard` (with `cds watch` in `examples/app`) for TypeScript development, and `npm run build:dashboard` to regenerate the pre-built bundle in `app/dashboard/`.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
