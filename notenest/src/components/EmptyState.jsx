import React from 'react'

export default function EmptyState({
  title = 'No notes found',
  description = 'Create a new note to start capturing your ideas and tasks.',
  actionLabel = 'Create Note',
  onAction,
  icon = '📝',
}) {
  return (
    <div className="empty-state-container">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {onAction && actionLabel && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          <span className="btn-icon">+</span> {actionLabel}
        </button>
      )}
    </div>
  )
}
