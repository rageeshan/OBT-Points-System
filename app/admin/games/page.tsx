'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, Target, X, Check, AlertTriangle, MapPin, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface Game {
  id: string
  name: string
  description?: string
  location?: string
  isActive: boolean
  facilitators?: { id: string; faciId: string; name: string; isActive: boolean }[]
  createdAt: string
}

const emptyForm = { name: '', description: '', location: '', isActive: true }

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editGame, setEditGame] = useState<Game | null>(null)
  const [form, setForm] = useState<{ name: string; description: string; location: string; isActive: boolean }>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchGames = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/games')
      if (res.ok) setGames(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGames() }, [fetchGames])

  function openCreate() {
    setEditGame(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(game: Game) {
    setEditGame(game)
    setForm({ name: game.name, description: game.description || '', location: game.location || '', isActive: game.isActive })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editGame ? `/api/games/${editGame.id}` : '/api/games'
      const method = editGame ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) toast.error(data.error || 'Operation failed')
      else {
        toast.success(editGame ? '✓ MISSION UPDATED' : '✓ MISSION CREATED')
        setShowModal(false)
        fetchGames()
      }
    } catch {
      toast.error('SYSTEM ERROR')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(game: Game) {
    try {
      const res = await fetch(`/api/games/${game.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !game.isActive }),
      })
      if (!res.ok) toast.error('Failed to update status')
      else {
        toast.success(game.isActive ? '✓ MISSION DEACTIVATED' : '✓ MISSION ACTIVATED')
        fetchGames()
      }
    } catch {
      toast.error('SYSTEM ERROR')
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/games/${id}`, { method: 'DELETE' })
      if (!res.ok) toast.error('Failed to delete mission')
      else {
        toast.success('✓ MISSION ELIMINATED')
        setDeleteConfirm(null)
        fetchGames()
      }
    } catch {
      toast.error('SYSTEM ERROR')
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-mission-border px-6 py-5 flex items-center justify-between">
        <div>
          <div className="classified-badge mb-2">OPERATIONS REGISTRY</div>
          <h1 className="mono text-2xl font-black text-white tracking-wider">MISSIONS</h1>
          <p className="text-mission-muted text-sm mt-1">{games.length} missions configured</p>
        </div>
        <button onClick={openCreate} className="btn-mission flex items-center gap-2">
          <Plus className="w-4 h-4" />NEW MISSION
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="mission-spinner w-10 h-10" />
          </div>
        ) : games.length === 0 ? (
          <div className="mission-card rounded-xl p-16 text-center">
            <Target className="w-12 h-12 text-mission-muted mx-auto mb-4" />
            <div className="mono text-mission-muted mb-2">NO MISSIONS CONFIGURED</div>
            <button onClick={openCreate} className="btn-mission mt-4">CREATE FIRST MISSION</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {games.map((game, idx) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`mission-card rounded-xl p-5 ${!game.isActive ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="section-label">MISSION</div>
                      <div className="mono text-lg font-black text-white tracking-wider">{game.name}</div>
                    </div>
                    {game.isActive ? (
                      <span className="status-active text-xs">ACTIVE</span>
                    ) : (
                      <span className="status-inactive text-xs">INACTIVE</span>
                    )}
                  </div>

                  {game.description && (
                    <div className="mb-3">
                      <div className="section-label">BRIEFING</div>
                      <p className="text-mission-muted text-sm leading-relaxed">{game.description}</p>
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="section-label">LOCATION</div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-mission-amber" />
                      <span className="text-white text-sm">{game.location || '— UNSET —'}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="section-label">ASSIGNED OFFICERS</div>
                    {game.facilitators && game.facilitators.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {game.facilitators.map((f) => (
                          <span key={f.id} className={`mono text-xs px-2 py-0.5 rounded border ${f.isActive ? 'text-green-400 border-green-900/40 bg-green-900/10' : 'text-mission-muted border-mission-border'}`}>
                            {f.faciId}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-mission-muted text-sm">
                        <Users className="w-3 h-3" />
                        <span>No officers assigned</span>
                      </div>
                    )}
                  </div>

                  {deleteConfirm === game.id ? (
                    <div className="flex gap-2 items-center">
                      <div className="flex items-center gap-1 flex-1 text-mission-red mono text-xs">
                        <AlertTriangle className="w-3 h-3" />CONFIRM DELETE?
                      </div>
                      <button onClick={() => handleDelete(game.id)} className="btn-mission py-1.5 px-3 text-xs">
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="btn-ghost py-1.5 px-3 text-xs">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(game)} className="btn-ghost flex-1 py-1.5 text-xs flex items-center justify-center gap-1">
                        <Edit2 className="w-3 h-3" />EDIT
                      </button>
                      <button onClick={() => handleToggleActive(game)} className={`flex-1 py-1.5 text-xs rounded mono font-bold tracking-wider transition-all ${game.isActive ? 'btn-ghost' : 'btn-amber'}`}>
                        {game.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                      </button>
                      <button onClick={() => setDeleteConfirm(game.id)} className="flex-1 py-1.5 text-xs rounded bg-transparent border border-red-900/40 text-mission-red hover:bg-red-900/20 mono font-bold tracking-wider transition-all flex items-center justify-center gap-1">
                        <Trash2 className="w-3 h-3" />DELETE
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
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
              <div className="glass-card-bright rounded-xl p-8 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="classified-badge mb-1">{editGame ? 'MODIFY MISSION' : 'NEW MISSION'}</div>
                    <h2 className="mono text-xl font-black text-white">{editGame ? 'EDIT MISSION' : 'CREATE MISSION'}</h2>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-mission-muted hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="section-label block mb-1">MISSION NAME *</label>
                    <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="mission-input" placeholder="e.g. Code Breaker" required />
                  </div>
                  <div>
                    <label className="section-label block mb-1">MISSION BRIEFING</label>
                    <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="mission-input resize-none" rows={3} placeholder="Mission description..." />
                  </div>
                  <div>
                    <label className="section-label block mb-1">LOCATION / ZONE</label>
                    <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      className="mission-input" placeholder="e.g. ZONE A" />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="isActive" checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="w-4 h-4 accent-mission-red" />
                    <label htmlFor="isActive" className="section-label cursor-pointer">MISSION ACTIVE</label>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">CANCEL</button>
                    <button type="submit" disabled={submitting} className="btn-mission flex-1 flex items-center justify-center gap-2">
                      {submitting ? <div className="mission-spinner" /> : editGame ? 'UPDATE MISSION' : 'CREATE MISSION'}
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
