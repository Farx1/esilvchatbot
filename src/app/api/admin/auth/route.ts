import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE_S, createAdminToken, verifyAdminToken } from '@/lib/admin-session'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // Vérifier le mot de passe admin depuis les variables d'environnement
    const adminPassword = process.env.ADMIN_PASSWORD
    const sessionSecret = process.env.SESSION_SECRET

    if (!adminPassword || !sessionSecret) {
      console.error('⚠️ ADMIN_PASSWORD or SESSION_SECRET not set in environment variables')
      return NextResponse.json(
        { error: 'Configuration serveur incorrecte' },
        { status: 500 }
      )
    }

    if (password === adminPassword) {
      // Authentification réussie - créer un cookie sécurisé
      const cookieStore = await cookies()
      
      cookieStore.set(ADMIN_COOKIE, await createAdminToken(sessionSecret), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: ADMIN_SESSION_MAX_AGE_S,
        path: '/'
      })

      console.log('✅ Admin authentication successful')

      return NextResponse.json({ 
        success: true,
        message: 'Authentification réussie'
      })
    } else {
      console.log('❌ Admin authentication failed - incorrect password')
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json(
      { error: 'Erreur d\'authentification' },
      { status: 500 }
    )
  }
}

// Route pour vérifier l'authentification
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(ADMIN_COOKIE)?.value

    return NextResponse.json({
      authenticated: await verifyAdminToken(token, process.env.SESSION_SECRET)
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}

// Route pour se déconnecter
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(ADMIN_COOKIE)

    console.log('✅ Admin logged out')

    return NextResponse.json({ 
      success: true,
      message: 'Déconnexion réussie'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Erreur de déconnexion' },
      { status: 500 }
    )
  }
}

