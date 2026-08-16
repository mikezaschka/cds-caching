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
   - [Encrypting cached values](#encrypting-cached-values)
7. [Resource limits](#resource-limits)
8. [Content Security Policy](#content-security-policy)

## Production checklist

- Restrict `CachingApiService` to an administrative role rather than leaving it at the default `authenticated-user`.
- Set `isLocaleAware: true` for translated content, and `isUserAware: true` where a response varies per user without the query varying. See [what the awareness flags do not cover](#what-the-awareness-flags-do-not-cover).
- Leave `debugHeaders` off.
- Decide whether `keyMetricsEnabled` is acceptable for your data, and who may read `KeyMetrics`.
- Apply rate limits in front of the management API if it is externally reachable.
- Confirm your store's transport and at-rest encryption (Redis TLS, HANA, Postgres), and consider [encrypting cached values](#encrypting-cached-values) where the store is outside your trust boundary.

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

By default cached values are stored **unencrypted** in whichever store you configure, including `store: 'cds'`. A cached value is a copy of data your application already holds, so the cache inherits the sensitivity of its source.

Consequences:

- With `store: 'cds'`, values are readable in the `CacheStore` table by anyone with database access, at the same level of protection as your other application tables.
- With `store: 'redis'`, values are readable by anyone with Redis access. Use TLS and credentials, and do not share the instance across trust boundaries.
- Cached values can outlive their source rows until their TTL expires or they are invalidated. Deleting a record does not by itself remove it from the cache — use `@cache.invalidateOnWrite` or tag-based invalidation.

### Encrypting cached values

Since 3.0 a cache can encrypt its values with AES-256-GCM, using a 32-byte key, base64 or hex encoded. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

For a local trial, `encryption.key` takes the key directly:

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "encryption": {
          "key": "<32-byte key, base64 or hex>"
        }
      }
    }
  }
}
```

#### Supplying the key on a platform

A key in `package.json` is a key in your Git history, so on a deployed landscape the configuration should carry only the intent and the platform should supply the value. Commit `enabled: true` and let the key arrive from the environment:

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "encryption": {
          "enabled": true,
          "keyEnv": "CACHE_ENCRYPTION_KEY"
        }
      }
    }
  }
}
```

This is what makes the failure mode safe. Because `enabled: true` is committed, a deployment that forgets the secret fails at startup naming the variable, instead of starting up and writing plaintext under a configuration that claims to encrypt. Three sources are supported, in this order:

| Source | Use it when |
|--------|-------------|
| `encryption.key` | Local development and tests |
| `encryption.keyEnv` | The platform injects secrets as environment variables — Cloud Foundry, Kyma secrets, or a Vault-style sidecar |
| `credentials.encryptionKey` | The key arrives through a service binding |

**On SAP BTP, Cloud Foundry.** Set the variable the app already reads, keeping it out of `manifest.yml`, which is usually committed:

```bash
cf set-env my-app CACHE_ENCRYPTION_KEY "$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
cf restage my-app
```

Note that Cloud Foundry environment variables are readable with `cf env` by anyone holding Space Developer, and appear in `VCAP_APPLICATION`-adjacent tooling — they are configuration, not a vault. Where that is too exposed, bind a user-provided service instance or SAP Credential Store and supply the key as `encryptionKey` in its credentials:

```bash
cf create-user-provided-service cache-encryption -p '{"encryptionKey":"<32-byte key>"}'
cf bind-service my-app cache-encryption
```

CAP merges a binding's credentials into the required service's `credentials`, so the instance must be bound under the cache's service name (or mapped to it with `vcap.name`). The key is stripped before the store sees those credentials, so it is never passed into a Redis or HANA client where a connection error could print it. A key bound this way with no `encryption` block to switch it on is refused at startup rather than ignored, since an ignored key means plaintext.

The catch is that a cache has only one `credentials`, and for `store: 'redis'` or `store: 'hana'` it is already carrying the store binding. Only one instance can be mapped to a required service, so a separate instance for the key does not fit alongside one — either add `encryptionKey` to the credentials of the instance you already bind, or use `keyEnv`, which stays independent of the store. With `store: 'cds'`, where the store needs no credentials of its own, a dedicated instance works cleanly.

Alternatively, CAP's own environment overrides reach the same setting without a `keyEnv` indirection, using the config path with underscores:

```bash
cf set-env my-app cds_requires_caching_encryption_key "<32-byte key>"
```

A key that is present but not 32 bytes is rejected at startup in every case, naming the command that generates a valid one.

What this does and does not protect:

- **Encrypted:** the cached value, with a fresh random IV per entry, so two equal values do not produce equal ciphertext. GCM authenticates as well as encrypts, so a tampered entry is rejected rather than returned.
- **Not encrypted:** cache keys, tags and timestamps. Tag-based invalidation scans tags without reading values, and a scan that had to decrypt every entry would be far more expensive. Do not put sensitive values in tags or in custom key templates.
- **Not protected:** anyone who can read the API can still read decrypted values, because the service decrypts on the way out. This protects the data where it sits — a database dump, a Redis instance, a backup — not against a caller you have authorized.

Operational notes:

- **Enabling it on a warm cache** does not invalidate anything: entries already stored are plaintext, are still returned, and are replaced with encrypted ones as they are refreshed. Flush the cache if you need them gone immediately.
- **Rotating the key** makes existing entries unreadable. They are reported as misses and refetched, with a warning per entry, so rotation costs a cold cache rather than errors.
- **Cost:** encryption runs on every write and decryption on every read, which eats into the latency the cache is there to save. Enable it per cache, for the ones holding data that warrants it.

Where the data warrants stronger handling than this, the earlier advice still applies: avoid caching it, use a short TTL, and prefer a store whose at-rest encryption you control.

## Resource limits

- `getEntries` returns 100 entries by default and at most 1000 per call.
- `setEntry` rejects values larger than 1 MB.
- `metrics.maxKeyMetrics` bounds how many distinct keys are tracked in memory.

No rate limiting is applied to the management API — CAP does not provide one. Enforce limits at the approuter, API gateway, or ingress if the API is reachable from outside your landscape.

## Content Security Policy

Since 3.0 the dashboard bootstraps the UI5 runtime from `https://ui5.sap.com` at a pinned version rather than bundling it, so a CSP that allows only same-origin scripts will block it. Either allow that host:

```
script-src 'self' https://ui5.sap.com;
connect-src 'self' https://ui5.sap.com;
```

or serve UI5 yourself and set `metrics.ui5Url` to a same-origin path, which keeps the policy at `'self'`. See [the dashboard guide](dashboard.md#where-the-ui5-runtime-comes-from).
