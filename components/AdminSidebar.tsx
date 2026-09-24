'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Target,
  Trophy,
  Receipt,
  LogOut,
  Shield,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/teams', label: 'Units', icon: Users },
  { href: '/admin/facilitators', label: 'Officers', icon: UserCheck },
  { href: '/admin/games', label: 'Missions', icon: Target },
  { href: '/admin/leaderboard', label: 'Ranking', icon: Trophy },
  { href: '/admin/transactions', label: 'History', icon: Receipt },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────── */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-mission-dark border-r border-mission-border flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="flex-shrink-0 p-6 border-b border-mission-border">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-9 h-9 rounded-full border border-mission-red/40 flex items-center justify-center bg-mission-red/10"
            >
              <Shield className="w-4 h-4 text-mission-red" />
            </motion.div>
            <div>
              <div className="mono text-xs font-black tracking-widest text-mission-red">MISSION</div>
              <div className="mono text-xs font-black tracking-widest text-mission-red">CONTROL</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="classified-badge w-fit">OMEGA CLEARANCE</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
          {navItems.map((item) => {
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx('sidebar-link', { active })}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3 text-mission-red" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer — always visible */}
        <div className="flex-shrink-0 p-4 border-t border-mission-border space-y-2">
          <div className="mission-card rounded-lg p-3">
            <div className="section-label">LOGGED IN AS</div>
            <div className="mono text-sm font-bold text-white">SUPER ADMIN</div>
            <div className="mono text-xs text-mission-muted">SECURITY LEVEL: OMEGA</div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-mission-red hover:bg-red-900/20"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR ──────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-mission-dark border-b border-mission-border">
        <Link href="/admin" className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-mission-red" />
          <span className="mono text-sm font-black tracking-widest text-mission-red">MISSION CONTROL</span>
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-lg hover:bg-white/5 text-white"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── MOBILE DRAWER ───────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/70 z-50"
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer panel */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed right-0 top-0 bottom-0 w-72 bg-mission-dark border-l border-mission-border z-50 flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-mission-border">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-mission-red" />
                  <span className="mono text-sm font-black tracking-widest text-mission-red">MISSION CONTROL</span>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-mission-muted hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer nav */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
                {navItems.map((item) => {
                  const active = isActive(item)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={clsx('sidebar-link text-base py-3', { active })}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight className="w-4 h-4 text-mission-red" />}
                    </Link>
                  )
                })}
              </nav>

              {/* Drawer footer */}
              <div className="flex-shrink-0 p-4 border-t border-mission-border space-y-2">
                <div className="mission-card rounded-lg p-3">
                  <div className="section-label">LOGGED IN AS</div>
                  <div className="mono text-sm font-bold text-white">SUPER ADMIN</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="sidebar-link w-full text-mission-red hover:bg-red-900/20 py-3"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-base">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
