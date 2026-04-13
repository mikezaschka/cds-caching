namespace plugin.cds_caching;

/**
 * Key-value store for the CDS cache adapter (`store: 'cds'`).
 * Uses CAP's managed DB connection — works with HANA, PostgreSQL, SQLite.
 * In MTX mode, each tenant's HDI container gets its own table automatically.
 */
entity CacheStore {
    key ID        : String(900);
        value     : LargeString;
        expiresAt : Int64;
}
