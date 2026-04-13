'use strict';

const otelApi = require('@opentelemetry/api');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { InMemorySpanExporter, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const {
    MeterProvider,
    InMemoryMetricExporter,
    PeriodicExportingMetricReader,
    AggregationTemporality
} = require('@opentelemetry/sdk-metrics');

// ---------------------------------------------------------------------------
// Suite 1 — Telemetry.js with OTel SDK available
// ---------------------------------------------------------------------------
describe('Telemetry (OTel available)', () => {

    let spanExporter, tracerProvider;
    let metricExporter, metricReader, meterProvider;
    let telemetry;

    beforeAll(async () => {
        spanExporter = new InMemorySpanExporter();
        tracerProvider = new NodeTracerProvider({
            spanProcessors: [new SimpleSpanProcessor(spanExporter)]
        });
        tracerProvider.register();

        metricExporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
        metricReader = new PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: 60_000
        });
        meterProvider = new MeterProvider({ readers: [metricReader] });
        otelApi.metrics.setGlobalMeterProvider(meterProvider);

        // Require Telemetry AFTER providers are registered so it picks up
        // the real @opentelemetry/api instead of falling back to null.
        jest.resetModules();
        telemetry = require('../lib/support/Telemetry');
    });

    afterAll(async () => {
        await tracerProvider.shutdown();
        await metricReader.shutdown();
        otelApi.metrics.disable();
        otelApi.trace.disable();
    });

    beforeEach(() => {
        spanExporter.reset();
        metricExporter.reset();
    });

    // -- helpers --

    async function collectMetrics() {
        await metricReader.forceFlush();
        return metricExporter.getMetrics();
    }

    function findMetric(resourceMetrics, name) {
        for (const rm of resourceMetrics) {
            for (const sm of rm.scopeMetrics) {
                for (const m of sm.metrics) {
                    if (m.descriptor.name === name) return m;
                }
            }
        }
        return undefined;
    }

    // -- availability -------------------------------------------------------

    it('isAvailable() returns true', () => {
        expect(telemetry.isAvailable()).toBe(true);
    });

    // -- tracer / meter access ----------------------------------------------

    it('getTracer() returns a Tracer', () => {
        const tracer = telemetry.getTracer('unit-test');
        expect(tracer).toBeDefined();
        expect(typeof tracer.startActiveSpan).toBe('function');
    });

    it('getMeter() returns a Meter', () => {
        const meter = telemetry.getMeter('unit-test');
        expect(meter).toBeDefined();
        expect(typeof meter.createCounter).toBe('function');
    });

    it('SpanStatusCode exposes ERROR and OK', () => {
        expect(telemetry.SpanStatusCode.ERROR).toBe(2);
        expect(telemetry.SpanStatusCode.OK).toBe(1);
    });

    // -- active span --------------------------------------------------------

    it('getActiveSpan() returns undefined outside a span', () => {
        expect(telemetry.getActiveSpan()).toBeUndefined();
    });

    it('getActiveSpan() returns the span inside startActiveSpan', () => {
        const tracer = telemetry.getTracer('unit-test');
        tracer.startActiveSpan('test-span', (span) => {
            const active = telemetry.getActiveSpan();
            expect(active).toBeDefined();
            expect(active).toBe(span);
            span.end();
        });
    });

    // -- default attributes -------------------------------------------------

    it('setDefaultAttributes() merges into subsequent recordings', async () => {
        telemetry.setDefaultAttributes({ 'cache.name': 'test-cache', 'cache.store': 'memory' });
        telemetry.recordSet({ 'extra.attr': 'val' });

        const metrics = await collectMetrics();
        const setMetric = findMetric(metrics, 'cds_caching.sets');
        expect(setMetric).toBeDefined();

        const dp = setMetric.dataPoints[0];
        expect(dp.attributes['cache.name']).toBe('test-cache');
        expect(dp.attributes['cache.store']).toBe('memory');
        expect(dp.attributes['extra.attr']).toBe('val');
        expect(dp.attributes['cache.operation']).toBe('set');
    });

    // -- recordHit ----------------------------------------------------------

    it('recordHit() increments cds_caching.hits and records latency', async () => {
        telemetry.recordHit(42, { 'cache.name': 'test' });

        const metrics = await collectMetrics();
        const hits = findMetric(metrics, 'cds_caching.hits');
        expect(hits).toBeDefined();
        expect(hits.dataPoints[0].value).toBe(1);
        expect(hits.dataPoints[0].attributes['cache.operation']).toBe('hit');

        const latency = findMetric(metrics, 'cds_caching.latency');
        expect(latency).toBeDefined();
        expect(latency.dataPoints.length).toBeGreaterThanOrEqual(1);
    });

    it('recordHit(null) records counter but skips histogram', async () => {
        metricExporter.reset();
        telemetry.recordHit(null, { 'cache.name': 'test-null' });

        const metrics = await collectMetrics();
        const hits = findMetric(metrics, 'cds_caching.hits');
        expect(hits).toBeDefined();
        const hitPoint = hits.dataPoints.find(
            dp => dp.attributes['cache.name'] === 'test-null'
        );
        expect(hitPoint).toBeDefined();

        const latency = findMetric(metrics, 'cds_caching.latency');
        if (latency) {
            const latPoint = latency.dataPoints.find(
                dp => dp.attributes['cache.name'] === 'test-null'
            );
            expect(latPoint).toBeUndefined();
        }
    });

    // -- recordMiss ---------------------------------------------------------

    it('recordMiss() increments cds_caching.misses and records latency', async () => {
        telemetry.recordMiss(15, { 'cache.name': 'test' });

        const metrics = await collectMetrics();
        const misses = findMetric(metrics, 'cds_caching.misses');
        expect(misses).toBeDefined();
        expect(misses.dataPoints[0].value).toBe(1);
        expect(misses.dataPoints[0].attributes['cache.operation']).toBe('miss');

        const latency = findMetric(metrics, 'cds_caching.latency');
        expect(latency).toBeDefined();
    });

    // -- recordSet ----------------------------------------------------------

    it('recordSet() increments cds_caching.sets', async () => {
        telemetry.recordSet({ 'cache.name': 'test' });

        const metrics = await collectMetrics();
        const sets = findMetric(metrics, 'cds_caching.sets');
        expect(sets).toBeDefined();
        expect(sets.dataPoints[0].value).toBeGreaterThanOrEqual(1);
        expect(sets.dataPoints[0].attributes['cache.operation']).toBe('set');
    });

    // -- recordDelete -------------------------------------------------------

    it('recordDelete() increments cds_caching.deletes', async () => {
        telemetry.recordDelete({ 'cache.name': 'test' });

        const metrics = await collectMetrics();
        const deletes = findMetric(metrics, 'cds_caching.deletes');
        expect(deletes).toBeDefined();
        expect(deletes.dataPoints[0].value).toBe(1);
        expect(deletes.dataPoints[0].attributes['cache.operation']).toBe('delete');
    });

    // -- recordError --------------------------------------------------------

    it('recordError() increments cds_caching.errors', async () => {
        telemetry.recordError({ 'cache.error_operation': 'get' });

        const metrics = await collectMetrics();
        const errors = findMetric(metrics, 'cds_caching.errors');
        expect(errors).toBeDefined();
        expect(errors.dataPoints[0].value).toBe(1);
        expect(errors.dataPoints[0].attributes['cache.operation']).toBe('error');
        expect(errors.dataPoints[0].attributes['cache.error_operation']).toBe('get');
    });
});

