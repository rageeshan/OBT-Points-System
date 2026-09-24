'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Terminal, MapPin, Zap, LogOut, CheckCircle, Trophy
} from 'lucide-react'
import toast from 'react-hot-toast'
import PointsModal from '@/components/PointsModal'

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
  } | null
}

const QUICK_POINTS = [10, 20, 50, 100]

export default function FaciDashboardPage() {
  const router = useRouter()
  const [faciInfo, setFaciInfo] = useState<FaciInfo | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [customPoints, setCustomPoints] = useState('')
  const [pendingPoints, setPendingPoints] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState<{ teamName: string; points: number } | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [faciRes, teamsRes] = await Promise.all([
        fetch('/api/faci/me'),
        fetch('/api/teams'),
      ])
      if (faciRes.status === 401) {
        router.push('/faci/login')
        return
      }
      if (faciRes.ok) setFaciInfo(await faciRes.json())
      if (teamsRes.ok) setTeams(await teamsRes.json())
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  function handleQuickPoints(pts: number) {
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
    if (pts > 10000) {
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
        setSuccess({ teamName: selectedTeam.name, points: pendingPoints })
        // Update local team points
        setTeams((prev) =>
          prev.map((t) =>
            t.id === selectedTeam.id
              ? { ...t, currentPoints: t.currentPoints + pendingPoints }
              : t
          )
        )
        setSelectedTeam((prev) =>
          prev ? { ...prev, currentPoints: prev.currentPoints + pendingPoints } : null
        )
        setCustomPoints('')
        setPendingPoints(0)
        setTimeout(() => setSuccess(null), 4000)
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
          <div className="w-8 h-8 rounded-full bg-mission-amber/10 border border-mission-amber/30 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-mission-amber" />
          </div>
          <div>
            <div className="mono text-xs font-bold text-mission-amber tracking-widest">{faciInfo.faciId}</div>
            <div className="mono text-[10px] text-mission-muted">{faciInfo.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/leaderboard" target="_blank" className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1.5">
            <Trophy className="w-3 h-3" />RANKING
          </a>
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
          <div className="mt-3">
            <span className="status-active text-xs">OPERATION ACTIVE</span>
          </div>
        </motion.div>

        {/* Team Select */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mission-card rounded-xl p-5"
        >
          <div className="section-label mb-2">SELECT MISSION UNIT</div>
          <select
            value={selectedTeam?.id || ''}
            onChange={(e) => {
              const team = teams.find((t) => t.id === e.target.value) || null
              setSelectedTeam(team)
            }}
            className="mission-input"
          >
            <option value="">— SELECT TEAM —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.currentPoints} credits)
              </option>
            ))}
          </select>

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
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Points Buttons */}
        <AnimatePresence>
          {selectedTeam && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.15 }}
              className="space-y-4"
            >
              {/* Quick Points */}
              <div className="mission-card rounded-xl p-5">
                <div className="section-label mb-3">QUICK CREDITS</div>
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_POINTS.map((pts) => (
                    <button
                      key={pts}
                      onClick={() => handleQuickPoints(pts)}
                      className="btn-mission py-4 text-base font-black"
                    >
                      +{pts}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Points */}
              <div className="mission-card rounded-xl p-5">
                <div className="section-label mb-3">CUSTOM CREDITS</div>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={customPoints}
                    onChange={(e) => setCustomPoints(e.target.value)}
                    className="mission-input flex-1"
                    placeholder="Enter credits..."
                    min="1"
                    max="10000"
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomPoints()}
                  />
                  <button
                    onClick={handleCustomPoints}
                    disabled={!customPoints}
                    className="btn-amber py-2.5 px-5 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    AWARD
                  </button>
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
