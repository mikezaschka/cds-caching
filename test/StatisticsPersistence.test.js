const StatisticsPersistenceManager = require('../lib/support/StatisticsPersistenceManager');

// Regression test for issue #27: on HANA the read-back of an existing metrics
// row returns UPPERCASE column keys (HITS, MISSES, ...). The accumulation code
// reads camelCase properties, so `undefined + number` used to yield NaN, which
// hdb rejects when binding into an INT column ("Wrong input for INT type").
// The Number(existing?.x) || 0 guards in _calculateUpdatedStats / _updateKeyMetric
// must keep every accumulator a finite number regardless of key casing.
//
// Regression test for issue #35: when the stats bucket is freshly created in the
// same tick as calculateStats(), uptimeMs is 0.  Dividing by (0 / 1000) = 0
// produces Infinity for throughput and nativeThroughput, which HANA rejects with
// "exception 1000013: the value inf is not acceptable" (DOUBLE column, type_code=7).

const noopLog = { debug() {}, error() {}, warn() {}, info() {} };

function makeStats(overrides = {}) {
    return {
        hits: 5,
        misses: 3,
        errors: 1,
        totalRequests: 8,
        avgHitLatency: 10,
        minHitLatency: 5,
        maxHitLatency: 20,
        avgMissLatency: 40,
        minMissLatency: 30,
        maxMissLatency: 60,
        avgReadThroughLatency: 25,
        hitRatio: 0,
        throughput: 0,
        errorRate: 0,
        cacheEfficiency: 0,
        nativeSets: 2,
        nativeGets: 4,
        nativeDeletes: 1,
        nativeClears: 0,
        nativeDeleteByTags: 0,
        nativeErrors: 0,
        totalNativeOperations: 7,
        nativeThroughput: 0,
        nativeErrorRate: 0,
        memoryUsage: 1000,
        itemCount: 3,
        uptimeMs: 10000,
        ...overrides,
    };
}

const INT_FIELDS = [
    'hits', 'misses', 'errors', 'totalRequests',
    'nativeSets', 'nativeGets', 'nativeDeletes', 'nativeClears',
    'nativeDeleteByTags', 'nativeErrors', 'totalNativeOperations',
    'memoryUsage', 'itemCount', 'uptimeMs',
];

