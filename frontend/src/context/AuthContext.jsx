import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  getAuthToken,
  getMe,
  login as apiLogin,
  signup as apiSignup,
  setAuthToken,
} from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading | authed | anon

  useEffect(() => {
    if (!getAuthToken()) {
      setStatus('anon')
      return
    }
    getMe()
      .then((me) => {
        setUser(me)
        setStatus('authed')
      })
      .catch(() => {
        setAuthToken(null)
        setStatus('anon')
      })
  }, [])

  const login = useCallback(async (email, password) => {
    const { access_token, user: me } = await apiLogin({ email, password })
    setAuthToken(access_token)
    setUser(me)
    setStatus('authed')
  }, [])

  const signup = useCallback(async (name, email, password) => {
    const { access_token, user: me } = await apiSignup({ name, email, password })
    setAuthToken(access_token)
    setUser(me)
    setStatus('authed')
  }, [])

  const logout = useCallback(() => {
    setAuthToken(null)
    setUser(null)
    setStatus('anon')
  }, [])

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  return (
    <AuthContext.Provider value={{ user, status, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
