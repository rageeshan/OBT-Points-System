import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const [teamCount, faciCount, gameCount, txnCount, totalPointsAgg, topTeams] = await Promise.all([
      prisma.team.count(),
      prisma.facilitator.count({ where: { isActive: true } }),
      prisma.game.count({ where: { isActive: true } }),
      prisma.pointTransaction.count(),
      prisma.team.aggregate({ _sum: { currentPoints: true } }),
      prisma.team.findMany({
        take: 5,
        orderBy: { currentPoints: 'desc' },
        select: { id: true, name: true, leaderName: true, currentPoints: true },
      }),
    ])

    return NextResponse.json({
      teamCount,
      faciCount,
      gameCount,
      txnCount,
      totalPoints: totalPointsAgg._sum.currentPoints || 0,
      topTeams,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
