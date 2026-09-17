import React from 'react'
import NoteCard from './NoteCard'
import EmptyState from './EmptyState'

export default function NoteList({
  notes = [],
  onSelectNote,
  onTogglePin,
  onDeleteNote,
  onCreateNote,
  searchQuery = '',
}) {
  if (notes.length === 0) {
    return (
      <EmptyState
        title={searchQuery ? 'No matching notes found' : 'No notes created yet'}
        description={
          searchQuery
            ? `We couldn't find any notes matching "${searchQuery}". Try clearing your search or filters.`
            : 'Capture your thoughts, ideas, tasks, and project documentation in one place.'
        }
        actionLabel={searchQuery ? null : 'Create Note'}
        onAction={searchQuery ? null : onCreateNote}
      />
    )
  }

  const pinnedNotes = notes.filter((n) => n.pinned)
  const unpinnedNotes = notes.filter((n) => !n.pinned)

  return (
    <div className="note-list-container">
      {pinnedNotes.length > 0 && (
        <div className="note-section">
          <div className="note-section-title">
            <span>⭐ Pinned Notes ({pinnedNotes.length})</span>
          </div>
          <div className="note-grid">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onSelect={onSelectNote}
                onTogglePin={onTogglePin}
                onDelete={onDeleteNote}
              />
            ))}
          </div>
        </div>
      )}

      {unpinnedNotes.length > 0 && (
        <div className="note-section">
          {pinnedNotes.length > 0 && (
            <div className="note-section-title">
              <span>📝 Other Notes ({unpinnedNotes.length})</span>
            </div>
          )}
          <div className="note-grid">
            {unpinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onSelect={onSelectNote}
                onTogglePin={onTogglePin}
                onDelete={onDeleteNote}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
