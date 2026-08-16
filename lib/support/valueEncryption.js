const crypto = require('crypto')

/**
 * Optional encryption of cached values at rest.
 *
 * Cached values are written to the configured store as plaintext, which is
 * appropriate for a cache holding data the store already holds, and wrong for
 * one holding personal or otherwise sensitive data in a store whose operators or
 * backups are outside the application's trust boundary. This is opt-in, because
 * encrypting every cache by default would cost throughput for the majority of
 * caches that hold nothing worth encrypting, and because a key that the
 * application cannot lose has to be supplied deliberately.
 *
 * Only the cached value is encrypted. Tags and timestamps stay readable, since
 * tag-based invalidation scans them without reading values, and a scan that had
 * to decrypt every entry to find its tags would be far more expensive.
 */

const ALGORITHM = 'aes-256-gcm'
const KEY_BYTES = 32
const IV_BYTES = 12

/** Versioned prefix, so the format can change without mistaking old entries for plaintext. */
const PREFIX = 'enc:v1:'

/**
 * Decode configured key material into a 32-byte key.
 * @param {any} material - Base64 or hex encoded key
 * @returns {Buffer}
 * @throws {Error} When the material is missing or not 32 bytes
 */
function parseKey(material) {
    if (typeof material !== 'string' || !material.trim()) {
        throw new Error('cds-caching: encryption.key is required when encryption is configured.')
    }

    const trimmed = material.trim()
    const encoding = /^[0-9a-f]{64}$/i.test(trimmed) ? 'hex' : 'base64'
    const key = Buffer.from(trimmed, encoding)

    if (key.length !== KEY_BYTES) {
        throw new Error(
            `cds-caching: encryption.key must decode to ${KEY_BYTES} bytes (got ${key.length}). ` +
            `Generate one with: node -e "console.log(require('crypto').randomBytes(${KEY_BYTES}).toString('base64'))"`
        )
    }
    return key
}

class ValueCipher {

    /**
     * @param {Buffer} key - 32-byte AES key
     */
    constructor(key) {
        this.key = key
    }

    /**
     * Whether a stored value carries this module's envelope.
     * @param {any} value - Stored value
     * @returns {boolean}
     */
    static isEncrypted(value) {
        return typeof value === 'string' && value.startsWith(PREFIX)
    }

    /**
     * Encrypt a serialized value.
     * @param {string} plaintext - Serialized cached value
     * @returns {string} Envelope carrying iv, auth tag and ciphertext
     */
    encrypt(plaintext) {
        const iv = crypto.randomBytes(IV_BYTES)
        const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv)
        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])

        return PREFIX + [
            iv.toString('base64'),
            cipher.getAuthTag().toString('base64'),
            encrypted.toString('base64'),
        ].join(':')
    }

    /**
     * Decrypt an envelope produced by `encrypt`.
     * @param {string} envelope - Stored value
     * @returns {string} Serialized cached value
     * @throws {Error} When the envelope is malformed, or the key or data is wrong
     */
    decrypt(envelope) {
        if (!ValueCipher.isEncrypted(envelope)) {
            throw new Error('cds-caching: value is not encrypted.')
        }

        const [ivPart, tagPart, dataPart] = envelope.slice(PREFIX.length).split(':')
        if (!ivPart || !tagPart || !dataPart) {
            throw new Error('cds-caching: encrypted value is malformed.')
        }

        const decipher = crypto.createDecipheriv(ALGORITHM, this.key, Buffer.from(ivPart, 'base64'))
        decipher.setAuthTag(Buffer.from(tagPart, 'base64'))

        return Buffer.concat([
            decipher.update(Buffer.from(dataPart, 'base64')),
            decipher.final(),
        ]).toString('utf8')
    }
}

/**
 * Build a cipher from cache options, or `null` when encryption is not configured.
 *
 * Misconfiguration throws rather than falling back: a cache that was meant to be
 * encrypted and silently is not would be worse than one that refuses to start.
 *
 * @param {object} [options={}] - Cache service options
 * @returns {ValueCipher|null}
 * @throws {Error} When encryption is configured but the key is unusable
 */
function createValueCipher(options = {}) {
    const config = options.encryption
    if (!config || config.enabled === false) return null

    return new ValueCipher(parseKey(config.key))
}

module.exports = {
    ALGORITHM,
    KEY_BYTES,
    PREFIX,
    ValueCipher,
    parseKey,
    createValueCipher,
}
