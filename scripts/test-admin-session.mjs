// Run: node --experimental-strip-types scripts/test-admin-session.mjs
import assert from 'node:assert/strict'
import { createAdminToken, verifyAdminToken } from '../src/lib/admin-session.ts'

const secret = 'test-secret'
const now = 1_700_000_000_000
const token = await createAdminToken(secret, now)

assert.equal(await verifyAdminToken(token, secret, now), true)
assert.equal(await verifyAdminToken(token, 'other-secret', now), false)
assert.equal(await verifyAdminToken(token, undefined, now), false)
assert.equal(await verifyAdminToken(undefined, secret, now), false)
assert.equal(await verifyAdminToken('true', secret, now), false) // old unsigned cookie value
assert.equal(await verifyAdminToken(token, secret, now + 25 * 3600 * 1000), false) // expired
const [exp, sig] = token.split('.')
assert.equal(await verifyAdminToken(`${Number(exp) + 1}.${sig}`, secret, now), false) // tampered expiry
assert.equal(await verifyAdminToken(`${exp}.${sig.slice(0, -1)}${sig.at(-1) === '0' ? '1' : '0'}`, secret, now), false) // tampered sig
assert.equal(await verifyAdminToken(`${token}.x`, secret, now), false)
console.log('OK admin-session')
