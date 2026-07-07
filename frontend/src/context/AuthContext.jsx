import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react'
import { getMe, setTokenGetter } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, getToken, userId } = useClerkAuth()
  const { signOut } = useClerk()
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading | authed | anon | error

  const loadProfile = useCallback(() => {
    setStatus('loading')
    getMe()
      .then((me) => {
        setUser(me)
        setStatus('authed')
      })
      .catch(() => {
        // Clerk still considers the user signed in — a failed profile fetch
        // is a backend/network hiccup, not a logout, so don't bounce to /login.
        setUser(null)
        setStatus('error')
      })
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      setTokenGetter(null)
      setUser(null)
      setStatus('anon')
      return
    }

    setTokenGetter(getToken)
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, userId])

  const logout = useCallback(async () => {
    await signOut()
    setTokenGetter(null)
    setUser(null)
    setStatus('anon')
  }, [signOut])

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  return (
    <AuthContext.Provider value={{ user, status, logout, updateUser, retry: loadProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
