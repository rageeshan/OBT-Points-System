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
    const { name, password, gameId, isActive } = await req.json()

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (gameId !== undefined) updateData.gameId = gameId || null
    if (isActive !== undefined) updateData.isActive = isActive
    if (password) updateData.passwordHash = await hashPassword(password)

    const facilitator = await prisma.facilitator.update({
      where: { id },
      data: updateData,
      include: { game: true },
    })

    const { passwordHash: _, ...safe } = facilitator
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
    await prisma.facilitator.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete facilitator' }, { status: 500 })
  }
}
