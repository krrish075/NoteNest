import React from 'react'

export default function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="skeleton-grid" aria-busy="true" aria-label="Loading notes">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-circle" />
          </div>
          <div className="skeleton-line skeleton-sub" />
          <div className="skeleton-line skeleton-text" />
          <div className="skeleton-line skeleton-text-short" />
          <div className="skeleton-footer">
            <div className="skeleton-badge" />
            <div className="skeleton-date" />
          </div>
        </div>
      ))}
    </div>
  )
}
