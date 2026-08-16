const crypto = require('crypto')
const { expect } = require('chai')
const { ValueCipher, parseKey, createValueCipher, KEY_BYTES, PREFIX } = require('../lib/support/valueEncryption')

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

		it('refuses missing key material', () => {
			for (const bad of [undefined, null, '', '   ', 42]) {
				expect(() => parseKey(bad), String(bad)).to.throw(/encryption.key is required/)
			}
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
			expect(() => createValueCipher({ encryption: {} })).to.throw(/encryption.key is required/)
			expect(() => createValueCipher({ encryption: { key: 'too-short' } })).to.throw(/must decode to 32 bytes/)
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
