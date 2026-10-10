'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  UserCheck,
  Target,
  X,
  Shield,
  Terminal,
  Eye,
  Lock,
  CheckCircle,
  Search,
  LayoutGrid,
  Table as TableIcon,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface Facilitator {
  faciId: string
  name: string
}

interface PointTransactionSnippet {
  createdAt: string | Date
}

interface Game {
  id: string
  name: string
  description?: string | null
  location?: string | null
  isLive?: boolean
  isActive?: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
  facilitator?: Facilitator | null
  facilitators?: Facilitator[]
  transactions?: PointTransactionSnippet[]
}

function getGameFacilitators(game: Game | null | undefined): Facilitator[] {
  if (!game) return []
  if (Array.isArray(game.facilitators) && game.facilitators.length > 0) {
    return game.facilitators
  }
  if (game.facilitator && (game.facilitator as unknown as { isActive?: boolean }).isActive !== false) {
    return [{ faciId: game.facilitator.faciId, name: game.facilitator.name }]
  }
  return []
}

// ─── Priority & Inactivity Calculations ───────────────────────────────────────
// Inactivity threshold: 5 minutes (user requested)
const INACTIVITY_THRESHOLD_MS = 5 * 60 * 1000

function getLastActiveTimestamp(game: Game): number {
  const txnTime = game.transactions?.[0]?.createdAt
    ? new Date(game.transactions[0].createdAt).getTime()
    : 0
  const updatedTime = game.updatedAt ? new Date(game.updatedAt).getTime() : 0
  const createdTime = game.createdAt ? new Date(game.createdAt).getTime() : 0
  return Math.max(txnTime, updatedTime, createdTime)
}

function getIdleMinutes(game: Game, now: number): number {
  const lastActive = getLastActiveTimestamp(game)
  if (!lastActive) return 0
  return Math.max(0, Math.floor((now - lastActive) / (1000 * 60)))
}

