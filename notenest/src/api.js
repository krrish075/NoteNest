const API_URL = 'http://localhost:5000/api'

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'Something went wrong')
  }

  return result
}

export const notesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams()

    if (params.search) {
      query.set('search', params.search)
    }

    if (params.subject && params.subject !== 'All') {
      query.set('subject', params.subject)
    }

    if (params.pinned) {
      query.set('pinned', 'true')
    }

    const queryString = query.toString()

    return request(`/notes${queryString ? `?${queryString}` : ''}`)
  },

  getOne: (id) => {
    return request(`/notes/${id}`)
  },

  create: (note) => {
    return request('/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    })
  },

  update: (id, note) => {
    return request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(note),
    })
  },

  delete: (id) => {
    return request(`/notes/${id}`, {
      method: 'DELETE',
    })
  },
}