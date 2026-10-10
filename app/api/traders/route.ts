import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession, hashPassword } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/traders — list all traders (admin only)
export async function GET() {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const traders = await prisma.trader.findMany({
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { traderId: 'asc' },
    })

    const safe = traders.map(({ passwordHash: _, ...t }) => t)
    return NextResponse.json(safe)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch traders' }, { status: 500 })
  }
}

// POST /api/traders — register new trader (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { name, password, traderId: manualTraderId } = await req.json()

    if (!name || !password) {
      return NextResponse.json({ error: 'Name and password are required' }, { status: 400 })
    }

    let traderId: string
    if (manualTraderId && manualTraderId.trim()) {
      traderId = manualTraderId.trim().toUpperCase()
      const existing = await prisma.trader.findUnique({ where: { traderId } })
      if (existing) {
        return NextResponse.json({ error: `Trader ID "${traderId}" is already taken` }, { status: 409 })
      }
    } else {
      const last = await prisma.trader.findFirst({
        orderBy: { traderId: 'desc' },
        select: { traderId: true },
      })
      const lastNum = last ? parseInt(last.traderId.replace('TRADE-', ''), 10) : 0
      traderId = `TRADE-${String((isNaN(lastNum) ? 0 : lastNum) + 1).padStart(3, '0')}`
    }

    const passwordHash = await hashPassword(password)

    const trader = await prisma.trader.create({
      data: {
        traderId,
        name: name.trim(),
        passwordHash,
        isActive: true,
      },
    })

    const { passwordHash: _, ...safe } = trader
    return NextResponse.json(safe, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create trader' }, { status: 500 })
  }
}
