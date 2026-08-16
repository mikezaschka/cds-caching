# Security

This document covers the security-relevant behavior of `cds-caching`: what is protected by default, what you must configure yourself, and the decisions worth reviewing before going to production.

To report a vulnerability, see [SECURITY.md](../SECURITY.md).

## Table of Contents

1. [Production checklist](#production-checklist)
2. [Management API and dashboard](#management-api-and-dashboard)
3. [Cache key isolation](#cache-key-isolation)
   - [What the awareness flags do not cover](#what-the-awareness-flags-do-not-cover)
4. [Debug response headers](#debug-response-headers)
5. [Metrics data](#metrics-data)
6. [Data at rest](#data-at-rest)
7. [Resource limits](#resource-limits)
8. [Content Security Policy](#content-security-policy)

## Production checklist

- Restrict `CachingApiService` to an administrative role rather than leaving it at the default `authenticated-user`.
- Set `isLocaleAware: true` for translated content, and `isUserAware: true` where a response varies per user without the query varying. See [what the awareness flags do not cover](#what-the-awareness-flags-do-not-cover).
- Leave `debugHeaders` off.
- Decide whether `keyMetricsEnabled` is acceptable for your data, and who may read `KeyMetrics`.
- Apply rate limits in front of the management API if it is externally reachable.
- Confirm your store's transport and at-rest encryption (Redis TLS, HANA, Postgres).

## Management API and dashboard

### Default authorization

`CachingApiService` is annotated `@requires: 'authenticated-user'`. Unauthenticated callers receive `401`.

This default exists because the API can enumerate and delete cached values and flush entire caches. It is deliberately the *least* restrictive safe setting so that adding it does not break existing deployments — it is usually **not** sufficient for production, since every logged-in user of your application satisfies it.

Narrow it to a dedicated role in your own model:

```cds
using {plugin.cds_caching.CachingApiService} from 'cds-caching/index.cds';

annotate plugin.cds_caching.CachingApiService with @requires: 'CacheAdmin';
```

Your model is a downstream annotation layer, so this replaces the plugin's default. To expose the API without authentication — only sensible for a strictly internal, network-isolated deployment — set `@requires: null`.

### Local development

With CAP's mocked authentication (the default outside production), the API and dashboard now require credentials. `cds watch` will prompt for a login. Define users in your `cds.requires.auth` block, or pass basic credentials from your HTTP client.

### `Caches` is read-only over OData

Cache configuration rows are exposed `@readonly`. Metrics flags are changed through the `setMetricsEnabled` and `setKeyMetricsEnabled` actions, which run through the plugin's own logic, rather than by writing to the entity.

### Cache name validation

The cache name in an API route is validated against the services configured with `impl: 'cds-caching'`. This stops a caller from using the route to reach an unrelated business service through `cds.connect.to()`.

### Dashboard static assets

When `metrics.reuse.dashboard` is enabled, the dashboard is served from `/caching-dashboard`. That route sits outside CAP's service adapters, so it is wrapped in CAP's own middleware chain plus an explicit authenticated-user check. Restricting the OData API alone would not have protected it, since it is not a CAP service.

## Cache key isolation

Cache keys are built from a template. By default the template is `{hash}`, where the hash covers the request and its **effective query** — including a `where` clause contributed by `@restrict`, by row-level rules, or by a custom handler. Two reads that resolve to different queries therefore derive different keys without further configuration.

Before 3.0 the hash was derived from the request URL and the CQN was dropped whenever the URL carried a query string, so per-user filtering did not reach the key and one user could be served another's rows. If you are on 2.x, set `isUserAware: true` for any cache holding user-filtered data and see [GHSA-9hrx-jq4r-33g9](https://github.com/mikezaschka/cds-caching/security/advisories/GHSA-9hrx-jq4r-33g9).

The template still governs how entries are partitioned. Enable user-aware keys per cache service:

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "keyManagement": {
          "isUserAware": true,
          "isTenantAware": true
        }
      }
    }
  }
}
```

`keyManagement` must sit inside the individual cache configuration. A top-level `"cds-caching"` block is ignored; the plugin warns at startup if it finds one. See [Key Management](key-management.md).

`isTenantAware` defaults to `true` when multitenancy is detected, so tenants are separated by default in MTX mode.

### What the awareness flags do not cover

Since 3.0 the key hash covers the **effective query**, not just the request URL. A `where` clause contributed by `@restrict` or by a custom handler is part of the key, so two users whose reads are filtered differently derive different keys even with `isUserAware` off. That holds however the filter arises — from the user id, from a request header, or from anything else that reaches the query.

What the flags are still for:

- **Responses that vary by user without the query varying.** If a handler filters or enriches the *result* in JavaScript after the query has run, or returns data derived from `cds.context.user` directly, the query is identical for every caller and so is the key. Set `isUserAware: true` for those caches, or key the operation explicitly.

```javascript
const { result } = await cache.rt.run(query, db, { key: '{user}:{hash}' })
```

- **Locale.** `isLocaleAware` defaults to `false`, so responses in different languages share one entry. Locale is a context dimension rather than part of the query, so enable it for any cache holding translated texts.

- **Deliberate isolation.** Even where the key is already correct, `isUserAware` and `isTenantAware` keep one caller's entries from being reachable by another, which some deployments want independently of correctness. The cost is entry count: a per-user key multiplies entries by your user count and lowers hit rates, so it is the wrong default for shared reference data.

You can also set the template per operation, which overrides the global setting:

```javascript
const { result } = await cache.rt.run(query, db, { key: '{tenant}:{user}:{hash}' })
```

## Debug response headers

Read-through HTTP responses can include the full cache key in `x-sap-cap-cache-key`. Knowing a key makes it possible to address a specific cached entry directly, so this is **off by default** and should stay off in production. Enable it only for local debugging:

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "debugHeaders": true
      }
    }
  }
}
```

The `x-sap-cap-cache` hit/miss header is always sent; it carries no key material.

## Metrics data

Aggregate `Metrics` rows hold counters and latencies only.

`KeyMetrics` rows are richer and only collected when `keyMetricsEnabled` is on (off by default). Each row can retain:

- the serialized query, **including filter values**
- the target entity and service
- the requesting user id, tenant, and locale
- request path, method, and parameters

Credential-bearing headers are redacted before anything is persisted: `Authorization`, `Proxy-Authorization`, `Cookie`, `Set-Cookie`, `X-API-Key`, `ApiKey`, `X-CSRF-Token`, `X-XSRF-Token`, and `sap-passport`. Long free-text fields are truncated (8192 characters by default, configurable via `metrics.maxMetricFieldLength`).

Two consequences worth planning for: `KeyMetrics` may fall under your data-protection obligations because it stores user ids and query filter values, and anyone who can read the API can read it. Restrict the API accordingly, and leave key metrics off unless you are actively investigating.

## Data at rest

Cached values are stored **unencrypted** in whichever store you configure, for every store type including `store: 'cds'`. A cached value is a copy of data your application already holds, so the cache inherits the sensitivity of its source.

Consequences:

- With `store: 'cds'`, values are readable in the `CacheStore` table by anyone with database access, at the same level of protection as your other application tables.
- With `store: 'redis'`, values are readable by anyone with Redis access. Use TLS and credentials, and do not share the instance across trust boundaries.
- Cached values can outlive their source rows until their TTL expires or they are invalidated. Deleting a record does not by itself remove it from the cache — use `@cache.invalidateOnWrite` or tag-based invalidation.

Avoid caching highly sensitive data, use a short TTL where you must, and prefer a store whose at-rest encryption you control.

## Resource limits

- `getEntries` returns 100 entries by default and at most 1000 per call.
- `setEntry` rejects values larger than 1 MB.
- `metrics.maxKeyMetrics` bounds how many distinct keys are tracked in memory.

No rate limiting is applied to the management API — CAP does not provide one. Enforce limits at the approuter, API gateway, or ingress if the API is reachable from outside your landscape.

## Content Security Policy

The dashboard loads the UI5 runtime. If you serve it through `metrics.reuse.dashboard` or the generated `cds add caching-dashboard` app and your CSP restricts script sources, allow the UI5 host you are using — for example `script-src https://ui5.sap.com` when bootstrapping from the SAP CDN.
