'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Terminal, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react'

export default function FaciLoginPage() {
  const router = useRouter()
  const [faciId, setFaciId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/faci/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faciId: faciId.toUpperCase(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'ACCESS DENIED')
      } else {
        router.push('/faci/dashboard')
      }
    } catch {
      setError('SYSTEM ERROR — RETRY')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mission-bg min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-full border-2 border-mission-amber/40 flex items-center justify-center bg-mission-amber/10 mx-auto mb-4"
          >
            <Terminal className="w-8 h-8 text-mission-amber" />
          </motion.div>
          <div className="classified-badge mx-auto w-fit mb-3">AGENT AUTHENTICATION</div>
          <h1 className="mono text-3xl font-black text-white tracking-wider">FACI LOGIN</h1>
          <p className="mono text-sm text-mission-muted mt-2 tracking-wider">MISSION OFFICER ACCESS PORTAL</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-bright rounded-xl p-8 corner-accent"
        >
          <div className="text-center mb-6">
            <div className="mono text-xs text-mission-muted tracking-widest">
              ⚡ ENTER YOUR AGENT CREDENTIALS
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-red-900/20 border border-red-900/40 rounded-lg p-3 mb-4"
            >
              <AlertTriangle className="w-4 h-4 text-mission-red flex-shrink-0" />
              <span className="mono text-sm text-mission-red">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="section-label block mb-1">AGENT ID</label>
              <input
                type="text"
                value={faciId}
                onChange={(e) => setFaciId(e.target.value.toUpperCase())}
                className="mission-input"
                placeholder="FACI-001"
                autoComplete="username"
                required
              />
              <div className="mono text-xs text-mission-muted mt-1">Format: FACI-001, FACI-002...</div>
            </div>

            <div>
              <label className="section-label block mb-1">SECURITY CODE</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mission-input pr-10"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mission-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-amber w-full py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="mission-spinner border-amber-200 border-t-mission-amber" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  AUTHENTICATE AGENT
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-mission-border text-center">
            <div className="mono text-xs text-mission-muted tracking-wider">
              UNAUTHORIZED ACCESS IS PROHIBITED AND MONITORED
            </div>
          </div>
        </motion.div>

        <div className="text-center mt-6 space-y-2">
          <a href="/" className="mono text-xs text-mission-muted hover:text-white transition-colors tracking-wider block">
            ← RETURN TO MISSION HQ
          </a>
          <a href="/leaderboard" className="mono text-xs text-mission-muted hover:text-mission-amber transition-colors tracking-wider block">
            📊 VIEW LIVE RANKING
          </a>
        </div>
      </div>
    </div>
  )
}
