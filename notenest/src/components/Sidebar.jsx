import React from 'react'

export default function Sidebar({
  activeNav = 'notes',
  onSelectNav,
  notesCount = 0,
  pinnedCount = 0,
  subjects = [],
  selectedSubject = 'All',
  onSelectSubject,
  user,
  darkMode,
  onToggleDarkMode,
  onLogout,
  isOpen = false,
  onCloseMobile,
}) {
  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">N</div>
          <span className="brand-name">NoteNest</span>
          {isOpen && (
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={onCloseMobile}
              aria-label="Close menu"
            >
              ✕
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${activeNav === 'notes' && selectedSubject === 'All' ? 'active' : ''}`}
            onClick={() => {
              onSelectSubject('All')
              onSelectNav('notes')
              onCloseMobile?.()
            }}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-label">All Notes</span>
            <span className="nav-badge">{notesCount}</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNav === 'favorites' ? 'active' : ''}`}
            onClick={() => {
              onSelectNav('favorites')
              onCloseMobile?.()
            }}
          >
            <span className="nav-icon">⭐</span>
            <span className="nav-label">Favorites</span>
            {pinnedCount > 0 && <span className="nav-badge star-badge">{pinnedCount}</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => {
              onSelectNav('settings')
              onCloseMobile?.()
            }}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>
        </nav>

        {subjects.length > 0 && (
          <div className="sidebar-section">
            <h4 className="sidebar-section-title">Categories</h4>
            <div className="category-list">
              <button
                type="button"
                className={`category-item ${selectedSubject === 'All' && activeNav === 'notes' ? 'active' : ''}`}
                onClick={() => {
                  onSelectSubject('All')
                  onSelectNav('notes')
                  onCloseMobile?.()
                }}
              >
                📁 All Categories
              </button>
              {subjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  className={`category-item ${selectedSubject === sub && activeNav === 'notes' ? 'active' : ''}`}
                  onClick={() => {
                    onSelectSubject(sub)
                    onSelectNav('notes')
                    onCloseMobile?.()
                  }}
                >
                  📂 {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="sidebar-footer">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleDarkMode}
            title="Toggle light/dark theme"
          >
            <span>{darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
          </button>

          <div className="user-profile-card">
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-email">{user?.email || ''}</span>
            </div>
            <button
              type="button"
              className="logout-icon-btn"
              onClick={onLogout}
              title="Log out"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
