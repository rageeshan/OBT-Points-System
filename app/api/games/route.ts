import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/games
export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: { facilitators: { select: { id: true, faciId: true, name: true, isActive: true } } },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(games, {
      headers: {
        'Cache-Control': 'public, s-maxage=2, stale-while-revalidate=4',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}

// POST /api/games
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { name, description, location, isActive, maxPoints } = await req.json()

    if (!name) return NextResponse.json({ error: 'Mission name is required' }, { status: 400 })

    const game = await prisma.game.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        location: location?.trim() || null,
        isActive: isActive ?? true,
        maxPoints: maxPoints ? parseInt(maxPoints, 10) : null,
      },
    })

    return NextResponse.json(game, { status: 201 })
  } catch (err: unknown) {
    const error = err as { code?: string }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Mission name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
  }
}
