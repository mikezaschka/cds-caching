# MTX Hybrid Test Checklist (BTP Trial)

Manual verification for [issue #18](https://github.com/mikezaschka/cds-caching/issues/18): local CAP + MTX sidecar bound to trial Service Manager / HANA Cloud.

This is **not** CI. Trial HANA stops nightly; bindings are credentials.

Use [FabianBerr/featureFlagCaching](https://github.com/FabianBerr/featureFlagCaching) (`caching` branch). App name: `minimalsample`. Mock users `t1` / `t2` / `t3` map to tenants of the same name. That branch already uses `"store": "cds"`.

Do **not** require a full CF MTA deploy. Hybrid only needs two Cloud Foundry service instances plus a running HANA Cloud.

## 0. Machine

- Node 22, [cf CLI](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html), `@sap/cds-dk` (`npm i -g @sap/cds-dk`)
- Clone the sample next to cds-caching:

```bash
cd ~/workspace
git clone -b caching https://github.com/FabianBerr/featureFlagCaching.git
# cds-caching already at ~/workspace/cds-caching
```

## 1. BTP trial

- Sign up: [SAP BTP Trial](https://www.sap.com/products/technology-platform/trial.html) (90 days; log in at least every 30 days). Prefer region **us10** so HANA Cloud is entitled ([tutorial](https://developers.sap.com/tutorials/hcp-create-trial-account.html)).
- In the subaccount: Enable Cloud Foundry, create a space (often `dev`).
- Entitlements if missing: SAP HANA Cloud (`hana` / tools), Service Manager (`container`), Feature Flags (`lite`).

## 2. HANA Cloud (mandatory)

- Subscribe to SAP HANA Cloud **tools**, assign yourself **SAP HANA Cloud Administrator**.
- In HANA Cloud Central, create a **free/trial HANA** instance. Map it to the CF org/space.
- Before every session: **Start** the instance. Trial HANA stops nightly and is **deleted after ~30 days** stopped.

## 3. CF services (once)

```bash
cf login -a https://api.cf.us10.hana.ondemand.com   # adjust API if not us10
cf target -o <org> -s <space>

cf create-service service-manager container minimalsample-db
cf create-service feature-flags lite minimalsample-feature-flags
cf services   # both should be create succeeded
```

Skip xsuaa / saas-registry for hybrid — the sample uses mocked auth locally.

## 4. Wire the plugin under test

In `featureFlagCaching/package.json` dependencies:

```json
"cds-caching": "file:../cds-caching"
```

Optional, to exercise metrics persistence:

```json
"metrics": { "enabled": true, "persistenceInterval": 10000, "reuse": { "api": true } }
```

Then:

```bash
cd featureFlagCaching && rm -rf node_modules && npm install
cd mtx/sidecar && npm install
```

## 5. Bind (creates `.cdsrc-private.json` — do not commit)

```bash
cd featureFlagCaching
cds bind -2 minimalsample-db
cds bind -2 minimalsample-feature-flags

cd mtx/sidecar
cds bind -2 minimalsample-db
```

## 6. Run hybrid (sidecar first)

```bash
# terminal A — sidecar
cd featureFlagCaching/mtx/sidecar
cds watch --profile hybrid
# expect http://localhost:4005
```

```bash
# terminal B — app
cd featureFlagCaching
npm run watch:hybrid
# expect http://localhost:4004
```

**Pass:** app log shows multi-tenant mode / **no** `TimeoutError: ResourceRequest timed out` and no `Failed to create/update cache entry` at `served`.

## 7. Subscribe tenants

```bash
cds subscribe t1 --to http://localhost:4005 -u t1:
cds subscribe t2 --to http://localhost:4005 -u t2:
```

First subscribe provisions the HDI container (can take a few minutes). Tenant HDI must contain:

- Tables: `plugin_cds_caching_Caches` / `Metrics` / `KeyMetrics` (and `CacheStore` when `store: cds`)
- Views: `plugin_cds_caching_CachingApiService_Caches` (and Metrics / KeyMetrics) — OData reads these

After changing the plugin, rebuild (`cds build --production`) and `cds upgrade t1` so those objects land in the tenant. If the app process died (e.g. uncaught timeout after a prior 500), restart `npm run watch:hybrid` before curling again. If subscribe fails or the schema is stale: `cds upgrade t1 --at http://localhost:4005 -u t1:`.

## 8. Hit the app as a tenant

Mocked basic auth, empty password:

```bash
curl -u t1: http://localhost:4004/odata/v4/catalog/Books
curl -u t1: http://localhost:4004/odata/v4/caching-api/Caches
```

Or open Browse Books and log in as `t1`.

## 9. Assert

- `Caches` for `t1` has a row for the `caching` service (lazy seed)
- After `persistenceInterval`, `GET …/caching-api/Metrics` as `t1` is non-empty; as `t2` it is not t1’s data
- Cache keys for t1 are not visible to t2 (`getEntries`)
- A second Books read logs a cache hit with `DEBUG=cds-caching`

## 10. Local MTX only (no BTP)

Cheaper smoke test. Does **not** reproduce the original pool timeout (SQLite, no Service Manager):

```bash
cd featureFlagCaching
npm run watch:sidecar     # terminal A
npm run watch:withmtx     # terminal B
cds subscribe t1 --to http://localhost:4005 -u t1:
```

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Bind / first-query timeout | HANA instance is stopped — start it |
| `cf create-service` fails | Missing entitlement or wrong space |
| Subscribe hangs | HANA not mapped to the CF space |
| Duplicate `cds.xt.MTXServices` on **CF deploy** | Sample / cds-mtxs issue — ignore for hybrid |
| Startup `db.read` still times out | Not on a plugin build that skips `createCacheEntry` in MTX, or `[hybrid]` missing `multitenancy` |

## Related

- [README — Multi-Tenancy](../README.md#multi-tenancy-mtx)
- [Feature Activation — MTX](feature-activation.md#multi-tenancy-mtx)
- [Deployment Guide — CDS store](deployment-guide.md#cds-database-on-sap-btp)
