import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('notenest_token')
  })

  const login = (newToken) => {
    localStorage.setItem('notenest_token', newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('notenest_token')
    setToken(null)
  }

  const isAuthenticated = Boolean(token)

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        logout,
        isAuthenticated,
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