function formatIdleTime(minutes: number): string {
  if (minutes < 1) return 'Active just now'
  if (minutes < 60) return `Idle for ${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  return `Idle for ${hours}h ${rem}m`
}

function isTopPriority(game: Game, now: number): boolean {
  if (game.isLive) return false
  const lastActive = getLastActiveTimestamp(game)
  if (!lastActive) return true
  return now - lastActive >= INACTIVITY_THRESHOLD_MS
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i * 0.04, 0.4), duration: 0.35, ease: 'easeOut' },
  }),
}

// ─── Tactical Mission Table Component ─────────────────────────────────────────
function MissionsTable({
  games,
  type,
  now,
  onSelect,
}: {
  games: Game[]
  type: 'available' | 'ongoing'
  now: number
  onSelect: (g: Game) => void
}) {
  const isOngoing = type === 'ongoing'

  return (
    <div
      className={`rounded-2xl border overflow-hidden backdrop-blur-md shadow-2xl relative transition-all ${
        isOngoing
          ? 'bg-orange-950/20 border-orange-500/40 shadow-orange-950/30'
          : 'glass-card border-mission-border hover:border-mission-border/90'
      }`}
    >
      {/* Top ambient highlight line */}
      <div
        className={`h-0.5 w-full bg-gradient-to-r ${
          isOngoing
            ? 'from-transparent via-orange-500/70 to-transparent'
            : 'from-transparent via-green-500/70 to-transparent'
        }`}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-mission-border/80 bg-black/50 text-[11px] mono uppercase tracking-wider text-mission-muted select-none">
              <th className="py-3.5 px-4 text-center font-bold w-12 sm:w-16">#</th>
              <th className="py-3.5 px-4 font-bold min-w-[200px]">MISSION</th>
              <th className="py-3.5 px-4 font-bold min-w-[150px]">DEPLOYMENT ZONE</th>
              <th className="py-3.5 px-4 font-bold hidden sm:table-cell">TACTICAL INTEL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mission-border/30">
            {games.map((game, index) => {
              const occupied = game.isLive
              const priority = !occupied && isTopPriority(game, now)

              return (
                <motion.tr
                  key={game.id}
                  custom={index}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  onClick={() => onSelect(game)}
                  title="Click to view mission status, officer & tactical details"
                  className={`group cursor-pointer transition-all ${
                    occupied
                      ? 'hover:bg-orange-500/10'
                      : priority
                        ? 'bg-red-950/[0.12] hover:bg-red-950/[0.22] border-l-2 border-l-red-500'
                        : 'hover:bg-white/[0.04]'
                  }`}
                >
                  {/* # Index */}
                  <td className="py-4 px-4 text-center mono text-xs text-mission-muted font-bold" suppressHydrationWarning>
                    {priority ? (
                      <span className="text-red-400 font-black">
                        #{String(index + 1).padStart(2, '0')}
                      </span>
                    ) : (
                      String(index + 1).padStart(2, '0')
                    )}
                  </td>

                  {/* Mission Name & Details */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                          occupied
                            ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400 group-hover:bg-orange-500/20'
                            : priority
                              ? 'bg-red-500/15 border border-red-500/40 text-red-400 group-hover:bg-red-500/25 shadow-sm shadow-red-500/20'
                              : 'bg-mission-red/10 border border-mission-red/20 text-mission-red group-hover:bg-mission-red/20 group-hover:border-mission-red/50'
                        }`}
                      >
                        {occupied ? (
                          <Lock className="w-4 h-4" />
                        ) : priority ? (
                          <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                        ) : (
                          <Target className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`mono font-black text-sm sm:text-base tracking-wider truncate transition-colors ${
                            occupied
                              ? 'text-orange-100 group-hover:text-orange-300'
                              : priority
                                ? 'text-white group-hover:text-red-400'
                                : 'text-white group-hover:text-mission-red'
                          }`}
                        >
                          {game.name.toUpperCase()}
                        </div>
                        {priority && (
                          <div className="mono text-[10px] text-red-400 font-semibold tracking-wider">
                            ⚡ NEEDS TEAMS IMMEDIATELY
                          </div>
                        )}
                        {game.description && (
                          <p className="text-[11px] text-mission-muted truncate max-w-xs sm:hidden mt-0.5">
                            {game.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Deployment Zone */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-mission-amber flex-shrink-0" />
                      <span className="mono text-xs font-semibold text-gray-200">
                        {game.location || '— UNSET —'}
                      </span>
                    </div>
                  </td>

                  {/* Tactical Intel Preview */}
                  <td className="py-4 px-4 hidden sm:table-cell">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-mission-muted line-clamp-1 leading-relaxed">
                        {game.description || 'Standard tactical outbound parameters apply.'}
                      </p>
                      <span className="mono text-[10px] text-mission-red opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 font-bold hidden md:inline-flex items-center gap-1">
                        VIEW INTEL &rarr;
                      </span>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile tap helper */}
      <div className="sm:hidden px-4 py-2 bg-black/40 border-t border-mission-border/40 text-center">
        <span className="mono text-[10px] text-mission-muted">
          ← TAP ANY MISSION ROW TO VIEW FULL INTEL, STATUS &amp; OFFICERS →
        </span>
      </div>
    </div>
  )
}

// ─── Individual Game Card (Alternative Grid View) ───────────────────────────
function GameCard({
  game,
  index,
  now,
  onSelect,
}: {
  game: Game
  index: number
  now: number
  onSelect: (g: Game) => void
}) {
  const occupied = game.isLive
  const priority = !occupied && isTopPriority(game, now)
  const idleMins = getIdleMinutes(game, now)

  return (
    <motion.div
      key={game.id}
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      onClick={() => onSelect(game)}
      className={`rounded-xl p-6 corner-accent transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
        occupied
          ? 'bg-orange-950/20 border border-orange-500/40 hover:border-orange-400/60 hover:bg-orange-950/30'
          : priority
            ? 'bg-red-950/20 border border-red-500/50 hover:border-red-400 hover:bg-red-950/30 shadow-lg shadow-red-950/30'
            : 'mission-card hover:border-mission-red/50 hover:bg-black/40'
      }`}
    >
      {occupied && (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
      )}
      {priority && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
      )}

      <div>
        {/* Card header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
              occupied
                ? 'bg-orange-500/10 border border-orange-500/30 group-hover:bg-orange-500/20'
                : priority
                  ? 'bg-red-500/15 border border-red-500/40 text-red-400 group-hover:bg-red-500/25'
                  : 'bg-mission-red/10 border border-mission-red/20 group-hover:border-mission-red/50 group-hover:bg-mission-red/20'
            }`}
          >
            {occupied ? (
              <Lock className="w-5 h-5 text-orange-400" />
            ) : priority ? (
              <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            ) : (
              <Target className="w-5 h-5 text-mission-red" />
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            {occupied ? (
              <span className="flex items-center gap-1.5 text-[10px] mono font-bold tracking-widest px-2.5 py-1 rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-400">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                IN PROGRESS
              </span>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 text-[10px] mono font-bold tracking-widest px-2.5 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    AVAILABLE
                  </span>
                  {priority && (
                    <span className="flex items-center gap-1 text-[9px] mono font-black tracking-widest px-2 py-0.5 rounded-full border border-red-500/60 bg-red-500/25 text-red-300 shadow-sm animate-pulse" suppressHydrationWarning>
                      <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                      TOP PRIORITY
                    </span>
                  )}
                </div>
                <span className={`mono text-[10px] ${priority ? 'text-red-400 font-bold' : 'text-mission-muted'}`} suppressHydrationWarning>
                  {priority ? `⚡ Inactive ${idleMins}m` : formatIdleTime(idleMins)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Mission name */}
        <div className="section-label mb-1">
          {priority ? 'PRIORITY MISSION' : 'MISSION'}
        </div>
        <div
          className={`mono text-lg font-black tracking-wider mb-3 transition-colors ${
            occupied
              ? 'text-orange-100 group-hover:text-orange-300'
              : priority
                ? 'text-white group-hover:text-red-400'
                : 'text-white group-hover:text-mission-red'
          }`}
        >
          {game.name.toUpperCase()}
        </div>

        {/* Description */}
        {game.description && (
          <p className="text-mission-muted text-sm leading-relaxed mb-4 line-clamp-2">
            {game.description}
          </p>
        )}

        <div className="border-t border-mission-border pt-4 space-y-3">
          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-mission-amber flex-shrink-0" />
            <div>
              <div className="section-label text-[9px]">LOCATION</div>
              <div className="mono text-sm text-white font-semibold">
                {game.location || '— UNSET —'}
              </div>
            </div>
          </div>

          {/* Officers */}
          <div className="flex items-start gap-2">
            <UserCheck className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="section-label text-[9px]">MISSION OFFICER</div>
              {(() => {
                const facis = getGameFacilitators(game)
                return facis.length > 0 ? (
                  <div className="flex flex-col gap-1 mt-0.5">
                    {facis.map((f) => (
                      <span key={f.faciId} className="text-sm text-green-400 font-semibold truncate">
                        {f.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mono text-xs text-mission-muted">— UNASSIGNED —</div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className={`pt-4 mt-4 border-t border-mission-border/40 flex items-center justify-between text-xs mono transition-colors ${
          occupied
            ? 'text-orange-400/60 group-hover:text-orange-400'
            : priority
              ? 'text-red-400 group-hover:text-red-300'
              : 'text-mission-muted group-hover:text-mission-red'
        }`}
      >
        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider">
          <Eye className="w-3.5 h-3.5" /> VIEW INTEL
        </span>
        <span className="text-[10px] tracking-widest uppercase opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
          DETAILS &rarr;
        </span>
      </div>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MissionsSection({
  games: initialGames,
  initialNow,
}: {
  games: Game[]
  initialNow?: number
}) {
  const [mounted, setMounted] = useState(false)
  const [games, setGames] = useState<Game[]>(initialGames)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLiveSync, setIsLiveSync] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [now, setNow] = useState<number>(initialNow || 0)

  // Dynamic ticker to recalculate idle times every 15 seconds
  useEffect(() => {
    setMounted(true)
    setNow(Date.now())
    setLastUpdated(new Date())
    const timer = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setGames(initialGames)
  }, [initialGames])

  // Fetch games helper
  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/games', { cache: 'no-store' })
      if (!res.ok) return
      const rawData = await res.json()
      if (!Array.isArray(rawData)) return
      const active = rawData
        .filter((g: Game) => g.isActive !== false)
        .map((g: Game) => ({
          ...g,
          facilitators: getGameFacilitators(g),
        }))
      setGames(active)
      setLastUpdated(new Date())
      setSelectedGame((prev) =>
        prev ? active.find((g) => g.id === prev.id) ?? null : null
      )
    } catch {
      // silent — keep current data
    }
  }, [])

  useEffect(() => {
    // 1. Supabase Realtime WebSocket subscription
    const channel = supabase
      .channel('missions-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games' },
        () => {
          fetchGames()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'point_transactions' },
        () => {
          fetchGames()
        }
      )
      .on('broadcast', { event: 'game-status-changed' }, () => {
        fetchGames()
      })
      .subscribe((status) => {
        setIsLiveSync(status === 'SUBSCRIBED')
      })

    // 2. BroadcastChannel for instant local cross-tab sync
    let localBc: BroadcastChannel | null = null
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        localBc = new BroadcastChannel('game-updates')
        localBc.onmessage = () => {
          fetchGames()
        }
      } catch {}
    }

    // 3. Tab visibility & focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchGames()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleVisibility)

    // 4. Relaxed fallback polling (15s when tab is active)
    const pollId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchGames()
      }
    }, 15000)

    return () => {
      supabase.removeChannel(channel)
      localBc?.close()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleVisibility)
      clearInterval(pollId)
    }
  }, [fetchGames])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedGame(null)
    }
    if (selectedGame) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedGame])

  if (games.length === 0) return null

  // 1. Separate Available vs Ongoing
  const rawAvailable = games.filter((g) => !g.isLive)
  const occupiedGames = games.filter((g) => g.isLive)

  // 2. Sort Available Missions:
  //    Games inactive for >= 5 minutes are placed ON TOP (TOP PRIORITY)!
  //    Longest idle games appear first among top priorities.
  const sortedAvailable = [...rawAvailable].sort((a, b) => {
    const aPriority = isTopPriority(a, now)
    const bPriority = isTopPriority(b, now)

    // TOP PRIORITY games go on top!
    if (aPriority && !bPriority) return -1
    if (!aPriority && bPriority) return 1

    // Among top priority games, the ones idle longest go first
    if (aPriority && bPriority) {
      const aTime = getLastActiveTimestamp(a)
      const bTime = getLastActiveTimestamp(b)
      if (aTime !== bTime) return aTime - bTime
    }

    // Otherwise alphabetical
    return a.name.localeCompare(b.name)
  })

  // Search filtering
  const q = searchQuery.trim().toLowerCase()
  const filterFn = (g: Game) => {
    if (!q) return true
    const matchName = g.name.toLowerCase().includes(q)
    const matchLoc = g.location?.toLowerCase().includes(q)
    const matchDesc = g.description?.toLowerCase().includes(q)
    const matchFaci = getGameFacilitators(g).some(
      (f) => f.name.toLowerCase().includes(q) || f.faciId.toLowerCase().includes(q)
    )
    return matchName || matchLoc || matchDesc || matchFaci
  }

  const filteredAvailable = sortedAvailable.filter(filterFn)
  const filteredOccupied = occupiedGames.filter(filterFn)

  // Count top priority missions
  const topPriorityCount = rawAvailable.filter((g) => isTopPriority(g, now)).length

  return (
    <section id="missions" className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 space-y-14">

      {/* ── Main Section Header ──────────────────────────────────────── */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-mission-red/40 bg-mission-red/10 text-mission-red mono text-xs font-bold tracking-widest">
          <span className="w-2 h-2 rounded-full bg-mission-red animate-pulse" />
          FIELD OPERATIONS ROSTER
        </div>

        <h2 className="mono text-3xl sm:text-5xl font-black text-white tracking-wider">
          TODAY&apos;S MISSIONS
        </h2>

        <p className="text-mission-muted text-sm sm:text-base max-w-2xl mx-auto">
          Tactical mission overview for outbound training operations. Missions inactive for over 5 minutes are automatically highlighted on top with top priority.
        </p>

        {/* Live status indicators & stats */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/40 border border-mission-border text-xs mono">
            <span className={`w-2 h-2 rounded-full ${isLiveSync ? 'bg-green-400 animate-pulse' : 'bg-white/30'}`} />
            <span className="text-mission-muted" suppressHydrationWarning>
              {isLiveSync ? 'REALTIME SYNC' : 'LIVE'}
              {mounted && lastUpdated ? ` · LAST ${lastUpdated.toLocaleTimeString()}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-xs mono text-green-400 font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            {rawAvailable.length} AVAILABLE
          </div>

          {topPriorityCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/50 text-xs mono text-red-400 font-bold animate-pulse shadow-sm shadow-red-500/20" suppressHydrationWarning>
              <AlertTriangle className="w-3.5 h-3.5" />
              {topPriorityCount} TOP PRIORITY (&gt;5M IDLE)
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs mono text-orange-400 font-bold">
            <Lock className="w-3.5 h-3.5" />
            {occupiedGames.length} ONGOING
          </div>
        </div>

        {/* Search bar & View mode controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 max-w-4xl mx-auto">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-mission-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by mission, zone, officer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-mission-border rounded-xl pl-10 pr-9 py-2 text-xs mono text-white placeholder-mission-muted/70 focus:outline-none focus:border-mission-red/60 focus:ring-1 focus:ring-mission-red/50 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mission-muted hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-black/40 border border-mission-border rounded-xl p-1 self-stretch sm:self-auto justify-center">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs mono font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-mission-red text-white shadow-md shadow-red-950/40'
                  : 'text-mission-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              TABLE VIEW
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs mono font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-mission-red text-white shadow-md shadow-red-950/40'
                  : 'text-mission-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              CARD VIEW
            </button>
          </div>
        </div>
      </div>

      {/* ── 1. AVAILABLE MISSIONS SECTION (FIRST / ON TOP) ───────────── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-mission-border/60 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 mono text-xs font-bold tracking-widest">
                <CheckCircle className="w-3.5 h-3.5" />
                AVAILABLE NOW
              </div>
              {topPriorityCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/50 bg-red-500/20 text-red-400 mono text-xs font-black tracking-widest animate-pulse shadow-sm">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  {topPriorityCount} TOP PRIORITY ON TOP
                </div>
              )}
            </div>
            <h3 className="mono text-2xl sm:text-3xl font-black text-white tracking-wider">
              AVAILABLE MISSIONS
            </h3>
            <p className="text-mission-muted text-xs sm:text-sm mt-1">
              {topPriorityCount > 0
                ? `${topPriorityCount} mission${topPriorityCount !== 1 ? 's' : ''} inactive for over 5 minutes prioritized on top — click any mission row for intel`
                : `${rawAvailable.length} mission${rawAvailable.length !== 1 ? 's' : ''} ready for teams — click any mission row for intel`}
            </p>
          </div>

          <div className="mono text-xs text-mission-muted">
            SHOWING {filteredAvailable.length} OF {rawAvailable.length} AVAILABLE
          </div>
        </div>

        {filteredAvailable.length > 0 ? (
          viewMode === 'table' ? (
            <MissionsTable
              games={filteredAvailable}
              type="available"
              now={now}
              onSelect={setSelectedGame}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAvailable.map((game, i) => (
                <GameCard
                  key={game.id}
                  game={game}
                  index={i}
                  now={now}
                  onSelect={setSelectedGame}
                />
              ))}
            </div>
          )
        ) : (
          <div className="glass-card rounded-2xl p-10 border border-mission-border text-center">
            <Target className="w-10 h-10 text-mission-muted mx-auto mb-3" />
            <div className="mono text-sm font-bold text-white mb-1">
              {searchQuery
                ? 'NO AVAILABLE MISSIONS MATCH YOUR SEARCH'
                : 'NO MISSIONS CURRENTLY AVAILABLE'}
            </div>
            <p className="mono text-xs text-mission-muted">
              {searchQuery
                ? 'Try adjusting your search criteria or clear the query.'
                : 'All missions are currently occupied or awaiting clearance below.'}
            </p>
          </div>
        )}
      </div>

      {/* ── 2. ONGOING MISSIONS SECTION (BELOW AVAILABLE MISSIONS) ─────── */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-orange-500/30 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-400 mono text-xs font-bold tracking-widest mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              CURRENTLY OCCUPIED
            </div>
            <h3 className="mono text-2xl sm:text-3xl font-black text-white tracking-wider">
              ONGOING MISSIONS
            </h3>
            <p className="text-mission-muted text-xs sm:text-sm mt-1">
              {occupiedGames.length} mission{occupiedGames.length !== 1 ? 's' : ''} currently underway — teams are inside and zones are secured
            </p>
          </div>

          <div className="mono text-xs text-orange-400/80">
            SHOWING {filteredOccupied.length} OF {occupiedGames.length} IN PROGRESS
          </div>
        </div>

        {occupiedGames.length > 0 ? (
          filteredOccupied.length > 0 ? (
            viewMode === 'table' ? (
              <MissionsTable
                games={filteredOccupied}
                type="ongoing"
                now={now}
                onSelect={setSelectedGame}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOccupied.map((game, i) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    index={i}
                    now={now}
                    onSelect={setSelectedGame}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="bg-orange-950/20 rounded-2xl p-8 border border-orange-500/30 text-center">
              <div className="mono text-sm font-bold text-orange-300 mb-1">
                NO ONGOING MISSIONS MATCH YOUR SEARCH
              </div>
              <p className="mono text-xs text-mission-muted">
                Clear the search bar to inspect all ongoing operations.
              </p>
            </div>
          )
        ) : (
          /* Standby state when no missions are occupied */
          <div className="glass-card rounded-2xl p-8 border border-mission-border text-center">
            <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="mono text-sm font-bold text-white mb-1">
              NO MISSIONS CURRENTLY IN PROGRESS
            </div>
            <p className="mono text-xs text-mission-muted max-w-md mx-auto">
              All deployment zones are open and clear. Teams can freely select and engage any of the available missions above.
            </p>
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedGame && (() => {
          const isSelectedLive = selectedGame.isLive
          const isSelectedPriority = !isSelectedLive && isTopPriority(selectedGame, now)
          const selectedIdleMins = getIdleMinutes(selectedGame, now)

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setSelectedGame(null)}
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                className={`glass-card-bright rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 corner-accent relative z-10 border ${
                  isSelectedLive
                    ? 'border-orange-500/40'
                    : isSelectedPriority
                      ? 'border-red-500/50 shadow-red-950/40'
                      : 'border-mission-red/40'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Top Bar */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelectedLive
                          ? 'bg-orange-500/10 border border-orange-500/30'
                          : isSelectedPriority
                            ? 'bg-red-500/15 border border-red-500/40 text-red-400'
                            : 'bg-mission-red/10 border border-mission-red/30'
                      }`}
                    >
                      {isSelectedLive ? (
                        <Lock className="w-6 h-6 text-orange-400" />
                      ) : isSelectedPriority ? (
                        <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
                      ) : (
                        <Target className="w-6 h-6 text-mission-red" />
                      )}
                    </div>
                    <div>
                      <div className="classified-badge text-[10px] w-fit mb-1">
                        <span className="animate-blink">◉</span>
                        MISSION BRIEFING // RESTRICTED INTEL
                      </div>
                      <h2 className="mono text-2xl sm:text-3xl font-black text-white tracking-wider">
                        {selectedGame.name.toUpperCase()}
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedGame(null)}
                    className="p-2 rounded-lg text-mission-muted hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Top Priority Banner if applicable */}
                {isSelectedPriority && (
                  <div className="mb-6 flex items-start gap-3 bg-red-950/30 border border-red-500/50 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <div className="mono text-xs font-black text-red-400 tracking-wider">
                        TOP PRIORITY DEPLOYMENT ZONE
                      </div>
                      <p className="mono text-[11px] text-red-300/90 mt-0.5">
                        This mission has been idle for {selectedIdleMins} minutes (exceeds 5m threshold). Teams should report to this zone promptly!
                      </p>
                    </div>
                  </div>
                )}

                {/* Location & Status pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <div className="bg-black/40 rounded-xl p-4 border border-mission-border">
                    <div className="section-label text-[10px] mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-mission-amber" />
                      DEPLOYMENT ZONE
                    </div>
                    <div className="mono text-base font-bold text-white">
                      {selectedGame.location || '— UNSET —'}
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-xl p-4 border border-mission-border">
                    <div className="section-label text-[10px] mb-1 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-green-400" />
                      STATUS &amp; PRIORITY
                    </div>
                    {isSelectedLive ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                          <span className="mono text-base font-bold text-orange-400 tracking-wider">
                            IN PROGRESS
                          </span>
                        </div>
                        <span className="mono text-xs text-orange-400/80">
                          Zone currently engaged by a team
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="mono text-base font-bold text-green-400 tracking-wider">
                            AVAILABLE
                          </span>
                          {isSelectedPriority && (
                            <span className="inline-flex items-center gap-1 text-[9px] mono font-black tracking-widest px-2 py-0.5 rounded-full border border-red-500/60 bg-red-500/25 text-red-300 shadow-sm animate-pulse">
                              <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                              TOP PRIORITY
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs mono text-mission-muted">
                          <Clock className={`w-3.5 h-3.5 ${isSelectedPriority ? 'text-red-400' : 'text-mission-muted'}`} />
                          <span className={isSelectedPriority ? 'text-red-400 font-bold' : ''}>
                            {isSelectedPriority ? `Inactive for ${selectedIdleMins}m` : formatIdleTime(selectedIdleMins)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Occupied notice */}
                {isSelectedLive && (
                  <div className="mb-6 flex items-center gap-3 bg-orange-900/20 border border-orange-500/30 rounded-xl px-4 py-3">
                    <Lock className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <p className="mono text-xs text-orange-300">
                      A TEAM IS CURRENTLY INSIDE THIS MISSION. PLEASE WAIT FOR THEM TO COMPLETE BEFORE ENTERING.
                    </p>
                  </div>
                )}

                {/* Description */}
                <div className="mb-6">
                  <div className="section-label text-[10px] mb-2">MISSION INTEL &amp; OBJECTIVES</div>
                  <div className="bg-black/30 rounded-xl p-4 sm:p-5 border border-mission-border">
                    <p className="text-gray-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                      {selectedGame.description ||
                        'Standard tactical outbound mission parameters apply. Contact the assigned mission facilitator on-site for rules of engagement and score metrics.'}
                    </p>
                  </div>
                </div>

                {/* Mission Officers */}
                {(() => {
                  const selectedFacis = getGameFacilitators(selectedGame)
                  return (
                    <div className="mb-6">
                      <div className="section-label text-[10px] mb-2 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-green-400" />
                        ASSIGNED MISSION OFFICER{selectedFacis.length > 1 ? 'S' : ''} ({selectedFacis.length})
                      </div>
                      {selectedFacis.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedFacis.map((f) => (
                            <div
                              key={f.faciId}
                              className="flex items-center justify-between bg-black/40 border border-mission-border rounded-xl px-4 py-3"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-mission-amber/10 border border-mission-amber/30 flex items-center justify-center flex-shrink-0">
                                  <Terminal className="w-3.5 h-3.5 text-mission-amber" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-white">{f.name}</div>
                                  <div className="mono text-[10px] text-mission-amber font-semibold">{f.faciId}</div>
                                </div>
                              </div>
                              <span className="status-active text-[10px]">ON SITE</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-black/30 rounded-xl p-4 border border-mission-border text-center">
                          <div className="mono text-xs text-mission-muted">
                            NO MISSION OFFICER ASSIGNED YET — STANDBY MODE
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Close Button Footer */}
                <div className="flex justify-end pt-3 border-t border-mission-border/40">
                  <button
                    type="button"
                    onClick={() => setSelectedGame(null)}
                    className="btn-ghost px-5 py-2 text-xs mono tracking-wider"
                  >
                    CLOSE BRIEFING
                  </button>
                </div>
              </motion.div>
            </div>
          )
        })()}
      </AnimatePresence>
    </section>
  )
}
