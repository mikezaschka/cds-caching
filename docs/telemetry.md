# OpenTelemetry Integration

cds-caching provides optional [OpenTelemetry](https://opentelemetry.io/) (OTel) integration that emits distributed traces and metrics for all cache operations. When `@opentelemetry/api` is installed, the plugin automatically enriches spans and records cache-specific metrics. When it is absent, everything is a safe no-op with no runtime errors and no performance impact.

## Prerequisites

The integration works through `@opentelemetry/api`, which is declared as an **optional peer dependency**. You do not need to install it directly -- it is typically provided by the SAP CAP telemetry plugin:

```bash
npm add @cap-js/telemetry
```

`@cap-js/telemetry` brings `@opentelemetry/api` along with a preconfigured SDK (TracerProvider, MeterProvider, exporters) that works out of the box with SAP BTP and common backends like Jaeger, Dynatrace, or Cloud Logging.

If you are not using `@cap-js/telemetry`, install `@opentelemetry/api` and set up the SDK yourself:

```bash
npm add @opentelemetry/api
```

No configuration is needed inside cds-caching itself. If `@opentelemetry/api` can be resolved at startup, the integration activates automatically.

## Traces

### Span creation (read-through operations)

Read-through operations create dedicated child spans that capture timing, cache key, hit/miss status, and TTL:

| Operation | Span name | Created by |
|---|---|---|
| `cache.rt.send(...)` | `cds-caching - send` | CapOperations |
| `cache.rt.run(...)` | `cds-caching - run` | CapOperations |
| `cache.rt.wrap(...)` | `cds-caching - wrap` | AsyncOperations |
| `cache.rt.exec(...)` | `cds-caching - exec` | AsyncOperations |

Each span carries the following attributes on success:

| Attribute | Type | Description |
|---|---|---|
| `cache.operation` | string | `send`, `run`, `wrap`, or `exec` |
| `cache.operation_type` | string | Always `read_through` |
| `cache.hit` | boolean | Whether the value was served from cache |
| `cache.key` | string | The resolved cache key |
| `cache.ttl_ms` | number | TTL in milliseconds (only on cache miss) |

On error, the span status is set to `ERROR` with the exception message.

### Span decoration (basic operations)

Basic cache operations (`get`, `set`, `delete`, `clear`, `deleteByTag`) do not create new spans. Instead, they enrich the **currently active span** (if one exists) with cache-specific attributes:

| Operation | Attributes set |
|---|---|
| `set` | `cache.key`, `cache.operation`, `cache.operation_type`, `cache.ttl_ms` |
| `get` | `cache.key`, `cache.operation`, `cache.operation_type`, `cache.hit` |
| `delete` | `cache.key`, `cache.operation`, `cache.operation_type` |
| `clear` | `cache.operation`, `cache.operation_type` |
| `deleteByTag` | `cache.tag`, `cache.operation`, `cache.operation_type` |

The `cache.operation_type` for basic operations is always `basic`.

## Metrics

cds-caching emits OTel metrics **independently** of the built-in metrics system (see [Metrics Guide](metrics-guide.md)). Even when `metricsEnabled` is `false`, OpenTelemetry counters and histograms are recorded as long as `@opentelemetry/api` is available and a MeterProvider is registered.

All metrics are scoped under the meter name `cds-caching`.

### Counters

| Metric name | Description |
|---|---|
| `cds_caching.hits` | Number of cache hits |
| `cds_caching.misses` | Number of cache misses |
| `cds_caching.sets` | Number of cache set operations |
| `cds_caching.deletes` | Number of cache delete operations |
| `cds_caching.errors` | Number of cache operation errors |

### Histogram

| Metric name | Unit | Description |
|---|---|---|
| `cds_caching.latency` | ms | Cache operation latency in milliseconds |

The latency histogram is recorded alongside hit and miss counters, capturing the time spent in each cache lookup.

### Default attributes

Every metric recording includes these default attributes, set once during `CachingService.init()`:

| Attribute | Description |
|---|---|
| `cache.name` | The CDS service name (e.g. `caching`) |
| `cache.store` | The store type (`memory`, `redis`, `sqlite`, `postgres`, `hana`) |
| `cache.namespace` | The cache namespace |

Each recording also includes:

| Attribute | Description |
|---|---|
| `cache.operation` | `hit`, `miss`, `set`, `delete`, or `error` |

## Usage with @cap-js/telemetry

The simplest setup is to add `@cap-js/telemetry` to your CAP project. It configures the OpenTelemetry SDK automatically, and cds-caching will start emitting traces and metrics without any additional code.

### 1. Install the plugin

```bash
npm add @cap-js/telemetry
```

### 2. Configure an exporter (optional)

`@cap-js/telemetry` defaults to console output for local development. For production, configure an OTLP exporter in your `package.json`:

```jsonc
{
  "cds": {
    "requires": {
      "telemetry": {
        "kind": "to-cloud-logging"  // or "to-dynatrace", "to-jaeger", etc.
      }
    }
  }
}
```

See the [@cap-js/telemetry documentation](https://github.com/cap-js/telemetry) for the full list of exporter options.

### 3. Use cds-caching as usual

No changes to your caching code are required. All `cache.rt.*` calls and basic operations will automatically produce spans and metrics.

```javascript
const cache = await cds.connect.to('caching')

// This read-through call creates a "cds-caching - run" span
// and records hit/miss + latency metrics automatically
const { result } = await cache.rt.run(SELECT.from(Books), cds, { ttl: 60000 })
```

### Example trace output (console exporter)

```
cds-caching - run [SpanKind: INTERNAL]
  cache.operation: run
  cache.operation_type: read_through
  cache.hit: false
  cache.key: AppService.Books:SELECT:...
  cache.ttl_ms: 60000
```

## Architecture overview

```mermaid
flowchart LR
    App["CAP Application"]
    CS["CachingService"]
    T["Telemetry module"]
    OTelAPI["@opentelemetry/api"]
    SDK["OTel SDK / @cap-js/telemetry"]
    Backend["Exporter backend"]

    App --> CS
    CS --> T
    T -->|"spans + metrics"| OTelAPI
    OTelAPI --> SDK
    SDK -->|"OTLP / console"| Backend
```

## Relationship to built-in metrics

| Aspect | Built-in metrics | OpenTelemetry metrics |
|---|---|---|
| Activation | `cache.setMetricsEnabled(true)` at runtime | Automatic when `@opentelemetry/api` is present |
| Storage | In-memory + CDS persistence | Exported via OTel SDK (OTLP, console, etc.) |
| Scope | Rich per-key statistics, historical aggregation | Counters and histograms with dimensional attributes |
| Use case | Application-level dashboards, OData API | Infrastructure monitoring, distributed tracing, alerting |

Both systems operate independently and can be used together.
