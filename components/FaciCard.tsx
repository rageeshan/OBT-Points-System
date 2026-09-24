'use client'

import { motion } from 'framer-motion'
import { Lock, CheckCircle, MapPin } from 'lucide-react'

interface FaciCardProps {
  faciId: string
  name: string
  gameName?: string
  location?: string
  isActive: boolean
  onEdit?: () => void
  onDelete?: () => void
  onToggleStatus?: () => void
}

export default function FaciCard({
  faciId,
  name,
  gameName,
  location,
  isActive,
  onEdit,
  onDelete,
  onToggleStatus,
}: FaciCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mission-card rounded-lg p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="section-label">MISSION OFFICER</div>
          <div className="mono font-black text-xl text-white tracking-widest">{faciId}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isActive ? (
            <span className="status-active">ACTIVE</span>
          ) : (
            <span className="status-inactive">INACTIVE</span>
          )}
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-mission-muted" />
            <span className="mono text-xs text-mission-muted">SECURED</span>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="mb-3">
        <div className="section-label">OPERATIVE NAME</div>
        <div className="text-white font-semibold">{name}</div>
      </div>

      {/* Assigned Mission */}
      <div className="mb-3">
        <div className="section-label">ASSIGNED MISSION</div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3 h-3 text-mission-green" />
          <span className="text-white text-sm">{gameName || '— UNASSIGNED —'}</span>
        </div>
      </div>

      {/* Location */}
      <div className="mb-4">
        <div className="section-label">LOCATION</div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3 h-3 text-mission-amber" />
          <span className="text-white text-sm">{location || '— UNKNOWN —'}</span>
        </div>
      </div>

      {/* Actions */}
      {(onEdit || onDelete || onToggleStatus) && (
        <div className="border-t border-mission-border pt-3 flex gap-2 flex-wrap">
          {onEdit && (
            <button onClick={onEdit} className="btn-ghost py-1.5 px-3 text-xs flex-1">
              EDIT
            </button>
          )}
          {onToggleStatus && (
            <button
              onClick={onToggleStatus}
              className={`py-1.5 px-3 text-xs flex-1 rounded ${
                isActive
                  ? 'btn-ghost'
                  : 'btn-amber'
              }`}
            >
              {isActive ? 'DEACTIVATE' : 'ACTIVATE'}
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="py-1.5 px-3 text-xs flex-1 bg-transparent border border-red-900/40 text-mission-red rounded hover:bg-red-900/20 mono font-bold tracking-wider transition-all"
            >
              DELETE
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
