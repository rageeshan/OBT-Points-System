import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession, hashPassword } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// PATCH /api/facilitators/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { name, password, gameIds, gameId, isActive } = await req.json()

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (isActive !== undefined) updateData.isActive = isActive
    if (password) updateData.passwordHash = await hashPassword(password)

    const facilitator = await prisma.facilitator.update({
      where: { id },
      data: updateData,
    })

    // If gameIds was specified, synchronize the assigned games
    if (gameIds !== undefined || gameId !== undefined) {
      const assignedGameIds: string[] = Array.isArray(gameIds)
        ? gameIds
        : gameId
          ? [gameId]
          : []

      // 1. Remove facilitator from games no longer in the list
      await prisma.game.updateMany({
        where: {
          facilitatorId: id,
          id: { notIn: assignedGameIds },
        },
        data: { facilitatorId: null },
      })

      // 2. Assign facilitator to games in the list
      if (assignedGameIds.length > 0) {
        await prisma.game.updateMany({
          where: { id: { in: assignedGameIds } },
          data: { facilitatorId: id },
        })
      }
    }

    const fullFacilitator = await prisma.facilitator.findUnique({
      where: { id },
      include: {
        games: { select: { id: true, name: true, location: true, maxPoints: true, isLive: true } },
      },
    })

    if (!fullFacilitator) {
      return NextResponse.json({ error: 'Officer not found' }, { status: 404 })
    }

    const { passwordHash: _, ...safe } = fullFacilitator
    return NextResponse.json(safe)
  } catch {
    return NextResponse.json({ error: 'Failed to update facilitator' }, { status: 500 })
  }
}

// DELETE /api/facilitators/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    await prisma.$transaction([
      // 1. Unassign any missions linked to this officer
      prisma.game.updateMany({
        where: { facilitatorId: id },
        data: { facilitatorId: null },
      }),
      // 2. Clear facilitatorId on historic point transactions so team credits remain intact
      prisma.pointTransaction.updateMany({
        where: { facilitatorId: id },
        data: { facilitatorId: null },
      }),
      // 3. Safely delete the facilitator
      prisma.facilitator.delete({
        where: { id },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to delete facilitator:', err)
    return NextResponse.json({ error: 'Failed to delete facilitator' }, { status: 500 })
  }
}
