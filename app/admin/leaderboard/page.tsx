export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db/prisma'
import Leaderboard from '@/components/Leaderboard'

async function getLeaderboard() {
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      leaderName: true,
      currentPoints: true,
      transactions: {
        select: {
          points: true,
          game: { select: { id: true, name: true, location: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { currentPoints: 'desc' },
  })
  return teams.map((t, i) => ({
    ...t,
    rank: i + 1,
    gameScores: t.transactions.map((txn) => ({
      gameId: txn.game.id,
      gameName: txn.game.name,
      location: txn.game.location,
      points: txn.points,
    })),
  }))
}

export default async function AdminLeaderboardPage() {
  const leaderboard = await getLeaderboard()

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-mission-border px-6 py-5">
        <div className="classified-badge mb-2">LIVE RANKING</div>
        <h1 className="mono text-2xl font-black text-white tracking-wider">MISSION RANKING</h1>
        <p className="text-mission-muted text-sm mt-1">Real-time leaderboard — auto-updates via Supabase Realtime</p>
      </div>

      <div className="p-6 max-w-3xl">
        <Leaderboard initialData={leaderboard} />
      </div>
    </div>
  )
}
