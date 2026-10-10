import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession, hashPassword } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// PATCH /api/traders/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { name, password, isActive } = await req.json()

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (isActive !== undefined) updateData.isActive = isActive
    if (password) updateData.passwordHash = await hashPassword(password)

    const trader = await prisma.trader.update({
      where: { id },
      data: updateData,
    })

    const { passwordHash: _, ...safe } = trader
    return NextResponse.json(safe)
  } catch {
    return NextResponse.json({ error: 'Failed to update trader' }, { status: 500 })
  }
}

// DELETE /api/traders/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    await prisma.$transaction([
      prisma.pointTransaction.updateMany({
        where: { traderId: id },
        data: { traderId: null },
      }),
      prisma.trader.delete({ where: { id } }),
    ])
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete trader' }, { status: 500 })
  }
}
