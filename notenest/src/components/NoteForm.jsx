import React, { useState } from 'react'
import RichTextEditor from './RichTextEditor'

const DEFAULT_SUBJECTS = ['General', 'Work', 'Personal', 'Ideas', 'Projects', 'Tasks']

export default function NoteForm({
  initialData = {},
  isEditing = false,
  isSaving = false,
  subjects = DEFAULT_SUBJECTS,
  onSave,
  onCancel,
}) {
  const [title, setTitle] = useState(initialData.title || '')
  const [subject, setSubject] = useState(initialData.subject || 'General')
  const [customSubject, setCustomSubject] = useState('')
  const [isCustomSubject, setIsCustomSubject] = useState(
    initialData.subject && !DEFAULT_SUBJECTS.includes(initialData.subject)
  )
  const [tags, setTags] = useState(initialData.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [content, setContent] = useState(initialData.content || '')
  const [pinned, setPinned] = useState(Boolean(initialData.pinned))
  const [validationError, setValidationError] = useState('')

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '')
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setValidationError('')

    const finalTitle = title.trim()
    const finalSubject = isCustomSubject
      ? customSubject.trim() || 'General'
      : subject

    if (!finalTitle && !content.trim()) {
      setValidationError('Please provide either a title or note content before saving.')
      return
    }

    onSave({
      title: finalTitle || 'Untitled Note',
      subject: finalSubject,
      tags,
      content,
      pinned,
    })
  }

  return (
    <form className="note-form-container" onSubmit={handleSubmit}>
      <div className="note-form-header">
        <div className="note-form-title-group">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
            disabled={isSaving}
          >
            ← Back
          </button>
          <h2 className="note-form-heading">
            {isEditing ? 'Edit Note' : 'Create New Note'}
          </h2>
        </div>

        <div className="note-form-header-actions">
          <label className="pin-checkbox-label">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              disabled={isSaving}
            />
            <span className="pin-checkbox-custom">
              {pinned ? '⭐ Pinned' : '☆ Pin Note'}
            </span>
          </label>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="btn-spinner-wrapper">
                <span className="spinner-sm" /> Saving...
              </span>
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Create Note'
            )}
          </button>
        </div>
      </div>

      {validationError && (
        <div className="form-validation-alert" role="alert">
          ⚠️ {validationError}
        </div>
      )}

      <div className="note-form-grid">
        <div className="form-group title-group">
          <input
            type="text"
            className="form-input note-title-input"
            placeholder="Note Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSaving}
            autoFocus
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category / Subject</label>
            {!isCustomSubject ? (
              <div className="subject-select-wrapper">
                <select
                  className="form-select"
                  value={subject}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setIsCustomSubject(true)
                    } else {
                      setSubject(e.target.value)
                    }
                  }}
                  disabled={isSaving}
                >
                  {Array.from(new Set([...DEFAULT_SUBJECTS, ...subjects])).map(
                    (sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    )
                  )}
                  <option value="__CUSTOM__">+ New Category...</option>
                </select>
              </div>
            ) : (
              <div className="custom-subject-wrapper">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter category name..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  disabled={isSaving}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => setIsCustomSubject(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <div className="tags-input-container">
              <div className="tags-chip-list">
                {tags.map((tag) => (
                  <span key={tag} className="tag-chip editable">
                    #{tag}
                    <button
                      type="button"
                      className="tag-remove-btn"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={isSaving}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="tag-add-inline">
                <input
                  type="text"
                  className="tag-input"
                  placeholder="Add tag (Press Enter)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  disabled={isSaving}
                />
                {tagInput.trim() && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={handleAddTag}
                    disabled={isSaving}
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="form-group editor-group">
        <label className="form-label">Content</label>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Write your note using rich text formatting, lists, headings, links, and code blocks..."
        />
      </div>
    </form>
  )
}
