import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/teams/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const team = await prisma.team.findUnique({
      where: { id },
      include: { members: true, transactions: { include: { game: true, facilitator: true }, orderBy: { createdAt: 'desc' }, take: 10 } },
    })
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    return NextResponse.json(team)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
  }
}

// PATCH /api/teams/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { name, leaderName, member2, member3, member4, member5 } = await req.json()

    const team = await prisma.team.update({
      where: { id },
      data: {
        name: name?.trim(),
        leaderName: leaderName?.trim(),
        members: {
          deleteMany: {},
          create: [
            { name: leaderName.trim(), isLeader: true },
            { name: member2.trim(), isLeader: false },
            { name: member3.trim(), isLeader: false },
            { name: member4.trim(), isLeader: false },
            { name: member5.trim(), isLeader: false },
          ],
        },
      },
      include: { members: true },
    })

    return NextResponse.json(team)
  } catch {
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
  }
}

// DELETE /api/teams/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    await prisma.team.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}
