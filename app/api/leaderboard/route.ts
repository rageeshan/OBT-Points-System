import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/leaderboard — public, includes per-game score breakdown
export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        leaderName: true,
        currentPoints: true,
        transactions: {
          select: {
            points: true,
            game: { select: { id: true, name: true, location: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { currentPoints: 'desc' },
    })

    const ranked = teams.map((team, idx) => ({
      id: team.id,
      name: team.name,
      leaderName: team.leaderName,
      currentPoints: team.currentPoints,
      rank: idx + 1,
      // Game breakdown: which games they scored in and how many points
      gameScores: team.transactions
        .filter((t) => t.game)
        .map((t) => ({
          gameId: t.game!.id,
          gameName: t.game!.name,
          location: t.game!.location,
          points: t.points,
        })),
    }))

    return NextResponse.json(ranked, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
