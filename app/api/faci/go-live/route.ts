import { NextResponse } from 'next/server'
import { getFaciSession } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// POST /api/faci/go-live — toggle the live status of the faci's assigned game
export async function POST() {
  const session = await getFaciSession()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    const facilitator = await prisma.facilitator.findUnique({
      where: { id: session.facilitatorId },
      select: {
        id: true,
        isActive: true,
        game: { select: { id: true, isLive: true } },
      },
    })

    if (!facilitator || !facilitator.isActive) {
      return NextResponse.json({ error: 'AGENT DEACTIVATED' }, { status: 403 })
    }

    if (!facilitator.game) {
      return NextResponse.json({ error: 'NO MISSION ASSIGNED' }, { status: 400 })
    }

    const currentlyLive = facilitator.game.isLive

    if (!currentlyLive) {
      // Going live: clear any other live games and set this one live in a single transaction
      const [, updatedGame] = await prisma.$transaction([
        prisma.game.updateMany({
          where: { isLive: true },
          data: { isLive: false },
        }),
        prisma.game.update({
          where: { id: facilitator.game.id },
          data: { isLive: true },
          select: { isLive: true },
        }),
      ])
      return NextResponse.json({ isLive: updatedGame.isLive })
    } else {
      // Ending session: mark this game as not live
      const updatedGame = await prisma.game.update({
        where: { id: facilitator.game.id },
        data: { isLive: false },
        select: { isLive: true },
      })
      return NextResponse.json({ isLive: updatedGame.isLive })
    }
  } catch {
    return NextResponse.json({ error: 'Failed to update live status' }, { status: 500 })
  }
}
