import React from 'react'
import { FolderOpen } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ElementType
}

export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  icon: Icon = FolderOpen 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl shadow-sm border border-gray-100 h-full min-h-[400px]">
      <div className="w-16 h-16 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full flex items-center justify-center mb-4">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg font-medium hover:bg-[var(--color-primary)]/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
      {!actionLabel && (
         <p className="text-xs text-gray-400 italic">Module en cours de finalisation (Phase 5)</p>
      )}
    </div>
  )
}
