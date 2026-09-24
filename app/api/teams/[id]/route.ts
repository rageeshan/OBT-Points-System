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
    const body = await req.json()
    const name = body.name?.trim()
    const leaderName = body.leaderName?.trim()

    if (!name) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
    }

    if (!leaderName) {
      return NextResponse.json({ error: 'Mission commander name is required (minimum 1 member)' }, { status: 400 })
    }

    const membersToCreate: { name: string; isLeader: boolean }[] = [
      { name: leaderName, isLeader: true },
    ]

    if (Array.isArray(body.members)) {
      for (const m of body.members) {
        if (typeof m === 'string' && m.trim()) {
          membersToCreate.push({ name: m.trim(), isLeader: false })
        }
      }
    } else {
      const additionalFields = [body.member2, body.member3, body.member4, body.member5]
      for (const m of additionalFields) {
        if (typeof m === 'string' && m.trim()) {
          membersToCreate.push({ name: m.trim(), isLeader: false })
        }
      }
    }

    const team = await prisma.team.update({
      where: { id },
      data: {
        name,
        leaderName,
        members: {
          deleteMany: {},
          create: membersToCreate,
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
