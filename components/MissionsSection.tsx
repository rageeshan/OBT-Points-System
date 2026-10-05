'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, UserCheck, Target, X, Shield, Terminal, Eye, Lock, CheckCircle, RefreshCw, Radio } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface Facilitator {
  faciId: string
  name: string
}

interface Game {
  id: string
  name: string
  description?: string | null
  location?: string | null
  isLive?: boolean
  isActive?: boolean
  facilitators: Facilitator[]
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
}

// ─── Individual Game Card ────────────────────────────────────────────────────
function GameCard({
  game,
  index,
  onSelect,
}: {
  game: Game
  index: number
  onSelect: (g: Game) => void
}) {
  const occupied = game.isLive

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
          : 'mission-card hover:border-mission-red/50 hover:bg-black/40'
      }`}
    >
      {/* Subtle glow for occupied */}
      {occupied && (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
      )}

      <div>
        {/* Card header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
              occupied
                ? 'bg-orange-500/10 border border-orange-500/30 group-hover:bg-orange-500/20'
                : 'bg-mission-red/10 border border-mission-red/20 group-hover:border-mission-red/50 group-hover:bg-mission-red/20'
            }`}
          >
            {occupied ? (
              <Lock className="w-5 h-5 text-orange-400" />
            ) : (
              <Target className="w-5 h-5 text-mission-red" />
            )}
          </div>

          {occupied ? (
            <span className="flex items-center gap-1.5 text-[10px] mono font-bold tracking-widest px-2.5 py-1 rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-400">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              OCCUPIED
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] mono font-bold tracking-widest px-2.5 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400">
              <CheckCircle className="w-3 h-3" />
              AVAILABLE
            </span>
          )}
        </div>

        {/* Mission name */}
        <div className="section-label mb-1">MISSION</div>
        <div
          className={`mono text-lg font-black tracking-wider mb-3 transition-colors ${
            occupied
              ? 'text-orange-100 group-hover:text-orange-300'
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
              {game.facilitators.length > 0 ? (
                <div className="flex flex-col gap-1 mt-0.5">
                  {game.facilitators.map((f) => (
                    <span key={f.faciId} className="text-sm text-green-400 font-semibold truncate">
                      {f.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mono text-xs text-mission-muted">— UNASSIGNED —</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className={`pt-4 mt-4 border-t border-mission-border/40 flex items-center justify-between text-xs mono transition-colors ${
          occupied
            ? 'text-orange-400/60 group-hover:text-orange-400'
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
export default function MissionsSection({ games: initialGames }: { games: Game[] }) {
  const [games, setGames] = useState<Game[]>(initialGames)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isLiveSync, setIsLiveSync] = useState(false)

  // Fetch games helper
  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/games', { cache: 'no-store' })
      if (!res.ok) return
      const data: Game[] = await res.json()
      // only show active games, sorted live-first then alphabetically
      const active = data
        .filter((g) => g.isActive !== false)
        .sort((a, b) => {
          if (a.isLive && !b.isLive) return -1
          if (!a.isLive && b.isLive) return 1
          return a.name.localeCompare(b.name)
        })
      setGames(active)
      setLastUpdated(new Date())
      // keep selectedGame in sync
      setSelectedGame((prev) =>
        prev ? active.find((g) => g.id === prev.id) ?? null : null
      )
    } catch {
      // silent — keep showing current data
    }
  }, [])

  useEffect(() => {
    // 1. Supabase Realtime WebSocket subscription (handles hundreds of users with 0 server query stress)
    const channel = supabase
      .channel('missions-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games' },
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

    // 3. Tab visibility & focus: immediately sync when user unlocks device or focuses tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchGames()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleVisibility)

    // 4. Relaxed fallback polling (every 15s, ONLY when tab is active/visible)
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

  const occupiedGames = games.filter((g) => g.isLive)
  const availableGames = games.filter((g) => !g.isLive)

  return (
    <section id="missions" className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 space-y-16">

      {/* ── OCCUPIED SECTION ─────────────────────────────────────────── */}
      {occupiedGames.length > 0 && (
        <div>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-400 mono text-xs font-bold tracking-widest mb-4">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              CURRENTLY OCCUPIED
            </div>
            <h2 className="mono text-3xl sm:text-4xl font-black text-white tracking-wider">
              IN PROGRESS
            </h2>
            <p className="text-mission-muted text-sm mt-2">
              {occupiedGames.length} mission{occupiedGames.length !== 1 ? 's' : ''} currently underway — teams are inside
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-mission-muted">
              <span className={`w-2 h-2 rounded-full ${isLiveSync ? 'bg-orange-400 animate-pulse' : 'bg-white/30'}`} />
              <span className="mono text-[10px]">
                {isLiveSync ? 'REALTIME SYNC' : 'LIVE'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {occupiedGames.map((game, i) => (
              <GameCard key={game.id} game={game} index={i} onSelect={setSelectedGame} />
            ))}
          </div>
        </div>
      )}

      {/* ── AVAILABLE SECTION ────────────────────────────────────────── */}
      {availableGames.length > 0 && (
        <div>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 mono text-xs font-bold tracking-widest mb-4">
              <CheckCircle className="w-3 h-3" />
              AVAILABLE NOW
            </div>
            <h2 className="mono text-3xl sm:text-4xl font-black text-white tracking-wider">
              {occupiedGames.length > 0 ? 'OTHER MISSIONS' : "TODAY'S MISSIONS"}
            </h2>
            <p className="text-mission-muted text-sm mt-2">
              {availableGames.length} mission{availableGames.length !== 1 ? 's' : ''} ready — click any mission to inspect full briefing
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-mission-muted">
              <span className={`w-2 h-2 rounded-full ${isLiveSync ? 'bg-green-400 animate-pulse' : 'bg-white/30'}`} />
              <span className="mono text-[10px]">
                {isLiveSync ? 'REALTIME SYNC' : 'LIVE'} · LAST {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableGames.map((game, i) => (
              <GameCard key={game.id} game={game} index={i} onSelect={setSelectedGame} />
            ))}
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedGame && (
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
                selectedGame.isLive ? 'border-orange-500/40' : 'border-mission-red/40'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      selectedGame.isLive
                        ? 'bg-orange-500/10 border border-orange-500/30'
                        : 'bg-mission-red/10 border border-mission-red/30'
                    }`}
                  >
                    {selectedGame.isLive ? (
                      <Lock className="w-6 h-6 text-orange-400" />
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
                  onClick={() => setSelectedGame(null)}
                  className="p-2 rounded-lg text-mission-muted hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

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
                    MISSION STATUS
                  </div>
                  {selectedGame.isLive ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                      <span className="mono text-base font-bold text-orange-400 tracking-wider">
                        OCCUPIED
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="mono text-base font-bold text-green-400 tracking-wider">
                        AVAILABLE
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Occupied notice */}
              {selectedGame.isLive && (
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

              {/* Officers */}
              <div className="mb-8">
                <div className="section-label text-[10px] mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-green-400" />
                  ASSIGNED OFFICERS &amp; FACILITATORS ({selectedGame.facilitators.length})
                </div>
                {selectedGame.facilitators.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedGame.facilitators.map((f) => (
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
                      NO OFFICER ASSIGNED YET — STANDBY MODE
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
