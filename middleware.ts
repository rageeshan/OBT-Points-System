import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ─── Admin route protection ────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('admin-token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    const session = await verifyToken(token)
    if (!session || session.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // ─── Faci route protection ─────────────────────────────────
  if (pathname.startsWith('/faci') && pathname !== '/faci/login') {
    const token = request.cookies.get('faci-token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/faci/login', request.url))
    }
    const session = await verifyToken(token)
    if (!session || session.role !== 'facilitator') {
      return NextResponse.redirect(new URL('/faci/login', request.url))
    }
  }

  // ─── Trader route protection ───────────────────────────────
  if (pathname.startsWith('/trade') && pathname !== '/trade/login') {
    const token = request.cookies.get('trade-token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/trade/login', request.url))
    }
    const session = await verifyToken(token)
    if (!session || session.role !== 'trade') {
      return NextResponse.redirect(new URL('/trade/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/faci/:path*', '/trade/:path*'],
}
