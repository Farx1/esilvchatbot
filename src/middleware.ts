import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin-session'

// Routes where only some methods are admin-only; every other matched path is fully admin-only.
const ADMIN_METHODS: Record<string, string[]> = {
  '/api/knowledge': ['POST', 'PUT', 'PATCH', 'DELETE'],
  '/api/documents/upload': ['POST', 'PUT', 'PATCH', 'DELETE'],
  '/api/rag-updates': ['POST', 'PUT', 'PATCH', 'DELETE'],
  '/api/ai-config': ['POST'],
  '/api/form-submit': ['GET'], // GET returns submitted personal data
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin/login' || pathname === '/api/admin/auth') return NextResponse.next()
  const methods = ADMIN_METHODS[pathname]
  if (methods && !methods.includes(request.method)) return NextResponse.next()

  const token = request.cookies.get(ADMIN_COOKIE)?.value
  if (await verifyAdminToken(token, process.env.SESSION_SECRET)) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Authentification admin requise' }, { status: 401 })
  }
  const loginUrl = new URL('/admin/login', request.url)
  loginUrl.searchParams.set('callbackUrl', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/rag-viewer/:path*',
    '/api/admin/:path*',
    '/api/knowledge',
    '/api/documents/upload',
    '/api/rag-updates',
    '/api/ai-config',
    '/api/form-submit',
  ],
}
