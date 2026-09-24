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
      include: { game: true },
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

    const { name, password, gameId } = await req.json()

    if (!name || !password) {
      return NextResponse.json({ error: 'Name and password are required' }, { status: 400 })
    }

    // Generate next FACI ID
    const count = await prisma.facilitator.count()
    const faciId = `FACI-${String(count + 1).padStart(3, '0')}`

    const passwordHash = await hashPassword(password)

    const facilitator = await prisma.facilitator.create({
      data: {
        faciId,
        name: name.trim(),
        passwordHash,
        gameId: gameId || null,
        isActive: true,
      },
      include: { game: true },
    })

    const { passwordHash: _, ...safe } = facilitator
    return NextResponse.json(safe, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create facilitator' }, { status: 500 })
  }
}
