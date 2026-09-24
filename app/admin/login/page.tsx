'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'ACCESS DENIED')
      } else {
        router.push('/admin')
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
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="classified-badge mx-auto w-fit mb-3">OMEGA CLEARANCE REQUIRED</div>
          <h1 className="mono text-3xl font-black text-white tracking-wider">MISSION CONTROL</h1>
          <p className="mono text-sm text-mission-muted mt-2 tracking-wider">SUPER ADMIN ACCESS</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-bright rounded-xl p-8 corner-accent"
        >
          <div className="mono text-xs text-mission-muted tracking-widest mb-6 text-center">
            ⚡ AUTHENTICATE TO PROCEED
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
              <label className="section-label block mb-1">ADMIN USERNAME</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mission-input"
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="section-label block mb-1">PASSWORD</label>
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
              className="btn-mission w-full py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="mission-spinner" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  ACCESS MISSION CONTROL
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-mission-border text-center">
            <div className="mono text-xs text-mission-muted tracking-wider">
              ALL ACTIVITY IS MONITORED AND LOGGED
            </div>
          </div>
        </motion.div>

        <div className="text-center mt-6">
          <a href="/" className="mono text-xs text-mission-muted hover:text-white transition-colors tracking-wider">
            ← RETURN TO MISSION HQ
          </a>
        </div>
      </div>
    </div>
  )
}
