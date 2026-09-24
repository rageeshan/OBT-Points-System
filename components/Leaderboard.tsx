'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import { Trophy, Target } from 'lucide-react'

interface GameScore {
  gameId: string
  gameName: string
  location: string | null
  points: number
}

interface LeaderboardEntry {
  id: string
  name: string
  leaderName: string
  currentPoints: number
  rank: number
  gameScores?: GameScore[]
}

interface LeaderboardProps {
  initialData: LeaderboardEntry[]
  large?: boolean  // for projector mode
}

const rankStyles = [
  { bg: 'rank-gold', rankColor: 'text-mission-amber', textGlow: 'text-shadow-amber', icon: '🥇' },
  { bg: 'rank-silver', rankColor: 'text-gray-300', icon: '🥈' },
  { bg: 'rank-bronze', rankColor: 'text-orange-400', icon: '🥉' },
]

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export default function Leaderboard({ initialData, large = false }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialData)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) return

    const supabase = createClient(supabaseUrl, supabaseAnon)

    // Subscribe to point_transactions inserts for realtime updates
    const channel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'point_transactions',
        },
        async () => {
          // Refetch leaderboard
          const res = await fetch('/api/leaderboard', { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            setEntries(data)
            setLastUpdated(new Date())
            // Flash animation on update
            if (data.length > 0) {
              setFlashId(data[0].id)
              setTimeout(() => setFlashId(null), 2000)
            }
          }
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-mission-amber" />
    if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Trophy className="w-5 h-5 text-orange-400" />
    return <span className="mono text-mission-muted font-bold">#{rank.toString().padStart(2, '0')}</span>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-mission-muted'}`} />
          <span className={`mono text-xs font-bold tracking-wider ${isLive ? 'text-green-400' : 'text-mission-muted'}`}>
            {isLive ? 'LIVE' : 'CONNECTED'}
          </span>
        </div>
        {lastUpdated && (
          <span className="mono text-xs text-mission-muted">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Entries */}
      <AnimatePresence initial={false}>
        {entries.map((entry, idx) => {
          const rankStyle = idx < 3 ? rankStyles[idx] : null
          const isFlashing = flashId === entry.id
          const isExpanded = expandedId === entry.id
          const hasGameScores = entry.gameScores && entry.gameScores.length > 0

          return (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: 1,
                x: 0,
                boxShadow: isFlashing
                  ? '0 0 30px rgba(220, 38, 38, 0.5)'
                  : 'none',
              }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 25 }}
              className={`
                mission-card rounded-lg overflow-hidden
                ${rankStyle?.bg || ''}
                ${large ? '' : ''}
              `}
            >
              {/* Main row */}
              <div
                className={`px-5 py-4 flex items-center gap-4 ${hasGameScores ? 'cursor-pointer' : ''}`}
                onClick={() => hasGameScores && setExpandedId(isExpanded ? null : entry.id)}
              >
                {/* Rank */}
                <div className={`flex-shrink-0 ${large ? 'w-16' : 'w-10'} text-center`}>
                  {getIcon(entry.rank)}
                </div>

                {/* Team Info */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`mono font-black text-white tracking-wider truncate ${
                      large ? 'text-3xl' : 'text-base'
                    } ${entry.rank === 1 ? 'rank-1' : ''}`}
                  >
                    {entry.name.toUpperCase()}
                  </div>
                  <div className={`text-mission-muted truncate ${large ? 'text-base mt-1' : 'text-xs'}`}>
                    CMD: {entry.leaderName}
                  </div>
                  {/* Game count pill */}
                  {entry.gameScores && (
                    <div className="flex items-center gap-1 mt-1">
                      <Target className="w-3 h-3 text-mission-muted" />
                      <span className="mono text-xs text-mission-muted">
                        {entry.gameScores.length} game{entry.gameScores.length !== 1 ? 's' : ''} completed
                      </span>
                      {hasGameScores && (
                        <span className="mono text-xs text-mission-muted ml-1">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Points */}
                <div className="flex-shrink-0 text-right">
                  <div className={`mono font-black ${
                    large ? 'text-4xl' : 'text-xl'
                  } ${idx === 0 ? 'text-mission-amber' : 'text-white'}`}>
                    {entry.currentPoints.toLocaleString()}
                  </div>
                  <div className={`mono text-mission-muted ${large ? 'text-sm' : 'text-xs'}`}>
                    CREDITS
                  </div>
                </div>

                {/* Flash effect */}
                {isFlashing && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 rounded-lg bg-mission-red/10 pointer-events-none"
                  />
                )}
              </div>

              {/* Expandable game score breakdown */}
              <AnimatePresence>
                {isExpanded && hasGameScores && (
                  <motion.div
                    key="breakdown"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t border-mission-border"
                  >
                    <div className="px-5 py-3 space-y-2 bg-black/20">
                      <div className="section-label flex items-center gap-1 mb-1">
                        <Target className="w-3 h-3" />
                        GAME SCORE BREAKDOWN
                      </div>
                      {entry.gameScores!.map((gs) => (
                        <div key={gs.gameId} className="flex items-center justify-between text-xs">
                          <div className="flex flex-col">
                            <span className="mono font-bold text-white">{gs.gameName}</span>
                            {gs.location && (
                              <span className="text-mission-muted">{gs.location}</span>
                            )}
                          </div>
                          <span className="mono font-black text-mission-amber">+{gs.points} pts</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {entries.length === 0 && (
        <div className="mission-card rounded-lg p-10 text-center">
          <div className="mono text-mission-muted text-sm">NO MISSION UNITS REGISTERED</div>
        </div>
      )}
    </div>
  )
}
