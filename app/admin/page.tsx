'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, UserCheck, Target, Trophy, TrendingUp, Zap, RotateCcw, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Stats {
  teamCount: number
  faciCount: number
  gameCount: number
  txnCount: number
  totalPoints: number
  topTeams: { id: string; name: string; leaderName: string; currentPoints: number }[]
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) setStats(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  async function handleReset() {
    setResetting(true)
    try {
      const res = await fetch('/api/admin/reset-points', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Reset failed')
      } else {
        toast.success('✓ ALL POINTS RESET — Teams can compete again from scratch')
        setShowResetConfirm(false)
        fetchStats()
      }
    } catch {
      toast.error('SYSTEM ERROR')
    } finally {
      setResetting(false)
    }
  }

  const statCards = stats ? [
    { label: 'ACTIVE UNITS', value: stats.teamCount, icon: Users, color: 'text-mission-amber', href: '/admin/teams' },
    { label: 'MISSION OFFICERS', value: stats.faciCount, icon: UserCheck, color: 'text-green-400', href: '/admin/facilitators' },
    { label: 'ACTIVE MISSIONS', value: stats.gameCount, icon: Target, color: 'text-blue-400', href: '/admin/games' },
    { label: 'TOTAL CREDITS', value: stats.totalPoints.toLocaleString(), icon: Zap, color: 'text-mission-red', href: '/admin/transactions' },
  ] : []

  return (
    <div className="flex-1 overflow-auto">
      {/* Page Header */}
      <div className="border-b border-mission-border px-6 py-5">
        <div className="classified-badge mb-2">MISSION CONTROL HQ</div>
        <h1 className="mono text-2xl font-black text-white tracking-wider">DASHBOARD</h1>
        <p className="text-mission-muted text-sm mt-1">Mission Control Overview — Real-time operational status</p>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="mission-spinner w-10 h-10" />
          </div>
        ) : (
          <>
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
                {stats?.topTeams.map((team, idx) => (
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
                {(!stats?.topTeams || stats.topTeams.length === 0) && (
                  <div className="px-5 py-8 text-center mono text-mission-muted text-sm">NO UNITS REGISTERED</div>
                )}
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

            {/* Danger Zone — Reset Points */}
            <div className="rounded-xl border border-red-900/40 bg-red-950/10 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-mission-red" />
                    <span className="mono text-sm font-black text-mission-red tracking-wider">DANGER ZONE</span>
                  </div>
                  <div className="mono text-xs text-mission-muted max-w-md">
                    <strong className="text-white">Reset All Points</strong> — Sets every team&apos;s score to 0 and deletes all point transactions.
                    Teams will be able to participate in all games again from scratch.
                  </div>
                </div>
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="flex-shrink-0 flex items-center gap-2 py-2 px-4 rounded-lg border border-red-700/50 bg-red-900/20 text-mission-red mono text-xs font-bold hover:bg-red-900/40 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    RESET POINTS
                  </button>
                ) : (
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className="mono text-xs text-mission-red font-bold">ARE YOU SURE?</span>
                    <button
                      onClick={handleReset}
                      disabled={resetting}
                      className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-mission-red text-white mono text-xs font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                    >
                      {resetting ? <div className="mission-spinner w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                      YES, RESET
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="p-2 rounded-lg hover:bg-white/5 text-mission-muted hover:text-white transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
