import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Shield, Trophy, Terminal, ChevronRight, Zap, Lock, UserCheck, Coins } from 'lucide-react'
import MissionHeader from '@/components/MissionHeader'
import MissionsSection from '@/components/MissionsSection'
import FacilitatorsSection from '@/components/FacilitatorsSection'

// Always fetch fresh data — disables Vercel's static page cache
export const dynamic = 'force-dynamic'

async function getGames() {
  try {
    const rawGames = await prisma.game.findMany({
      where: { isActive: true },
      include: {
        facilitator: {
          select: { faciId: true, name: true, isActive: true },
        },
        transactions: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [
        { isLive: 'asc' }, // available games first
        { name: 'asc' },
      ],
    })

    return rawGames.map((g) => ({
      ...g,
      facilitators: g.facilitator && g.facilitator.isActive
        ? [{ faciId: g.facilitator.faciId, name: g.facilitator.name }]
        : [],
    }))
  } catch {
    return []
  }
}

async function getFacilitators() {
  try {
    return await prisma.facilitator.findMany({
      where: { isActive: true },
      include: {
        games: {
          where: { isActive: true },
          select: { id: true, name: true, location: true },
        },
      },
      orderBy: { faciId: 'asc' },
    })
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [games, facilitators] = await Promise.all([
    getGames(),
    getFacilitators(),
  ])

  const initialNow = Date.now()

  return (
    <div className="mission-bg min-h-screen">
      <MissionHeader />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="classified-badge text-sm px-4 py-1.5">
              <span className="animate-blink">◉</span>
              SECURITY LEVEL: OMEGA
            </div>
          </div>

          <h1
            className="mono text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-6 animate-glitch"
          >
            <span className="text-white">NLDS</span>
            <span
              className="text-mission-red"
              style={{ textShadow: '0 0 40px rgba(220,38,38,0.5)' }}
            >&apos;26</span>
          </h1>

          <div className="mb-4">
            <div className="mono text-lg sm:text-2xl font-bold tracking-[0.3em] text-mission-amber mb-2">
              OUTBOUND TRAINING SESSION 2026
            </div>
            <div className="w-32 h-px bg-mission-red/40 mx-auto" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/leaderboard" className="btn-mission text-sm sm:text-base py-3 px-8 flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4" />
              VIEW LIVE RANKING
              <ChevronRight className="w-4 h-4" />
            </Link>
            <a href="#missions" className="btn-ghost text-sm sm:text-base py-3 px-8 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-mission-red" />
              MISSIONS ({games.length})
            </a>
            <a href="#facilitators" className="btn-ghost text-sm sm:text-base py-3 px-8 flex items-center justify-center gap-2">
              <Terminal className="w-4 h-4 text-mission-amber" />
              MISSION OFFICERS ({facilitators.length})
            </a>
          </div>
        </section>

        {/* Active Missions Grid — FIRST */}
        <MissionsSection games={games} initialNow={initialNow} />

        {/* Facilitators List — SECOND */}
        <FacilitatorsSection facilitators={facilitators} />

        {/* Portals Access Links */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/faci/login" className="btn-ghost py-2.5 px-5 text-xs flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-green-400" />
              OFFICER PORTAL
            </Link>
            <Link href="/trade/login" className="btn-ghost py-2.5 px-5 text-xs flex items-center gap-2 border-yellow-500/30 text-yellow-400 hover:border-yellow-500/60">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              TRADE DESK
            </Link>
            <Link href="/admin/login" className="btn-ghost py-2.5 px-5 text-xs flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-mission-red" />
              MISSION CONTROL ACCESS
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-mission-border py-6 text-center">
        <div className="mono text-xs text-mission-muted tracking-wider">
          MISSION CONTROL © OBT 2026 — CLASSIFIED SYSTEM — UNAUTHORIZED ACCESS PROHIBITED
        </div>
      </footer>
    </div>
  )
}
