'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface PointsModalProps {
  isOpen: boolean
  teamName: string
  gameName: string
  points: number
  onConfirm: () => void
  onAbort: () => void
  isLoading?: boolean
}

export default function PointsModal({
  isOpen,
  teamName,
  gameName,
  points,
  onConfirm,
  onAbort,
  isLoading = false,
}: PointsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onAbort}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-card-bright rounded-xl p-8 w-full max-w-sm corner-accent">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mono text-xs font-bold tracking-widest text-mission-red mb-2">
                  ⚡ CONFIRM MISSION RESULT
                </div>
                <div className="w-12 h-px bg-mission-red/40 mx-auto" />
              </div>

              {/* Details */}
              <div className="space-y-4 mb-6">
                <div className="mission-card rounded-lg p-4 space-y-3">
                  <div>
                    <div className="section-label">MISSION UNIT</div>
                    <div className="mono font-bold text-white text-lg">{teamName.toUpperCase()}</div>
                  </div>
                  <div>
                    <div className="section-label">MISSION</div>
                    <div className="font-semibold text-white">{gameName}</div>
                  </div>
                  <div>
                    <div className="section-label">CREDITS AWARDED</div>
                    <div className="mono font-black text-3xl text-mission-amber">
                      +{points.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-mission-amber/10 border border-mission-amber/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-mission-amber flex-shrink-0" />
                  <span className="mono text-xs text-mission-amber">
                    THIS ACTION CANNOT BE UNDONE
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onAbort}
                  disabled={isLoading}
                  className="btn-ghost flex-1"
                >
                  ABORT
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="btn-mission flex-1 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="mission-spinner" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      CONFIRM
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
