import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth/auth'
import { hashPassword } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/facilitators
export async function GET() {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const facilitators = await prisma.facilitator.findMany({
      include: {
        games: {
          select: { id: true, name: true, location: true, maxPoints: true, isLive: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { faciId: 'asc' },
    })

    // Never return password hash
    const safe = facilitators.map(({ passwordHash: _, ...f }) => f)
    return NextResponse.json(safe)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch facilitators' }, { status: 500 })
  }
}

// POST /api/facilitators
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { name, password, gameIds, gameId, faciId: manualFaciId } = await req.json()

    if (!name || !password) {
      return NextResponse.json({ error: 'Name and password are required' }, { status: 400 })
    }

    let faciId: string

    if (manualFaciId && manualFaciId.trim()) {
      // Use manually entered Faci ID (uppercase, trimmed)
      faciId = manualFaciId.trim().toUpperCase()
      // Check uniqueness
      const existing = await prisma.facilitator.findUnique({ where: { faciId } })
      if (existing) {
        return NextResponse.json({ error: `Agent ID "${faciId}" is already taken` }, { status: 409 })
      }
    } else {
      // Auto-generate next FACI ID
      const last = await prisma.facilitator.findFirst({
        orderBy: { faciId: 'desc' },
        select: { faciId: true },
      })
      const lastNum = last ? parseInt(last.faciId.replace('FACI-', ''), 10) : 0
      faciId = `FACI-${String(lastNum + 1).padStart(3, '0')}`
    }

    const passwordHash = await hashPassword(password)

    // Collect games to assign: support both gameIds array or single gameId
    const assignedGameIds: string[] = Array.isArray(gameIds)
      ? gameIds
      : gameId
      ? [gameId]
      : []

    const facilitator = await prisma.facilitator.create({
      data: {
        faciId,
        name: name.trim(),
        passwordHash,
        isActive: true,
      },
    })

    // If games are selected, assign this facilitator to those games
    if (assignedGameIds.length > 0) {
      await prisma.game.updateMany({
        where: { id: { in: assignedGameIds } },
        data: { facilitatorId: facilitator.id },
      })
    }

    const fullFacilitator = await prisma.facilitator.findUnique({
      where: { id: facilitator.id },
      include: {
        games: { select: { id: true, name: true, location: true, maxPoints: true, isLive: true } },
      },
    })

    if (!fullFacilitator) {
      return NextResponse.json({ error: 'Failed to retrieve created officer' }, { status: 500 })
    }

    const { passwordHash: _, ...safe } = fullFacilitator
    return NextResponse.json(safe, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create facilitator' }, { status: 500 })
  }
}
