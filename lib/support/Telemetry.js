'use strict';

/**
 * Optional OpenTelemetry integration for cds-caching.
 *
 * If `@opentelemetry/api` is installed (e.g. via `@cap-js/telemetry`), this
 * module exposes helpers to enrich auto-created spans and emit cache-specific
 * OTel metrics.  When the dependency is absent everything is a safe no-op —
 * no runtime errors, no performance impact.
 */

let otel;
try { otel = require('@opentelemetry/api'); } catch { otel = null; }

// ---------------------------------------------------------------------------
// Default attributes (set once during CachingService.init)
// ---------------------------------------------------------------------------
let _defaults = {};

// ---------------------------------------------------------------------------
// Lazy metric instances — created on first use so the MeterProvider set up
// by @cap-js/telemetry is already in place.
// ---------------------------------------------------------------------------
let _meter;
let _hitCounter;
let _missCounter;
let _setCounter;
let _deleteCounter;
let _errorCounter;
let _latencyHistogram;

function ensureMetrics() {
    if (_meter) return;
    if (!otel) return;
    _meter = otel.metrics.getMeter('cds-caching');
    _hitCounter = _meter.createCounter('cds_caching.hits', {
        description: 'Number of cache hits'
    });
    _missCounter = _meter.createCounter('cds_caching.misses', {
        description: 'Number of cache misses'
    });
    _setCounter = _meter.createCounter('cds_caching.sets', {
        description: 'Number of cache set operations'
    });
    _deleteCounter = _meter.createCounter('cds_caching.deletes', {
        description: 'Number of cache delete operations'
    });
    _errorCounter = _meter.createCounter('cds_caching.errors', {
        description: 'Number of cache operation errors'
    });
    _latencyHistogram = _meter.createHistogram('cds_caching.latency', {
        description: 'Cache operation latency in milliseconds',
        unit: 'ms'
    });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function attrs(extra) {
    return { ..._defaults, ...extra };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
module.exports = {

    /** Whether `@opentelemetry/api` could be loaded. */
    isAvailable() { return !!otel; },

    /** Return the currently active span, or `undefined`. */
    getActiveSpan() { return otel?.trace?.getActiveSpan(); },

    /** Return a Tracer scoped to the given name. */
    getTracer(name) { return otel?.trace?.getTracer(name); },

    /** Return a Meter scoped to the given name. */
    getMeter(name) { return otel?.metrics?.getMeter(name); },

    /** Convenience re-export so callers don't need to require `@opentelemetry/api`. */
    SpanStatusCode: otel?.SpanStatusCode ?? { ERROR: 2, OK: 1 },

    // -- configuration ------------------------------------------------------

    /**
     * Set attributes that will be merged into every metric recording.
     * Typically called once during `CachingService.init()`.
     */
    setDefaultAttributes(attributes) {
        _defaults = { ..._defaults, ...attributes };
    },

    // -- metric convenience methods -----------------------------------------

    recordHit(latency, extra = {}) {
        if (!otel) return;
        ensureMetrics();
        const a = attrs({ 'cache.operation': 'hit', ...extra });
        _hitCounter.add(1, a);
        if (latency != null) _latencyHistogram.record(latency, a);
    },

    recordMiss(latency, extra = {}) {
        if (!otel) return;
        ensureMetrics();
        const a = attrs({ 'cache.operation': 'miss', ...extra });
        _missCounter.add(1, a);
        if (latency != null) _latencyHistogram.record(latency, a);
    },

    recordSet(extra = {}) {
        if (!otel) return;
        ensureMetrics();
        _setCounter.add(1, attrs({ 'cache.operation': 'set', ...extra }));
    },

    recordDelete(extra = {}) {
        if (!otel) return;
        ensureMetrics();
        _deleteCounter.add(1, attrs({ 'cache.operation': 'delete', ...extra }));
    },

    recordError(extra = {}) {
        if (!otel) return;
        ensureMetrics();
        _errorCounter.add(1, attrs({ 'cache.operation': 'error', ...extra }));
    }
};
