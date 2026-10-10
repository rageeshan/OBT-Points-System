import { NextRequest, NextResponse } from 'next/server'
import { getFaciSession } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// POST /api/faci/go-live — toggle the live status of the faci's assigned game
export async function POST(req: NextRequest) {
  const session = await getFaciSession()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    let reqGameId: string | undefined
    try {
      const body = await req.json()
      reqGameId = body?.gameId
    } catch {
      // Body may be empty
    }

    const facilitator = await prisma.facilitator.findUnique({
      where: { id: session.facilitatorId },
      select: {
        id: true,
        isActive: true,
        games: { select: { id: true, isLive: true } },
      },
    })

    if (!facilitator || !facilitator.isActive) {
      return NextResponse.json({ error: 'AGENT DEACTIVATED' }, { status: 403 })
    }

    if (!facilitator.games || facilitator.games.length === 0) {
      return NextResponse.json({ error: 'NO MISSIONS ASSIGNED' }, { status: 400 })
    }

    const targetGame = reqGameId
      ? facilitator.games.find((g) => g.id === reqGameId)
      : facilitator.games[0]

    if (!targetGame) {
      return NextResponse.json({ error: 'MISSION NOT ASSIGNED TO YOU' }, { status: 403 })
    }

    const nextLiveStatus = !targetGame.isLive

    // Toggle only the target game's live status without turning off other games
    const updatedGame = await prisma.game.update({
      where: { id: targetGame.id },
      data: { isLive: nextLiveStatus },
      select: { id: true, isLive: true },
    })

    return NextResponse.json({ gameId: updatedGame.id, isLive: updatedGame.isLive })
  } catch {
    return NextResponse.json({ error: 'Failed to update live status' }, { status: 500 })
  }
}
