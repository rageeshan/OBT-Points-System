'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, Coins, X, Check, AlertTriangle, Eye, EyeOff, Lock, ArrowDownRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface Trader {
  id: string
  traderId: string
  name: string
  isActive: boolean
  createdAt: string
  _count?: { transactions: number }
}

const emptyForm = { name: '', traderId: '', password: '', isActive: true }

export default function TradersPage() {
  const [traders, setTraders] = useState<Trader[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTrader, setEditTrader] = useState<Trader | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const fetchTraders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/traders')
      if (res.ok) setTraders(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTraders() }, [fetchTraders])

  function openCreate() {
    setEditTrader(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(trader: Trader) {
    setEditTrader(trader)
    setForm({
      name: trader.name,
      traderId: '',
      password: '',
      isActive: trader.isActive,
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        isActive: form.isActive,
      }
      if (form.traderId) payload.traderId = form.traderId
      if (form.password) payload.password = form.password

      const url = editTrader ? `/api/traders/${editTrader.id}` : '/api/traders'
      const method = editTrader ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Operation failed')
      } else {
        toast.success(editTrader ? '✓ TRADER UPDATED' : '✓ TRADER REGISTERED')
        setShowModal(false)
        fetchTraders()
      }
    } catch {
      toast.error('SYSTEM ERROR')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleStatus(trader: Trader) {
    try {
      const res = await fetch(`/api/traders/${trader.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !trader.isActive }),
      })
      if (!res.ok) toast.error('Failed to update status')
      else {
        toast.success(trader.isActive ? '✓ TRADER DEACTIVATED' : '✓ TRADER ACTIVATED')
        fetchTraders()
      }
    } catch {
      toast.error('SYSTEM ERROR')
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/traders/${id}`, { method: 'DELETE' })
      if (!res.ok) toast.error('Failed to delete trader')
      else {
        toast.success('✓ TRADER REMOVED')
        setDeleteConfirm(null)
        fetchTraders()
      }
    } catch {
      toast.error('SYSTEM ERROR')
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-mission-border px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="classified-badge mb-1.5">MARKET REGISTRY</div>
          <h1 className="mono text-xl sm:text-2xl font-black text-white tracking-wider">TRADE OPERATIVES</h1>
          <p className="text-mission-muted text-xs sm:text-sm mt-0.5">
            {traders.length} traders authorized to liquidate/reduce team credits
          </p>
        </div>
        <button onClick={openCreate} className="btn-mission flex items-center gap-2 flex-shrink-0 py-2 px-3 sm:py-2.5 sm:px-4 text-xs sm:text-sm">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">NEW TRADER</span><span className="sm:hidden">NEW</span>
        </button>
      </div>

      <div className="p-3 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="mission-spinner w-10 h-10" />
          </div>
        ) : traders.length === 0 ? (
          <div className="mission-card rounded-xl p-16 text-center">
            <Coins className="w-12 h-12 text-mission-muted mx-auto mb-4" />
            <div className="mono text-mission-muted mb-2">NO TRADERS REGISTERED</div>
            <button onClick={openCreate} className="btn-mission mt-4">REGISTER FIRST TRADER</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {traders.map((trader, idx) => (
                <motion.div
                  key={trader.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`mission-card rounded-xl p-5 ${!trader.isActive ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="section-label">TRADE OPERATIVE</div>
                      <div className="mono font-black text-2xl text-mission-amber tracking-widest">{trader.traderId}</div>
                    </div>
                    {trader.isActive ? (
                      <span className="status-active">ACTIVE</span>
                    ) : (
                      <span className="status-inactive">INACTIVE</span>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="section-label">OPERATIVE NAME</div>
                    <div className="text-white font-semibold">{trader.name}</div>
                  </div>

                  <div className="mb-4">
                    <div className="section-label">ROLE CLEARANCE</div>
                    <div className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-950/30 border border-yellow-800/40 px-2.5 py-1 rounded w-fit">
                      <ArrowDownRight className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Point Reductions & Asset Trade</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-3 h-3 text-mission-muted" />
                    <span className="mono text-xs text-mission-muted">PASSWORD SECURED</span>
                  </div>

                  {deleteConfirm === trader.id ? (
                    <div className="flex gap-2 items-center">
                      <div className="flex items-center gap-1 flex-1 text-mission-red mono text-xs">
                        <AlertTriangle className="w-3 h-3" />CONFIRM DELETE?
                      </div>
                      <button onClick={() => handleDelete(trader.id)} className="btn-mission py-1.5 px-3 text-xs">
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="btn-ghost py-1.5 px-3 text-xs">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => openEdit(trader)} className="btn-ghost flex-1 py-1.5 text-xs flex items-center justify-center gap-1">
                        <Edit2 className="w-3 h-3" />EDIT
                      </button>
                      <button
                        onClick={() => handleToggleStatus(trader)}
                        className={`flex-1 py-1.5 text-xs rounded mono font-bold tracking-wider transition-all ${trader.isActive ? 'btn-ghost' : 'btn-amber'}`}
                      >
                        {trader.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                      </button>
                      <button onClick={() => setDeleteConfirm(trader.id)} className="flex-1 py-1.5 text-xs rounded bg-transparent border border-red-900/40 text-mission-red hover:bg-red-900/20 mono font-bold tracking-wider transition-all flex items-center justify-center gap-1">
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
              <div className="glass-card-bright rounded-xl p-5 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="classified-badge mb-1">{editTrader ? 'MODIFY TRADER' : 'REGISTER TRADER'}</div>
                    <h2 className="mono text-xl font-black text-white">{editTrader ? 'EDIT TRADER' : 'NEW TRADE OPERATIVE'}</h2>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-mission-muted hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                {editTrader && (
                  <div className="mission-card rounded-lg p-3 mb-4 flex items-center gap-3">
                    <div className="section-label">TRADER ID:</div>
                    <div className="mono font-black text-mission-amber">{editTrader.traderId}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="section-label block mb-1">OPERATIVE NAME *</label>
                    <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="mission-input" placeholder="Full name / Trader alias" required />
                  </div>

                  {!editTrader && (
                    <div>
                      <label className="section-label block mb-1">
                        TRADER ID <span className="text-mission-muted font-normal normal-case">(leave blank to auto-assign)</span>
                      </label>
                      <input
                        type="text"
                        value={form.traderId}
                        onChange={(e) => setForm((f) => ({ ...f, traderId: e.target.value.toUpperCase() }))}
                        className="mission-input mono tracking-widest"
                        placeholder="e.g. TRADE-001"
                        maxLength={20}
                      />
                    </div>
                  )}

                  <div>
                    <label className="section-label block mb-1">
                      {editTrader ? 'NEW PASSWORD (leave blank to keep)' : 'PASSWORD *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        className="mission-input pr-10"
                        placeholder={editTrader ? 'Leave blank to keep current' : 'Set password'}
                        required={!editTrader}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-mission-muted hover:text-white">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {editTrader && (
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
                      {submitting ? <div className="mission-spinner" /> : editTrader ? 'UPDATE TRADER' : 'REGISTER TRADER'}
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
