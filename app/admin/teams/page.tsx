
'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, Users, X, Check, AlertTriangle, Target } from 'lucide-react'
import toast from 'react-hot-toast'

interface TeamMember {
  id: string
  name: string
  isLeader: boolean
}

interface GameScore {
  points: number
  createdAt: string
  note?: string | null
  game?: { id: string; name: string; location: string | null } | null
}

interface Team {
  id: string
  name: string
  leaderName: string
  currentPoints: number
  members: TeamMember[]
  transactions: GameScore[]
  createdAt: string
}

interface TeamFormData {
  name: string
  leaderName: string
  operatives: string[]
}

const emptyForm: TeamFormData = { name: '', leaderName: '', operatives: ['', '', '', ''] }

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTeam, setEditTeam] = useState<Team | null>(null)
  const [form, setForm] = useState<TeamFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teams')
      if (res.ok) setTeams(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTeams() }, [fetchTeams])

  function openCreate() {
    setEditTeam(null)
    setForm({ name: '', leaderName: '', operatives: ['', '', '', ''] })
    setShowModal(true)
  }

  function openEdit(team: Team) {
    setEditTeam(team)
    const nonLeaders = team.members.filter((m) => !m.isLeader).map((m) => m.name)
    const operativeSlots = [...nonLeaders]
    while (operativeSlots.length < 4) {
      operativeSlots.push('')
    }
    setForm({
      name: team.name,
      leaderName: team.leaderName,
      operatives: operativeSlots,
    })
    setShowModal(true)
  }

  function updateOperative(index: number, val: string) {
    setForm((f) => {
      const next = [...f.operatives]
      next[index] = val
      return { ...f, operatives: next }
    })
  }

  function addOperativeSlot() {
    setForm((f) => ({ ...f, operatives: [...f.operatives, ''] }))
  }

  function removeOperativeSlot(index: number) {
    setForm((f) => ({
      ...f,
      operatives: f.operatives.filter((_, i) => i !== index),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Unit name is required')
      return
    }
    if (!form.leaderName.trim()) {
      toast.error('Mission Commander name is required (minimum 1 member)')
      return
    }

    setSubmitting(true)
    try {
      const url = editTeam ? `/api/teams/${editTeam.id}` : '/api/teams'
      const method = editTeam ? 'PATCH' : 'POST'
      const validOperatives = form.operatives
        .map((op) => op.trim())
        .filter((op) => op.length > 0)

      const payload = {
        name: form.name.trim(),
        leaderName: form.leaderName.trim(),
        members: validOperatives,
        member2: validOperatives[0] || '',
        member3: validOperatives[1] || '',
        member4: validOperatives[2] || '',
        member5: validOperatives[3] || '',
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Operation failed')
      } else {
        toast.success(editTeam ? '✓ UNIT UPDATED' : '✓ UNIT CREATED')
        setShowModal(false)
        fetchTeams()
      }
    } catch {
      toast.error('SYSTEM ERROR')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Failed to delete unit')
      } else {
        toast.success('✓ UNIT ELIMINATED')
        setDeleteConfirm(null)
        fetchTeams()
      }
    } catch {
      toast.error('SYSTEM ERROR')
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="border-b border-mission-border px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="classified-badge mb-1.5">UNIT REGISTRY</div>
          <h1 className="mono text-xl sm:text-2xl font-black text-white tracking-wider">MISSION UNITS</h1>
          <p className="text-mission-muted text-xs sm:text-sm mt-0.5">{teams.length} units registered — 5 operatives each</p>
        </div>
        <button onClick={openCreate} className="btn-mission flex items-center gap-2 flex-shrink-0 py-2 px-3 sm:py-2.5 sm:px-4 text-xs sm:text-sm">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">NEW UNIT</span><span className="sm:hidden">NEW</span>
        </button>
      </div>

      <div className="p-3 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="mission-spinner w-10 h-10" />
          </div>
        ) : teams.length === 0 ? (
          <div className="mission-card rounded-xl p-16 text-center">
            <Users className="w-12 h-12 text-mission-muted mx-auto mb-4" />
            <div className="mono text-mission-muted mb-2">NO UNITS REGISTERED</div>
            <button onClick={openCreate} className="btn-mission mt-4">REGISTER FIRST UNIT</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {teams.map((team, idx) => {
                const nonLeaders = team.members.filter((m) => !m.isLeader)
                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`mission-card rounded-xl p-5 corner-accent ${idx === 0 ? 'rank-gold' : idx === 1 ? 'rank-silver' : idx === 2 ? 'rank-bronze' : ''}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="section-label">MISSION UNIT</div>
                        <div className="mono text-xl font-black text-white tracking-wider">{team.name}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`mono text-xl font-black ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'text-mission-muted'}`}>
                          #{idx + 1}
                        </div>
                      </div>
                    </div>

                    {/* Classification */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="classified-badge w-fit">TOP SECRET</div>
                      <div className="mono text-xs text-mission-muted">
                        {team.members.length} {team.members.length === 1 ? 'OPERATIVE' : 'OPERATIVES'}
                      </div>
                    </div>

                    {/* Commander */}
                    <div className="mb-3">
                      <div className="section-label">MISSION COMMANDER</div>
                      <div className="text-white font-semibold flex items-center gap-2">
                        <span className="text-mission-amber">★</span>
                        {team.leaderName}
                      </div>
                    </div>

                    {/* Operatives */}
                    <div className="mb-4">
                      <div className="section-label">
                        OPERATIVES {nonLeaders.length > 0 ? `(${nonLeaders.length})` : ''}
                      </div>
                      {nonLeaders.length > 0 ? (
                        <div className="space-y-1">
                          {nonLeaders.map((m) => (
                            <div key={m.id} className="flex items-center gap-2 text-sm text-mission-muted">
                              <Users className="w-3 h-3" />
                              <span>{m.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-mission-muted/70 italic flex items-center gap-1.5 py-0.5">
                          <span>Solo Operative (Commander only)</span>
                        </div>
                      )}
                    </div>

                    {/* Points */}
                    <div className="border-t border-mission-border pt-3 mb-4">
                      <div className="section-label">MISSION CREDITS</div>
                      <div className={`mono text-3xl font-black ${idx === 0 ? 'text-mission-amber' : 'text-white'}`}>
                        {team.currentPoints.toLocaleString()}
                      </div>
                    </div>

                    {/* Game Score Breakdown */}
                    {team.transactions && team.transactions.length > 0 && (
                      <div className="border-t border-mission-border pt-3 mb-4">
                        <div className="section-label flex items-center gap-1 mb-2">
                          <Target className="w-3 h-3" />
                          GAMES COMPLETED
                        </div>
                        <div className="space-y-1.5">
                          {team.transactions.map((txn, i) => {
                            const isDeduction = txn.points < 0
                            return (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex flex-col min-w-0">
                                  <span className={`mono font-bold truncate ${isDeduction ? 'text-red-400' : 'text-white'}`}>
                                    {isDeduction ? `Trade: ${txn.note || 'Deduction'}` : (txn.game?.name || 'Mission')}
                                  </span>
                                  {txn.game?.location && (
                                    <span className="text-mission-muted">{txn.game.location}</span>
                                  )}
                                </div>
                                <span className={`mono font-black ml-2 flex-shrink-0 ${isDeduction ? 'text-red-400' : 'text-mission-amber'}`}>
                                  {isDeduction ? `${txn.points} pts` : `+${txn.points} pts`}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {team.transactions && team.transactions.length === 0 && (
                      <div className="border-t border-mission-border pt-3 mb-4">
                        <div className="section-label flex items-center gap-1 mb-1">
                          <Target className="w-3 h-3" />
                          GAMES COMPLETED
                        </div>
                        <div className="mono text-xs text-mission-muted">NO GAMES COMPLETED YET</div>
                      </div>
                    )}

                    {/* Actions */}
                    {deleteConfirm === team.id ? (
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2 flex-1 text-mission-red mono text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          CONFIRM DELETE?
                        </div>
                        <button onClick={() => handleDelete(team.id)} className="btn-mission py-1.5 px-3 text-xs">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="btn-ghost py-1.5 px-3 text-xs">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(team)} className="btn-ghost flex-1 py-1.5 text-xs flex items-center justify-center gap-1">
                          <Edit2 className="w-3 h-3" />EDIT
                        </button>
                        <button onClick={() => setDeleteConfirm(team.id)} className="flex-1 py-1.5 text-xs rounded bg-transparent border border-red-900/40 text-mission-red hover:bg-red-900/20 mono font-bold tracking-wider transition-all flex items-center justify-center gap-1">
                          <Trash2 className="w-3 h-3" />DELETE
                        </button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card-bright rounded-xl p-5 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="classified-badge mb-1">{editTeam ? 'MODIFY UNIT' : 'REGISTER UNIT'}</div>
                    <h2 className="mono text-xl font-black text-white">{editTeam ? 'EDIT MISSION UNIT' : 'NEW MISSION UNIT'}</h2>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-mission-muted hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="section-label block mb-1">UNIT NAME *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="mission-input"
                      placeholder="e.g. ALPHA, BRAVO..."
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="section-label">MISSION COMMANDER * (OPERATIVE 1)</label>
                      <span className="mono text-[10px] text-mission-amber font-bold">REQUIRED (MIN 1)</span>
                    </div>
                    <input
                      type="text"
                      value={form.leaderName}
                      onChange={(e) => setForm((f) => ({ ...f, leaderName: e.target.value }))}
                      className="mission-input"
                      placeholder="Team leader / Commander name"
                      required
                    />
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between border-t border-mission-border pt-3">
                      <div className="section-label">ADDITIONAL OPERATIVES</div>
                      <span className="mono text-[10px] text-mission-muted">OPTIONAL</span>
                    </div>

                    {form.operatives.map((op, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={op}
                            onChange={(e) => updateOperative(i, e.target.value)}
                            className="mission-input"
                            placeholder={`Operative ${i + 2} name (optional)`}
                          />
                        </div>
                        {form.operatives.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOperativeSlot(i)}
                            className="p-2 text-mission-muted hover:text-mission-red transition-colors"
                            title="Remove field"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addOperativeSlot}
                      className="text-xs mono text-mission-amber hover:text-yellow-300 flex items-center gap-1.5 transition-colors pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      ADD ANOTHER OPERATIVE SLOT
                    </button>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">CANCEL</button>
                    <button type="submit" disabled={submitting} className="btn-mission flex-1 flex items-center justify-center gap-2">
                      {submitting ? <div className="mission-spinner" /> : editTeam ? 'UPDATE UNIT' : 'REGISTER UNIT'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
