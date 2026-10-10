import { NextRequest, NextResponse } from 'next/server'
import { getTradeSession, getAdminSession } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/trade/history — fetch recent trade transactions (deductions)
export async function GET(req: NextRequest) {
  try {
    const tradeSession = await getTradeSession()
    const adminSession = await getAdminSession()

    if (!tradeSession && !adminSession) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '30', 10)

    const transactions = await prisma.pointTransaction.findMany({
      where: {
        points: { lt: 0 }, // deductions
      },
      include: {
        team: { select: { id: true, name: true, leaderName: true, currentPoints: true } },
        trader: { select: { id: true, traderId: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(transactions.map((t) => ({
      id: t.id,
      txnId: t.txnId,
      teamId: t.team.id,
      teamName: t.team.name,
      leaderName: t.team.leaderName,
      currentPoints: t.team.currentPoints,
      amountDeducted: Math.abs(t.points),
      points: t.points,
      reason: t.note || 'Trade Deduction',
      traderName: t.trader?.name || 'Trade Operative',
      traderId: t.trader?.traderId || 'TRADE',
      createdAt: t.createdAt,
    })))
  } catch {
    return NextResponse.json({ error: 'Failed to fetch trade history' }, { status: 500 })
  }
}
