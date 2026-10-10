'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, UserCheck, X, Check, AlertTriangle, Eye, EyeOff, Lock, Target, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

interface Game {
  id: string
  name: string
  location?: string | null
  facilitator?: { id: string; faciId: string; name: string } | null
}

interface AssignedGame {
  id: string
  name: string
  location?: string | null
  maxPoints?: number | null
}

interface Facilitator {
  id: string
  faciId: string
  name: string
  isActive: boolean
  games?: AssignedGame[]
  createdAt: string
}

const emptyForm = {
  name: '',
  faciId: '',
  password: '',
  gameIds: [] as string[],
  isActive: true,
}

export default function FacilitatorsPage() {
  const [facis, setFacis] = useState<Facilitator[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editFaci, setEditFaci] = useState<Facilitator | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [facisRes, gamesRes] = await Promise.all([
        fetch('/api/facilitators'),
        fetch('/api/games'),
      ])
      if (facisRes.ok) setFacis(await facisRes.json())
      if (gamesRes.ok) setGames(await gamesRes.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function openCreate() {
    setEditFaci(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(faci: Facilitator) {
    setEditFaci(faci)
    setForm({
      name: faci.name,
      faciId: '',
      password: '',
      gameIds: (faci.games || []).map((g) => g.id),
      isActive: faci.isActive,
    })
    setShowModal(true)
  }

  function toggleGameSelection(gameId: string) {
    setForm((prev) => {
      const exists = prev.gameIds.includes(gameId)
      return {
        ...prev,
        gameIds: exists
          ? prev.gameIds.filter((id) => id !== gameId)
          : [...prev.gameIds, gameId],
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        gameIds: form.gameIds,
        isActive: form.isActive,
      }

      if (form.faciId) payload.faciId = form.faciId
      if (form.password) payload.password = form.password

      const url = editFaci ? `/api/facilitators/${editFaci.id}` : '/api/facilitators'
      const method = editFaci ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Operation failed')
      } else {
        toast.success(editFaci ? '✓ OFFICER UPDATED' : '✓ OFFICER REGISTERED')
        setShowModal(false)
        fetchData()
      }
    } catch {
      toast.error('SYSTEM ERROR')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleStatus(faci: Facilitator) {
    try {
      const res = await fetch(`/api/facilitators/${faci.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !faci.isActive }),
      })
      if (!res.ok) toast.error('Failed to update status')
      else {
        toast.success(faci.isActive ? '✓ OFFICER DEACTIVATED' : '✓ OFFICER ACTIVATED')
        fetchData()
      }
    } catch {
      toast.error('SYSTEM ERROR')
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/facilitators/${id}`, { method: 'DELETE' })
      if (!res.ok) toast.error('Failed to delete officer')
      else {
        toast.success('✓ OFFICER REMOVED')
        setDeleteConfirm(null)
        fetchData()
      }
    } catch {
      toast.error('SYSTEM ERROR')
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-mission-border px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="classified-badge mb-1.5">PERSONNEL REGISTRY</div>
          <h1 className="mono text-xl sm:text-2xl font-black text-white tracking-wider">MISSION OFFICERS</h1>
          <p className="text-mission-muted text-xs sm:text-sm mt-0.5">
            {facis.length} officers registered · 1 officer can handle 1 or more missions
          </p>
        </div>
        <button onClick={openCreate} className="btn-mission flex items-center gap-2 flex-shrink-0 py-2 px-3 sm:py-2.5 sm:px-4 text-xs sm:text-sm">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">NEW OFFICER</span><span className="sm:hidden">NEW</span>
        </button>
      </div>

      <div className="p-3 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="mission-spinner w-10 h-10" />
          </div>
        ) : facis.length === 0 ? (
          <div className="mission-card rounded-xl p-16 text-center">
            <UserCheck className="w-12 h-12 text-mission-muted mx-auto mb-4" />
            <div className="mono text-mission-muted mb-2">NO OFFICERS REGISTERED</div>
            <button onClick={openCreate} className="btn-mission mt-4">REGISTER FIRST OFFICER</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {facis.map((faci, idx) => {
                const assignedGames = faci.games || []
                return (
                  <motion.div
                    key={faci.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`mission-card rounded-xl p-5 ${!faci.isActive ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="section-label">MISSION OFFICER</div>
                        <div className="mono font-black text-2xl text-white tracking-widest">{faci.faciId}</div>
                      </div>
                      {faci.isActive ? (
                        <span className="status-active">ACTIVE</span>
                      ) : (
                        <span className="status-inactive">INACTIVE</span>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="section-label">OPERATIVE NAME</div>
                      <div className="text-white font-semibold">{faci.name}</div>
                    </div>

                    <div className="mb-4">
                      <div className="section-label flex items-center justify-between">
                        <span>ASSIGNED MISSIONS ({assignedGames.length})</span>
                      </div>
                      {assignedGames.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-32 overflow-y-auto">
                          {assignedGames.map((g) => (
                            <span
                              key={g.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-mission-border text-xs text-white"
                            >
                              <Target className="w-3 h-3 text-mission-red" />
                              <span className="truncate max-w-[150px]">{g.name}</span>
                              {g.location && (
                                <span className="text-[10px] text-mission-muted">({g.location})</span>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-mission-muted text-xs mt-1">— NO MISSIONS ASSIGNED —</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="w-3 h-3 text-mission-muted" />
                      <span className="mono text-xs text-mission-muted">PASSWORD SECURED</span>
                    </div>

                    {deleteConfirm === faci.id ? (
                      <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-1 flex-1 text-mission-red mono text-xs">
                          <AlertTriangle className="w-3 h-3" />CONFIRM DELETE?
                        </div>
                        <button onClick={() => handleDelete(faci.id)} className="btn-mission py-1.5 px-3 text-xs">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="btn-ghost py-1.5 px-3 text-xs">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => openEdit(faci)} className="btn-ghost flex-1 py-1.5 text-xs flex items-center justify-center gap-1">
                          <Edit2 className="w-3 h-3" />EDIT
                        </button>
                        <button
                          onClick={() => handleToggleStatus(faci)}
                          className={`flex-1 py-1.5 text-xs rounded mono font-bold tracking-wider transition-all ${faci.isActive ? 'btn-ghost' : 'btn-amber'}`}
                        >
                          {faci.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                        </button>
                        <button onClick={() => setDeleteConfirm(faci.id)} className="flex-1 py-1.5 text-xs rounded bg-transparent border border-red-900/40 text-mission-red hover:bg-red-900/20 mono font-bold tracking-wider transition-all flex items-center justify-center gap-1">
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

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={() => setShowModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
              <div className="glass-card-bright rounded-xl p-5 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="classified-badge mb-1">{editFaci ? 'MODIFY OFFICER' : 'REGISTER OFFICER'}</div>
                    <h2 className="mono text-xl font-black text-white">{editFaci ? 'EDIT OFFICER' : 'NEW MISSION OFFICER'}</h2>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-mission-muted hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                {editFaci && (
                  <div className="mission-card rounded-lg p-3 mb-4 flex items-center gap-3">
                    <div className="section-label">AGENT ID:</div>
                    <div className="mono font-black text-mission-amber">{editFaci.faciId}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="section-label block mb-1">OPERATIVE NAME *</label>
                    <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="mission-input" placeholder="Full name" required />
                  </div>

                  {/* Manual Faci ID — only on create */}
                  {!editFaci && (
                    <div>
                      <label className="section-label block mb-1">
                        AGENT ID <span className="text-mission-muted font-normal normal-case">(leave blank to auto-assign)</span>
                      </label>
                      <input
                        type="text"
                        value={form.faciId}
                        onChange={(e) => setForm((f) => ({ ...f, faciId: e.target.value.toUpperCase() }))}
                        className="mission-input mono tracking-widest"
                        placeholder="e.g. FACI-001"
                        maxLength={20}
                      />
                    </div>
                  )}

                  <div>
                    <label className="section-label block mb-1">
                      {editFaci ? 'NEW PASSWORD (leave blank to keep)' : 'PASSWORD *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        className="mission-input pr-10"
                        placeholder={editFaci ? 'Leave blank to keep current' : 'Set password'}
                        required={!editFaci}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-mission-muted hover:text-white">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Multi-select Missions */}
                  <div>
                    <label className="section-label block mb-1">
                      ASSIGNED MISSIONS ({form.gameIds.length} SELECTED)
                    </label>
                    <p className="text-mission-muted text-xs mb-2">
                      Select 1 or more missions. One mission can only have one assigned officer.
                    </p>
                    <div className="border border-mission-border rounded-lg bg-black/40 p-2.5 max-h-56 overflow-y-auto space-y-1.5">
                      {games.length === 0 ? (
                        <div className="mono text-xs text-mission-muted p-2">NO MISSIONS FOUND</div>
                      ) : (
                        games.map((g) => {
                          const isChecked = form.gameIds.includes(g.id)
                          const otherOfficer = g.facilitator && (!editFaci || g.facilitator.id !== editFaci.id)
                            ? g.facilitator
                            : null

                          return (
                            <label
                              key={g.id}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                                isChecked
                                  ? 'bg-mission-red/15 border-mission-red/40 text-white'
                                  : 'bg-white/5 border-transparent hover:bg-white/10 text-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleGameSelection(g.id)}
                                  className="w-4 h-4 accent-mission-red rounded"
                                />
                                <div className="truncate">
                                  <div className="mono text-xs font-bold text-white truncate">{g.name}</div>
                                  {g.location && (
                                    <div className="mono text-[10px] text-mission-muted">{g.location}</div>
                                  )}
                                </div>
                              </div>
                              {otherOfficer && !isChecked && (
                                <span className="mono text-[10px] text-yellow-400 bg-yellow-950/40 px-1.5 py-0.5 rounded border border-yellow-800/40 flex-shrink-0 ml-2">
                                  Assigned to {otherOfficer.faciId}
                                </span>
                              )}
                            </label>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {editFaci && (
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="isActive" checked={form.isActive}
                        onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                        className="w-4 h-4 accent-mission-red" />
                      <label htmlFor="isActive" className="section-label cursor-pointer">ACTIVE STATUS</label>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">CANCEL</button>
                    <button type="submit" disabled={submitting} className="btn-mission flex-1 flex items-center justify-center gap-2">
                      {submitting ? <div className="mission-spinner" /> : editFaci ? 'UPDATE OFFICER' : 'REGISTER OFFICER'}
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
