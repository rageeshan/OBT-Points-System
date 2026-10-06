'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Terminal, MapPin, Zap, LogOut, CheckCircle, Users, Target, Clock, Trophy, AlertTriangle, Radio,
  ChevronDown, Search, Check, X, Lock
} from 'lucide-react'
import toast from 'react-hot-toast'
import PointsModal from '@/components/PointsModal'
import { supabase } from '@/lib/supabase/client'

interface Team {
  id: string
  name: string
  currentPoints: number
}

interface FaciInfo {
  faciId: string
  name: string
  game: {
    id: string
    name: string
    location?: string
    maxPoints?: number | null
    isLive?: boolean
  } | null
}

interface AttendedTeam {
  teamId: string
  teamName: string
  leaderName: string
  totalPoints: number
  pointsFromThisGame: number
  scoredAt: string
}

export default function FaciDashboardPage() {
  const router = useRouter()
  const [faciInfo, setFaciInfo] = useState<FaciInfo | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [attendedTeams, setAttendedTeams] = useState<AttendedTeam[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [teamSearch, setTeamSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [customPoints, setCustomPoints] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [pendingPoints, setPendingPoints] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState<{ teamName: string; points: number } | null>(null)
  const [goingLive, setGoingLive] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [faciRes, teamsRes, attendedRes] = await Promise.all([
        fetch('/api/faci/me'),
        fetch('/api/teams'),
        fetch('/api/faci/attended'),
      ])
      if (faciRes.status === 401) {
        router.push('/faci/login')
        return
      }
      if (faciRes.ok) setFaciInfo(await faciRes.json())
      if (teamsRes.ok) setTeams(await teamsRes.json())
      if (attendedRes.ok) setAttendedTeams(await attendedRes.json())
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const maxPoints = faciInfo?.game?.maxPoints ?? null
  const scoreValue = maxPoints ?? 100
  const isLive = faciInfo?.game?.isLive ?? false

  async function handleGoLive() {
    if (!faciInfo?.game || goingLive) return
    const prevLive = !!faciInfo.game.isLive
    const nextLive = !prevLive

    // 1. Instant optimistic update (0ms delay)
    setFaciInfo((prev) =>
      prev && prev.game
        ? { ...prev, game: { ...prev.game, isLive: nextLive } }
        : prev
    )
    toast.success(nextLive ? '🔴 MISSION IS NOW LIVE' : '⬛ MISSION ENDED')

    // 2. Broadcast across tabs so homepage updates immediately
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('game-updates')
        bc.postMessage({ type: 'STATUS_CHANGED', gameId: faciInfo.game.id, isLive: nextLive })
        bc.close()
      }
    } catch {}

    // 3. Broadcast to all connected devices via Supabase Realtime WebSocket
    try {
      supabase.channel('missions-live').send({
        type: 'broadcast',
        event: 'game-status-changed',
        payload: { gameId: faciInfo.game.id, isLive: nextLive },
      })
    } catch {}

    setGoingLive(true)
    try {
      const res = await fetch('/api/faci/go-live', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        // Rollback on server error
        setFaciInfo((prev) =>
          prev && prev.game
            ? { ...prev, game: { ...prev.game, isLive: prevLive } }
            : prev
        )
        toast.error(data.error || 'Failed to update live status')
      } else {
        // Confirm server state
        setFaciInfo((prev) =>
          prev && prev.game
            ? { ...prev, game: { ...prev.game, isLive: data.isLive } }
            : prev
        )
      }
    } catch {
      // Rollback on network error
      setFaciInfo((prev) =>
        prev && prev.game
          ? { ...prev, game: { ...prev.game, isLive: prevLive } }
          : prev
      )
      toast.error('SYSTEM ERROR')
    } finally {
      setGoingLive(false)
    }
  }

  function handleAwardScore(pts: number = scoreValue) {
    setPendingPoints(pts)
    setCustomPoints('')
    setShowModal(true)
  }

  function handleCustomPoints() {
    const pts = parseInt(customPoints, 10)
    if (!pts || pts <= 0) {
      toast.error('Enter a valid number of credits')
      return
    }
    if (maxPoints && pts > maxPoints) {
      toast.error(`Maximum ${maxPoints} points allowed for this mission`)
      return
    }
    if (!maxPoints && pts > 10000) {
      toast.error('Maximum 10,000 credits per transaction')
      return
    }
    setPendingPoints(pts)
    setShowModal(true)
  }

  async function handleConfirmPoints() {
    if (!selectedTeam || !faciInfo?.game || !pendingPoints) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          gameId: faciInfo.game.id,
          points: pendingPoints,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'TRANSMISSION FAILED')
        setShowModal(false)
      } else {
        setShowModal(false)
        const teamName = selectedTeam.name
        const points = pendingPoints
        toast.success(`+${points} CREDITS AWARDED TO ${teamName}`)

        // Reset selection immediately
        setSelectedTeam(null)
        setCustomPoints('')
        setShowCustom(false)
        setPendingPoints(0)
        setSuccess({ teamName, points })

        // 1. Instantly reload fresh data
        await loadData()

        // 2. Auto-refresh the page as requested
        setTimeout(() => {
          window.location.reload()
        }, 1200)
      }
    } catch {
      toast.error('SYSTEM ERROR')
      setShowModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/faci/logout', { method: 'POST' })
    router.push('/faci/login')
  }

  // Teams that have already attended (scored) — for the dropdown label
  const attendedTeamIds = new Set(attendedTeams.map((t) => t.teamId))

  if (loading) {
    return (
      <div className="mission-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mission-spinner w-12 h-12 mx-auto mb-4" />
          <div className="mono text-sm text-mission-muted tracking-wider animate-pulse">AUTHENTICATING AGENT...</div>
        </div>
      </div>
    )
  }

  if (!faciInfo?.game) {
    return (
      <div className="mission-bg min-h-screen flex items-center justify-center px-4">
        <div className="mission-card rounded-xl p-8 max-w-md text-center">
          <Terminal className="w-12 h-12 text-mission-amber mx-auto mb-4" />
          <div className="classified-badge mx-auto w-fit mb-3">AGENT: {faciInfo?.faciId}</div>
          <div className="mono text-xl font-bold text-white mb-2">NO MISSION ASSIGNED</div>
          <p className="text-mission-muted text-sm mb-6">Contact Mission Control to be assigned a mission.</p>
          <button onClick={handleLogout} className="btn-ghost flex items-center gap-2 mx-auto">
            <LogOut className="w-4 h-4" />LOGOUT
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mission-bg min-h-screen">
      {/* Header */}
      <header className="border-b border-mission-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-black/40 border border-mission-amber/40 flex items-center justify-center overflow-hidden p-1 flex-shrink-0">
            <Image
              src="/icon.png"
              alt="OBT Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="mono text-xs font-bold text-mission-amber tracking-widest">{faciInfo.faciId}</div>
            <div className="mono text-[10px] text-mission-muted">{faciInfo.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1.5">
            <LogOut className="w-3 h-3" />LOGOUT
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Mission Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-bright rounded-xl p-5"
        >
          <div className="classified-badge mb-3 w-fit">AGENT ACCESS GRANTED</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="section-label">MISSION</div>
              <div className="mono font-black text-white text-sm tracking-wider">{faciInfo.game.name.toUpperCase()}</div>
            </div>
            <div>
              <div className="section-label">LOCATION</div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-mission-amber" />
                <span className="mono text-sm text-white">{faciInfo.game.location || 'UNSET'}</span>
              </div>
            </div>
          </div>
          {/* Max Points Badge */}
          <div className="mt-4 space-y-3">
            {/* Max Points */}
            <div className="flex items-center justify-between">
              {maxPoints != null ? (
                <div className="flex items-center gap-1.5 bg-mission-amber/10 border border-mission-amber/30 rounded-lg px-3 py-1.5">
                  <Trophy className="w-3.5 h-3.5 text-mission-amber" />
                  <span className="mono text-xs font-bold text-mission-amber">MAX: {maxPoints.toLocaleString()} PTS</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                  <Trophy className="w-3.5 h-3.5 text-mission-muted" />
                  <span className="mono text-xs text-mission-muted">UNLIMITED PTS</span>
                </div>
              )}
              {isLive ? (
                <span className="status-active text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  LIVE
                </span>
              ) : (
                <span className="status-inactive text-xs">STANDBY</span>
              )}
            </div>

            {/* GO LIVE / END SESSION button */}
            <button
              onClick={handleGoLive}
              disabled={goingLive}
              className={`w-full py-3 rounded-xl mono font-black text-sm tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                isLive
                  ? 'bg-red-900/40 border border-red-500/50 text-mission-red hover:bg-red-900/60'
                  : 'bg-green-900/30 border border-green-500/40 text-green-400 hover:bg-green-900/50'
              } ${goingLive ? 'opacity-80' : ''}`}
            >
              <Radio className={`w-4 h-4 ${isLive ? 'animate-pulse' : ''}`} />
              {isLive ? 'END SESSION' : 'GO LIVE'}
            </button>
          </div>
        </motion.div>

        {/* Team Select */}
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mission-card rounded-xl p-5 relative z-30"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="section-label flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-mission-red" />
              <span>SELECT MISSION UNIT</span>
            </div>
            {selectedTeam && (
              <button
                type="button"
                onClick={() => setSelectedTeam(null)}
                className="mono text-[10px] text-mission-muted hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> CLEAR
              </button>
            )}
          </div>

          {/* Custom Dropdown Trigger Button */}
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`w-full rounded-xl p-3.5 flex items-center justify-between transition-all border text-left cursor-pointer ${
              dropdownOpen
                ? 'bg-black/90 border-mission-red shadow-[0_0_20px_rgba(230,57,70,0.2)] ring-1 ring-mission-red/50'
                : selectedTeam
                ? 'bg-black/60 border-white/20 hover:border-white/40'
                : 'bg-black/40 border-mission-border hover:border-mission-border-hover hover:bg-black/60'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedTeam
                    ? 'bg-mission-red/20 border border-mission-red/40 text-mission-red'
                    : 'bg-white/5 border border-white/10 text-mission-muted'
                }`}
              >
                {selectedTeam ? (
                  <span className="mono font-black text-sm">
                    {selectedTeam.name.slice(0, 2).toUpperCase()}
                  </span>
                ) : (
                  <Users className="w-5 h-5" />
                )}
              </div>

              <div className="min-w-0">
                {selectedTeam ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="mono font-black text-base text-white truncate">
                        {selectedTeam.name}
                      </span>
                      {attendedTeamIds.has(selectedTeam.id) && (
                        <span className="mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          SCORED
                        </span>
                      )}
                    </div>
                    <div className="mono text-xs text-mission-amber flex items-center gap-1 mt-0.5">
                      <Trophy className="w-3 h-3" />
                      <span>{selectedTeam.currentPoints.toLocaleString()} CREDITS</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mono text-sm text-mission-muted font-medium">
                      CHOOSE A TEAM UNIT
                    </div>
                    <div className="mono text-[10px] text-white/40 mt-0.5">
                      {teams.length - attendedTeamIds.size} AVAILABLE · {attendedTeamIds.size} SCORED
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <span className="mono text-[10px] tracking-widest text-mission-muted hidden sm:inline-block">
                {dropdownOpen ? 'CLOSE' : 'SELECT'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-mission-muted transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180 text-mission-red' : ''
                }`}
              />
            </div>
          </button>

          {/* Animated Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="mt-2.5 rounded-xl border border-mission-border bg-black/95 backdrop-blur-2xl shadow-2xl p-2.5 space-y-2 overflow-hidden"
              >
                {/* Search Bar if > 3 teams */}
                {teams.length > 3 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-mission-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      placeholder="SEARCH TEAM NAME..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-8 py-2 mono text-xs text-white placeholder-mission-muted focus:outline-none focus:border-mission-red/50 focus:bg-white/10 transition-colors"
                      autoFocus
                    />
                    {teamSearch && (
                      <button
                        type="button"
                        onClick={() => setTeamSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mission-muted hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Units List */}
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {teams.filter((t) => t.name.toLowerCase().includes(teamSearch.toLowerCase().trim())).length === 0 ? (
                    <div className="py-6 text-center">
                      <Target className="w-6 h-6 text-mission-muted/40 mx-auto mb-1.5" />
                      <p className="mono text-xs text-mission-muted">NO MATCHING TEAMS FOUND</p>
                    </div>
                  ) : (
                    teams
                      .filter((t) => t.name.toLowerCase().includes(teamSearch.toLowerCase().trim()))
                      .map((team) => {
                        const isSelected = selectedTeam?.id === team.id
                        const hasScored = attendedTeamIds.has(team.id)

                        return (
                          <div
                            key={team.id}
                            onClick={() => {
                              if (hasScored) return
                              setSelectedTeam(team)
                              setDropdownOpen(false)
                              setTeamSearch('')
                            }}
                            className={`w-full rounded-lg p-2.5 flex items-center justify-between transition-all border ${
                              hasScored
                                ? 'opacity-40 bg-white/[0.01] border-white/5 cursor-not-allowed select-none'
                                : isSelected
                                ? 'bg-mission-red/15 border-mission-red/60 text-white cursor-pointer'
                                : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.08] cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Avatar pill */}
                              <div
                                className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mono font-black text-xs ${
                                  hasScored
                                    ? 'bg-white/5 text-white/30 border border-white/5'
                                    : isSelected
                                    ? 'bg-mission-red text-white'
                                    : 'bg-white/10 text-mission-muted'
                                }`}
                              >
                                {team.name.slice(0, 2).toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <div className="mono font-bold text-sm text-white truncate flex items-center gap-1.5">
                                  <span className={hasScored ? 'text-white/40 line-through decoration-white/20' : ''}>
                                    {team.name}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              {hasScored ? (
                                <span className="mono text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/40 text-red-400/80 border border-red-500/20 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> SCORED
                                </span>
                              ) : (
                                <>
                                  <span className="mono text-xs text-mission-amber font-semibold">
                                    {team.currentPoints.toLocaleString()} PTS
                                  </span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-mission-red" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedTeam && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-mission-border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="section-label">MISSION UNIT</div>
                    <div className="mono font-black text-xl text-white">{selectedTeam.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="section-label">CURRENT CREDITS</div>
                    <div className="mono font-black text-2xl text-mission-amber">
                      {selectedTeam.currentPoints.toLocaleString()}
                    </div>
                  </div>
                </div>
                {/* Warning if team already scored */}
                {attendedTeamIds.has(selectedTeam.id) && (
                  <div className="mt-3 flex items-center gap-2 bg-yellow-900/20 border border-yellow-600/30 rounded-lg px-3 py-2">
                    <Target className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <span className="mono text-xs text-yellow-300">
                      THIS UNIT HAS ALREADY COMPLETED THIS MISSION — SCORING WILL BE BLOCKED
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Points Section */}
        <AnimatePresence>
          {selectedTeam && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.15 }}
              className="space-y-4"
            >
              <div className="mission-card rounded-2xl p-5 sm:p-6 corner-accent border border-mission-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="section-label flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-mission-amber" />
                    <span>SCORE MISSION POINTS</span>
                  </div>
                  <div className="mono text-xs text-mission-muted">
                    {faciInfo.game.name.toUpperCase()}
                  </div>
                </div>

                {/* Primary Hero Button: Direct Score Button (e.g. 100) */}
                <button
                  type="button"
                  onClick={() => handleAwardScore(scoreValue)}
                  className="w-full py-5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black mono tracking-wider shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer border border-amber-300 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-black/15 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Zap className="w-7 h-7 text-black fill-black" />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-bold tracking-widest text-black/75 uppercase mono">
                        AWARD FULL SCORE
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-black mono">
                        COMPLETE MISSION
                      </div>
                    </div>
                  </div>

                  {/* The bold score badge, e.g. 100 */}
                  <div className="mono font-black text-3xl sm:text-4xl bg-black text-amber-400 px-5 py-2 rounded-xl border border-black/40 shadow-inner group-hover:scale-105 transition-transform flex items-center gap-1">
                    <span>{scoreValue}</span>
                    <span className="text-xs text-amber-400/70 font-semibold tracking-normal">PTS</span>
                  </div>
                </button>

                {/* Collapsible custom input toggle */}
                <div className="pt-3 border-t border-mission-border/60 text-center">
                  <button
                    type="button"
                    onClick={() => setShowCustom(!showCustom)}
                    className="mono text-xs text-mission-muted hover:text-white transition-colors underline cursor-pointer"
                  >
                    {showCustom ? 'Hide custom input' : 'Need custom score? Click here'}
                  </button>

                  {showCustom && (
                    <div className="mt-3 flex gap-3 max-w-sm mx-auto">
                      <input
                        type="number"
                        value={customPoints}
                        onChange={(e) => setCustomPoints(e.target.value)}
                        className="mission-input flex-1"
                        placeholder={`1 – ${scoreValue}`}
                        min="1"
                        max={scoreValue}
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomPoints()}
                      />
                      <button
                        type="button"
                        onClick={handleCustomPoints}
                        disabled={!customPoints}
                        className="btn-amber py-2.5 px-4 flex items-center gap-1.5 disabled:opacity-50 text-xs"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        AWARD
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedTeam && (
          <div className="mission-card rounded-xl p-8 text-center">
            <Zap className="w-10 h-10 text-mission-muted mx-auto mb-3" />
            <div className="mono text-sm text-mission-muted">SELECT A MISSION UNIT TO AWARD CREDITS</div>
          </div>
        )}

        {/* ─── TEAMS ATTENDED ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mission-card rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="section-label flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              TEAMS ATTENDED
            </div>
            <div className="mono text-xs text-mission-muted">
              {attendedTeams.length} unit{attendedTeams.length !== 1 ? 's' : ''} scored
            </div>
          </div>

          {attendedTeams.length === 0 ? (
            <div className="text-center py-6">
              <Target className="w-8 h-8 text-mission-muted mx-auto mb-2" />
              <div className="mono text-xs text-mission-muted">NO TEAMS HAVE BEEN SCORED YET</div>
            </div>
          ) : (
            <div className="space-y-2">
              {attendedTeams.map((at, i) => (
                <motion.div
                  key={at.teamId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-3"
                >
                  <div>
                    <div className="mono font-black text-white text-sm">{at.teamName}</div>
                    <div className="mono text-xs text-mission-muted">CMD: {at.leaderName}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-mission-muted" />
                      <span className="mono text-xs text-mission-muted">
                        {new Date(at.scoredAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mono font-black text-mission-amber text-lg">+{at.pointsFromThisGame}</div>
                    <div className="mono text-xs text-mission-muted">
                      {maxPoints != null ? `/ ${maxPoints} pts` : 'credits'}
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <span className="mono text-xs text-green-400">DONE</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Success Toast */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm"
            >
              <div className="glass-card-bright rounded-xl p-5 border-green-500/40 shadow-green-glow text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="mono font-bold text-green-400 text-sm tracking-wider">MISSION RESULT RECORDED</div>
                <div className="mono text-lg font-black text-white mt-1">
                  +{success.points} CREDITS → {success.teamName}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Confirm Modal */}
      {faciInfo.game && selectedTeam && (
        <PointsModal
          isOpen={showModal}
          teamName={selectedTeam.name}
          gameName={faciInfo.game.name}
          points={pendingPoints}
          onConfirm={handleConfirmPoints}
          onAbort={() => setShowModal(false)}
          isLoading={submitting}
        />
      )}
    </div>
  )
}
