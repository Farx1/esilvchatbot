import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes qui nécessitent une authentification admin
const protectedRoutes = [
  '/admin',
  '/admin/analytics',
  '/admin/knowledge',
  '/rag-viewer',
  '/api/admin',
  '/api/knowledge'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Vérifier si la route est protégée
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    // Vérifier le cookie d'authentification admin
    const adminAuth = request.cookies.get('admin-authenticated')
    
    if (!adminAuth || adminAuth.value !== 'true') {
      // Rediriger vers la page de login admin
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/rag-viewer/:path*',
    '/api/admin/:path*',
    '/api/knowledge/:path*'
  ]
}

