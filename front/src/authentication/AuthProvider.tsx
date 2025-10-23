import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { setAuthToken, clearAuthToken } from "../api/client"
import type { User } from "../api/types"
import { getProfile, login, register } from "../api/auth"

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: { username: string; displayName: string; email: string; password: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("bgs_token")
    if (!token) {
      setLoading(false)
      return
    }

    setAuthToken(token)
    getProfile()
      .then((profile) => setUser(profile))
      .catch(() => {
        clearAuthToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { token, user: loggedUser } = await login({ email, password })
      setAuthToken(token)
      setUser(loggedUser)
      navigate("/")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (payload: { username: string; displayName: string; email: string; password: string }) => {
    setLoading(true)
    try {
      const { token, user: registered } = await register(payload)
      setAuthToken(token)
      setUser(registered)
      navigate("/")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuthToken()
    setUser(null)
    navigate("/login")
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext doit etre utilise dans AuthProvider")
  }
  return context
}
