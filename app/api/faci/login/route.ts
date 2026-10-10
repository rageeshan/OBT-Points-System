import { NextRequest, NextResponse } from 'next/server'
import { comparePassword, signToken } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  try {
    const { faciId, password } = await req.json()

    if (!faciId || !password) {
      return NextResponse.json({ error: 'Agent ID and password are required' }, { status: 400 })
    }

    // Find facilitator
    const facilitator = await prisma.facilitator.findUnique({
      where: { faciId: faciId.toUpperCase() },
      include: { games: true },
    })

    if (!facilitator) {
      return NextResponse.json({ error: 'AGENT ID NOT FOUND — ACCESS DENIED' }, { status: 401 })
    }

    if (!facilitator.isActive) {
      return NextResponse.json({ error: 'AGENT DEACTIVATED — CONTACT MISSION CONTROL' }, { status: 403 })
    }

    const valid = await comparePassword(password, facilitator.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'INVALID CREDENTIALS — ACCESS DENIED' }, { status: 401 })
    }

    const token = await signToken({
      role: 'facilitator',
      faciId: facilitator.faciId,
      facilitatorId: facilitator.id,
    }, '12h')

    const res = NextResponse.json({
      success: true,
      message: 'AGENT ACCESS GRANTED',
      facilitator: {
        faciId: facilitator.faciId,
        name: facilitator.name,
        games: facilitator.games.map((g) => ({
          id: g.id,
          name: g.name,
          location: g.location,
          maxPoints: g.maxPoints,
          isLive: g.isLive,
        })),
        // For backwards compatibility if any client reads game
        game: facilitator.games[0]
          ? {
              id: facilitator.games[0].id,
              name: facilitator.games[0].name,
              location: facilitator.games[0].location,
            }
          : null,
      },
    })

    res.cookies.set('faci-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12, // 12 hours
      path: '/',
    })

    return res
  } catch (err) {
    console.error('Faci login error:', err)
    return NextResponse.json({ error: 'SYSTEM ERROR' }, { status: 500 })
  }
}
