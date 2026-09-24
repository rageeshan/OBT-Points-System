import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminCredentials, signToken } from '@/lib/auth/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const valid = await verifyAdminCredentials(username, password)
    if (!valid) {
      return NextResponse.json({ error: 'INVALID CREDENTIALS — ACCESS DENIED' }, { status: 401 })
    }

    const token = await signToken({ role: 'admin', username }, '24h')

    const res = NextResponse.json({ success: true, message: 'ACCESS GRANTED' })
    res.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return res
  } catch {
    return NextResponse.json({ error: 'SYSTEM ERROR' }, { status: 500 })
  }
}
