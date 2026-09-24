import { prisma } from '@/lib/db/prisma'
import Leaderboard from '@/components/Leaderboard'
import { Trophy } from 'lucide-react'

async function getLeaderboard() {
  const teams = await prisma.team.findMany({
    select: { id: true, name: true, leaderName: true, currentPoints: true },
    orderBy: { currentPoints: 'desc' },
  })
  return teams.map((t, i) => ({ ...t, rank: i + 1 }))
}

export default async function AdminLeaderboardPage() {
  const leaderboard = await getLeaderboard()

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-mission-border px-6 py-5 flex items-center justify-between">
        <div>
          <div className="classified-badge mb-2">LIVE RANKING</div>
          <h1 className="mono text-2xl font-black text-white tracking-wider">MISSION RANKING</h1>
          <p className="text-mission-muted text-sm mt-1">Real-time leaderboard — auto-updates via Supabase Realtime</p>
        </div>
        <a href="/leaderboard" target="_blank" className="btn-amber py-2 px-4 text-xs flex items-center gap-2">
          <Trophy className="w-3 h-3" />PROJECTOR VIEW ↗
        </a>
      </div>

      <div className="p-6 max-w-3xl">
        <Leaderboard initialData={leaderboard} />
      </div>
    </div>
  )
}
