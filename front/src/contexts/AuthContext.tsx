import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Admin } from '@/types'

interface AuthContextType {
  admin: Admin | null
  token: string | null
  isAuthenticated: boolean
  login: (admin: Admin, token: string) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 从localStorage恢复登录状态
    const savedToken = localStorage.getItem('admin_token')
    const savedAdmin = localStorage.getItem('admin_info')
    
    if (savedToken && savedAdmin) {
      try {
        const adminInfo = JSON.parse(savedAdmin)
        setToken(savedToken)
        setAdmin(adminInfo)
      } catch (error) {
        console.error('Failed to parse saved admin info:', error)
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_info')
      }
    }
    
    setLoading(false)
  }, [])

  const login = (adminInfo: Admin, authToken: string) => {
    setAdmin(adminInfo)
    setToken(authToken)
    localStorage.setItem('admin_token', authToken)
    localStorage.setItem('admin_info', JSON.stringify(adminInfo))
  }

  const logout = () => {
    setAdmin(null)
    setToken(null)
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_info')
  }

  const value: AuthContextType = {
    admin,
    token,
    isAuthenticated: !!token && !!admin,
    login,
    logout,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}