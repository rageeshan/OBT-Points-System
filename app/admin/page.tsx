import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Users, UserCheck, Target, Receipt, Trophy, TrendingUp, Clock, Zap } from 'lucide-react'

async function getStats() {
  const [teamCount, faciCount, gameCount, txnCount, totalPoints, recentTxns, topTeams] = await Promise.all([
    prisma.team.count(),
    prisma.facilitator.count({ where: { isActive: true } }),
    prisma.game.count({ where: { isActive: true } }),
    prisma.pointTransaction.count(),
    prisma.team.aggregate({ _sum: { currentPoints: true } }),
    prisma.pointTransaction.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        team: { select: { name: true } },
        game: { select: { name: true } },
        facilitator: { select: { faciId: true } },
      },
    }),
    prisma.team.findMany({
      take: 5,
      orderBy: { currentPoints: 'desc' },
    }),
  ])

  return { teamCount, faciCount, gameCount, txnCount, totalPoints: totalPoints._sum.currentPoints || 0, recentTxns, topTeams }
}

export default async function AdminDashboardPage() {
  const { teamCount, faciCount, gameCount, txnCount, totalPoints, recentTxns, topTeams } = await getStats()

  const statCards = [
    { label: 'ACTIVE UNITS', value: teamCount, icon: Users, color: 'text-mission-amber', href: '/admin/teams' },
    { label: 'MISSION OFFICERS', value: faciCount, icon: UserCheck, color: 'text-green-400', href: '/admin/facilitators' },
    { label: 'ACTIVE MISSIONS', value: gameCount, icon: Target, color: 'text-blue-400', href: '/admin/games' },
    { label: 'TOTAL CREDITS', value: totalPoints.toLocaleString(), icon: Zap, color: 'text-mission-red', href: '/admin/transactions' },
  ]

  return (
    <div className="flex-1 overflow-auto">
      {/* Page Header */}
      <div className="border-b border-mission-border px-6 py-5">
        <div className="classified-badge mb-2">MISSION CONTROL HQ</div>
        <h1 className="mono text-2xl font-black text-white tracking-wider">DASHBOARD</h1>
        <p className="text-mission-muted text-sm mt-1">Mission Control Overview — Real-time operational status</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Link href={card.href} key={card.label}>
              <div className="mission-card rounded-xl p-5 hover:border-mission-red/30 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-mission-surface flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-mission-muted group-hover:text-mission-red transition-colors" />
                </div>
                <div className="mono text-3xl font-black text-white mb-1">{card.value}</div>
                <div className="section-label">{card.label}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Teams */}
          <div className="mission-card rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-mission-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-mission-amber" />
                <span className="mono text-sm font-bold text-white tracking-wider">TOP MISSION UNITS</span>
              </div>
              <Link href="/admin/leaderboard" className="mono text-xs text-mission-red hover:text-mission-red-bright">
                VIEW ALL →
              </Link>
            </div>
            <div className="divide-y divide-mission-border">
              {topTeams.map((team, idx) => (
                <div key={team.id} className="px-5 py-3 flex items-center gap-4">
                  <div className={`mono font-black text-xl ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'text-mission-muted'}`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mono font-bold text-white truncate">{team.name}</div>
                    <div className="mono text-xs text-mission-muted">{team.leaderName}</div>
                  </div>
                  <div className="mono font-bold text-mission-amber">{team.currentPoints.toLocaleString()}</div>
                </div>
              ))}
              {topTeams.length === 0 && (
                <div className="px-5 py-8 text-center mono text-mission-muted text-sm">NO UNITS REGISTERED</div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="mission-card rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-mission-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-400" />
                <span className="mono text-sm font-bold text-white tracking-wider">RECENT TRANSACTIONS</span>
              </div>
              <Link href="/admin/transactions" className="mono text-xs text-mission-red hover:text-mission-red-bright">
                VIEW ALL →
              </Link>
            </div>
            <div className="divide-y divide-mission-border">
              {recentTxns.map((txn) => (
                <div key={txn.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-mission-red/10 border border-mission-red/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-3 h-3 text-mission-red" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="mono text-sm font-bold text-white">{txn.team.name}</span>
                      <span className="mono text-xs text-mission-muted">via {txn.facilitator.faciId}</span>
                    </div>
                    <div className="mono text-xs text-mission-muted truncate">{txn.game.name}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="mono text-sm font-bold text-green-400">+{txn.points}</span>
                    <div className="flex items-center gap-1 text-mission-muted">
                      <Clock className="w-2.5 h-2.5" />
                      <span className="mono text-[10px]">
                        {new Date(txn.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {recentTxns.length === 0 && (
                <div className="px-5 py-8 text-center mono text-mission-muted text-sm">NO TRANSACTIONS YET</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mission-card rounded-xl p-5">
          <div className="section-label mb-3">QUICK ACTIONS</div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/teams" className="btn-ghost py-2 px-4 text-xs flex items-center gap-2">
              <Users className="w-3 h-3" />ADD UNIT
            </Link>
            <Link href="/admin/facilitators" className="btn-ghost py-2 px-4 text-xs flex items-center gap-2">
              <UserCheck className="w-3 h-3" />ADD OFFICER
            </Link>
            <Link href="/admin/games" className="btn-ghost py-2 px-4 text-xs flex items-center gap-2">
              <Target className="w-3 h-3" />ADD MISSION
            </Link>
            <Link href="/leaderboard" target="_blank" className="btn-amber py-2 px-4 text-xs flex items-center gap-2">
              <Trophy className="w-3 h-3" />LIVE LEADERBOARD ↗
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
