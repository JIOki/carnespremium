import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren autenticacion
const protectedRoutes = ['/my-orders', '/profile', '/checkout']

// Rutas que requieren rol de admin
const adminRoutes = ['/admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // Verificar rutas protegidas (requieren login)
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute || isAdminRoute) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Decodificar token para verificar rol (sin verificar firma en middleware)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      
      // Verificar expiracion
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        const loginUrl = new URL('/auth/login', request.url)
        return NextResponse.redirect(loginUrl)
      }

      // Verificar rol para rutas admin
      if (isAdminRoute) {
        const role = payload.role
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }
    } catch {
      const loginUrl = new URL('/auth/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/my-orders/:path*', '/profile/:path*', '/checkout/:path*']
}