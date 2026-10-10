import { NextRequest, NextResponse } from 'next/server'
import { getFaciSession } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/faci/attended — returns teams that scored in the faci's assigned game(s)
export async function GET(req: NextRequest) {
  const session = await getFaciSession()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    const facilitator = await prisma.facilitator.findUnique({
      where: { id: session.facilitatorId },
      select: {
        id: true,
        isActive: true,
        games: { select: { id: true } },
      },
    })

    if (!facilitator || !facilitator.isActive) {
      return NextResponse.json({ error: 'AGENT DEACTIVATED' }, { status: 403 })
    }

    const assignedGameIds = facilitator.games.map((g) => g.id)
    if (assignedGameIds.length === 0) {
      return NextResponse.json([])
    }

    const url = new URL(req.url)
    const specificGameId = url.searchParams.get('gameId')

    const targetGameIds = specificGameId && assignedGameIds.includes(specificGameId)
      ? [specificGameId]
      : assignedGameIds

    // Find all transactions awarded for these games (only positive score awards)
    const transactions = await prisma.pointTransaction.findMany({
      where: {
        gameId: { in: targetGameIds },
        points: { gt: 0 },
      },
      select: {
        points: true,
        createdAt: true,
        team: {
          select: { id: true, name: true, leaderName: true, currentPoints: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(transactions.map((t) => ({
      teamId: t.team.id,
      teamName: t.team.name,
      leaderName: t.team.leaderName,
      totalPoints: t.team.currentPoints,
      pointsFromThisGame: t.points,
      scoredAt: t.createdAt,
    })))
  } catch {
    return NextResponse.json({ error: 'Failed to fetch attended teams' }, { status: 500 })
  }
}
