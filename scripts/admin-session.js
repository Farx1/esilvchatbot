// Admin login for the scripts that POST to /api/knowledge (admin-only, see src/middleware.ts).
const BASE_URL = 'http://localhost:3000';
let session; // one login per run, shared by every call

function login() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return Promise.reject(new Error('ADMIN_PASSWORD manquant : lancez `node --env-file=.env scripts/<script>.js` ou exportez ADMIN_PASSWORD.'));
  }
  return fetch(`${BASE_URL}/api/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  }).then((res) => {
    const cookie = res.headers.getSetCookie().find((c) => c.startsWith('admin-authenticated='));
    if (!res.ok || !cookie) {
      throw new Error(`Connexion admin refusée (HTTP ${res.status}) : vérifiez ADMIN_PASSWORD, SESSION_SECRET et que l'app tourne sur ${BASE_URL}.`);
    }
    return cookie.split(';')[0];
  });
}

async function adminHeaders() {
  session ??= login().catch((err) => { session = undefined; throw err; });
  return { 'Content-Type': 'application/json', Cookie: await session };
}

module.exports = { adminHeaders };
