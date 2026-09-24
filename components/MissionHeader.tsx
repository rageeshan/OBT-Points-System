'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Terminal, Trophy } from 'lucide-react'

interface MissionHeaderProps {
  title?: string
  subtitle?: string
  showNav?: boolean
}

export default function MissionHeader({
  title = 'NLDS-26 OBT MISSION CONTROL',
  subtitle = 'OUTBOUND TRAINING SESSION',
  showNav = true,
}: MissionHeaderProps) {
  const pathname = usePathname()

  const navLinks = [
    { href: '/leaderboard', label: 'Live Ranking', icon: <Trophy className="w-3 h-3" /> },
    { href: '/faci/login', label: 'Agent Login', icon: <Terminal className="w-3 h-3" /> },
  ]

  return (
    <header className="relative border-b border-mission-border backdrop-blur-sm bg-black/40 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-0">
        <div className="flex items-center h-16 gap-8">

          {/* Logo / Title */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-9 h-9 rounded-full border border-mission-red/40 flex items-center justify-center bg-black/40 overflow-hidden p-1 group-hover:border-mission-red/70 transition-colors flex-shrink-0"
            >
              <Image
                src="/icon.png"
                alt="OBT Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </motion.div>
            <div>
              <div className="mono text-xs font-bold tracking-widest text-mission-red leading-none">
                {title}
              </div>
              <div className="mono text-[9px] tracking-wider text-mission-muted leading-none mt-0.5">
                {subtitle}
              </div>
            </div>
          </Link>

          {/* Centered Nav */}
          {showNav && (
            <nav className="hidden sm:flex flex-1 items-center justify-center gap-10">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      flex items-center gap-2 mono text-xs font-bold tracking-widest uppercase
                      transition-all duration-200 pb-0.5
                      ${isActive
                        ? 'text-white border-b-2 border-mission-red'
                        : 'text-mission-muted hover:text-white border-b-2 border-transparent hover:border-mission-red/40'
                      }
                    `}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Right side — classification badge */}
          <div className="flex-shrink-0 ml-auto">
            <div className="classified-badge hidden sm:flex">
              <span className="animate-blink">◉</span>
              CLASSIFIED
            </div>
          </div>

        </div>
      </div>
    </header>
  )
}
