'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import { Trophy, Shield, Zap } from 'lucide-react'
import MissionHeader from '@/components/MissionHeader'

interface LeaderboardEntry {
  id: string
  name: string
  leaderName: string
  currentPoints: number
  rank: number
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const rankConfig = [
  { bg: 'from-yellow-900/30 to-yellow-950/20', border: 'border-yellow-500/40', rankColor: 'text-yellow-400', pointColor: 'text-yellow-300', prefix: '◈' },
  { bg: 'from-slate-700/30 to-slate-800/20', border: 'border-slate-400/40', rankColor: 'text-slate-300', pointColor: 'text-slate-200', prefix: '◈' },
  { bg: 'from-orange-900/30 to-orange-950/20', border: 'border-orange-500/40', rankColor: 'text-orange-400', pointColor: 'text-orange-300', prefix: '◈' },
]

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set())

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeaderboard()

    // Supabase realtime
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return
    }

    const supabase = createClient(supabaseUrl, supabaseAnon)
    const channel = supabase
      .channel('leaderboard-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'point_transactions' }, async (payload) => {
        const teamId = (payload.new as { team_id?: string }).team_id
        await fetchLeaderboard()
        if (teamId) {
          setFlashIds((prev) => new Set([...prev, teamId]))
          setTimeout(() => {
            setFlashIds((prev) => {
              const next = new Set(prev)
              next.delete(teamId)
              return next
            })
          }, 2500)
        }
      })
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLeaderboard])

  return (
    <div className="mission-bg min-h-screen flex flex-col">
      {/* Shared Navbar */}
      <MissionHeader
        title="NLDS'26 OBT LEADERBOARD"
        subtitle="LIVE OPERATIONS"
        rightSlot={
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-mission-muted'}`} />
            <span className={`mono text-xs font-bold tracking-widest ${isLive ? 'text-green-400' : 'text-mission-muted'}`}>
              {isLive ? '● LIVE' : '○ OFFLINE'}
            </span>
          </div>
        }
      />

      <main className="flex-1 flex flex-col px-4 sm:px-8 py-8 max-w-5xl mx-auto w-full">
        {/* Title */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="classified-badge mx-auto mb-4 w-fit"
          >
            <Zap className="w-3 h-3" />
            CLASSIFIED RANKING
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mono text-4xl sm:text-6xl font-black text-white tracking-wider"
          >
            MISSION RANKING
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="w-32 h-0.5 bg-mission-red mx-auto mt-4"
          />
          {lastUpdated && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="mono text-xs text-mission-muted" suppressHydrationWarning>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="mission-spinner w-10 h-10 mx-auto mb-4" />
              <div className="mono text-sm text-mission-muted tracking-wider">LOADING INTEL...</div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {entries.map((entry, idx) => {
                const cfg = idx < 3 ? rankConfig[idx] : null
                const isFlashing = flashIds.has(entry.id)
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, x: -30 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 25 }}
                    className={`
                      relative rounded-xl border p-5 sm:p-6 flex items-center gap-5 overflow-hidden
                      ${cfg ? `bg-gradient-to-r ${cfg.bg} ${cfg.border}` : 'mission-card border-mission-border'}
                    `}
                  >
                    {/* Flash overlay */}
                    <AnimatePresence>
                      {isFlashing && (
                        <motion.div
                          key="flash"
                          initial={{ opacity: 0.6 }}
                          animate={{ opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 2 }}
                          className="absolute inset-0 bg-mission-red/20 pointer-events-none"
                        />
                      )}
                    </AnimatePresence>

                    {/* Rank */}
                    <div className="flex-shrink-0 w-16 sm:w-20 text-center">
                      {idx < 3 ? (
                        <div className="flex flex-col items-center gap-1">
                          <Trophy className={`w-6 h-6 sm:w-8 sm:h-8 ${cfg?.rankColor}`} />
                          <div className={`mono text-xs font-bold ${cfg?.rankColor}`}>
                            #{entry.rank.toString().padStart(2, '0')}
                          </div>
                        </div>
                      ) : (
                        <div className="mono text-2xl sm:text-3xl font-black text-mission-muted">
                          #{entry.rank.toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>

                    {/* Team info */}
                    <div className="flex-1 min-w-0">
                      <div className={`mono font-black text-xl sm:text-3xl tracking-wider truncate ${idx === 0 ? 'text-yellow-300' : 'text-white'}`}>
                        {entry.name}
                      </div>
                      <div className="mono text-xs sm:text-sm text-mission-muted mt-1">
                        CMD: {entry.leaderName}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="flex-shrink-0 text-right">
                      <div className={`mono font-black text-3xl sm:text-5xl ${cfg?.pointColor || 'text-white'}`}>
                        {entry.currentPoints.toLocaleString()}
                      </div>
                      <div className="mono text-xs text-mission-muted">CREDITS</div>
                    </div>

                    {/* Update flash badge */}
                    {isFlashing && (
                      <motion.div
                        initial={{ opacity: 1, scale: 0.8 }}
                        animate={{ opacity: 0, scale: 1.2 }}
                        transition={{ duration: 2 }}
                        className="absolute top-3 right-3 bg-mission-red text-white mono text-xs px-2 py-0.5 rounded font-bold"
                      >
                        +UPDATED
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {entries.length === 0 && (
              <div className="mission-card rounded-xl p-16 text-center">
                <Shield className="w-12 h-12 text-mission-muted mx-auto mb-4" />
                <div className="mono text-mission-muted">NO MISSION UNITS REGISTERED</div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-mission-border py-4 text-center">
        <div className="mono text-xs text-mission-muted tracking-widest">
          MISSION CONTROL LIVE FEED — OBT 2026 — ALL DATA IS CLASSIFIED
        </div>
      </footer>
    </div>
  )
}