// ---------------------------------------------------------------------------
// Suite 3 — Integration: span creation in AsyncOperations
// ---------------------------------------------------------------------------
describe('Telemetry integration (span creation)', () => {

    let spanExporter, tracerProvider;
    let metricExporter, metricReader, meterProvider;
    let AsyncOperations;
    let _originalCds;

    function mockCache() {
        return {
            has: jest.fn().mockResolvedValue(false),
            send: jest.fn().mockResolvedValue(undefined),
        };
    }

    function mockKeyManager() {
        return {
            createKey: jest.fn().mockReturnValue('generated-key'),
        };
    }

    function mockStatistics() {
        return {
            recordHit: jest.fn(),
            recordMiss: jest.fn(),
            recordSet: jest.fn(),
            recordDelete: jest.fn(),
            recordError: jest.fn(),
            recordNativeSet: jest.fn(),
            recordNativeGet: jest.fn(),
            recordNativeDelete: jest.fn(),
        };
    }

    beforeAll(async () => {
        // Restore modules after Suite 1 teardown / Suite 2 mocking
        jest.restoreAllMocks();
        jest.resetModules();

        // AsyncOperations uses `cds` as a global (provided by CAP runtime).
        // Provide a minimal stub so the class can be instantiated standalone.
        _originalCds = globalThis.cds;
        globalThis.cds = { context: {} };

        spanExporter = new InMemorySpanExporter();
        tracerProvider = new NodeTracerProvider({
            spanProcessors: [new SimpleSpanProcessor(spanExporter)]
        });
        tracerProvider.register();

        metricExporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
        metricReader = new PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: 60_000
        });
        meterProvider = new MeterProvider({ readers: [metricReader] });
        otelApi.metrics.setGlobalMeterProvider(meterProvider);

        AsyncOperations = require('../lib/operations/AsyncOperations');
    });

    afterAll(async () => {
        await tracerProvider.shutdown();
        await metricReader.shutdown();
        otelApi.metrics.disable();
        otelApi.trace.disable();
        if (_originalCds === undefined) {
            delete globalThis.cds;
        } else {
            globalThis.cds = _originalCds;
        }
    });

    beforeEach(() => {
        spanExporter.reset();
    });

    describe('AsyncOperations.wrap()', () => {

        it('creates a span named "cds-caching - wrap" on cache miss', async () => {
            const cache = mockCache();
            const ops = new AsyncOperations(cache, mockKeyManager(), mockStatistics());
            ops.log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

            const fn = async () => 'result-value';
            const wrapped = ops.wrap('my-key', fn);
            const { result, cacheKey } = await wrapped();

            expect(result).toBe('result-value');

            const spans = spanExporter.getFinishedSpans();
            expect(spans.length).toBe(1);
            expect(spans[0].name).toBe('cds-caching - wrap');
            expect(spans[0].attributes['cache.operation']).toBe('wrap');
            expect(spans[0].attributes['cache.operation_type']).toBe('read_through');
            expect(spans[0].attributes['cache.hit']).toBe(false);
            expect(spans[0].attributes['cache.key']).toBe('generated-key');
        });

        it('creates a span with cache.hit=true on cache hit', async () => {
            const cache = mockCache();
            cache.has.mockResolvedValue(true);
            cache.send.mockResolvedValue({ value: 'cached-value', tags: [], timestamp: Date.now() });

            const ops = new AsyncOperations(cache, mockKeyManager(), mockStatistics());
            ops.log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

            const fn = async () => 'should-not-be-called';
            const wrapped = ops.wrap('my-key', fn);
            const { result } = await wrapped();

            expect(result).toBe('cached-value');

            const spans = spanExporter.getFinishedSpans();
            expect(spans.length).toBe(1);
            expect(spans[0].attributes['cache.hit']).toBe(true);
        });

        it('sets span error status when the wrapped function throws', async () => {
            const cache = mockCache();
            const ops = new AsyncOperations(cache, mockKeyManager(), mockStatistics());
            ops.log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

            const fn = async () => { throw new Error('boom'); };
            const wrapped = ops.wrap('my-key', fn);

            await expect(wrapped()).rejects.toThrow('boom');

            const spans = spanExporter.getFinishedSpans();
            expect(spans.length).toBe(1);
            expect(spans[0].status.code).toBe(otelApi.SpanStatusCode.ERROR);
            expect(spans[0].status.message).toBe('boom');
        });
    });

    describe('AsyncOperations.exec()', () => {

        it('creates a span named "cds-caching - exec" on cache miss', async () => {
            const cache = mockCache();
            const ops = new AsyncOperations(cache, mockKeyManager(), mockStatistics());
            ops.log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

            const fn = async (a, b) => a + b;
            const { result, cacheKey } = await ops.exec('exec-key', fn, [3, 4]);

            expect(result).toBe(7);

            const spans = spanExporter.getFinishedSpans();
            expect(spans.length).toBe(1);
            expect(spans[0].name).toBe('cds-caching - exec');
            expect(spans[0].attributes['cache.operation']).toBe('exec');
            expect(spans[0].attributes['cache.operation_type']).toBe('read_through');
            expect(spans[0].attributes['cache.hit']).toBe(false);
            expect(spans[0].attributes['cache.key']).toBe('generated-key');
        });

        it('sets span error status when exec function throws', async () => {
            const cache = mockCache();
            const ops = new AsyncOperations(cache, mockKeyManager(), mockStatistics());
            ops.log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

            const fn = async () => { throw new Error('exec-fail'); };

            await expect(ops.exec('exec-key', fn)).rejects.toThrow('exec-fail');

            const spans = spanExporter.getFinishedSpans();
            expect(spans.length).toBe(1);
            expect(spans[0].status.code).toBe(otelApi.SpanStatusCode.ERROR);
            expect(spans[0].status.message).toBe('exec-fail');
        });
    });
});

