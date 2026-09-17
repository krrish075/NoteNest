import React from 'react'

export default function SettingsView({ user, notesCount, darkMode, onToggleDarkMode }) {
  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2 className="settings-title">Account & App Settings</h2>
        <p className="settings-desc">Manage your account profile, theme preferences, and app options.</p>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">User Profile</h3>
        <div className="settings-card">
          <div className="profile-detail-row">
            <span className="profile-label">Full Name:</span>
            <span className="profile-value">{user?.name || 'User'}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-label">Email Address:</span>
            <span className="profile-value">{user?.email || 'N/A'}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-label">Account Status:</span>
            <span className="badge badge-success">Active & Authenticated</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Appearance & Theme</h3>
        <div className="settings-card flex-row">
          <div>
            <span className="setting-name">Dark Mode Theme</span>
            <p className="setting-subtext">Toggle between light and dark visual themes</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onToggleDarkMode}>
            {darkMode ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Database & Sync</h3>
        <div className="settings-card">
          <div className="profile-detail-row">
            <span className="profile-label">Cloud Sync:</span>
            <span className="profile-value text-success">✓ Encrypted PostgreSQL Sync Active</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-label">Stored Notes Count:</span>
            <span className="profile-value font-bold">{notesCount} Notes</span>
          </div>
        </div>
      </div>
    </div>
  )
}
