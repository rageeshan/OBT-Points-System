'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, UserCheck, Target, X, Shield, Terminal, Eye, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Facilitator {
  faciId: string
  name: string
}



interface Game {
  id: string
  name: string
  description?: string | null
  location?: string | null
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

export default function MissionsSection({ games }: { games: Game[] }) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  // Close modal on Escape key and manage body overflow
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

  return (
    <section id="missions" className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
      {/* Section header */}
      <div className="text-center mb-10">
        <div className="classified-badge mx-auto w-fit mb-4">ACTIVE OPERATIONS</div>
        <h2 className="mono text-3xl sm:text-4xl font-black text-white tracking-wider">
          TODAY&apos;S MISSIONS
        </h2>
        <p className="text-mission-muted text-sm mt-2">
          {games.length} active mission{games.length !== 1 ? 's' : ''} — click any mission to inspect full briefing
        </p>
      </div>

      {/* Mission cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game, i) => (
          <motion.div
            key={game.id}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            onClick={() => setSelectedGame(game)}
            className="mission-card rounded-xl p-6 corner-accent hover:border-mission-red/50 hover:bg-black/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              {/* Mission header */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-mission-red/10 border border-mission-red/20 flex items-center justify-center flex-shrink-0 group-hover:border-mission-red/50 group-hover:bg-mission-red/20 transition-all">
                  <Target className="w-5 h-5 text-mission-red" />
                </div>
                <span className="status-active text-xs">ACTIVE</span>
              </div>

              {/* Mission name */}
              <div className="section-label mb-1">MISSION</div>
              <div className="mono text-lg font-black text-white tracking-wider mb-3 group-hover:text-mission-red transition-colors">
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

                {/* Assigned officers */}
                <div className="flex items-start gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="section-label text-[9px]">MISSION OFFICER</div>
                    {game.facilitators.length > 0 ? (
                      <div className="flex flex-col gap-1 mt-0.5">
                        {game.facilitators.map((f) => (
                          <span
                            key={f.faciId}
                            className="text-sm text-green-400 font-semibold truncate"
                          >
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

            {/* Click indicator footer */}
            <div className="pt-4 mt-4 border-t border-mission-border/40 flex items-center justify-between text-xs mono text-mission-muted group-hover:text-mission-red transition-colors">
              <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider">
                <Eye className="w-3.5 h-3.5" /> VIEW INTEL
              </span>
              <span className="text-[10px] tracking-widest uppercase opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                DETAILS &rarr;
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal for Mission Details */}
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
              className="glass-card-bright rounded-2xl border border-mission-red/40 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 corner-accent relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-mission-red/10 border border-mission-red/30 flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-mission-red" />
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

              {/* Details Pills: Location & Status */}
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
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="mono text-base font-bold text-green-400 tracking-wider">
                      ACTIVE OPERATION
                    </span>
                  </div>
                </div>
              </div>

              {/* Description / Briefing */}
              <div className="mb-6">
                <div className="section-label text-[10px] mb-2">MISSION INTEL &amp; OBJECTIVES</div>
                <div className="bg-black/30 rounded-xl p-4 sm:p-5 border border-mission-border">
                  <p className="text-gray-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {selectedGame.description || 'Standard tactical outbound mission parameters apply. Contact the assigned mission facilitator on-site for rules of engagement and score metrics.'}
                  </p>
                </div>
              </div>

              {/* Assigned Officers / Facilitators */}
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
                            <div className="text-sm font-bold text-white">
                              {f.name}
                            </div>
                            <div className="mono text-[10px] text-mission-amber font-semibold">
                              {f.faciId}
                            </div>
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

              {/* Modal Footer Actions */}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
