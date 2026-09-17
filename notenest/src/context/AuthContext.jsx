import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('notenest_token'))
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const login = (newToken, userData = null) => {
    if (newToken) {
      localStorage.setItem('notenest_token', newToken)
      setToken(newToken)
    }
    if (userData) {
      setUser(userData)
    }
  }

  const logout = async () => {
    localStorage.removeItem('notenest_token')
    setToken(null)
    setUser(null)
    await authApi.logout()
  }

  const refreshAccessToken = async () => {
    try {
      const res = await authApi.refresh()
      const newToken = res.data?.accessToken
      const userData = res.data?.user
      if (newToken) {
        localStorage.setItem('notenest_token', newToken)
        setToken(newToken)
        if (userData) setUser(userData)
        return newToken
      }
    } catch (err) {
      localStorage.removeItem('notenest_token')
      setToken(null)
      setUser(null)
      throw err
    }
    return null
  }

  const getCurrentUser = () => user

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('notenest_token')
      if (storedToken) {
        try {
          const res = await authApi.getMe(storedToken)
          if (res.data?.user) {
            setUser(res.data.user)
            setIsLoading(false)
            return
          }
        } catch (err) {
          // Stored access token might be expired, attempt refresh
        }
      }

      // Try refresh token from HttpOnly cookie
      try {
        const refreshRes = await authApi.refresh()
        const newToken = refreshRes.data?.accessToken
        const userData = refreshRes.data?.user
        if (newToken) {
          localStorage.setItem('notenest_token', newToken)
          setToken(newToken)
          if (userData) setUser(userData)
        } else {
          localStorage.removeItem('notenest_token')
          setToken(null)
          setUser(null)
        }
      } catch (err) {
        localStorage.removeItem('notenest_token')
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const isAuthenticated = Boolean(token)

  return (
    <AuthContext.Provider
      value={{
        token,
        accessToken: token,
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshAccessToken,
        getCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}