// ---------------------------------------------------------------------------
// Suite 4 — Integration: span decoration in BasicOperations
// ---------------------------------------------------------------------------
describe('Telemetry integration (BasicOperations span decoration)', () => {

    let spanExporter, tracerProvider;
    let BasicOperations;

    function makeMocks(sendResult = null) {
        const cache = {
            options: { throwOnErrors: false },
            cache: {
                has: jest.fn().mockResolvedValue(false),
                iterator: jest.fn().mockImplementation(async function* () {}),
            },
            send: jest.fn().mockResolvedValue(sendResult),
            name: 'test-cache',
        };
        const keyManager = { createKey: jest.fn().mockReturnValue('resolved-key') };
        const tagResolver = { resolveTags: jest.fn().mockReturnValue([]) };
        const statistics = {
            recordNativeSet: jest.fn(),
            recordNativeGet: jest.fn(),
            recordNativeDelete: jest.fn(),
            recordNativeClear: jest.fn(),
            recordNativeDeleteByTag: jest.fn(),
        };
        return { cache, keyManager, tagResolver, statistics };
    }

    beforeAll(async () => {
        jest.restoreAllMocks();
        jest.resetModules();

        spanExporter = new InMemorySpanExporter();
        tracerProvider = new NodeTracerProvider({
            spanProcessors: [new SimpleSpanProcessor(spanExporter)]
        });
        tracerProvider.register();

        BasicOperations = require('../lib/operations/BasicOperations');
    });

    afterAll(async () => {
        await tracerProvider.shutdown();
        otelApi.trace.disable();
    });

    beforeEach(() => {
        spanExporter.reset();
    });

    it('set() decorates the active span with cache attributes', async () => {
        const { cache, keyManager, tagResolver, statistics } = makeMocks();
        const ops = new BasicOperations(cache, keyManager, tagResolver, statistics);

        const tracer = otelApi.trace.getTracer('test');
        await tracer.startActiveSpan('parent-set', async (span) => {
            await ops.set('my-key', 'my-value', { ttl: 5000 });
            span.end();
        });

        const spans = spanExporter.getFinishedSpans();
        expect(spans.length).toBe(1);
        expect(spans[0].attributes['cache.operation']).toBe('set');
        expect(spans[0].attributes['cache.operation_type']).toBe('basic');
        expect(spans[0].attributes['cache.key']).toBe('resolved-key');
        expect(spans[0].attributes['cache.ttl_ms']).toBe(5000);
    });

    it('get() decorates the active span with cache.hit=false on cache miss', async () => {
        const { cache, keyManager, tagResolver, statistics } = makeMocks(null);
        const ops = new BasicOperations(cache, keyManager, tagResolver, statistics);

        const tracer = otelApi.trace.getTracer('test');
        await tracer.startActiveSpan('parent-get-miss', async (span) => {
            await ops.get('my-key');
            span.end();
        });

        const spans = spanExporter.getFinishedSpans();
        expect(spans.length).toBe(1);
        expect(spans[0].attributes['cache.operation']).toBe('get');
        expect(spans[0].attributes['cache.operation_type']).toBe('basic');
        expect(spans[0].attributes['cache.key']).toBe('resolved-key');
        expect(spans[0].attributes['cache.hit']).toBe(false);
    });

    it('get() decorates the active span with cache.hit=true on cache hit', async () => {
        const { cache, keyManager, tagResolver, statistics } = makeMocks({ value: 'cached', tags: [], timestamp: Date.now() });
        const ops = new BasicOperations(cache, keyManager, tagResolver, statistics);

        const tracer = otelApi.trace.getTracer('test');
        await tracer.startActiveSpan('parent-get-hit', async (span) => {
            await ops.get('my-key');
            span.end();
        });

        const spans = spanExporter.getFinishedSpans();
        expect(spans.length).toBe(1);
        expect(spans[0].attributes['cache.hit']).toBe(true);
        expect(spans[0].attributes['cache.operation']).toBe('get');
    });

    it('delete() decorates the active span with cache attributes', async () => {
        const { cache, keyManager, tagResolver, statistics } = makeMocks();
        const ops = new BasicOperations(cache, keyManager, tagResolver, statistics);

        const tracer = otelApi.trace.getTracer('test');
        await tracer.startActiveSpan('parent-delete', async (span) => {
            await ops.delete('my-key');
            span.end();
        });

        const spans = spanExporter.getFinishedSpans();
        expect(spans.length).toBe(1);
        expect(spans[0].attributes['cache.operation']).toBe('delete');
        expect(spans[0].attributes['cache.operation_type']).toBe('basic');
        expect(spans[0].attributes['cache.key']).toBe('resolved-key');
    });

    it('clear() decorates the active span with cache attributes', async () => {
        const { cache, keyManager, tagResolver, statistics } = makeMocks();
        const ops = new BasicOperations(cache, keyManager, tagResolver, statistics);

        const tracer = otelApi.trace.getTracer('test');
        await tracer.startActiveSpan('parent-clear', async (span) => {
            await ops.clear();
            span.end();
        });

        const spans = spanExporter.getFinishedSpans();
        expect(spans.length).toBe(1);
        expect(spans[0].attributes['cache.operation']).toBe('clear');
        expect(spans[0].attributes['cache.operation_type']).toBe('basic');
    });

    it('does not throw when no active span exists', async () => {
        const { cache, keyManager, tagResolver, statistics } = makeMocks();
        const ops = new BasicOperations(cache, keyManager, tagResolver, statistics);

        // Running outside any active span context should not throw
        await ops.set('key', 'value');
        await ops.get('key');
        await ops.delete('key');
        await ops.clear();
    });
});

