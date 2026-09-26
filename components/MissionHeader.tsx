'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Terminal, Trophy, Menu, X, House } from 'lucide-react'

interface MissionHeaderProps {
  title?: string
  subtitle?: string
  showNav?: boolean
  /** Extra right-side element (e.g. LIVE badge on leaderboard page) */
  rightSlot?: React.ReactNode
}

export default function MissionHeader({
  title = 'NLDS-26 OBT MISSION CONTROL',
  subtitle = 'OUTBOUND TRAINING SESSION',
  showNav = true,
  rightSlot,
}: MissionHeaderProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { href: '/', label: 'Home', icon: <House className="w-3 h-3" /> },
    { href: '/leaderboard', label: 'Live Ranking', icon: <Trophy className="w-3 h-3" /> },
    { href: '/faci/login', label: 'Faci Login', icon: <Terminal className="w-3 h-3" /> },
  ]

  return (
    <header className="relative border-b border-mission-border backdrop-blur-sm bg-black/40 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-0">
        <div className="flex items-center h-16 gap-8">

          {/* Logo / Title */}
          <Link
            href="/"
            className="flex items-center gap-3 group min-w-0 shrink"
            onClick={() => setMenuOpen(false)}
          >
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
            <div className="min-w-0 flex-1">
              <div className="mono text-xs font-bold tracking-widest text-mission-red leading-none truncate max-w-[160px] sm:max-w-none">
                {title}
              </div>
              <div className="mono text-[9px] tracking-wider text-mission-muted leading-none mt-0.5 truncate max-w-[160px] sm:max-w-none">
                {subtitle}
              </div>
            </div>
          </Link>

          {/* Desktop Centered Nav */}
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

          {/* Right side */}
          <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
            {/* Custom right slot (e.g. LIVE indicator) */}
            {rightSlot && <div>{rightSlot}</div>}

            {/* Classification badge — desktop only */}
            {!rightSlot && (
              <div className="classified-badge hidden sm:flex">
                <span className="animate-blink">◉</span>
                CLASSIFIED
              </div>
            )}

            {/* Hamburger — mobile only */}
            {showNav && (
              <button
                id="mobile-menu-toggle"
                className="sm:hidden flex items-center justify-center w-9 h-9 rounded border border-mission-border text-mission-muted hover:text-white hover:border-mission-red/40 transition-all duration-200"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle navigation menu"
              >
                {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && showNav && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="sm:hidden overflow-hidden border-t border-mission-border bg-black/60 backdrop-blur-md"
          >
            <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`
                      flex items-center gap-3 mono text-xs font-bold tracking-widest uppercase
                      px-4 py-3 rounded transition-all duration-200
                      ${isActive
                        ? 'bg-mission-red/15 text-white border-l-2 border-mission-red'
                        : 'text-mission-muted hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                      }
                    `}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
