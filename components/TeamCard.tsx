'use client'

import { motion } from 'framer-motion'
import { Users, Star } from 'lucide-react'

interface TeamCardProps {
  name: string
  leaderName: string
  members?: string[]
  currentPoints: number
  rank?: number
  showMembers?: boolean
  className?: string
}

const rankColors = {
  1: 'rank-gold',
  2: 'rank-silver',
  3: 'rank-bronze',
}

export default function TeamCard({
  name,
  leaderName,
  members = [],
  currentPoints,
  rank,
  showMembers = true,
  className = '',
}: TeamCardProps) {
  const rankClass = rank && rank <= 3 ? rankColors[rank as 1 | 2 | 3] : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`mission-card rounded-lg p-5 corner-accent ${rankClass} ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="section-label">MISSION UNIT</div>
          <h3 className="mono text-lg font-bold text-white tracking-wider">
            {name.toUpperCase()}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          {rank && (
            <div className={`mono text-2xl font-black ${rank <= 3 ? `rank-${rank}` : 'text-mission-muted'}`}>
              #{rank.toString().padStart(2, '0')}
            </div>
          )}
          <div className="classified-badge">ACTIVE</div>
        </div>
      </div>

      {/* Commander */}
      <div className="mb-3">
        <div className="section-label">MISSION COMMANDER</div>
        <div className="flex items-center gap-2">
          <Star className="w-3 h-3 text-mission-amber" />
          <span className="text-white font-semibold">{leaderName}</span>
        </div>
      </div>

      {/* Operatives */}
      {showMembers && members.length > 0 && (
        <div className="mb-4">
          <div className="section-label">OPERATIVES</div>
          <div className="space-y-1">
            {members.map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-mission-muted">
                <Users className="w-3 h-3" />
                <span>{m}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points */}
      <div className="border-t border-mission-border pt-3">
        <div className="section-label">MISSION CREDITS</div>
        <div className={`mono text-3xl font-black ${rank === 1 ? 'text-mission-amber' : 'text-white'}`}>
          {currentPoints.toLocaleString()}
        </div>
      </div>
    </motion.div>
  )
}
