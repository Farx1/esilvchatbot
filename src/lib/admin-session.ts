// HMAC-signed admin session token "<expiresAtMs>.<hex sha256 hmac>".
// Web Crypto only, so it runs in both the edge middleware and node route handlers.

export const ADMIN_COOKIE = 'admin-authenticated'
export const ADMIN_SESSION_MAX_AGE_S = 60 * 60 * 24 // 24 heures

const encoder = new TextEncoder()

function hmacKey(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function createAdminToken(secret: string, now = Date.now()): Promise<string> {
  const expiresAt = String(now + ADMIN_SESSION_MAX_AGE_S * 1000)
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(expiresAt))
  return `${expiresAt}.${Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, '0')).join('')}`
}

export async function verifyAdminToken(token: string | undefined, secret: string | undefined, now = Date.now()): Promise<boolean> {
  if (!token || !secret) return false
  const [expiresAt, sigHex, extra] = token.split('.')
  if (extra !== undefined || !/^\d+$/.test(expiresAt) || Number(expiresAt) <= now) return false
  if (!/^[0-9a-f]{64}$/.test(sigHex ?? '')) return false
  const sig = new Uint8Array(sigHex.match(/../g)!.map(h => parseInt(h, 16)))
  // subtle.verify compares in constant time
  return crypto.subtle.verify('HMAC', await hmacKey(secret), sig, encoder.encode(expiresAt))
}