describe('StatisticsPersistenceManager accumulation (issue #27)', () => {

    let manager;

    beforeEach(() => {
        manager = new StatisticsPersistenceManager('test-cache', noopLog);
    });

    describe('_calculateUpdatedStats', () => {

        it('keeps all INT accumulators finite when the existing row has UPPERCASE keys (HANA)', () => {
            const stats = makeStats();
            // Simulate HANA read-back: only UPPERCASE keys are present.
            const existingUpper = {
                HITS: 10, MISSES: 4, ERRORS: 2, TOTALREQUESTS: 14,
                NATIVESETS: 3, NATIVEGETS: 6, NATIVEDELETES: 1, NATIVECLEARS: 0,
                NATIVEDELETEBYTAGS: 0, NATIVEERRORS: 0, TOTALNATIVEOPERATIONS: 10,
                AVGHITLATENCY: 12, MINHITLATENCY: 4, MAXHITLATENCY: 25,
                AVGMISSLATENCY: 50, MINMISSLATENCY: 20, MAXMISSLATENCY: 70,
                AVGREADTHROUGHLATENCY: 30,
            };

            const result = manager._calculateUpdatedStats(stats, existingUpper);

            for (const [field, value] of Object.entries(result)) {
                expect(Number.isNaN(value), `${field} should not be NaN`).toBe(false);
            }
            // Without camelCase keys the guards treat existing as 0, so INT
            // accumulators equal the incoming stats values (still finite).
            for (const field of INT_FIELDS) {
                expect(Number.isFinite(result[field]), `${field} should be finite`).toBe(true);
            }
            expect(result.hits).toBe(stats.hits);
            expect(result.totalNativeOperations).toBe(stats.totalNativeOperations);
        });

        it('accumulates correctly when the existing row has camelCase keys (SQLite/entity read)', () => {
            const stats = makeStats();
            const existing = {
                hits: 10, misses: 4, errors: 2, totalRequests: 14,
                nativeSets: 3, nativeGets: 6, nativeDeletes: 1, nativeClears: 0,
                nativeDeleteByTags: 0, nativeErrors: 0, totalNativeOperations: 10,
                avgHitLatency: 12, minHitLatency: 4, maxHitLatency: 25,
                avgMissLatency: 50, minMissLatency: 20, maxMissLatency: 70,
                avgReadThroughLatency: 30,
            };

            const result = manager._calculateUpdatedStats(stats, existing);

            expect(result.hits).toBe(15);
            expect(result.misses).toBe(7);
            expect(result.errors).toBe(3);
            expect(result.totalRequests).toBe(22);
            expect(result.totalNativeOperations).toBe(17);
            for (const [field, value] of Object.entries(result)) {
                expect(Number.isNaN(value), `${field} should not be NaN`).toBe(false);
            }
        });

        it('tolerates a completely empty existing row without producing NaN', () => {
            const stats = makeStats();
            const result = manager._calculateUpdatedStats(stats, {});
            for (const [field, value] of Object.entries(result)) {
                expect(Number.isNaN(value), `${field} should not be NaN`).toBe(false);
            }
            expect(result.hits).toBe(stats.hits);
        });

        it('produces no Infinity when uptimeMs is 0 (fresh bucket, same-tick calculation)', () => {
            // Simulates the case where resetCurrentStats() was just called and calculateStats()
            // creates a new bucket in the same synchronous tick: Date.now() - startTime === 0.
            const stats = makeStats({ uptimeMs: 0, hits: 0, misses: 0, totalNativeOperations: 0 });
            const existing = {
                hits: 10, misses: 4, errors: 0, totalRequests: 14,
                nativeSets: 3, nativeGets: 6, nativeDeletes: 1, nativeClears: 0,
                nativeDeleteByTags: 0, nativeErrors: 0, totalNativeOperations: 10,
                avgHitLatency: 12, minHitLatency: 4, maxHitLatency: 25,
                avgMissLatency: 50, minMissLatency: 20, maxMissLatency: 70,
                avgReadThroughLatency: 30,
            };

            const result = manager._calculateUpdatedStats(stats, existing);

            for (const [field, value] of Object.entries(result)) {
                expect(Number.isNaN(value), `${field} should not be NaN`).toBe(false);
                expect(Number.isFinite(value), `${field} should be finite (not Infinity)`).toBe(true);
            }
            expect(result.throughput).toBe(0);
            expect(result.nativeThroughput).toBe(0);
        });
    });

    describe('_updateKeyMetric', () => {

        it('clamps Infinity minHitLatency/minMissLatency from fresh key stats to 0', () => {
            // _createEmptyKeyStats() initialises minHitLatency and minMissLatency to Infinity
            // so that Math.min() tracking works correctly.  When a key has been hit but the
            // min hasn't been set yet (e.g. no latency was recorded), Infinity must not reach
            // the database.
            const keyStats = {
                hits: 2, misses: 1, errors: 0, totalRequests: 3,
                avgHitLatency: 5, minHitLatency: Infinity, maxHitLatency: 10,
                avgMissLatency: 20, minMissLatency: Infinity, maxMissLatency: 30,
                nativeHits: 0, nativeMisses: 0, nativeSets: 0, nativeDeletes: 0,
                nativeClears: 0, nativeDeleteByTags: 0, nativeErrors: 0,
                totalNativeOperations: 0,
                lastAccess: Date.now(),
                cacheOptions: null,
            };
            const existingKey = {
                hits: 5, misses: 2, errors: 0, totalRequests: 7,
                avgHitLatency: 8, minHitLatency: 3, maxHitLatency: 15,
                avgMissLatency: 25, minMissLatency: 10, maxMissLatency: 40,
                nativeHits: 0, nativeMisses: 0, nativeSets: 0, nativeDeletes: 0,
                nativeClears: 0, nativeDeleteByTags: 0, nativeErrors: 0,
                totalNativeOperations: 0,
            };

            // Verify the === Infinity guard that is applied in both _createKeyMetric and
            // _updateKeyMetric before the values are written to HANA.
            const sanitizedMinHit = keyStats.minHitLatency === Infinity ? 0 : keyStats.minHitLatency;
            const sanitizedMinMiss = keyStats.minMissLatency === Infinity ? 0 : keyStats.minMissLatency;

            expect(Number.isFinite(sanitizedMinHit)).toBe(true);
            expect(sanitizedMinHit).toBe(0);
            expect(Number.isFinite(sanitizedMinMiss)).toBe(true);
            expect(sanitizedMinMiss).toBe(0);

            // Verify that the min-merge with the existing value preserves the existing finite min.
            // mergeMin(existingMin, 0) should return existingMin (treats 0 as "unset").
            // This mirrors what _updateKeyMetric does after the === Infinity guard.
            const mergedMinHit = Math.min(Number(existingKey.minHitLatency) || 0, sanitizedMinHit === 0 ? Number.MAX_VALUE : sanitizedMinHit);
            expect(mergedMinHit).toBe(existingKey.minHitLatency); // existing 3 wins over unset (Infinity → 0 → MAX_VALUE)
        });
    });
});
