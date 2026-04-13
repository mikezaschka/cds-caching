# Dashboard

The cds-caching plugin includes a pre-built UI5 dashboard for monitoring cache performance. You can add it to any CAP project with a single command.

![Cache Dashboard](./dashboard.jpg)

## Quick Start

```bash
cds add caching-dashboard
```

Then start your application:

```bash
cds watch
```

The dashboard is available at [http://localhost:4004/caching-dashboard/index.html](http://localhost:4004/caching-dashboard/index.html).

## Prerequisites

The dashboard requires the `CachingApiService` OData API and a `statistics` configuration block so that metrics are collected and persisted.

Make sure your caching configuration includes a `statistics` section:

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "statistics": {
          "enabled": true,
          "persistenceInterval": 60000
        }
      }
    }
  }
}
```

See the [Metrics Guide](metrics-guide.md) for details on statistics configuration.

## What Gets Created

Running `cds add caching-dashboard` adds two things to your project:

| Path | Purpose |
|------|---------|
| `app/caching-dashboard/webapp/` | Pre-built UI5 dashboard application |
| `srv/caching-api.cds` | Exposes the `CachingApiService` OData API |

The `srv/caching-api.cds` file contains a single `using` statement that tells CAP to serve the plugin's OData API:

```cds
using {plugin.cds_caching.CachingApiService} from 'cds-caching/index.cds';
```

This also transitively loads the required database entities (`Caches`, `Metrics`, `KeyMetrics`).

## Features

- **Real-time Metrics** -- View cache hit rates, latencies, and throughput
- **Key-level Analytics** -- Monitor performance for individual cache keys
- **Historical Data** -- Analyze trends over time with hourly/daily aggregations
- **Cache Management** -- Clear caches, view entries, and manage configurations
- **Multi-cache Support** -- Monitor multiple caching services simultaneously

## Securing the Dashboard

By default the `CachingApiService` is accessible without authentication. To restrict access, annotate the service in a separate `.cds` file (or append to `srv/caching-api.cds`):

```cds
using {plugin.cds_caching.CachingApiService} from 'cds-caching/index.cds';

annotate CachingApiService with @requires: 'authenticated-user';
```

## Customization

The dashboard files copied into `app/caching-dashboard/webapp/` are fully owned by your project. You can modify views, controllers, and styles as needed. Changes are preserved across `cds watch` restarts.

## Updating

To update the dashboard to the latest version shipped with cds-caching, re-run:

```bash
cds add caching-dashboard
```

This overwrites the files in `app/caching-dashboard/webapp/` with the latest build. If you have made local modifications, back them up before updating.

## Manual Setup

If you prefer not to use `cds add`, you can integrate the dashboard manually:

1. Copy the pre-built dashboard from `node_modules/cds-caching/app/dashboard/` into your project's `app/caching-dashboard/webapp/` directory.

2. Create `srv/caching-api.cds` with:

```cds
using {plugin.cds_caching.CachingApiService} from 'cds-caching/index.cds';
```

3. Run `cds watch` -- CAP auto-detects the app folder and serves the dashboard.
