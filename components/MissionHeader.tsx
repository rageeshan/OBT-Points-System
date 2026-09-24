'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Shield, Terminal } from 'lucide-react'

interface MissionHeaderProps {
  title?: string
  subtitle?: string
  showNav?: boolean
}

export default function MissionHeader({
  title = 'MISSION CONTROL',
  subtitle = 'OUTBOUND TRAINING 2026',
  showNav = true,
}: MissionHeaderProps) {
  return (
    <header className="relative border-b border-mission-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo / Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 rounded-full border border-mission-red/40 flex items-center justify-center bg-mission-red/10"
            >
              <Shield className="w-4 h-4 text-mission-red" />
            </motion.div>
            <div>
              <div className="mono text-xs font-bold tracking-widest text-mission-red">
                {title}
              </div>
              <div className="mono text-[10px] tracking-wider text-mission-muted">
                {subtitle}
              </div>
            </div>
          </Link>

          {/* Security Badge */}
          <div className="flex items-center gap-3">
            <div className="classified-badge">
              <span className="animate-blink">◉</span>
              CLASSIFIED
            </div>
            {showNav && (
              <nav className="hidden sm:flex items-center gap-1">
                <Link
                  href="/leaderboard"
                  className="btn-ghost py-2 px-3 text-xs"
                >
                  Live Ranking
                </Link>
                <Link
                  href="/faci/login"
                  className="btn-ghost py-2 px-3 text-xs"
                >
                  <Terminal className="w-3 h-3" />
                  Agent Login
                </Link>
                <Link
                  href="/admin/login"
                  className="btn-mission py-2 px-3 text-xs"
                >
                  Mission Control
                </Link>
              </nav>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
