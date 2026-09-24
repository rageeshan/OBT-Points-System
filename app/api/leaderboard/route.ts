import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/leaderboard — public
export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        leaderName: true,
        currentPoints: true,
      },
      orderBy: { currentPoints: 'desc' },
    })

    // Add rank
    const ranked = teams.map((team, idx) => ({
      ...team,
      rank: idx + 1,
    }))

    return NextResponse.json(ranked, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
