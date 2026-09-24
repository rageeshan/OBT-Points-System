import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Shield, Trophy, Terminal, ChevronRight, Zap, Lock } from 'lucide-react'
import MissionHeader from '@/components/MissionHeader'
import MissionsSection from '@/components/MissionsSection'

async function getGames() {
  try {
    return await prisma.game.findMany({
      where: { isActive: true },
      include: {
        facilitators: {
          where: { isActive: true },
          select: { faciId: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    })
  } catch {
    return []
  }
}

export default async function HomePage() {
  const games = await getGames()

  return (
    <div className="mission-bg min-h-screen">
      <MissionHeader />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-36 text-center">
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



          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/leaderboard" className="btn-mission text-sm sm:text-base py-3 px-8 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              VIEW LIVE RANKING
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Active Missions Grid */}
        <MissionsSection games={games} />

        {/* Mission Control link */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
          <div className="flex justify-center">
            <Link href="/admin/login" className="btn-ghost py-2.5 px-6 text-xs flex items-center gap-2">
              <Shield className="w-3 h-3" />
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
