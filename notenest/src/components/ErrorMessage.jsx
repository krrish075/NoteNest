import React from 'react'

export default function ErrorMessage({ message = 'An error occurred', onRetry }) {
  return (
    <div className="error-banner" role="alert">
      <div className="error-banner-content">
        <span className="error-icon">⚠️</span>
        <div className="error-text">
          <strong>Error</strong>
          <p>{message}</p>
        </div>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          🔄 Retry
        </button>
      )}
    </div>
  )
}
