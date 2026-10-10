import { NextRequest, NextResponse } from 'next/server'
import { getTradeSession, getAdminSession } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

function generateTradeTxnId(): string {
  const count = Math.floor(Math.random() * 90000) + 10000
  return `TRD-${count}`
}

// POST /api/trade/deduct — reduce points for a selected team
export async function POST(req: NextRequest) {
  try {
    const tradeSession = await getTradeSession()
    const adminSession = await getAdminSession()

    if (!tradeSession && !adminSession) {
      return NextResponse.json({ error: 'UNAUTHORIZED — Trade clearance required' }, { status: 401 })
    }

    const { teamId, amount, reason } = await req.json()

    if (!teamId || amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Team and reduction amount are required' }, { status: 400 })
    }

    const deductionAmount = parseInt(amount, 10)
    if (isNaN(deductionAmount) || deductionAmount <= 0) {
      return NextResponse.json({ error: 'Reduction amount must be a positive number' }, { status: 400 })
    }

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    })

    if (!team) {
      return NextResponse.json({ error: 'Selected team unit not found' }, { status: 404 })
    }

    // Determine trader identifier
    let traderId: string | null = null
    if (tradeSession?.dbTraderId) {
      traderId = tradeSession.dbTraderId
    } else {
      // Find default trader if available
      const defaultTrader = await prisma.trader.findFirst({ select: { id: true } })
      traderId = defaultTrader?.id || null
    }

    const note = reason && typeof reason === 'string' && reason.trim()
      ? reason.trim()
      : 'Trade Deduction'

    // Atomically create point transaction with negative points and decrement team currentPoints
    const [transaction, updatedTeam] = await prisma.$transaction([
      prisma.pointTransaction.create({
        data: {
          txnId: generateTradeTxnId(),
          teamId,
          traderId,
          points: -deductionAmount,
          note,
        },
        include: {
          team: { select: { id: true, name: true, leaderName: true } },
          trader: { select: { id: true, traderId: true, name: true } },
        },
      }),
      prisma.team.update({
        where: { id: teamId },
        data: {
          currentPoints: { decrement: deductionAmount },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: `Successfully deducted ${deductionAmount} credits from ${team.name}`,
      deduction: {
        txnId: transaction.txnId,
        teamName: updatedTeam.name,
        amountDeducted: deductionAmount,
        previousPoints: team.currentPoints,
        newPoints: updatedTeam.currentPoints,
        reason: transaction.note,
        createdAt: transaction.createdAt,
      },
    }, { status: 201 })
  } catch (err) {
    console.error('Trade deduction error:', err)
    return NextResponse.json({ error: 'SYSTEM ERROR — Failed to process deduction' }, { status: 500 })
  }
}
