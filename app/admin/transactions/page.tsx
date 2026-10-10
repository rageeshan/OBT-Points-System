'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Receipt, Zap, Clock, RefreshCw, ArrowDownRight, Coins } from 'lucide-react'

interface Transaction {
  id: string
  txnId: string
  points: number
  note?: string | null
  createdAt: string
  team: { id: string; name: string }
  game?: { id: string; name: string } | null
  facilitator?: { id: string; faciId: string; name: string } | null
  trader?: { id: string; traderId: string; name: string } | null
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 25

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/points?limit=${PAGE_SIZE}&skip=${page * PAGE_SIZE}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions)
        setTotal(data.total)
      }
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-mission-border px-6 py-5 flex items-center justify-between">
        <div>
          <div className="classified-badge mb-2">AUDIT LOG</div>
          <h1 className="mono text-2xl font-black text-white tracking-wider">POINTS HISTORY</h1>
          <p className="text-mission-muted text-sm mt-1">{total} transactions recorded (missions &amp; trade deductions)</p>
        </div>
        <button onClick={fetchTransactions} className="btn-ghost py-2 px-4 text-xs flex items-center gap-2">
          <RefreshCw className="w-3 h-3" />REFRESH
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="mission-spinner w-10 h-10" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="mission-card rounded-xl p-16 text-center">
            <Receipt className="w-12 h-12 text-mission-muted mx-auto mb-4" />
            <div className="mono text-mission-muted">NO TRANSACTIONS RECORDED</div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block mission-card rounded-xl overflow-hidden">
              <table className="mission-table">
                <thead>
                  <tr>
                    <th>TXN ID</th>
                    <th>MISSION UNIT</th>
                    <th>SOURCE / REASON</th>
                    <th>OPERATIVE</th>
                    <th>CREDITS</th>
                    <th>TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn, idx) => {
                    const isDeduction = txn.points < 0
                    return (
                      <motion.tr
                        key={txn.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                      >
                        <td><span className="mono text-xs text-mission-amber">{txn.txnId}</span></td>
                        <td><span className="mono font-bold text-white">{txn.team.name}</span></td>
                        <td>
                          {isDeduction ? (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center gap-1 text-xs text-red-400 font-bold">
                                <ArrowDownRight className="w-3 h-3" /> TRADE DEDUCTION
                              </span>
                              {txn.note && (
                                <span className="text-[11px] text-mission-muted italic">{txn.note}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-mission-muted text-sm">{txn.game?.name || 'MISSION'}</span>
                          )}
                        </td>
                        <td>
                          {isDeduction ? (
                            <span className="mono text-xs text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                              {txn.trader?.traderId || 'TRADER'}
                            </span>
                          ) : (
                            <span className="mono text-xs text-blue-400">
                              {txn.facilitator?.faciId || 'HQ'}
                            </span>
                          )}
                        </td>
                        <td>
                          {isDeduction ? (
                            <span className="mono font-bold text-red-400 flex items-center gap-1">
                              <ArrowDownRight className="w-3 h-3" />{txn.points}
                            </span>
                          ) : (
                            <span className="mono font-bold text-green-400 flex items-center gap-1">
                              <Zap className="w-3 h-3" />+{txn.points}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-1 text-mission-muted">
                            <Clock className="w-3 h-3" />
                            <span className="mono text-xs" suppressHydrationWarning>
                              {new Date(txn.createdAt).toLocaleString('en-GB', {
                                day: '2-digit', month: '2-digit', year: '2-digit',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {transactions.map((txn, idx) => {
                const isDeduction = txn.points < 0
                return (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="mission-card rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="mono text-xs text-mission-amber">{txn.txnId}</span>
                      {isDeduction ? (
                        <span className="mono font-bold text-red-400 flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3" />{txn.points}
                        </span>
                      ) : (
                        <span className="mono font-bold text-green-400 flex items-center gap-1">
                          <Zap className="w-3 h-3" />+{txn.points}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="mono font-bold text-white">{txn.team.name}</div>
                        <div className="text-mission-muted text-xs">
                          {isDeduction ? `TRADE: ${txn.note || 'Deduction'}` : txn.game?.name || 'MISSION'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mono text-xs text-amber-400">
                          {isDeduction ? (txn.trader?.traderId || 'TRADER') : (txn.facilitator?.faciId || 'HQ')}
                        </div>
                        <div className="mono text-xs text-mission-muted" suppressHydrationWarning>
                          {new Date(txn.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="mono text-sm text-mission-muted">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn-ghost py-2 px-4 text-xs disabled:opacity-40"
                >
                  ← PREV
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * PAGE_SIZE >= total}
                  className="btn-ghost py-2 px-4 text-xs disabled:opacity-40"
                >
                  NEXT →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
