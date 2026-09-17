import { authApi } from './authApi'

const API_URL = 'http://localhost:5000/api'

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const token = localStorage.getItem('notenest_token')
  if (token && token !== 'undefined' && token !== 'null') {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    headers,
    credentials: 'include',
    ...options,
  })

  if (response.status === 401 && !options._isRetry) {
    try {
      const refreshRes = await authApi.refresh()
      const newToken = refreshRes.data?.accessToken
      if (newToken) {
        localStorage.setItem('notenest_token', newToken)
        headers['Authorization'] = `Bearer ${newToken}`

        response = await fetch(`${API_URL}${endpoint}`, {
          headers,
          credentials: 'include',
          ...options,
          _isRetry: true,
        })
      }
    } catch (refreshErr) {
      localStorage.removeItem('notenest_token')
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
      throw new Error('Session expired. Please log in again.')
    }
  }

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