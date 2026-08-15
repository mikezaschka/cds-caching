/**
 * Sanitizing helpers for data that gets persisted into the KeyMetrics entity.
 *
 * KeyMetrics rows are long-lived and readable through the management API, so
 * credentials must never reach them and single fields must not grow unbounded.
 */

/** Header names whose values are credentials or session material. */
const SENSITIVE_HEADERS = new Set([
    'authorization',
    'proxy-authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'apikey',
    'x-csrf-token',
    'x-xsrf-token',
    'sap-passport',
]);

const REDACTED = '[redacted]';

/** Default cap for free-text metric fields (metadata, query, subject, context). */
const MAX_FIELD_LENGTH = 8192;

/** Fields that carry serialized request/query detail and can grow without bound. */
const TRUNCATED_FIELDS = ['metadata', 'query', 'subject', 'context', 'cacheOptions'];

/**
 * Copy headers with credential-bearing values replaced.
 * @param {object} headers - Raw header map (case-insensitive keys)
 * @returns {object|undefined} Redacted copy, or undefined if there was nothing to copy
 */
function redactHeaders(headers) {
    if (!headers || typeof headers !== 'object') return undefined;

    const safe = {};
    for (const [name, value] of Object.entries(headers)) {
        safe[name] = SENSITIVE_HEADERS.has(name.toLowerCase()) ? REDACTED : value;
    }
    return safe;
}

/**
 * Truncate a single field to `max` characters, marking where it was cut.
 * @param {any} value - Field value; non-strings are returned unchanged
 * @param {number} [max=MAX_FIELD_LENGTH] - Maximum length to keep
 * @returns {any}
 */
function truncateField(value, max = MAX_FIELD_LENGTH) {
    if (typeof value !== 'string' || value.length <= max) return value;
    return `${value.slice(0, max)}…[truncated ${value.length - max} chars]`;
}

/**
 * Bound the free-text fields of a key-metrics metadata object.
 * Returns the input unchanged when nothing needs truncating, so the common
 * path allocates nothing.
 * @param {object} metadata - Metadata as assembled by the operation layers
 * @param {number} [max=MAX_FIELD_LENGTH] - Maximum length per field
 * @returns {object}
 */
function truncateMetadataFields(metadata, max = MAX_FIELD_LENGTH) {
    if (!metadata || typeof metadata !== 'object') return metadata;

    let copy = null;
    for (const field of TRUNCATED_FIELDS) {
        const value = metadata[field];
        if (typeof value === 'string' && value.length > max) {
            copy ??= { ...metadata };
            copy[field] = truncateField(value, max);
        }
    }
    return copy ?? metadata;
}

module.exports = {
    SENSITIVE_HEADERS,
    REDACTED,
    MAX_FIELD_LENGTH,
    redactHeaders,
    truncateField,
    truncateMetadataFields,
};
