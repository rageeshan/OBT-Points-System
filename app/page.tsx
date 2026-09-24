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

          <h1 className="mono text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight leading-none mb-2 animate-glitch">
            MISSION
          </h1>
          <h1
            className="mono text-5xl sm:text-7xl lg:text-8xl font-black text-mission-red tracking-tight leading-none mb-6"
            style={{ textShadow: '0 0 40px rgba(220,38,38,0.5)' }}
          >
            IMPOSSIBLE
          </h1>

          <div className="mb-4">
            <div className="mono text-lg sm:text-2xl font-bold tracking-[0.3em] text-mission-amber mb-2">
              OUTBOUND TRAINING 2026
            </div>
            <div className="w-32 h-px bg-mission-red/40 mx-auto" />
          </div>

          <p className="text-mission-muted text-base sm:text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Your team has been selected.
            Complete the missions. Earn the credits.{' '}
            <span className="text-white font-semibold">Climb the ranking.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/leaderboard" className="btn-mission text-sm sm:text-base py-3 px-8 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              VIEW LIVE RANKING
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/faci/login" className="btn-ghost text-sm sm:text-base py-3 px-8 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              MISSION OFFICER LOGIN
            </Link>
          </div>
        </section>

        {/* Active Missions Grid */}
        <MissionsSection games={games} />

        {/* Mission Classification */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
          <div className="glass-card rounded-2xl p-8 sm:p-12 text-center border border-mission-red/10">
            <div className="mono text-xs tracking-[0.4em] text-mission-muted mb-6">
              ██ CLASSIFIED TRANSMISSION ██
            </div>
            <div className="mono text-xl sm:text-3xl font-bold text-white mb-4">
              &ldquo;This message will self-destruct in 5 seconds.
              Your mission, should you choose to accept it...&rdquo;
            </div>
            <div className="w-24 h-px bg-mission-red/40 mx-auto my-6" />
            <div className="mono text-sm text-mission-muted tracking-wider">
              GOOD LUCK, AGENT. THE FATE OF THE RANKING IS IN YOUR HANDS.
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/admin/login" className="btn-ghost py-2.5 px-6 text-xs flex items-center gap-2">
                <Shield className="w-3 h-3" />
                MISSION CONTROL ACCESS
              </Link>
              <span className="text-mission-muted text-xs flex items-center justify-center mono">
                ALL PERSONNEL DETAILS ARE CLASSIFIED
              </span>
            </div>
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
