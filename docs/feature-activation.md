# Feature Activation Guide

cds-caching separates three concerns:

| Layer | What it does | Enabled by default? |
|-------|--------------|---------------------|
| **Cache runtime** | `cds.connect.to('caching')`, `@cache` annotations, external stores | Yes — with `"impl": "cds-caching"` only |
| **Metrics** | Collect, persist, and expose hit rates, latencies, key-level stats | No — opt in via `metrics` |
| **Monitoring surface** | OData API (`CachingApiService`) + optional dashboard UI | No — opt in via `metrics.reuse` or manual wiring |

## Reuse vs own (CAP reuse & compose)

Following CAP's [reuse & compose](https://cap.cloud.sap/docs/guides/integration/reuse-and-compose#reuse-uis) pattern, monitoring can be activated in two ways:

| Mode | When | How |
|------|------|-----|
| **Reuse (config)** | Zero project files; local dev; CAP serves static UI | `metrics.reuse.api`, `metrics.reuse.dashboard` |
| **Own (manual)** | BTP HTML5 repo, customization, explicit control | `using … index.cds` and/or `cds add caching-metrics` |

Manual equivalents:

| Reuse flag | Manual alternative |
|------------|-------------------|
| `metrics.reuse.api` | `using {plugin.cds_caching.CachingApiService} from 'cds-caching/index.cds';` in `srv/` |
| `metrics.reuse.dashboard` | `cds add caching-metrics` (copies UI into `app/caching-dashboard/`) |

Do **not** combine reuse flags with their manual equivalent for the same concern.

## Quick decision guide

```
Need caching only?
  └─ "impl": "cds-caching"

Need metrics persisted to the DB?
  └─ "metrics": { "enabled": true, ... }
  └─ cds deploy

Need OData API (reuse from package)?
  └─ "metrics": { "reuse": { "api": true }, "enabled": true }

Need dashboard locally (reuse UI from package)?
  └─ "metrics": { "enabled": true, "reuse": { "api": true, "dashboard": true } }

Need dashboard on BTP (own the UI project)?
  └─ cds add caching-metrics + metrics.enabled
  └─ cds add html5-repo && cds add mta
  └─ do NOT set metrics.reuse.dashboard
```

## v2 configuration

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "store": "redis",
        "metrics": {
          "enabled": true,
          "persistenceInterval": 60000,
          "maxLatencies": 1000,
          "reuse": {
            "api": true,
            "dashboard": true
          }
        }
      }
    }
  }
}
```

| Field | Purpose |
|-------|---------|
| `metrics.enabled` | Enable runtime metrics collection and persistence |
| `metrics.persistenceInterval` | Interval (ms) for persisting hourly stats to the database |
| `metrics.maxLatencies` | Max latency samples kept in memory |
| `metrics.reuse.api` | Plugin registers `CachingApiService` via `index.cds` (no `srv/caching-api.cds` needed) |
| `metrics.reuse.dashboard` | Plugin serves UI at `/caching-dashboard`; implies `reuse.api: true` |

`store: "cds"` is independent — loads the `CacheStore` entity for CDS-backed cache storage.

## Feature matrix

| Setup | Cache | Metrics DB | CDS store | OData API | Dashboard |
|-------|:-----:|:----------:|:---------:|:---------:|:---------:|
| `impl` only | ✓ | | | | |
| + `metrics.enabled` | ✓ | ✓ | | | |
| + `store: cds` | ✓ | | ✓ | | |
| + `metrics.reuse.api` | ✓ | ✓* | | ✓ | |
| + `metrics.reuse.dashboard` | ✓ | ✓* | | ✓ | ✓ |
| + `cds add caching-metrics` | ✓ | ✓* | | ✓ | ✓ |

\*Metrics tables load transitively when the API is activated. `metrics.enabled` is still required for collection.

## Avoiding duplicate model loading

The plugin deduplicates automatic loading:

- `metrics.reuse.api` or `metrics.reuse.dashboard` → injects `index.cds` only (includes statistics entities)
- `metrics` without reuse, when `srv/` has no `using … index.cds` → injects `db/statistics` only
- Manual `using … index.cds` → no separate statistics root injection

### Do not combine

| Combination | Problem |
|-------------|---------|
| `metrics.reuse.api` + `using … index.cds` | Duplicate `CachingApiService` |
| `metrics.reuse.dashboard` + `cds add caching-metrics` | Duplicate UI route at `/caching-dashboard` |
| `using … index.cds` in two `.cds` files | Duplicate `CachingApiService` |

### Securing the API

```cds
annotate plugin.cds_caching.CachingApiService with @requires: 'authenticated-user';
```

Use the fully-qualified name — do not repeat the `using` import.

## Recommended setups

### Local development (reuse everything)

```json
"metrics": {
  "enabled": true,
  "persistenceInterval": 60000,
  "reuse": { "api": true, "dashboard": true }
}
```

```bash
cds deploy && cds watch
# → http://localhost:4004/caching-dashboard/index.html
```

### API only (reuse API, no UI)

```json
"metrics": {
  "enabled": true,
  "persistenceInterval": 60000,
  "reuse": { "api": true }
}
```

### SAP BTP production

```json
"metrics": {
  "enabled": true,
  "persistenceInterval": 60000
}
```

```bash
cds add caching-metrics
cds add html5-repo
cds add mta
cd app/caching-dashboard && npm install && npm run build:cf
```

Secure the API with `@requires`. Do **not** use `metrics.reuse.dashboard` on standard HTML5 repo + approuter deployments.

### Multi-tenancy (MTX)

```json
{
  "multitenancy": true,
  "caching": {
    "impl": "cds-caching",
    "store": "cds",
    "metrics": {
      "enabled": true,
      "persistenceInterval": 60000
    }
  }
}
```

Use `cds add caching-metrics` for the UI. Each tenant's cache and metrics live in its HDI container when using `store: cds`.

## Deprecated v1 config (shim until v3.0)

| v1 | v2 equivalent |
|----|---------------|
| `statistics: { … }` | `metrics: { … }` |
| `dashboard: true` | `metrics.reuse.dashboard: true` (+ `reuse.api: true`) |

Startup warnings are emitted once per deprecated key. See [Upgrading to 2.0](migration-guide.md#upgrading-to-20).

## Related documentation

- [Dashboard Guide](dashboard.md)
- [Metrics Guide](metrics-guide.md)
- [OData API](odata-api.md)
- [Deployment Guide](deployment-guide.md)
