/**
 * Canonical representation of a CQN query, for use as cache key input.
 *
 * Hashing a query with `JSON.stringify` alone is not sound, for two reasons:
 *
 *  - The OData adapter builds query objects whose `SELECT` clauses can live on
 *    the prototype chain rather than as own properties. `JSON.stringify` only
 *    walks own enumerable properties, so a `where` clause contributed by
 *    `@restrict` or a custom handler disappears, and a filtered query hashes
 *    identically to an unfiltered one.
 *  - Property insertion order is not guaranteed to match between two otherwise
 *    identical requests, and `JSON.stringify` is order-sensitive.
 *
 * Clauses are therefore read by explicit property access, which traverses the
 * prototype chain, and re-emitted in a fixed order with object keys sorted.
 * Anything the runtime attaches for its own bookkeeping is left out, so the
 * result reflects what the query asks for and nothing about how it was built.
 */

/** Clauses that change which rows or columns a SELECT returns. */
const SELECT_CLAUSES = [
    'from',
    'columns',
    'where',
    'having',
    'groupBy',
    'orderBy',
    'limit',
    'distinct',
    'one',
    'count',
    'search',
    'excluding',
];

/** Guards against pathological or self-referential structures. */
const MAX_DEPTH = 12;

/**
 * Whether a value looks like a linked CSN definition rather than a CQN node.
 * Those carry the whole model behind them (`elements`, `_target`, parent links)
 * and must not be walked; their name identifies them well enough.
 * @param {object} value - Candidate object
 * @returns {boolean}
 */
function isCsnDefinition(value) {
    return typeof value.name === 'string' && (value.kind !== undefined || value.elements !== undefined);
}

/**
 * Whether a property is runtime bookkeeping rather than part of the query.
 * `_`/`$` prefixes are CAP internals (`_target`, `$refLinks`), and `cacheKey` is
 * attached by this plugin itself.
 * @param {string} key - Property name
 * @returns {boolean}
 */
function isInternalKey(key) {
    return key === 'cacheKey' || key.startsWith('_') || key.startsWith('$');
}

/**
 * Recursively canonicalize an arbitrary CQN value.
 * @param {any} value - Value to canonicalize
 * @param {WeakSet<object>} seen - Ancestors on the current path
 * @param {number} depth - Current recursion depth
 * @returns {any} Plain, deterministically ordered value
 */
function canonicalizeValue(value, seen, depth) {
    if (value === undefined) return null;
    if (value === null) return null;

    const type = typeof value;
    if (type === 'function' || type === 'symbol') return undefined;
    if (type !== 'object') return value;

    if (depth >= MAX_DEPTH) return '[maxDepth]';
    if (seen.has(value)) return '[circular]';

    if (value instanceof Date) return value.toISOString();
    if (Buffer.isBuffer(value)) return value.toString('base64');

    seen.add(value);
    try {
        if (Array.isArray(value)) {
            return value.map(entry => canonicalizeValue(entry, seen, depth + 1));
        }

        if (isCsnDefinition(value)) return { ref: [value.name] };

        // A nested query, e.g. `SELECT.from` holding a subselect.
        if (value.SELECT !== undefined) return canonicalizeQuery(value, seen, depth);

        const out = {};
        for (const key of Object.keys(value).sort()) {
            if (isInternalKey(key)) continue;
            const canonical = canonicalizeValue(value[key], seen, depth + 1);
            if (canonical !== undefined) out[key] = canonical;
        }
        return out;
    } finally {
        seen.delete(value);
    }
}

/**
 * Canonicalize a CQN query for hashing.
 *
 * Only `SELECT` is meaningful for caching; anything else is reported as
 * non-cacheable by returning `undefined`, matching the caller's contract.
 *
 * @param {object} query - CQN query, typically `req.query`
 * @param {WeakSet<object>} [seen] - Ancestors on the current path
 * @param {number} [depth=0] - Current recursion depth
 * @returns {object|undefined} Canonical query, or `undefined` when not a SELECT
 */
function canonicalizeQuery(query, seen = new WeakSet(), depth = 0) {
    if (!query || typeof query !== 'object') return undefined;

    const select = query.SELECT;
    if (!select || typeof select !== 'object') return undefined;

    const out = {};
    for (const clause of SELECT_CLAUSES) {
        // Explicit access, so clauses inherited through the prototype chain are
        // seen — the whole point of this module.
        const value = select[clause];
        if (value === undefined) continue;
        const canonical = canonicalizeValue(value, seen, depth + 1);
        if (canonical !== undefined) out[clause] = canonical;
    }

    return { SELECT: out };
}

module.exports = {
    SELECT_CLAUSES,
    MAX_DEPTH,
    canonicalizeQuery,
    canonicalizeValue,
};
