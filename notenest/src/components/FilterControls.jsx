import React from 'react'

export default function FilterControls({
  subjects = [],
  selectedSubject = 'All',
  onSelectSubject,
  allTags = [],
  selectedTag = 'All',
  onSelectTag,
  sortBy = 'updated',
  onSelectSort,
}) {
  return (
    <div className="filter-controls-container">
      <div className="filter-group">
        <label className="filter-label" htmlFor="subject-select">
          Category:
        </label>
        <select
          id="subject-select"
          className="filter-select"
          value={selectedSubject}
          onChange={(e) => onSelectSubject(e.target.value)}
        >
          <option value="All">All Categories</option>
          {subjects.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      {allTags.length > 0 && (
        <div className="filter-group">
          <label className="filter-label" htmlFor="tag-select">
            Tag:
          </label>
          <select
            id="tag-select"
            className="filter-select"
            value={selectedTag}
            onChange={(e) => onSelectTag(e.target.value)}
          >
            <option value="All">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="filter-group sort-group">
        <label className="filter-label" htmlFor="sort-select">
          Sort by:
        </label>
        <select
          id="sort-select"
          className="filter-select"
          value={sortBy}
          onChange={(e) => onSelectSort(e.target.value)}
        >
          <option value="updated">Recently Updated</option>
          <option value="created">Recently Created</option>
          <option value="alpha-asc">Alphabetical (A-Z)</option>
          <option value="alpha-desc">Alphabetical (Z-A)</option>
        </select>
      </div>
    </div>
  )
}
