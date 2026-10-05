import { NextResponse } from 'next/server'
import { getFaciSession } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/faci/attended — returns teams that scored in the faci's assigned game
export async function GET() {
  const session = await getFaciSession()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    const facilitator = await prisma.facilitator.findUnique({
      where: { id: session.facilitatorId },
      select: {
        id: true,
        gameId: true,
        isActive: true,
      },
    })

    if (!facilitator || !facilitator.isActive) {
      return NextResponse.json({ error: 'AGENT DEACTIVATED' }, { status: 403 })
    }

    if (!facilitator.gameId) {
      return NextResponse.json([])
    }

    // Find all transactions awarded by this facilitator OR for this game
    const whereClause = facilitator.gameId
      ? {
        OR: [
          { facilitatorId: facilitator.id },
          { gameId: facilitator.gameId },
        ],
      }
      : { facilitatorId: facilitator.id }

    const transactions = await prisma.pointTransaction.findMany({
      where: whereClause,
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
