import { NextResponse } from 'next/server'
import { getFaciSession } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/faci/me — returns current faci's info
export async function GET() {
  const session = await getFaciSession()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    const facilitator = await prisma.facilitator.findUnique({
      where: { id: session.facilitatorId },
      include: { game: { select: { id: true, name: true, location: true } } },
    })

    if (!facilitator || !facilitator.isActive) {
      return NextResponse.json({ error: 'AGENT DEACTIVATED' }, { status: 403 })
    }

    return NextResponse.json({
      faciId: facilitator.faciId,
      name: facilitator.name,
      game: facilitator.game,
      isActive: facilitator.isActive,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch agent info' }, { status: 500 })
  }
}
