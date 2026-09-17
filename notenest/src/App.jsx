import RichTextEditor from './components/RichTextEditor'
import { notesApi } from './api'
import { useEffect, useMemo, useState } from 'react'

const _starterNotes = [
  {
    id: 1,
    title: 'Java OOP Concepts',
    subject: 'Java',
    tags: ['OOP', 'Java'],
    content:
      'What is OOP?\n\nObject-Oriented Programming is a programming paradigm that uses objects and classes to design applications.\n\nKey Concepts\n\n• Class\n• Object\n• Encapsulation\n• Inheritance\n• Polymorphism',
    pinned: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Database Normalization',
    subject: 'DBMS',
    tags: ['1NF', '2NF', '3NF'],
    content:
      'Normalization organizes database tables to reduce redundancy and improve data integrity.\n\n1NF: Atomic values\n2NF: No partial dependency\n3NF: No transitive dependency',
    pinned: false,
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 3,
    title: 'Process Scheduling',
    subject: 'Operating Systems',
    tags: ['FCFS', 'SJF'],
    content:
      'Process scheduling determines which process gets CPU time.\n\nImportant algorithms:\n• FCFS\n• SJF\n• Priority Scheduling\n• Round Robin',
    pinned: false,
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

const emptyNote = {
  title: '',
  subject: 'General',
  tags: [],
  content: '',
  pinned: false,
}

function getTextPreview(html = '') {
  const temporaryElement = document.createElement('div')
  temporaryElement.innerHTML = html
  return temporaryElement.textContent || temporaryElement.innerText || ''
}

function App() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('notenest-theme') === 'dark'
  })

  const [page, setPage] = useState('dashboard')
  const [selectedNote, setSelectedNote] = useState(null)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('All')
  const [editor, setEditor] = useState(emptyNote)
  const [isEditing, setIsEditing] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true)
        setError('')

        const result = await notesApi.getAll()
        setNotes(result.data)
      } catch (err) {
        console.error('Failed to load notes:', err)
        setError(err.message || 'Failed to load notes')
      } finally {
        setLoading(false)
      }
    }

    loadNotes()
  }, [])

  useEffect(() => {
    localStorage.setItem('notenest-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  const subjects = useMemo(() => {
    return [...new Set(notes.map((note) => note.subject))].sort()
  }, [notes])

  const allTags = useMemo(() => {
    return [...new Set(notes.flatMap((note) => note.tags))].sort()
  }, [notes])

  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        const query = search.toLowerCase().trim()

        const matchesSearch =
          !query ||
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.subject.toLowerCase().includes(query) ||
          note.tags.some((tag) => tag.toLowerCase().includes(query))

        const matchesSubject =
          subjectFilter === 'All' || note.subject === subjectFilter

        return matchesSearch && matchesSubject
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return new Date(b.updatedAt) - new Date(a.updatedAt)
      })
  }, [notes, search, subjectFilter])

  function showToast(message) {
    setToast(message)
  }

  function formatDate(date) {
    const diff = Date.now() - new Date(date).getTime()

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`

    return new Date(date).toLocaleDateString()
  }

  function openNewNote() {
    setEditor({ ...emptyNote })
    setSelectedNote(null)
    setIsEditing(false)
    setPage('editor')
  }

  function openNote(note) {
    setEditor({
      title: note.title,
      subject: note.subject,
      tags: note.tags || [],
      content: note.content,
      pinned: note.pinned,
    })
    setSelectedNote(note.id)
    setIsEditing(true)
    setPage('editor')
  }

  function handleEditorChange(event) {
    const { name, value } = event.target
    setEditor((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function saveNote() {
    if (!editor.title.trim() && !editor.content.trim()) {
      showToast('Write something before saving')
      return
    }

    const noteData = {
      ...(isEditing && selectedNote !== null ? { id: selectedNote } : {}),
      title: editor.title.trim() || 'Untitled note',
      subject: editor.subject || 'General',
      content: editor.content || '',
      tags: editor.tags || [],
      pinned: Boolean(editor.pinned),
    }

    try {
      setError('')

      if (noteData.id) {
        const result = await notesApi.update(noteData.id, {
          title: noteData.title,
          subject: noteData.subject || 'General',
          content: noteData.content || '',
          tags: noteData.tags || [],
          pinned: Boolean(noteData.pinned),
        })

        setNotes((previousNotes) =>
          previousNotes.map((note) =>
            note.id === noteData.id ? result.data : note
          )
        )

        showToast('Note updated')
      } else {
        const result = await notesApi.create({
          title: noteData.title,
          subject: noteData.subject || 'General',
          content: noteData.content || '',
          tags: noteData.tags || [],
          pinned: Boolean(noteData.pinned),
        })

        setNotes((previousNotes) => [result.data, ...previousNotes])
        setSelectedNote(result.data.id)
        setIsEditing(true)
        showToast('Note created')
      }

      setPage('notes')
    } catch (err) {
      console.error('Failed to save note:', err)
      setError(err.message || 'Failed to save note')
    }
  }

  async function deleteNote(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this note?'
    )

    if (!confirmed) return

    try {
      setError('')

      await notesApi.delete(id)

      setNotes((previousNotes) =>
        previousNotes.filter((note) => note.id !== id)
      )

      if (selectedNote === id) {
        setSelectedNote(null)
        setPage('notes')
      }

      showToast('Note deleted')
    } catch (err) {
      console.error('Failed to delete note:', err)
      setError(err.message || 'Failed to delete note')
    }
  }

  async function togglePin(note) {
    try {
      setError('')

      const result = await notesApi.update(note.id, {
        pinned: !note.pinned,
      })

      setNotes((previousNotes) =>
        previousNotes.map((item) =>
          item.id === note.id ? result.data : item
        )
      )

      showToast('Pin status updated')
    } catch (err) {
      console.error('Failed to update pin:', err)
      setError(err.message || 'Failed to update pin status')
    }
  }

  function toggleEditorPin() {
    setEditor((current) => ({
      ...current,
      pinned: !current.pinned,
    }))
  }

  function addTag() {
    const tag = window.prompt('Enter a tag')

    if (!tag || !tag.trim()) return

    const cleanTag = tag.trim()

    if (editor.tags.includes(cleanTag)) {
      showToast('Tag already exists')
      return
    }

    setEditor((current) => ({
      ...current,
      tags: [...current.tags, cleanTag],
    }))
  }

  function removeTag(tagToRemove) {
    setEditor((current) => ({
      ...current,
      tags: current.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  function navigate(nextPage) {
    setPage(nextPage)
    if (nextPage !== 'editor') {
      setSelectedNote(null)
    }
  }

  function selectSubject(subject) {
    setSubjectFilter(subject)
    setPage('notes')
  }

  return (
    <div className={darkMode ? 'app dark' : 'app'}>
      <Sidebar
        page={page}
        navigate={navigate}
        openNewNote={openNewNote}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <main className="main">
        <header className="topbar">
          <div className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes, subjects, or tags..."
            />
          </div>

          <div className="topbar-actions">
            <button className="icon-button" title="Notifications">
              ♧
            </button>
            <div className="avatar">K</div>
          </div>
        </header>

        <div className="content">
          {error && <div className="empty-state">{error}</div>}
          {loading && <div className="empty-state">Loading notes...</div>}

          {page === 'dashboard' && (
            <Dashboard
              notes={notes}
              subjects={subjects}
              filteredNotes={filteredNotes}
              openNewNote={openNewNote}
              openNote={openNote}
              selectSubject={selectSubject}
              navigate={navigate}
              formatDate={formatDate}
            />
          )}

          {page === 'notes' && (
            <NotesPage
              notes={filteredNotes}
              subjects={subjects}
              subjectFilter={subjectFilter}
              setSubjectFilter={setSubjectFilter}
              openNewNote={openNewNote}
              openNote={openNote}
              deleteNote={deleteNote}
              togglePin={togglePin}
              formatDate={formatDate}
            />
          )}

          {page === 'subjects' && (
            <SubjectsPage
              subjects={subjects}
              notes={notes}
              selectSubject={selectSubject}
              openNewNote={openNewNote}
            />
          )}

          {page === 'tags' && (
            <TagsPage
              tags={allTags}
              notes={notes}
              setSearch={setSearch}
              navigate={navigate}
            />
          )}

          {page === 'settings' && (
            <SettingsPage
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              notes={notes}
              setNotes={setNotes}
            />
          )}

          {page === 'editor' && (
            <EditorPage
              editor={editor}
              isEditing={isEditing}
              handleEditorChange={handleEditorChange}
              saveNote={saveNote}
              toggleEditorPin={toggleEditorPin}
              addTag={addTag}
              removeTag={removeTag}
              navigate={navigate}
            />
          )}
        </div>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function Sidebar({
  page,
  navigate,
  openNewNote,
  darkMode,
  setDarkMode,
}) {
  const navItems = [
    { id: 'dashboard', icon: '⌂', label: 'Home' },
    { id: 'notes', icon: '▤', label: 'All Notes' },
    { id: 'subjects', icon: '◇', label: 'Subjects' },
    { id: 'tags', icon: '♢', label: 'Tags' },
    { id: 'settings', icon: '⚙', label: 'Settings' },
  ]

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">N</div>
        <span>NoteNest</span>
      </div>

      <nav className="nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={page === item.id ? 'nav-item active' : 'nav-item'}
            onClick={() => navigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <button className="new-note-button" onClick={openNewNote}>
        <span>＋</span>
        <span className="new-note-label">New Note</span>
      </button>

      <div className="sidebar-bottom">
        <button
          className="nav-item"
          onClick={() => setDarkMode((current) => !current)}
        >
          <span className="nav-icon">{darkMode ? '☀' : '☾'}</span>
          <span className="nav-label">
            {darkMode ? 'Light mode' : 'Dark mode'}
          </span>
        </button>

        <div className="profile">
          <div className="avatar">K</div>
          <div className="profile-info">
            <strong>Krrish</strong>
            <span>Student workspace</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Dashboard({
  notes,
  subjects,
  filteredNotes,
  openNewNote,
  openNote,
  selectSubject,
  navigate,
  formatDate,
}) {
  const pinnedCount = notes.filter((note) => note.pinned).length
  const draftCount = notes.filter(
    (note) => !note.title.trim() || !note.content.trim()
  ).length

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your personal workspace</p>
          <h1>Good morning, Krrish 👋</h1>
          <p className="subtitle">Pick up where you left off.</p>
        </div>

        <button className="primary-button" onClick={openNewNote}>
          ＋ New Note
        </button>
      </div>

      <div className="stats-grid">
        <StatCard icon="▤" label="Total Notes" value={notes.length} />
        <StatCard icon="◇" label="Subjects" value={subjects.length} />
        <StatCard icon="★" label="Pinned" value={pinnedCount} />
        <StatCard icon="✎" label="Drafts" value={draftCount} />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <PanelHeader
            title="Recent Notes"
            action="View all →"
            onAction={() => navigate('notes')}
          />

          {filteredNotes.slice(0, 5).map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              openNote={openNote}
              formatDate={formatDate}
            />
          ))}

          {notes.length === 0 && (
            <EmptyState
              message="No notes yet. Create your first note."
              buttonText="Create note"
              onClick={openNewNote}
            />
          )}
        </section>

        <section className="panel">
          <PanelHeader
            title="Subjects"
            action="View all →"
            onAction={() => navigate('subjects')}
          />

          {subjects.slice(0, 6).map((subject, index) => (
            <SubjectRow
              key={subject}
              subject={subject}
              count={notes.filter((note) => note.subject === subject).length}
              index={index}
              onClick={() => selectSubject(subject)}
            />
          ))}

          {subjects.length === 0 && (
            <div className="empty-state">No subjects yet.</div>
          )}
        </section>
      </div>
    </section>
  )
}

function NotesPage({
  notes,
  subjects,
  subjectFilter,
  setSubjectFilter,
  openNewNote,
  openNote,
  deleteNote,
  togglePin,
  formatDate,
}) {
  const filters = ['All', 'Pinned', ...subjects]

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1>All Notes</h1>
          <p className="subtitle">Everything you've written, in one place.</p>
        </div>

        <button className="primary-button" onClick={openNewNote}>
          ＋ New Note
        </button>
      </div>

      <div className="filter-bar">
        {filters.map((filter) => (
          <button
            key={filter}
            className={
              subjectFilter === filter
                ? 'filter-button selected'
                : 'filter-button'
            }
            onClick={() => setSubjectFilter(filter)}
          >
            {filter === 'All' ? 'All Notes' : filter}
          </button>
        ))}
      </div>

      <section className="panel notes-panel">
        <div className="list-header">
          <strong>Notes library</strong>
          <span>{notes.length} notes</span>
        </div>

        {notes.map((note) => (
          <NoteRow
            key={note.id}
            note={note}
            openNote={openNote}
            deleteNote={deleteNote}
            togglePin={togglePin}
            formatDate={formatDate}
            showActions
          />
        ))}

        {notes.length === 0 && (
          <EmptyState
            message="No notes match your filters."
            buttonText="Create note"
            onClick={openNewNote}
          />
        )}
      </section>
    </section>
  )
}

function SubjectsPage({ subjects, notes, selectSubject, openNewNote }) {
  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Organize your learning</p>
          <h1>Subjects</h1>
          <p className="subtitle">Group notes by what you're studying.</p>
        </div>

        <button className="primary-button" onClick={openNewNote}>
          ＋ Add Note
        </button>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>My Subjects</h2>
        </div>

        {subjects.map((subject, index) => (
          <SubjectRow
            key={subject}
            subject={subject}
            count={notes.filter((note) => note.subject === subject).length}
            index={index}
            onClick={() => selectSubject(subject)}
          />
        ))}

        {subjects.length === 0 && (
          <EmptyState
            message="Subjects will appear when you create notes."
            buttonText="Create note"
            onClick={openNewNote}
          />
        )}
      </section>
    </section>
  )
}

function TagsPage({ tags, notes, setSearch, navigate }) {
  function searchTag(tag) {
    setSearch(tag)
    navigate('notes')
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Browse by topic</p>
          <h1>Tags</h1>
          <p className="subtitle">Find notes through the ideas they contain.</p>
        </div>
      </div>

      <section className="panel tags-panel">
        {tags.map((tag) => (
          <button
            key={tag}
            className="tag-chip large"
            onClick={() => searchTag(tag)}
          >
            # {tag}
            <span>{notes.filter((note) => note.tags.includes(tag)).length}</span>
          </button>
        ))}

        {tags.length === 0 && (
          <div className="empty-state">No tags yet.</div>
        )}
      </section>
    </section>
  )
}

function SettingsPage({ darkMode, setDarkMode, notes, setNotes }) {
  function clearNotes() {
    const confirmed = window.confirm(
      'This will permanently remove all local notes. Continue?'
    )

    if (confirmed) {
      setNotes([])
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace preferences</p>
          <h1>Settings</h1>
          <p className="subtitle">Customize your NoteNest experience.</p>
        </div>
      </div>

      <section className="panel settings-panel">
        <div className="setting-row">
          <div>
            <strong>Appearance</strong>
            <p>Switch between light and dark mode.</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => setDarkMode((current) => !current)}
          >
            {darkMode ? 'Use light mode' : 'Use dark mode'}
          </button>
        </div>

        <div className="setting-row">
          <div>
            <strong>Local storage</strong>
            <p>{notes.length} notes are saved in this browser.</p>
          </div>
          <span className="status-badge">Active</span>
        </div>

        <div className="setting-row danger-row">
          <div>
            <strong>Clear all notes</strong>
            <p>Delete every note stored locally.</p>
          </div>
          <button className="danger-button" onClick={clearNotes}>
            Clear notes
          </button>
        </div>
      </section>
    </section>
  )
}

function EditorPage({
  editor,
  isEditing,
  handleEditorChange,
  saveNote,
  toggleEditorPin,
  addTag,
  removeTag,
  navigate,
}) {
  return (
    <section className="editor-page">
      <div className="editor-top">
        <button className="back-button" onClick={() => navigate('notes')}>
          ← Back to notes
        </button>

        <div className="editor-actions">
          <button className="secondary-button" onClick={toggleEditorPin}>
            {editor.pinned ? '★ Pinned' : '☆ Pin'}
          </button>
          <button className="primary-button" onClick={saveNote}>
            Save note
          </button>
        </div>
      </div>

      <div className="editor-card">
        <input
          className="editor-title"
          name="title"
          value={editor.title}
          onChange={handleEditorChange}
          placeholder="Untitled note"
        />

        <div className="editor-options">
          <select
            name="subject"
            value={editor.subject}
            onChange={handleEditorChange}
            className="subject-select"
          >
            <option>General</option>
            <option>Java</option>
            <option>DBMS</option>
            <option>Operating Systems</option>
            <option>Computer Networks</option>
            <option>Web Development</option>
            <option>AI & ML</option>
          </select>

          {editor.tags.map((tag) => (
            <button
              key={tag}
              className="tag-chip"
              onClick={() => removeTag(tag)}
              title="Remove tag"
            >
              {tag} ×
            </button>
          ))}

          <button className="add-tag-button" onClick={addTag}>
            ＋ Add tag
          </button>
        </div>
        <RichTextEditor
          content={editor.content}
          onChange={(content) =>
            handleEditorChange({
              target: {
                name: 'content',
                value: content,
              },
            })
          }
        />

        <div className="editor-footer">
          <span>{isEditing ? 'Editing existing note' : 'New note'}</span>
          <span>Saved locally when you click Save note</span>
        </div>
      </div>
    </section>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
    </div>
  )
}

function PanelHeader({ title, action, onAction }) {
  return (
    <div className="panel-header">
      <h2>{title}</h2>
      <button className="text-button" onClick={onAction}>
        {action}
      </button>
    </div>
  )
}

function NoteRow({
  note,
  openNote,
  deleteNote,
  togglePin,
  formatDate,
  showActions = false,
}) {
  return (
    <div className="note-row" onClick={() => openNote(note)}>
      <div className="note-icon">▤</div>

      <div className="note-info">
        <div className="note-title">
          {note.title || 'Untitled note'}
          {note.pinned && <span className="pin">★</span>}
        </div>

        <div className="note-preview">
          {getTextPreview(note.content).replace(/\n/g, ' ').slice(0, 100) ||
            'No content yet...'}
        </div>

        <div className="tag-chip">{note.subject}</div>
      </div>

      <div className="note-meta">
        <span>{formatDate(note.updatedAt)}</span>

        {showActions && (
          <div className="row-actions" onClick={(event) => event.stopPropagation()}>
            <button
              className="small-action"
              onClick={() => togglePin(note)}
              title="Pin note"
            >
              {note.pinned ? '★' : '☆'}
            </button>
            <button
              className="small-action delete-action"
              onClick={() => deleteNote(note.id)}
              title="Delete note"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SubjectRow({ subject, count, index, onClick }) {
  const icons = ['▤', '◇', '◈', '⌘', '▦', '☁']

  return (
    <div className="subject-row" onClick={onClick}>
      <div className="subject-icon">{icons[index % icons.length]}</div>
      <div className="subject-info">
        <strong>{subject}</strong>
        <span>
          {count} {count === 1 ? 'note' : 'notes'}
        </span>
      </div>
      <span className="subject-arrow">›</span>
    </div>
  )
}

function EmptyState({ message, buttonText, onClick }) {
  return (
    <div className="empty-state">
      <p>{message}</p>
      {buttonText && (
        <button className="secondary-button" onClick={onClick}>
          {buttonText}
        </button>
      )}
    </div>
  )
}


export default App
