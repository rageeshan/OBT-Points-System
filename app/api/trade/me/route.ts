import { NextResponse } from 'next/server'
import { getTradeSession } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const session = await getTradeSession()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    if (session.dbTraderId) {
      const trader = await prisma.trader.findUnique({
        where: { id: session.dbTraderId },
        select: { id: true, traderId: true, name: true, isActive: true },
      })
      if (trader) {
        if (!trader.isActive) {
          return NextResponse.json({ error: 'TRADER ACCOUNT DEACTIVATED' }, { status: 403 })
        }
        return NextResponse.json(trader)
      }
    }

    return NextResponse.json({
      id: session.dbTraderId || 'master',
      traderId: session.traderId,
      name: session.name,
      isActive: true,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch trader profile' }, { status: 500 })
  }
}
