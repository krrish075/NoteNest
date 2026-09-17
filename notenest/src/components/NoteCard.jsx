import React from 'react'

function getTextPreview(html = '') {
  if (!html) return ''
  const temporaryElement = document.createElement('div')
  temporaryElement.innerHTML = html
  const text = temporaryElement.textContent || temporaryElement.innerText || ''
  return text.trim()
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const diff = Date.now() - date.getTime()

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function NoteCard({
  note,
  onSelect,
  onTogglePin,
  onDelete,
}) {
  const previewText = getTextPreview(note.content)

  return (
    <div
      className={`note-card ${note.pinned ? 'pinned-card' : ''}`}
      onClick={() => onSelect(note)}
    >
      <div className="note-card-header">
        <div className="note-card-title-group">
          <span className="note-subject-pill">{note.subject || 'General'}</span>
          <h4 className="note-card-title">{note.title || 'Untitled Note'}</h4>
        </div>
        <button
          type="button"
          className={`pin-btn ${note.pinned ? 'active' : ''}`}
          title={note.pinned ? 'Unpin note' : 'Pin note to top'}
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin(note)
          }}
        >
          {note.pinned ? '★' : '☆'}
        </button>
      </div>

      <p className="note-card-preview">
        {previewText || <span className="empty-preview">No content preview</span>}
      </p>

      {note.tags && note.tags.length > 0 && (
        <div className="note-card-tags">
          {note.tags.map((tag, idx) => (
            <span key={idx} className="tag-chip">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="note-card-footer">
        <span className="note-card-date">{formatDate(note.updatedAt || note.createdAt)}</span>
        <div className="note-card-actions">
          <button
            type="button"
            className="card-action-btn edit-action"
            title="Edit note"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(note)
            }}
          >
            ✏️
          </button>
          <button
            type="button"
            className="card-action-btn delete-action"
            title="Delete note"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(note.id)
            }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}