// ---------------------------------------------------------------------------
// Suite 5 — Integration: span creation in CapOperations.send()
// ---------------------------------------------------------------------------
describe('Telemetry integration (CapOperations span creation)', () => {

    let spanExporter, tracerProvider;
    let CapOperations;
    let _originalCds;

    function makeRequest(method = 'GET') {
        return {
            method,
            path: '/Test',
            data: null,
            params: null,
            query: null,
            event: null,
            headers: {},
            user: { id: 'test-user' },
            tenant: 'test-tenant',
            locale: 'en',
            target: { name: 'Test' },
        };
    }

    function makeService(sendImpl) {
        return {
            name: 'TestService',
            send: sendImpl || jest.fn().mockResolvedValue({ data: 'response' }),
        };
    }

    function makeMocks({ hasResult = false, getValue = null } = {}) {
        const cache = {
            has: jest.fn().mockResolvedValue(hasResult),
            send: jest.fn().mockImplementation(async (op) => {
                if (op === 'GET') return getValue;
                return undefined;
            }),
            options: { throwOnErrors: false },
        };
        const keyManager = {
            createKey: jest.fn().mockReturnValue('cap-key'),
            createContentHash: jest.fn().mockReturnValue('hash'),
        };
        const statistics = {
            recordHit: jest.fn(),
            recordMiss: jest.fn(),
            recordSet: jest.fn(),
            recordError: jest.fn(),
        };
        const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
        return { cache, keyManager, statistics, log };
    }

    beforeAll(async () => {
        jest.restoreAllMocks();
        jest.resetModules();

        _originalCds = globalThis.cds;
        globalThis.cds = { context: { user: { id: 'u1' }, tenant: 't1', locale: 'en' } };

        spanExporter = new InMemorySpanExporter();
        tracerProvider = new NodeTracerProvider({
            spanProcessors: [new SimpleSpanProcessor(spanExporter)]
        });
        tracerProvider.register();

        CapOperations = require('../lib/operations/CapOperations');
    });

    afterAll(async () => {
        await tracerProvider.shutdown();
        otelApi.trace.disable();
        if (_originalCds === undefined) {
            delete globalThis.cds;
        } else {
            globalThis.cds = _originalCds;
        }
    });

    beforeEach(() => {
        spanExporter.reset();
    });

    it('creates a span named "cds-caching - send" on cache miss', async () => {
        const { cache, keyManager, statistics, log } = makeMocks({ hasResult: false });
        const service = makeService();
        const ops = new CapOperations(cache, keyManager, statistics, log);

        await ops.send(makeRequest('GET'), service, { ttl: 3000 });

        const spans = spanExporter.getFinishedSpans();
        expect(spans.length).toBe(1);
        expect(spans[0].name).toBe('cds-caching - send');
        expect(spans[0].attributes['cache.hit']).toBe(false);
        expect(spans[0].attributes['cache.key']).toBe('cap-key');
        expect(spans[0].attributes['cache.operation']).toBe('send');
        expect(spans[0].attributes['cache.operation_type']).toBe('read_through');
        expect(spans[0].attributes['cache.ttl_ms']).toBe(3000);
    });

    it('creates a span with cache.hit=true on cache hit', async () => {
        const cachedValue = { value: 'cached-data', tags: [], timestamp: Date.now() };
        const { cache, keyManager, statistics, log } = makeMocks({
            hasResult: true,
            getValue: cachedValue,
        });
        const service = makeService();
        const ops = new CapOperations(cache, keyManager, statistics, log);

        await ops.send(makeRequest('GET'), service, {});

        const spans = spanExporter.getFinishedSpans();
        expect(spans.length).toBe(1);
        expect(spans[0].name).toBe('cds-caching - send');
        expect(spans[0].attributes['cache.hit']).toBe(true);
        expect(spans[0].attributes['cache.key']).toBe('cap-key');
        expect(spans[0].attributes['cache.operation']).toBe('send');
        // ttl_ms should NOT be set on a cache hit
        expect(spans[0].attributes['cache.ttl_ms']).toBeUndefined();
    });

    it('does not set cache.key on non-cacheable requests (POST)', async () => {
        const { cache, keyManager, statistics, log } = makeMocks();
        const service = makeService();
        const ops = new CapOperations(cache, keyManager, statistics, log);

        await ops.send(makeRequest('POST'), service, {});

        const spans = spanExporter.getFinishedSpans();
        expect(spans.length).toBe(1);
        expect(spans[0].attributes['cache.hit']).toBe(false);
        // cacheKey is null for POST — must not appear as a span attribute
        expect(spans[0].attributes['cache.key']).toBeUndefined();
        expect(spans[0].attributes['cache.ttl_ms']).toBeUndefined();
    });

    it('sets span error status when the underlying service throws', async () => {
        const { cache, keyManager, statistics, log } = makeMocks({ hasResult: false });
        const service = makeService(jest.fn().mockRejectedValue(new Error('service-error')));
        const ops = new CapOperations(cache, keyManager, statistics, log);

        await expect(ops.send(makeRequest('GET'), service, {})).rejects.toThrow('service-error');

        const spans = spanExporter.getFinishedSpans();
        expect(spans.length).toBe(1);
        expect(spans[0].status.code).toBe(otelApi.SpanStatusCode.ERROR);
        expect(spans[0].status.message).toBe('service-error');
    });
});

