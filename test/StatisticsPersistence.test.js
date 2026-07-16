const StatisticsPersistenceManager = require('../lib/support/StatisticsPersistenceManager');

// Regression test for issue #27: on HANA the read-back of an existing metrics
// row returns UPPERCASE column keys (HITS, MISSES, ...). The accumulation code
// reads camelCase properties, so `undefined + number` used to yield NaN, which
// hdb rejects when binding into an INT column ("Wrong input for INT type").
// The Number(existing?.x) || 0 guards in _calculateUpdatedStats / _updateKeyMetric
// must keep every accumulator a finite number regardless of key casing.

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
    });
});
