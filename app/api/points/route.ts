import { NextRequest, NextResponse } from 'next/server'
import { getFaciSession, getAdminSession } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

function generateTxnId(): string {
  const count = Math.floor(Math.random() * 90000) + 10000
  return `TXN-${count}`
}

// POST /api/points
export async function POST(req: NextRequest) {
  try {
    // Try faci session first
    const faciSession = await getFaciSession()
    const adminSession = await getAdminSession()

    if (!faciSession && !adminSession) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { teamId, gameId, points } = await req.json()

    if (!teamId || !gameId || points === undefined || points === null) {
      return NextResponse.json({ error: 'teamId, gameId, and points are required' }, { status: 400 })
    }

    const pointsNum = parseInt(points, 10)
    if (isNaN(pointsNum) || pointsNum <= 0 || pointsNum > 10000) {
      return NextResponse.json({ error: 'Points must be between 1 and 10,000' }, { status: 400 })
    }

    // Validate facilitator permissions
    let facilitatorId: string

    if (faciSession) {
      // Verify facilitator is still active and assigned to this game
      const facilitator = await prisma.facilitator.findUnique({
        where: { id: faciSession.facilitatorId },
      })

      if (!facilitator || !facilitator.isActive) {
        return NextResponse.json({ error: 'AGENT DEACTIVATED' }, { status: 403 })
      }

      if (facilitator.gameId !== gameId) {
        return NextResponse.json({ error: 'UNAUTHORIZED — Not assigned to this mission' }, { status: 403 })
      }

      facilitatorId = facilitator.id
    } else {
      // Admin awarding — use admin's first facilitator or create admin action
      // For admin, find the game's facilitator
      const facilitator = await prisma.facilitator.findFirst({
        where: { gameId },
      })
      if (!facilitator) {
        return NextResponse.json({ error: 'No facilitator assigned to this mission' }, { status: 400 })
      }
      facilitatorId = facilitator.id
    }

    // Verify team exists
    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) {
      return NextResponse.json({ error: 'Mission unit not found' }, { status: 404 })
    }

    // Verify game exists and is active
    const game = await prisma.game.findUnique({ where: { id: gameId } })
    if (!game || !game.isActive) {
      return NextResponse.json({ error: 'Mission not found or inactive' }, { status: 404 })
    }

    // ─── ONE-TIME SCORING: Block if team already scored in this game ───────────
    const existingTxn = await prisma.pointTransaction.findFirst({
      where: { teamId, gameId },
    })
    if (existingTxn) {
      return NextResponse.json({
        error: `UNIT ${team.name} already completed mission "${game.name}" — duplicate scoring blocked`,
      }, { status: 409 })
    }

    // Create transaction and update team points atomically
    const [transaction] = await prisma.$transaction([
      prisma.pointTransaction.create({
        data: {
          txnId: generateTxnId(),
          teamId,
          gameId,
          facilitatorId,
          points: pointsNum,
        },
        include: { team: true, game: true, facilitator: true },
      }),
      prisma.team.update({
        where: { id: teamId },
        data: { currentPoints: { increment: pointsNum } },
      }),
    ])

    return NextResponse.json({
      success: true,
      transaction: {
        txnId: transaction.txnId,
        points: transaction.points,
        team: transaction.team.name,
        game: transaction.game.name,
        facilitator: transaction.facilitator.faciId,
        createdAt: transaction.createdAt,
      },
    }, { status: 201 })
  } catch (err) {
    console.error('Points award error:', err)
    return NextResponse.json({ error: 'SYSTEM ERROR — Points not recorded' }, { status: 500 })
  }
}

// GET /api/points — transaction history (admin)
export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const skip = parseInt(url.searchParams.get('skip') || '0')

    const transactions = await prisma.pointTransaction.findMany({
      include: {
        team: { select: { id: true, name: true } },
        game: { select: { id: true, name: true } },
        facilitator: { select: { id: true, faciId: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    })

    const total = await prisma.pointTransaction.count()

    return NextResponse.json({ transactions, total })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
