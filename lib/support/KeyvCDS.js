const cds = require('@sap/cds');

/**
 * Keyv-compatible store adapter that uses CAP's managed DB connection (CQL).
 *
 * Benefits:
 * - Works with any DB backend CAP supports (HANA, PostgreSQL, SQLite)
 * - In MTX mode, automatically routes to the correct tenant's HDI container
 * - No separate credentials needed — reuses the app's existing DB connection
 */
class KeyvCDS {
    constructor(options = {}) {
        this.log = cds.log('cds-caching');
        this._entity = null;
        // Keyv checks store.opts.dialect to enable iterator support
        this.opts = { dialect: 'sqlite', url: '' };
    }

    /**
     * Lazily resolve the CacheStore entity and DB service.
     * Both are only available after the CDS server has fully bootstrapped.
     * @private
     */
    async _getDB() {
        if (!cds.db) await cds.connect.to('db');
        const db = cds.db;
        if (!this._entity) {
            this._entity = cds.entities('plugin.cds_caching')?.CacheStore;
        }
        return { db, entity: this._entity };
    }

    /**
     * Get a value by key.
     * Returns undefined if the key does not exist or is expired.
     */
    async get(key) {
        try {
            const { db, entity } = await this._getDB();
            if (!db || !entity) return undefined;
            const row = await db.run(SELECT.one.from(entity).where({ ID: key }));
            if (!row) return undefined;
            if (row.expiresAt && row.expiresAt <= Date.now()) {
                await db.run(DELETE.from(entity).where({ ID: key }));
                return undefined;
            }
            return row.value;
        } catch (error) {
            this.log.error(`KeyvCDS get error for key ${key}:`, error);
            return undefined;
        }
    }

    /**
     * Set a key-value pair with optional TTL (in milliseconds).
     */
    async set(key, value, ttl) {
        try {
            const { db, entity } = await this._getDB();
            if (!db || !entity) return;
            const expiresAt = ttl ? Date.now() + ttl : null;
            const existing = await db.run(SELECT.one.from(entity).columns('ID').where({ ID: key }));
            if (existing) {
                await db.run(UPDATE(entity).set({ value, expiresAt }).where({ ID: key }));
            } else {
                await db.run(INSERT.into(entity).entries({ ID: key, value, expiresAt }));
            }
        } catch (error) {
            this.log.error(`KeyvCDS set error for key ${key}:`, error);
        }
    }

    /**
     * Delete a key. Returns true if the key existed, false otherwise.
     */
    async delete(key) {
        try {
            const { db, entity } = await this._getDB();
            if (!db || !entity) return false;
            const result = await db.run(DELETE.from(entity).where({ ID: key }));
            return !!result;
        } catch (error) {
            this.log.error(`KeyvCDS delete error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Clear all entries from the store.
     */
    async clear() {
        try {
            const { db, entity } = await this._getDB();
            if (!db || !entity) return;
            await db.run(DELETE.from(entity));
        } catch (error) {
            this.log.error('KeyvCDS clear error:', error);
        }
    }

    /**
     * Check if a key exists and is not expired.
     */
    async has(key) {
        try {
            const { db, entity } = await this._getDB();
            if (!db || !entity) return false;
            const row = await db.run(SELECT.one.from(entity).columns('ID', 'expiresAt').where({ ID: key }));
            if (!row) return false;
            if (row.expiresAt && row.expiresAt <= Date.now()) {
                await db.run(DELETE.from(entity).where({ ID: key }));
                return false;
            }
            return true;
        } catch (error) {
            this.log.error(`KeyvCDS has error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Async iterator over all non-expired [key, value] pairs.
     */
    async *iterator() {
        try {
            const { db, entity } = await this._getDB();
            if (!db || !entity) return;
            const rows = await db.run(SELECT.from(entity));
            const now = Date.now();
            for (const row of rows) {
                if (row.expiresAt && row.expiresAt <= now) {
                    continue;
                }
                yield [row.ID, row.value];
            }
        } catch (error) {
            this.log.error('KeyvCDS iterator error:', error);
        }
    }

    /**
     * No-op — CAP manages the DB connection lifecycle.
     */
    async disconnect() {
        // Nothing to do; the DB connection is managed by the CAP runtime
    }
}

module.exports = KeyvCDS;
