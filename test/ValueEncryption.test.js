const crypto = require('crypto')
const { expect } = require('chai')
const {
	ValueCipher,
	parseKey,
	createValueCipher,
	resolveKeyMaterial,
	storeCredentials,
	KEY_BYTES,
	PREFIX,
} = require('../lib/support/valueEncryption')

const KEY_B64 = crypto.randomBytes(KEY_BYTES).toString('base64')

describe('value encryption', () => {

	describe('key handling', () => {

		it('accepts base64 and hex key material', () => {
			const raw = crypto.randomBytes(KEY_BYTES)

			expect(parseKey(raw.toString('base64')).equals(raw)).to.be.true
			expect(parseKey(raw.toString('hex')).equals(raw)).to.be.true
		})

		it('refuses a key of the wrong length, naming the fix', () => {
			const short = crypto.randomBytes(16).toString('base64')
			expect(() => parseKey(short)).to.throw(/must decode to 32 bytes/)
			expect(() => parseKey(short)).to.throw(/randomBytes/)
		})

		it('refuses missing key material, naming every way to supply it', () => {
			for (const bad of [undefined, null, '', '   ', 42]) {
				expect(() => parseKey(bad), String(bad)).to.throw(/no key was supplied/)
			}
			expect(() => parseKey(undefined)).to.throw(/encryption\.key.*keyEnv.*encryptionKey/s)
		})
	})

	describe('createValueCipher', () => {

		it('returns null when encryption is not configured', () => {
			expect(createValueCipher({})).to.be.null
			expect(createValueCipher({ encryption: { enabled: false, key: KEY_B64 } })).to.be.null
		})

		it('builds a cipher when configured', () => {
			expect(createValueCipher({ encryption: { key: KEY_B64 } })).to.be.instanceOf(ValueCipher)
		})

		it('throws rather than silently storing plaintext', () => {
			expect(() => createValueCipher({ encryption: {} })).to.throw(/no key was supplied/)
			expect(() => createValueCipher({ encryption: { key: 'too-short' } })).to.throw(/must decode to 32 bytes/)
		})
	})

	// The key is a secret, so on a platform it arrives from the environment or a
	// binding rather than from the configuration file it is named in.
	describe('where the key comes from', () => {

		const ENV_NAME = 'CDS_CACHING_TEST_ENCRYPTION_KEY'
		afterEach(() => { delete process.env[ENV_NAME] })

		it('reads the key from the environment variable named by keyEnv', () => {
			process.env[ENV_NAME] = KEY_B64
			const cipher = createValueCipher({ encryption: { enabled: true, keyEnv: ENV_NAME } })

			expect(cipher).to.be.instanceOf(ValueCipher)
			expect(resolveKeyMaterial({ encryption: { keyEnv: ENV_NAME } })).to.equal(KEY_B64)
		})

		// Otherwise a deployment that forgot the secret would write plaintext under a
		// configuration that says it is encrypting.
		it('refuses to start when keyEnv names an unset or empty variable', () => {
			expect(() => createValueCipher({ encryption: { enabled: true, keyEnv: ENV_NAME } }))
				.to.throw(new RegExp(`keyEnv names "${ENV_NAME}".*unset or empty`))

			process.env[ENV_NAME] = '   '
			expect(() => createValueCipher({ encryption: { enabled: true, keyEnv: ENV_NAME } }))
				.to.throw(/unset or empty/)
		})

		it('reads the key from a service binding', () => {
			const options = { encryption: { enabled: true }, credentials: { url: 'redis://x', encryptionKey: KEY_B64 } }
			expect(createValueCipher(options)).to.be.instanceOf(ValueCipher)
		})

		it('prefers an explicit key, then keyEnv, then the binding', () => {
			const other = crypto.randomBytes(KEY_BYTES).toString('base64')
			process.env[ENV_NAME] = other

			expect(resolveKeyMaterial({
				encryption: { key: KEY_B64, keyEnv: ENV_NAME },
				credentials: { encryptionKey: other },
			})).to.equal(KEY_B64)

			expect(resolveKeyMaterial({
				encryption: { keyEnv: ENV_NAME },
				credentials: { encryptionKey: KEY_B64 },
			})).to.equal(other)
		})

		// A bound key that nothing switched on is the plaintext trap this feature exists
		// to prevent, and it is indistinguishable from a typo in the cache name.
		it('refuses to start when a key is bound but encryption is not enabled', () => {
			expect(() => createValueCipher({ credentials: { encryptionKey: KEY_B64 } }))
				.to.throw(/would be stored as plaintext/)
		})

		it('still honours an explicit opt-out', () => {
			const options = { encryption: { enabled: false }, credentials: { encryptionKey: KEY_B64 } }
			expect(createValueCipher(options)).to.be.null
		})

		// A store that received the key could print it in a connection error.
		it('keeps the key out of the credentials handed to a store', () => {
			const credentials = { url: 'redis://x', encryptionKey: KEY_B64 }
			const forStore = storeCredentials({ credentials })

			expect(forStore).to.eql({ url: 'redis://x' })
			expect(credentials.encryptionKey, 'the original is left alone').to.equal(KEY_B64)
			expect(storeCredentials({})).to.eql({})
		})
	})

	describe('round trip', () => {

		const cipher = new ValueCipher(parseKey(KEY_B64))

		it('recovers the plaintext', () => {
			const payload = JSON.stringify({ name: 'Alice', roles: ['admin'] })
			expect(cipher.decrypt(cipher.encrypt(payload))).to.equal(payload)
		})

		it('does not leave the plaintext visible in the envelope', () => {
			const envelope = cipher.encrypt(JSON.stringify({ secret: 'hunter2' }))

			expect(envelope).to.not.include('hunter2')
			expect(envelope.startsWith(PREFIX)).to.be.true
		})

		it('produces a different envelope every time, so equal values are not linkable', () => {
			const payload = JSON.stringify({ same: 'value' })
			expect(cipher.encrypt(payload)).to.not.equal(cipher.encrypt(payload))
		})

		it('rejects a value encrypted under a different key', () => {
			const other = new ValueCipher(parseKey(crypto.randomBytes(KEY_BYTES).toString('base64')))
			expect(() => other.decrypt(cipher.encrypt('"x"'))).to.throw()
		})

		it('rejects tampering with the ciphertext', () => {
			const envelope = cipher.encrypt(JSON.stringify({ amount: 100 }))
			const [prefix, iv, tag, data] = [PREFIX, ...envelope.slice(PREFIX.length).split(':')]
			const flipped = Buffer.from(data, 'base64')
			flipped[0] ^= 0xff

			expect(() => cipher.decrypt(`${prefix}${iv}:${tag}:${flipped.toString('base64')}`)).to.throw()
		})

		it('rejects a malformed envelope', () => {
			expect(() => cipher.decrypt(`${PREFIX}only-one-part`)).to.throw(/malformed/)
			expect(() => cipher.decrypt('plain text')).to.throw(/not encrypted/)
		})
	})

	describe('isEncrypted', () => {

		it('recognizes its own envelopes only', () => {
			const cipher = new ValueCipher(parseKey(KEY_B64))

			expect(ValueCipher.isEncrypted(cipher.encrypt('"x"'))).to.be.true
			for (const other of ['plain', '', null, undefined, 42, {}, []]) {
				expect(ValueCipher.isEncrypted(other), String(other)).to.be.false
			}
		})
	})
})
