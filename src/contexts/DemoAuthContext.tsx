import React, { createContext, useContext, useState } from 'react'
import { isDemoMode } from '../lib/demo'
import { AuthContext as RealAuthContext } from './AuthContext'

interface DemoAuthContextType {
  user: any
  session: any
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined)

export const useAuth = () => {
  const demoContext = useContext(DemoAuthContext)
  const realContext = useContext(RealAuthContext)
  
  if (isDemoMode) {
    if (demoContext === undefined) {
      throw new Error('useAuth must be used within a DemoAuthProvider')
    }
    return demoContext
  } else {
    if (realContext === undefined) {
      throw new Error('useAuth must be used within an AuthProvider')
    }
    return realContext
  }
}

export const DemoAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true) // Always authenticated in demo
  const [loading, setLoading] = useState(false)

  const demoUser = {
    id: 'demo-admin-id',
    email: 'admin@acmenonprofit.org',
    user_metadata: {
      full_name: 'Sarah Johnson'
    }
  }

  const demoSession = {
    user: demoUser,
    access_token: 'demo-access-token'
  }

  const signIn = async (_email: string, _password: string) => {
    setLoading(true)
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsAuthenticated(true)
    setLoading(false)
  }

  const signUp = async (_email: string, _password: string) => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsAuthenticated(true)
    setLoading(false)
  }

  const signOut = async () => {
    setIsAuthenticated(false)
  }

  const value = {
    user: isAuthenticated ? demoUser : null,
    session: isAuthenticated ? demoSession : null,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <DemoAuthContext.Provider value={value}>{children}</DemoAuthContext.Provider>
}