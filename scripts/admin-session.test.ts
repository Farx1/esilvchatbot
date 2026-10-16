import { createRequire } from 'node:module'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const load = (): { adminHeaders: () => Promise<Record<string, string>> } => {
  delete require.cache[require.resolve('./admin-session.js')] // fresh login memo per test
  return require('./admin-session.js')
}
const reply = (status: number, setCookie?: string) =>
  ({ ok: status < 400, status, headers: new Headers(setCookie ? { 'set-cookie': setCookie } : {}) })

beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('scripts/admin-session adminHeaders', () => {
  it('fails clearly without ADMIN_PASSWORD and never calls the server', async () => {
    vi.stubEnv('ADMIN_PASSWORD', '')
    await expect(load().adminHeaders()).rejects.toThrow(/ADMIN_PASSWORD manquant/)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('logs in once and sends the signed cookie on every call', async () => {
    vi.stubEnv('ADMIN_PASSWORD', 'pw')
    vi.mocked(fetch).mockResolvedValue(reply(200, 'admin-authenticated=123.abc; Path=/; HttpOnly') as Response)
    const { adminHeaders } = load()

    const [a, b] = await Promise.all([adminHeaders(), adminHeaders()])

    expect(a).toEqual({ 'Content-Type': 'application/json', Cookie: 'admin-authenticated=123.abc' })
    expect(b).toEqual(a)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/admin/auth', expect.objectContaining({ method: 'POST', body: '{"password":"pw"}' }))
  })

  it('reports a rejected password and retries on the next call', async () => {
    vi.stubEnv('ADMIN_PASSWORD', 'bad')
    vi.mocked(fetch).mockResolvedValueOnce(reply(401) as Response)
    const { adminHeaders } = load()
    await expect(adminHeaders()).rejects.toThrow(/Connexion admin refusée \(HTTP 401\)/)

    vi.mocked(fetch).mockResolvedValueOnce(reply(200, 'admin-authenticated=1.f') as Response)
    expect((await adminHeaders()).Cookie).toBe('admin-authenticated=1.f')
  })
})
