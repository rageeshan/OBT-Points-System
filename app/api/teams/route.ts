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

    // Accept additional members from array or individual fields
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

    const team = await prisma.team.create({
      data: {
        name,
        leaderName,
        currentPoints: 0,
        members: {
          create: membersToCreate,
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
