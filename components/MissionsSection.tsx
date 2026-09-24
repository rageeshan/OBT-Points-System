'use client'

import { motion } from 'framer-motion'
import { MapPin, UserCheck, Target } from 'lucide-react'

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
  if (games.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
      {/* Section header */}
      <div className="text-center mb-10">
        <div className="classified-badge mx-auto w-fit mb-4">ACTIVE OPERATIONS</div>
        <h2 className="mono text-3xl sm:text-4xl font-black text-white tracking-wider">
          TODAY&apos;S MISSIONS
        </h2>
        <p className="text-mission-muted text-sm mt-2">
          {games.length} active mission{games.length !== 1 ? 's' : ''} — officers on standby
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
            className="mission-card rounded-xl p-6 corner-accent hover:border-mission-red/30 transition-colors"
          >
            {/* Mission header */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-mission-red/10 border border-mission-red/20 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-mission-red" />
              </div>
              <span className="status-active text-xs">ACTIVE</span>
            </div>

            {/* Mission name */}
            <div className="section-label mb-1">MISSION</div>
            <div className="mono text-lg font-black text-white tracking-wider mb-3">
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
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {game.facilitators.map((f) => (
                        <span
                          key={f.faciId}
                          className="mono text-xs text-green-400 border border-green-900/40 bg-green-900/10 px-2 py-0.5 rounded"
                          title={f.name}
                        >
                          {f.faciId}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="mono text-xs text-mission-muted">— UNASSIGNED —</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
