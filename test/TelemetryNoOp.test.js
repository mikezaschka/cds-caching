'use strict';

const Module = require('module');

// Simulate @opentelemetry/api being absent so Telemetry.js falls back to its
// safe no-op mode. We intercept at Node's module loader level (runner-agnostic)
// so the transitive `require('@opentelemetry/api')` inside Telemetry.js throws
// MODULE_NOT_FOUND, exactly like when the optional dependency isn't installed.
const OTEL = '@opentelemetry/api';
const TELEMETRY = require.resolve('../lib/support/Telemetry');
const originalLoad = Module._load;

describe('Telemetry (OTel absent / no-op)', () => {

    let telemetry;

    beforeAll(() => {
        Module._load = function (request, ...args) {
            if (request === OTEL) {
                const err = new Error(`Cannot find module '${OTEL}'`);
                err.code = 'MODULE_NOT_FOUND';
                throw err;
            }
            return originalLoad.call(this, request, ...args);
        };
        // Force Telemetry to re-evaluate its top-level optional require.
        delete require.cache[TELEMETRY];
        telemetry = require('../lib/support/Telemetry');
    });

    afterAll(() => {
        Module._load = originalLoad;
        delete require.cache[TELEMETRY];
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
