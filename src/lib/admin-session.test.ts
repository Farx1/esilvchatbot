import { describe, expect, it } from 'vitest'
import { createAdminToken, verifyAdminToken } from './admin-session'

const secret = 'test-secret'
const now = 1_700_000_000_000

describe('admin session token', async () => {
  const token = await createAdminToken(secret, now)
  const [exp, sig] = token.split('.')

  it('accepts a fresh token signed with the secret', async () => {
    expect(await verifyAdminToken(token, secret, now)).toBe(true)
  })

  it.each([
    ['wrong secret', token, 'other-secret', now],
    ['missing secret', token, undefined, now],
    ['missing token', undefined, secret, now],
    ['old unsigned cookie value', 'true', secret, now],
    ['expired (25h later)', token, secret, now + 25 * 3600 * 1000],
    ['tampered expiry', `${Number(exp) + 1}.${sig}`, secret, now],
    ['tampered signature', `${exp}.${sig.slice(0, -1)}${sig.at(-1) === '0' ? '1' : '0'}`, secret, now],
    ['extra segment', `${token}.x`, secret, now],
  ])('rejects %s', async (_, t, s, at) => {
    expect(await verifyAdminToken(t, s, at)).toBe(false)
  })
})
