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
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/teams', label: 'Mission Units', icon: Users },
  { href: '/admin/facilitators', label: 'Mission Officers', icon: UserCheck },
  { href: '/admin/games', label: 'Missions', icon: Target },
  { href: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/admin/transactions', label: 'Points History', icon: Receipt },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-mission-border">
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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx('sidebar-link', { active })}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-mission-red" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-mission-border space-y-2">
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
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-mission-dark border-r border-mission-border flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-mission-dark border-b border-mission-border">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-mission-red" />
          <span className="mono text-sm font-bold text-mission-red">MISSION CONTROL</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-white/5"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/70 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-mission-dark border-r border-mission-border z-50"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
