'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Coins, Lock, Eye, EyeOff, ShieldAlert, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TradeLoginPage() {
  const router = useRouter()
  const [traderId, setTraderId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!traderId.trim() || !password) {
      toast.error('IDENTIFICATION & CIPHER KEY REQUIRED')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/trade/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traderId: traderId.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'ACCESS DENIED')
      } else {
        toast.success('✓ TRADE CLEARANCE GRANTED')
        router.push('/trade')
        router.refresh()
      }
    } catch {
      toast.error('COMMUNICATION FAILURE')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mission-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-16 h-16 rounded-2xl bg-black/50 border border-yellow-500/40 p-2 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-yellow-500/10"
          >
            <Coins className="w-8 h-8 text-yellow-400" />
          </motion.div>

          <div className="classified-badge mx-auto mb-2 w-fit">
            <span className="animate-blink text-yellow-400">◉</span>
            ASSET LIQUIDATION &amp; TRADE
          </div>

          <h1 className="mono text-2xl sm:text-3xl font-black text-white tracking-widest">
            TRADE DESK
          </h1>
          <p className="mono text-xs text-mission-muted mt-1 tracking-wider">
            AUTHORIZATION LEVEL: TRADE OPERATIVE
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="glass-card-bright rounded-2xl p-6 sm:p-8 corner-accent border-yellow-500/30"
        >
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="section-label block mb-2">TRADER ID / USERNAME</label>
              <div className="relative">
                <input
                  type="text"
                  value={traderId}
                  onChange={(e) => setTraderId(e.target.value.toUpperCase())}
                  placeholder="e.g. TRADE-001"
                  className="mission-input mono tracking-widest text-sm"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="section-label block mb-2">CIPHER PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="mission-input pr-10 mono"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mission-muted hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl mono font-black text-sm tracking-widest bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="mission-spinner border-black" />
              ) : (
                <>
                  <span>AUTHENTICATE OPERATIVE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <div className="flex items-center justify-center gap-1.5 text-mission-muted text-xs mono">
              <Lock className="w-3.5 h-3.5 text-yellow-500/70" />
              <span>CLASSIFIED TRADE TERMINAL — SECURED</span>
            </div>
            <div className="mt-2 mono text-[11px] text-white/40">
              Default credentials: <span className="text-yellow-400/80 font-bold">TRADE-001</span> / <span className="text-yellow-400/80 font-bold">Trade@2026</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
