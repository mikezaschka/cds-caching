# Federation Integration (cds-data)

[cds-data](https://github.com/mikezaschka/cds-data) is a monorepo of composable CAP plugins for integrating remote services, moving data between systems, and persisting local aggregate snapshots — declarative via CDS annotations, with a shared pipeline engine underneath.

| Package | Role |
|---------|------|
| [cds-data-federation](https://www.npmjs.com/package/cds-data-federation) | `@federation.delegate` and `@federation.replicate` on consumption views |
| [cds-data-pipeline](https://www.npmjs.com/package/cds-data-pipeline) | Shared `READ → MAP → WRITE` engine for scheduled sync and entity cache |
| cds-data-materialization *(experimental)* | `@materialize.snapshot` on `group by` projections |

## How cds-caching fits in

Federation can layer caching on delegated (and optionally replicated) views. Two strategies are available:

| Strategy | Peer dependency | Use when |
|----------|-----------------|----------|
| `cache.strategy: 'response'` (default) | **cds-caching** (optional peer) | The same OData query repeats often |
| `cache.strategy: 'entity'` | `cds-data-pipeline` + SQLite | Many different `$filter` / `$orderby` variants on one entity |

If `cds-caching` is not installed, `strategy: 'response'` is skipped with a warning — delegation still works.

### Response cache example

```cds
@federation.delegate: { cache: { ttl: 60000 } }
entity Partners as projection on remote.A_BusinessPartner {
    BusinessPartner         as ID,
    BusinessPartnerFullName as name,
    BusinessPartnerCategory as category
};
```

Identical subsequent requests (same `$filter`, `$select`, `$orderby`, `$top`, `$skip`, `$expand`) are served from the cache until the TTL expires. By default the plugin uses the `caching` service; override with `cache.service` if you need a separate instance.

Invalidate via tags — each federated entity gets an automatic `federation:<entityName>` tag:

```javascript
const cache = await cds.connect.to('caching')
await cache.deleteByTag('federation:Partners')
```

## Further reading

- [cds-data repository](https://github.com/mikezaschka/cds-data)
- [Documentation portal](https://mikezaschka.github.io/cds-data/)
- [Federation guide](https://mikezaschka.github.io/cds-data/federation/)
- [First cache walkthrough](https://mikezaschka.github.io/cds-data/federation/getting-started/first-cache)
- [Caching integration reference](https://mikezaschka.github.io/cds-data/federation/integration/caching)
