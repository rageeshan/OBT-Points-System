'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Coins, LogOut, Users, Search, ChevronDown, Check, X, AlertTriangle,
  ArrowDownRight, Clock, ShieldAlert, CheckCircle, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'

interface Team {
  id: string
  name: string
  leaderName: string
  currentPoints: number
}

interface TraderProfile {
  id: string
  traderId: string
  name: string
  isActive: boolean
}

interface TradeLog {
  id: string
  txnId: string
  teamName: string
  amountDeducted: number
  points: number
  reason: string
  createdAt: string
}

export default function TradeDashboardPage() {
  const router = useRouter()
  const [trader, setTrader] = useState<TraderProfile | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [teamSearch, setTeamSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [deductionAmount, setDeductionAmount] = useState<number>(0)
  const [customAmount, setCustomAmount] = useState<string>('')

  const [confirmModal, setConfirmModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([])
  const [successEvent, setSuccessEvent] = useState<{ teamName: string; amount: number } | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [traderRes, teamsRes, historyRes] = await Promise.all([
        fetch('/api/trade/me'),
        fetch('/api/teams'),
        fetch('/api/trade/history?limit=15'),
      ])

      if (traderRes.status === 401) {
        router.push('/trade/login')
        return
      }

      if (traderRes.ok) setTrader(await traderRes.json())
      if (teamsRes.ok) {
        const teamsData: Team[] = await teamsRes.json()
        setTeams(teamsData)
        // If a team is selected, refresh its points
        if (selectedTeam) {
          const fresh = teamsData.find((t) => t.id === selectedTeam.id)
          if (fresh) setSelectedTeam(fresh)
        }
      }
      if (historyRes.ok) setTradeLogs(await historyRes.json())
    } catch {
      toast.error('Failed to load trader data')
    } finally {
      setLoading(false)
    }
  }, [router, selectedTeam])

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

  function handleCustomAmountChange(val: string) {
    setCustomAmount(val)
    const parsed = parseInt(val, 10)
    if (!isNaN(parsed) && parsed > 0) {
      setDeductionAmount(parsed)
    } else {
      setDeductionAmount(0)
    }
  }

  async function handleLogout() {
    await fetch('/api/trade/logout', { method: 'POST' })
    router.push('/trade/login')
  }

  async function handleExecuteDeduction() {
    if (!selectedTeam || !deductionAmount || deductionAmount <= 0) return

    setSubmitting(true)

    try {
      const res = await fetch('/api/trade/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          amount: deductionAmount,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'DEDUCTION FAILED')
        setConfirmModal(false)
      } else {
        setConfirmModal(false)
        const teamName = selectedTeam.name
        const amount = deductionAmount
        toast.success(`-${amount} CREDITS DEDUCTED FROM ${teamName}`)

        // Broadcast across tabs and Supabase realtime
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('game-updates')
            bc.postMessage({ type: 'POINTS_DEDUCTED', teamId: selectedTeam.id, points: -amount })
            bc.close()
          }
        } catch {}

        try {
          supabase.channel('missions-live').send({
            type: 'broadcast',
            event: 'points-updated',
            payload: { teamId: selectedTeam.id, amount: -amount },
          })
        } catch {}

        setSuccessEvent({ teamName, amount })
        setTimeout(() => setSuccessEvent(null), 4000)

        // Reset inputs
        setCustomAmount('')
        setDeductionAmount(0)
        await loadData()
      }
    } catch {
      toast.error('COMMUNICATION ERROR')
      setConfirmModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mission-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mission-spinner w-12 h-12 mx-auto mb-4 border-yellow-400" />
          <div className="mono text-sm text-yellow-400/80 tracking-wider animate-pulse">
            CONNECTING TO TRADE DESK...
          </div>
        </div>
      </div>
    )
  }

  const projectedRemaining = selectedTeam
    ? selectedTeam.currentPoints - deductionAmount
    : 0

  return (
    <div className="mission-bg min-h-screen pb-12">
      {/* Header */}
      <header className="border-b border-mission-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-black/40 border border-yellow-500/40 flex items-center justify-center overflow-hidden p-1 flex-shrink-0">
            <Coins className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <div className="mono text-xs font-bold text-yellow-400 tracking-widest">
              {trader?.traderId || 'TRADE-001'}
            </div>
            <div className="mono text-[10px] text-mission-muted">
              {trader?.name || 'Trade Operative'} · TRADE DESK
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1.5">
            <LogOut className="w-3 h-3" />LOGOUT
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Banner */}
        <div className="glass-card-bright rounded-2xl p-5 border-yellow-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="classified-badge w-fit text-yellow-400 border-yellow-500/40 bg-yellow-950/20">
              <Coins className="w-3 h-3 inline mr-1 text-yellow-400" />
              ASSET REDUCTION TERMINAL
            </div>
            <button
              onClick={loadData}
              className="text-mission-muted hover:text-white p-1 rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <h1 className="mono text-xl sm:text-2xl font-black text-white tracking-wider">
            REDUCE TEAM CREDITS
          </h1>
          <p className="mono text-xs text-mission-muted mt-1">
            Select a unit to deduct credits for trade, purchases, or penalties.
          </p>
        </div>

        {/* ─── 1. SELECT TEAM UNIT ─────────────────────────────────────── */}
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mission-card rounded-2xl p-5 relative z-30"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="section-label flex items-center gap-1.5 text-yellow-400">
              <Users className="w-3.5 h-3.5" />
              <span>1. SELECT TARGET UNIT</span>
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

          {/* Trigger Button */}
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`w-full rounded-xl p-3.5 flex items-center justify-between transition-all border text-left cursor-pointer ${
              dropdownOpen
                ? 'bg-black/90 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] ring-1 ring-yellow-500/50'
                : selectedTeam
                ? 'bg-black/60 border-yellow-500/40 hover:border-yellow-500/70'
                : 'bg-black/40 border-mission-border hover:border-mission-border-hover hover:bg-black/60'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedTeam
                    ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400'
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
                    <div className="mono font-black text-base text-white truncate">
                      {selectedTeam.name}
                    </div>
                    <div className="mono text-xs text-yellow-400 font-bold flex items-center gap-1.5 mt-0.5">
                      <span>CURRENT BALANCE: {selectedTeam.currentPoints.toLocaleString()} PTS</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mono text-sm text-mission-muted font-medium">
                      CHOOSE A TEAM TO DEDUCT POINTS
                    </div>
                    <div className="mono text-[10px] text-white/40 mt-0.5">
                      {teams.length} REGISTERED UNITS AVAILABLE
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
                  dropdownOpen ? 'rotate-180 text-yellow-400' : ''
                }`}
              />
            </div>
          </button>

          {/* Animated Dropdown */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="mt-2.5 rounded-xl border border-mission-border bg-black/95 backdrop-blur-2xl shadow-2xl p-2.5 space-y-2 overflow-hidden"
              >
                {/* Search Bar */}
                {teams.length > 3 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-mission-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      placeholder="SEARCH TEAM NAME..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-8 py-2 mono text-xs text-white placeholder-mission-muted focus:outline-none focus:border-yellow-500/50 focus:bg-white/10 transition-colors"
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

                {/* Team Items */}
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {teams.filter((t) => t.name.toLowerCase().includes(teamSearch.toLowerCase().trim())).length === 0 ? (
                    <div className="py-6 text-center mono text-xs text-mission-muted">
                      NO MATCHING TEAMS FOUND
                    </div>
                  ) : (
                    teams
                      .filter((t) => t.name.toLowerCase().includes(teamSearch.toLowerCase().trim()))
                      .map((t) => {
                        const isSelected = selectedTeam?.id === t.id
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              setSelectedTeam(t)
                              setDropdownOpen(false)
                              setTeamSearch('')
                            }}
                            className={`w-full rounded-lg p-2.5 flex items-center justify-between transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-yellow-500/15 border-yellow-500/60 text-white'
                                : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mono font-black text-xs ${
                                  isSelected ? 'bg-yellow-500 text-black' : 'bg-white/10 text-mission-muted'
                                }`}
                              >
                                {t.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="truncate">
                                <div className="mono font-bold text-sm text-white truncate">{t.name}</div>
                                <div className="mono text-[10px] text-mission-muted truncate">CMD: {t.leaderName}</div>
                              </div>
                            </div>
                            <div className="mono text-xs font-bold text-yellow-400 flex items-center gap-1.5 flex-shrink-0 ml-2">
                              <span>{t.currentPoints.toLocaleString()} PTS</span>
                              {isSelected && <Check className="w-4 h-4 text-yellow-400" />}
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─── 2. DEDUCTION CONTROLS ─────────────────────────────────────── */}
        <AnimatePresence>
          {selectedTeam && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="mission-card rounded-2xl p-5 sm:p-6 border-red-500/30 space-y-5">
                <div className="section-label flex items-center gap-1.5 text-red-400">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>2. CONFIGURE CREDIT REDUCTION</span>
                </div>

                {/* Reduction Amount Input */}
                <div>
                  <label className="section-label block mb-2 text-white/90">CREDITS TO REDUCE</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      placeholder="Enter credits to deduct (e.g. 50)..."
                      min="1"
                      className="mission-input mono text-xl font-black text-red-400 pr-14 py-3.5"
                      autoFocus
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 mono text-xs font-bold text-mission-muted pointer-events-none">
                      PTS
                    </span>
                  </div>
                </div>

                {/* Live Balance Impact Preview */}
                <div className="bg-black/60 rounded-xl p-4 border border-mission-border space-y-2">
                  <div className="section-label text-[10px]">BALANCE IMPACT PREVIEW</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="mono text-mission-muted">Current Balance:</span>
                    <span className="mono font-bold text-white">{selectedTeam.currentPoints.toLocaleString()} PTS</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="mono text-red-400 font-semibold">Deduction Amount:</span>
                    <span className="mono font-bold text-red-400">-{deductionAmount.toLocaleString()} PTS</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="mono text-xs font-bold text-yellow-400 uppercase">Projected Balance:</span>
                    <span className={`mono font-black text-lg ${projectedRemaining < 0 ? 'text-red-500' : 'text-yellow-400'}`}>
                      {projectedRemaining.toLocaleString()} PTS
                    </span>
                  </div>
                  {projectedRemaining < 0 && (
                    <div className="flex items-center gap-1.5 text-red-400 text-[11px] mono pt-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Note: This deduction exceeds current credits (balance will become negative).</span>
                    </div>
                  )}
                </div>

                {/* Big Action Button */}
                <button
                  type="button"
                  onClick={() => setConfirmModal(true)}
                  disabled={!deductionAmount || deductionAmount <= 0}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black mono text-base tracking-wider shadow-xl shadow-red-600/30 active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer border border-red-400 group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center flex-shrink-0">
                      <ArrowDownRight className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] tracking-widest text-white/80 uppercase mono">CONFIRM DEDUCTION</div>
                      <div className="text-base sm:text-lg font-black text-white mono truncate max-w-[180px] sm:max-w-none">
                        REDUCE CREDITS
                      </div>
                    </div>
                  </div>

                  <div className="mono font-black text-2xl sm:text-3xl bg-black text-red-400 px-4 py-1.5 rounded-xl border border-black/40 shadow-inner">
                    -{deductionAmount} <span className="text-xs text-red-400/80">PTS</span>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedTeam && (
          <div className="mission-card rounded-xl p-8 text-center">
            <Coins className="w-10 h-10 text-mission-muted mx-auto mb-3" />
            <div className="mono text-sm text-mission-muted">
              SELECT A MISSION UNIT ABOVE TO DEDUCT CREDITS
            </div>
          </div>
        )}

        {/* ─── 3. RECENT TRADE LOGS ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mission-card rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="section-label flex items-center gap-1.5 text-mission-amber">
              <Clock className="w-3.5 h-3.5" />
              <span>RECENT TRADE TRANSACTIONS ({tradeLogs.length})</span>
            </div>
          </div>

          {tradeLogs.length === 0 ? (
            <div className="text-center py-6">
              <div className="mono text-xs text-mission-muted">NO TRADE DEDUCTIONS RECORDED YET</div>
            </div>
          ) : (
            <div className="space-y-2">
              {tradeLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between bg-black/40 border border-mission-border rounded-xl px-4 py-3"
                >
                  <div className="min-w-0 pr-3">
                    <div className="mono font-black text-white text-sm truncate">{log.teamName}</div>
                    <div className="mono text-xs text-mission-muted truncate">
                      {log.reason} · <span className="text-yellow-500/80">{log.txnId}</span>
                    </div>
                    <div className="mono text-[10px] text-white/40 mt-0.5" suppressHydrationWarning>
                      {new Date(log.createdAt).toLocaleTimeString()} · {new Date(log.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="mono font-black text-red-400 text-base">
                      -{log.amountDeducted} PTS
                    </div>
                    <span className="mono text-[10px] text-red-500/80 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40 inline-block mt-0.5">
                      DEDUCTED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && selectedTeam && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50"
              onClick={() => !submitting && setConfirmModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card-bright rounded-2xl p-6 sm:p-8 w-full max-w-md border-red-500/40 shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <div className="classified-badge text-red-400 border-red-500/40 bg-red-950/30">
                    <ShieldAlert className="w-3.5 h-3.5 inline mr-1" />
                    CONFIRMATION REQUIRED
                  </div>
                  {!submitting && (
                    <button
                      onClick={() => setConfirmModal(false)}
                      className="text-mission-muted hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="text-center py-2 space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-3">
                    <ArrowDownRight className="w-8 h-8" />
                  </div>
                  <h3 className="mono text-xl font-black text-white tracking-wider">
                    DEDUCT {deductionAmount} CREDITS?
                  </h3>
                  <p className="mono text-xs text-mission-muted">
                    This action will immediately reduce the team&apos;s points on the live leaderboard.
                  </p>
                </div>

                <div className="bg-black/60 rounded-xl p-4 border border-mission-border space-y-2 text-xs mono">
                  <div className="flex justify-between">
                    <span className="text-mission-muted">TARGET UNIT:</span>
                    <span className="font-bold text-white">{selectedTeam.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mission-muted">DEDUCTION AMOUNT:</span>
                    <span className="font-bold text-red-400">-{deductionAmount.toLocaleString()} PTS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mission-muted">CURRENT CREDITS:</span>
                    <span className="font-bold text-white">{selectedTeam.currentPoints.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/10 font-bold">
                    <span className="text-red-400">NEW BALANCE:</span>
                    <span className="text-red-400">{projectedRemaining.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModal(false)}
                    disabled={submitting}
                    className="btn-ghost flex-1 py-3 text-xs"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteDeduction}
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl mono font-black text-xs tracking-wider bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="mission-spinner" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        CONFIRM REDUCE
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Success Toast */}
      <AnimatePresence>
        {successEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50"
          >
            <div className="glass-card-bright rounded-xl p-4 border-red-500/50 shadow-2xl text-center bg-black/95">
              <CheckCircle className="w-7 h-7 text-red-400 mx-auto mb-1.5" />
              <div className="mono font-bold text-red-400 text-xs tracking-wider">
                TRADE DEDUCTION EXECUTED
              </div>
              <div className="mono text-base font-black text-white mt-1">
                -{successEvent.amount} CREDITS · {successEvent.teamName}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
