import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notesApi } from '../api'
import { useAuth } from '../context/AuthContext'

import DashboardLayout from '../components/DashboardLayout'
import SearchBar from '../components/SearchBar'
import FilterControls from '../components/FilterControls'
import NoteList from '../components/NoteList'
import NoteForm from '../components/NoteForm'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorMessage from '../components/ErrorMessage'
import ConfirmDialog from '../components/ConfirmDialog'
import SettingsView from '../components/SettingsView'

export default function Notes() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  // App State
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // View state: 'notes' | 'favorites' | 'editor' | 'settings'
  const [view, setView] = useState('notes')
  const [editingNote, setEditingNote] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  // Filtering & Sorting State
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [selectedTag, setSelectedTag] = useState('All')
  const [sortBy, setSortBy] = useState('updated')

  // Deletion Modal State
  const [deleteId, setDeleteId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('notenest-theme') === 'dark'
  })

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('notenest-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  // Load notes on mount
  const fetchNotes = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await notesApi.getAll()
      setNotes(result.data || [])
    } catch (err) {
      console.error('Failed to fetch notes:', err)
      setError(err.message || 'Failed to connect to notes server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [])

  function showToast(message) {
    setToast(message)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  // Categories & Tags lists
  const subjects = useMemo(() => {
    return [...new Set(notes.map((n) => n.subject).filter(Boolean))].sort()
  }, [notes])

  const allTags = useMemo(() => {
    return [...new Set(notes.flatMap((n) => n.tags || []).filter(Boolean))].sort()
  }, [notes])

  const pinnedCount = useMemo(() => {
    return notes.filter((n) => n.pinned).length
  }, [notes])

  // Filter & Sort Logic
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        // Nav filter
        if (view === 'favorites' && !note.pinned) return false

        // Category filter
        if (selectedSubject !== 'All' && note.subject !== selectedSubject) return false

        // Tag filter
        if (selectedTag !== 'All' && (!note.tags || !note.tags.includes(selectedTag))) return false

        // Search query filter
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.toLowerCase().trim()
          const titleMatch = note.title?.toLowerCase().includes(q)
          const contentMatch = note.content?.toLowerCase().includes(q)
          const subjectMatch = note.subject?.toLowerCase().includes(q)
          const tagMatch = note.tags?.some((t) => t.toLowerCase().includes(q))
          if (!titleMatch && !contentMatch && !subjectMatch && !tagMatch) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'created') {
          return new Date(b.createdAt) - new Date(a.createdAt)
        }
        if (sortBy === 'alpha-asc') {
          return (a.title || '').localeCompare(b.title || '')
        }
        if (sortBy === 'alpha-desc') {
          return (b.title || '').localeCompare(a.title || '')
        }
        // Default: updated
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      })
  }, [notes, view, selectedSubject, selectedTag, debouncedSearch, sortBy])

  // Navigation handlers
  const handleOpenNewNote = () => {
    setEditingNote(null)
    setView('editor')
  }

  const handleSelectNote = (note) => {
    setEditingNote(note)
    setView('editor')
  }

  // CRUD Actions
  const handleSaveNote = async (formData) => {
    try {
      setIsSaving(true)
      setError('')

      if (editingNote && editingNote.id) {
        // Update
        const res = await notesApi.update(editingNote.id, formData)
        setNotes((prev) => prev.map((n) => (n.id === editingNote.id ? res.data : n)))
        showToast('Note updated successfully')
      } else {
        // Create
        const res = await notesApi.create(formData)
        setNotes((prev) => [res.data, ...prev])
        showToast('Note created successfully')
      }

      setView('notes')
      setEditingNote(null)
    } catch (err) {
      console.error('Failed to save note:', err)
      setError(err.message || 'Failed to save note to database')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTogglePin = async (note) => {
    try {
      const res = await notesApi.update(note.id, { pinned: !note.pinned })
      setNotes((prev) => prev.map((n) => (n.id === note.id ? res.data : n)))
      showToast(res.data.pinned ? 'Pinned to top' : 'Unpinned from top')
    } catch (err) {
      console.error('Failed to toggle pin:', err)
      setError(err.message || 'Failed to update pin status')
    }
  }

  const handlePromptDelete = (id) => {
    setDeleteId(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return
    try {
      setIsDeleting(true)
      setError('')
      await notesApi.delete(deleteId)
      setNotes((prev) => prev.filter((n) => n.id !== deleteId))
      showToast('Note deleted successfully')
      setDeleteId(null)
    } catch (err) {
      console.error('Failed to delete note:', err)
      setError(err.message || 'Failed to delete note')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <DashboardLayout
      activeNav={view}
      onSelectNav={(newNav) => {
        setView(newNav)
        if (newNav !== 'editor') setEditingNote(null)
      }}
      notesCount={notes.length}
      pinnedCount={pinnedCount}
      subjects={subjects}
      selectedSubject={selectedSubject}
      onSelectSubject={setSelectedSubject}
      user={user}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode(!darkMode)}
      onLogout={handleLogout}
      onCreateNote={handleOpenNewNote}
      toastMessage={toast}
    >
      {/* Top Header Controls Bar */}
      {view !== 'editor' && view !== 'settings' && (
        <div className="dashboard-header-bar">
          <div className="welcome-headline">
            <h1 className="welcome-title">
              {view === 'favorites' ? '⭐ Favorite Notes' : `Welcome back, ${user?.name || 'User'}!`}
            </h1>
            <p className="welcome-subtext">
              {view === 'favorites'
                ? 'Your pinned notes for rapid access'
                : 'Organize your thoughts, tasks, ideas, and rich documentation.'}
            </p>
          </div>

          <div className="dashboard-top-actions">
            <SearchBar
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenNewNote}
            >
              + Create Note
            </button>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {error && <ErrorMessage message={error} onRetry={fetchNotes} />}

      {/* View Content */}
      {view === 'editor' ? (
        <NoteForm
          initialData={editingNote || {}}
          isEditing={Boolean(editingNote)}
          isSaving={isSaving}
          subjects={subjects}
          onSave={handleSaveNote}
          onCancel={() => {
            setView('notes')
            setEditingNote(null)
          }}
        />
      ) : view === 'settings' ? (
        <SettingsView
          user={user}
          notesCount={notes.length}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />
      ) : (
        <>
          {/* Filters & Sorting */}
          <FilterControls
            subjects={subjects}
            selectedSubject={selectedSubject}
            onSelectSubject={setSelectedSubject}
            allTags={allTags}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            sortBy={sortBy}
            onSelectSort={setSortBy}
          />

          {/* Note List / Loading / Empty State */}
          {loading ? (
            <LoadingSkeleton count={6} />
          ) : (
            <NoteList
              notes={filteredNotes}
              onSelectNote={handleSelectNote}
              onTogglePin={handleTogglePin}
              onDeleteNote={handlePromptDelete}
              onCreateNote={handleOpenNewNote}
              searchQuery={debouncedSearch}
            />
          )}
        </>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Note"
        message="Are you sure you want to permanently delete this note? This action cannot be undone."
        confirmText="Delete Note"
        cancelText="Cancel"
        isDanger={true}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </DashboardLayout>
  )
}