// ---------------------------------------------------------------------------
// Suite 2 — Telemetry.js when @opentelemetry/api is absent (no-op mode)
// ---------------------------------------------------------------------------
describe('Telemetry (OTel absent / no-op)', () => {

    let telemetry;

    beforeAll(() => {
        jest.resetModules();
        jest.mock('@opentelemetry/api', () => {
            const err = new Error('Cannot find module \'@opentelemetry/api\'');
            err.code = 'MODULE_NOT_FOUND';
            throw err;
        });
        telemetry = require('../lib/support/Telemetry');
    });

    afterAll(() => {
        jest.restoreAllMocks();
        jest.resetModules();
    });

    it('isAvailable() returns false', () => {
        expect(telemetry.isAvailable()).toBe(false);
    });

    it('getActiveSpan() returns undefined', () => {
        expect(telemetry.getActiveSpan()).toBeUndefined();
    });

    it('getTracer() returns undefined', () => {
        expect(telemetry.getTracer('test')).toBeUndefined();
    });

    it('getMeter() returns undefined', () => {
        expect(telemetry.getMeter('test')).toBeUndefined();
    });

    it('SpanStatusCode uses fallback values', () => {
        expect(telemetry.SpanStatusCode).toEqual({ ERROR: 2, OK: 1 });
    });

    it('setDefaultAttributes() does not throw', () => {
        expect(() => telemetry.setDefaultAttributes({ foo: 'bar' })).not.toThrow();
    });

    it('recordHit() does not throw', () => {
        expect(() => telemetry.recordHit(10, { k: 'v' })).not.toThrow();
    });

    it('recordMiss() does not throw', () => {
        expect(() => telemetry.recordMiss(5)).not.toThrow();
    });

    it('recordSet() does not throw', () => {
        expect(() => telemetry.recordSet()).not.toThrow();
    });

    it('recordDelete() does not throw', () => {
        expect(() => telemetry.recordDelete()).not.toThrow();
    });

    it('recordError() does not throw', () => {
        expect(() => telemetry.recordError({ op: 'get' })).not.toThrow();
    });
});
