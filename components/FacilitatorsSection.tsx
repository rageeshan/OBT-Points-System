'use client'

import { motion } from 'framer-motion'
import { MapPin, Target, Terminal } from 'lucide-react'

export interface PublicFacilitator {
  id: string
  faciId: string
  name: string
  isActive: boolean
  game?: {
    id: string
    name: string
    location?: string | null
  } | null
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
}

export default function FacilitatorsSection({
  facilitators,
}: {
  facilitators: PublicFacilitator[]
}) {
  if (facilitators.length === 0) return null

  return (
    <section id="facilitators" className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
      {/* Section header */}
      <div className="text-center mb-10">
        <div className="classified-badge mx-auto w-fit mb-4">
          <span className="animate-blink">◉</span>
          DEPLOYED PERSONNEL
        </div>
        <h2 className="mono text-3xl sm:text-4xl font-black text-white tracking-wider">
          MISSION OFFICERS &amp; FACILITATORS
        </h2>
        <p className="text-mission-muted text-sm mt-2 max-w-xl mx-auto">
          {facilitators.length} active facilitator{facilitators.length !== 1 ? 's' : ''} authorized for field operations and credit disbursements
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {facilitators.map((faci, i) => (
          <motion.div
            key={faci.id}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mission-card rounded-xl p-6 corner-accent hover:border-mission-amber/40 transition-all group"
          >
            {/* Header row: Agent ID & Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-mission-amber/10 border border-mission-amber/30 flex items-center justify-center flex-shrink-0 group-hover:border-mission-amber/60 transition-colors">
                  <Terminal className="w-4 h-4 text-mission-amber" />
                </div>
                <div>
                  <div className="mono text-xs font-black text-mission-amber tracking-widest">
                    {faci.faciId}
                  </div>
                  <div className="mono text-[9px] text-mission-muted tracking-wider">
                    OFFICER ID
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-black/40 border border-green-500/30 rounded-full px-2.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="mono text-[10px] font-bold text-green-400 tracking-wider">
                  {faci.isActive ? 'ACTIVE' : 'STANDBY'}
                </span>
              </div>
            </div>

            {/* Name */}
            <div className="mb-4">
              <div className="section-label text-[9px] mb-1">FACILITATOR NAME</div>
              <div className="mono text-lg font-bold text-white tracking-wide truncate">
                {faci.name}
              </div>
            </div>

            {/* Assigned Mission details */}
            <div className="bg-black/30 rounded-lg p-3 border border-mission-border/60 space-y-2">
              <div className="flex items-start gap-2">
                <Target className="w-3.5 h-3.5 text-mission-red flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="section-label text-[9px]">ASSIGNED MISSION</div>
                  <div className="mono text-xs font-bold text-white truncate">
                    {faci.game ? faci.game.name.toUpperCase() : '— STANDBY / UNASSIGNED —'}
                  </div>
                </div>
              </div>

              {faci.game?.location && (
                <div className="flex items-center gap-2 pt-1 border-t border-mission-border/40">
                  <MapPin className="w-3 h-3 text-mission-amber flex-shrink-0" />
                  <span className="mono text-[11px] text-mission-muted truncate">
                    {faci.game.location}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
