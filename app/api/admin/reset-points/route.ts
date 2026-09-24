import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

// POST /api/admin/reset-points — wipes all transactions and resets all team points to 0
export async function POST() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    await prisma.$transaction([
      // Delete ALL point transactions (so teams can score in all games again)
      prisma.pointTransaction.deleteMany(),
      // Reset every team's points to 0
      prisma.team.updateMany({ data: { currentPoints: 0 } }),
    ])

    return NextResponse.json({ success: true, message: 'All points reset and transactions cleared.' })
  } catch (err) {
    console.error('Reset points error:', err)
    return NextResponse.json({ error: 'Failed to reset points' }, { status: 500 })
  }
}
