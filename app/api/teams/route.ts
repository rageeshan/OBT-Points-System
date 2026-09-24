import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/teams
export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: true,
        transactions: {
          select: {
            points: true,
            createdAt: true,
            game: { select: { id: true, name: true, location: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { currentPoints: 'desc' },
    })
    return NextResponse.json(teams)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

// POST /api/teams
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { name, leaderName, member2, member3, member4, member5 } = await req.json()

    if (!name || !leaderName || !member2 || !member3 || !member4 || !member5) {
      return NextResponse.json({ error: 'All 5 member fields are required' }, { status: 400 })
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        leaderName: leaderName.trim(),
        currentPoints: 0,
        members: {
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

    return NextResponse.json(team, { status: 201 })
  } catch (err: unknown) {
    const error = err as { code?: string }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Team name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}
