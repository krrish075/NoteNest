import React, { useState } from 'react'
import Sidebar from './Sidebar'

export default function DashboardLayout({
  activeNav,
  onSelectNav,
  notesCount,
  pinnedCount,
  subjects,
  selectedSubject,
  onSelectSubject,
  user,
  darkMode,
  onToggleDarkMode,
  onLogout,
  onCreateNote,
  toastMessage,
  children,
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className={`app-layout ${darkMode ? 'dark' : ''}`}>
      {/* Mobile Header Bar */}
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <div className="mobile-brand">
          <div className="brand-logo sm">N</div>
          <span className="brand-name">NoteNest</span>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onCreateNote}
        >
          + Note
        </button>
      </header>

      {/* Sidebar Navigation */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={onSelectNav}
        notesCount={notesCount}
        pinnedCount={pinnedCount}
        subjects={subjects}
        selectedSubject={selectedSubject}
        onSelectSubject={onSelectSubject}
        user={user}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        onLogout={onLogout}
        isOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main App Content Area */}
      <main className="main-content">{children}</main>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="toast-notification" role="status">
          ✨ {toastMessage}
        </div>
      )}
    </div>
  )
}
