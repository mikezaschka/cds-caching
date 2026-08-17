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

/**
 * Credentials property carrying the key, for platforms where secrets arrive as a
 * service binding. Bindings are merged into `credentials`, which otherwise holds
 * store connection details, so this is stripped before the store sees them.
 */
const CREDENTIAL_KEY = 'encryptionKey'

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
        throw new Error(
            'cds-caching: encryption is enabled but no key was supplied. Set encryption.key, ' +
            'point encryption.keyEnv at an environment variable, or bind a service supplying ' +
            `credentials.${CREDENTIAL_KEY}.`
        )
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
 * Locate the configured key material.
 *
 * The key is a secret, so it usually does not live in the configuration it is
 * named in: it arrives from the platform. Deployments therefore commit the intent
 * (`encryption.enabled`, or the name of the variable to read) and inject only the
 * value, which is also what makes a missing secret a startup failure rather than
 * a cache that quietly writes plaintext.
 *
 * @param {object} options - Cache service options
 * @returns {string|undefined} Key material, or `undefined` when none is configured
 * @throws {Error} When `keyEnv` names a variable that is not set
 */
function resolveKeyMaterial(options) {
    const config = options.encryption ?? {}
    const isSupplied = value => typeof value === 'string' && value.trim().length > 0

    if (isSupplied(config.key)) return config.key

    if (config.keyEnv) {
        const fromEnv = process.env[config.keyEnv]
        if (!isSupplied(fromEnv)) {
            throw new Error(
                `cds-caching: encryption.keyEnv names "${config.keyEnv}", but that environment ` +
                `variable is unset or empty. Set it in the deployment rather than falling back ` +
                `to writing plaintext.`
            )
        }
        return fromEnv
    }

    const fromBinding = options.credentials?.[CREDENTIAL_KEY]
    if (isSupplied(fromBinding)) return fromBinding

    return undefined
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

    if (!config) {
        // A bound key with nothing enabling it is the plaintext trap this whole
        // feature exists to avoid, and it cannot be distinguished from a typo.
        const bound = options.credentials?.[CREDENTIAL_KEY]
        if (typeof bound === 'string' && bound.trim()) {
            throw new Error(
                `cds-caching: credentials.${CREDENTIAL_KEY} is set, but encryption is not enabled ` +
                `for this cache, so values would be stored as plaintext. Add ` +
                `"encryption": { "enabled": true } to the cache configuration.`
            )
        }
        return null
    }

    if (config.enabled === false) return null

    return new ValueCipher(parseKey(resolveKeyMaterial(options)))
}

/**
 * Credentials with the encryption key removed, for passing to a store.
 *
 * A binding merges the key into the same object as the connection details, and the
 * store has no use for it: forwarding it would put a secret into a client's
 * options, where a connection error could print it.
 *
 * @param {object} [options={}] - Cache service options
 * @returns {object} Credentials safe to hand to a store
 */
function storeCredentials(options = {}) {
    const { [CREDENTIAL_KEY]: _key, ...rest } = options.credentials ?? {}
    return rest
}

module.exports = {
    ALGORITHM,
    KEY_BYTES,
    PREFIX,
    CREDENTIAL_KEY,
    ValueCipher,
    parseKey,
    resolveKeyMaterial,
    createValueCipher,
    storeCredentials,
}
