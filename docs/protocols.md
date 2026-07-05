# Protocol Support (OData, REST, GraphQL, HCQL, MCP)

cds-caching is **protocol-agnostic**. It binds at the CAP *service handler* level
(the `READ` event for entities and the action/function event for functions),
installed via `service.prepend()`. It does **not** hook into any specific HTTP
adapter. As a result, a single `@cache` annotation applies no matter which
protocol a request arrives through — OData, REST, GraphQL, HCQL, or MCP.

```cds
// One annotation, cached across every protocol the service is served with
annotate CatalogService with @odata @rest @graphql @hcql @mcp;

service CatalogService {
  @cache: { ttl: 10000 }
  entity Books as projection on db.Books;

  @cache: { ttl: 60000 }
  function getRecommendations() returns array of Books;
}
```

## Table of Contents

1. [How it works](#how-it-works)
2. [MCP Protocol Adapter](#mcp-protocol-adapter)
3. [HCQL Protocol Adapter](#hcql-protocol-adapter)
4. [Cache keys across protocols](#cache-keys-across-protocols)

## How it works

When a request reaches a CAP service, the framework dispatches it to the
registered event handlers regardless of the protocol adapter that received it.
cds-caching registers a read-through handler for every `@cache`-annotated entity
and function:

- Entity reads → `service.on('READ', <entity>, …)`
- Functions/actions → `service.on('<event>', …)`
- Invalidation (when `invalidateOnWrite: true`) → `service.after('CREATE'|'UPDATE'|'DELETE', …)`

Because all protocols funnel through these same handlers, caching and
tag-based invalidation are **shared across protocols**: an entry populated by an
MCP read can be invalidated by an OData write, and vice versa.

## MCP Protocol Adapter

The [MCP Protocol Adapter](https://cap.cloud.sap/docs/guides/protocols/mcp)
(`@cap-js/mcp`, introduced with cds 10 / June 2026) turns any CAP service into an
MCP server for AI agents and LLM tools. From a developer's perspective, `@mcp` is
"just another protocol", and it exposes three tools:

| MCP tool      | Dispatches to                            | Cached by cds-caching?                          |
| ------------- | ---------------------------------------- | ----------------------------------------------- |
| `query`       | `service.run(<CQN SELECT>)` → `READ`     | ✅ Yes — via `@cache` on the entity              |
| `call_action` | the unbound action/function event        | ✅ Yes — via `@cache` on the function            |
| `describe`    | pure metadata (no data)                  | Not applicable (nothing to cache)               |

### Caching is implicit

No MCP-specific configuration or code is required. If an entity or unbound
function is annotated with `@cache`, MCP traffic against it is cached
automatically, exactly like OData/REST/GraphQL.

```cds
@mcp service BooksService {
  /** Books available in the shop. */
  @cache: { ttl: 10000 }
  entity Books as projection on db.Books;

  /** Personalized recommendations. */
  @cache: { ttl: 60000 }
  function getRecommendations() returns array of Books;
}
```

### MCP is read-only (today)

The current MCP adapter supports **reads and unbound actions/functions only** —
there are no CREATE/UPDATE/DELETE operations over MCP. Consequently:

- `@cache` read-through works for MCP `query` and `call_action`.
- `@cache.invalidateOnWrite` is **not** triggered by MCP itself (MCP performs no
  writes). Because the cache is shared across protocols, writes over OData/REST
  still invalidate the entries that MCP reads — so agents never see stale data
  once a change is persisted through a writable protocol.

See `test/MCPOperations.test.js` for the integration tests covering these paths.

## HCQL Protocol Adapter

HCQL ("CQL over HTTP", also introduced with cds 10) accepts CQN `SELECT` queries
in the HTTP request **body** via `POST`, instead of encoding query options in the
URL like OData. CAP also selects HCQL **automatically** for CAP-to-CAP remote
consumption and data federation, so you may be using it without opting in
explicitly.

### Inbound (serving `@hcql`)

Served HCQL entities are cached implicitly through the same `READ` handler
binding as every other protocol. The only subtlety is cache-key generation: for
OData the differentiating query lives in the URL query string, whereas for HCQL
it lives in the request body (the CQN). cds-caching therefore folds the CQN into
the cache key whenever the request URL carries no query string, so two different
HCQL queries against the same endpoint never collide on one key. This is handled
automatically — no configuration needed.

### Outbound (consuming remote services via `rt.send`)

When you cache a remote read through `cache.rt.send(request, remoteService, …)`
and CAP has negotiated HCQL for that remote, the query is sent as an HTTP `POST`.
cds-caching recognizes a `POST` that carries a `SELECT` query as a cacheable
read:

```js
const remote = await cds.connect.to('AdminService') // may resolve to HCQL
const { result } = await cache.rt.send(
  { method: 'POST', query: SELECT.from('Books').where({ stock: { '>': 100 } }) },
  remote,
  { ttl: 10000 }
)
```

Genuine mutations (a `POST`/`PUT`/`PATCH`/`DELETE` without a `SELECT`, or a
request carrying an `INSERT`/`UPDATE`/`DELETE`/`UPSERT` query) are never cached.

> Alternatively, `cache.rt.run(query, remoteService, …)` caches by query
> structure and is unaffected by the transport verb.

See `test/HCQLOperations.test.js` for the corresponding tests.

## Cache keys across protocols

The cache key is derived from request context that is set by CAP independently of
the protocol (`user`, `tenant`, `locale` from `cds.context`) plus a content hash
of the request:

- **OData/REST**: the HTTP URL query string (`$filter`, `$select`, `$orderby`, …)
  is the primary source for the content hash.
- **HCQL / MCP / programmatic CQL**: there is no URL query string, so the CQN
  query itself (`req.query`) drives the content hash.

This ensures that semantically different requests get different keys, and
identical requests share one key, regardless of the protocol used. See the
[Key Management guide](key-management.md) for templates and context-awareness
options.
