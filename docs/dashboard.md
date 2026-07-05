# Dashboard

The cds-caching plugin includes a pre-built UI5 dashboard for monitoring cache performance. You can add it to any CAP project with a single command.

![Cache Dashboard](./dashboard.jpg)

## Quick Start

```bash
cds add caching-dashboard
```

By default this copies a **pre-built**, self-contained UI5 app — ready for `cds watch` and for BTP/HTML5 repo deployment without extra setup.

To copy **TypeScript source** instead (for customizing views, controllers, and styles), use:

```bash
cds add caching-dashboard --source
```

Then install UI5 tooling dependencies and start your application:

```bash
cd app/caching-dashboard && npm install && cd ../..
cds watch
```

The dashboard is available at [http://localhost:4004/caching-dashboard/index.html](http://localhost:4004/caching-dashboard/index.html).

## Zero-config Alternative (reuse & compose)

If you don't want any files copied into your project, you can have the plugin serve its bundled dashboard directly from `node_modules`, following CAP's [reuse & compose](https://cap.cloud.sap/docs/guides/integration/reuse-and-compose#reuse-uis) pattern. Just set `dashboard: true` on your caching configuration:

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "statistics": { "enabled": true, "persistenceInterval": 60000 },
        "dashboard": true
      }
    }
  }
}
```

With this flag the plugin automatically:

- serves the pre-built UI at `/caching-dashboard` (via `app.serve('/caching-dashboard').from('cds-caching', 'app/dashboard')` at bootstrap), and
- exposes the `CachingApiService` OData API — so you don't need `srv/caching-api.cds` either.

No files are copied, and the dashboard always tracks the installed plugin version. Use **either** this flag **or** `cds add caching-dashboard`, not both (they both serve `/caching-dashboard`).

> **Production note:** `app.serve().from()` serves the UI from the CAP Node.js server. This works out of the box locally and in deployments where the CAP backend serves the UI. In the standard SAP BTP setup (managed/standalone approuter + HTML5 Application Repository), UIs are served from the HTML5 repo — not the backend — so the `dashboard: true` route is not reachable through the approuter unless you add an explicit route to the backend. For those deployments, use `cds add caching-dashboard` and the [deployment](#deploying-the-dashboard) flow below. See [issue #24](https://github.com/mikezaschka/cds-caching/issues/24).

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

Running `cds add caching-dashboard` adds the following to your project:

| Path | Purpose |
|------|---------|
| `app/caching-dashboard/webapp/` | UI5 dashboard application (pre-built by default, TypeScript source with `--source`) |
| `app/caching-dashboard/ui5.yaml` | UI5 build configuration |
| `app/caching-dashboard/ui5-deploy.yaml` | BTP/HTML5 Application Repository build config (`ui5-task-zipper`) |
| `app/caching-dashboard/xs-app.json` | Approuter routing for HTML5 App Repo deployments |
| `app/caching-dashboard/package.json` | `start`, `build`, and `build:cf` scripts for the UI app |
| `app/caching-dashboard/tsconfig.json` | TypeScript configuration (only with `--source`) |
| `srv/caching-api.cds` | Exposes the `CachingApiService` OData API |

Existing files are never overwritten, so your customizations and deploy settings are safe across re-runs (except `app/caching-dashboard/webapp/`, which is refreshed — see [Updating](#updating)).

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

By default the `CachingApiService` is accessible without authentication. To restrict access, annotate the service using its **fully-qualified name**. Add this single line to your existing `srv/caching-api.cds` (the file created by `cds add caching-dashboard`):

```cds
annotate plugin.cds_caching.CachingApiService with @requires: 'authenticated-user';
```

> **Important:** annotate the fully-qualified name (`plugin.cds_caching.CachingApiService`) and do **not** repeat the `using {plugin.cds_caching.CachingApiService} from 'cds-caching/index.cds';` import. Importing the same service name twice in the same model causes a `Duplicate definition of CachingApiService` error at startup (see [issue #24](https://github.com/mikezaschka/cds-caching/issues/24)). The fully-qualified `annotate` needs no `using` and works in any `.cds` file under `srv/`.

## Deploying the Dashboard

How you deploy the dashboard depends on your runtime topology:

**1. CAP backend serves the UI (simplest).** If your CAP server serves static content itself (e.g. directly exposed, or an approuter route that forwards to the backend), the dashboard is served by CAP just like locally. In this case the [zero-config `dashboard: true`](#zero-config-alternative-reuse--compose) flag is enough — nothing extra to deploy.

**2. SAP BTP with HTML5 App Repository + approuter (standard productive setup).** Here UIs are served from the HTML5 repo, not the backend, so the dashboard must be built and deployed as its own HTML5 app. `cds add caching-dashboard` lays down the required artifacts (`ui5.yaml`, `ui5-deploy.yaml`, `xs-app.json`, `package.json`). The generated `ui5-deploy.yaml` follows the CAP best-practice template for HTML5 repo deployment: it extends `ui5.yaml` and runs the `ui5-task-zipper` custom task to produce a deployable ZIP (including `xs-app.json`).

Install dependencies and verify the UI5 build from the app folder:

```bash
cd app/caching-dashboard && npm install
npm run build:cf
```

Then wire the app into your MTA deployment with the standard CAP facets:

```bash
cds add html5-repo
cds add mta          # or: cds add approuter
```

The generated `xs-app.json` forwards `/odata/v4/caching-api/*` to the CAP backend via the `srv-api` destination (created by `cds add mta`) and serves the UI from `html5-apps-repo-rt`. Adjust the destination name if yours differs, and secure the service (see [Securing the Dashboard](#securing-the-dashboard)).

**3. ABAP front-end server.** Generate an ABAP deploy configuration with `npx -p @sap/ux-ui5-tooling fiori add deploy-config abap` from `app/caching-dashboard/` (this creates a separate ABAP-specific deploy config alongside the HTML5 repo template).

> The shipped dashboard is a **self-contained UI5 build** (the SAPUI5 runtime is bundled), so it does not depend on the public SAPUI5 CDN at runtime.

## Customization

The dashboard files copied into `app/caching-dashboard/webapp/` are fully owned by your project.

**Default (pre-built):** Works immediately with `cds watch`, but controllers are transpiled/minified JavaScript bundled with the SAPUI5 runtime — fine for deployment, awkward for deep UI changes.

**Source mode (`--source`):** Copies the original TypeScript sources, `tsconfig.json`, and a `ui5.yaml` with transpile middleware. Run `npm install` in `app/caching-dashboard/` before `cds watch` or `npm start`. Local development uses the SAPUI5 CDN; run `npm run build:cf` from that folder before deploying to the HTML5 Application Repository.

Re-running `cds add caching-dashboard` (with or without `--source`) refreshes `webapp/` from the installed plugin version. Back up local changes before updating, and use the same flag you chose initially if you want to keep the same variant.

## Updating

To update the dashboard to the latest version shipped with cds-caching, re-run the same command you used initially:

```bash
cds add caching-dashboard           # pre-built
cds add caching-dashboard --source  # TypeScript source
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
