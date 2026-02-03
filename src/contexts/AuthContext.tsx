import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface ExtendedUser extends User {
  organizationId?: string | null;
}

interface AuthContextType {
  user: ExtendedUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  useEffect(() => {
    const loadUserWithProfile = async (session: Session | null) => {
      if (!session?.user) {
        console.log('[AuthContext] No session, clearing user')
        setUser(null);
        setOrganizationId(null);
        return;
      }

      try {
        console.log('[AuthContext] Setting basic user for:', session.user.id)
        // First, set the basic user immediately to allow the app to continue
        setUser(session.user);

        // Then try to load profile details in the background
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('organization_id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('[AuthContext] Error loading user profile:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            userId: session.user.id
          });
          // User is already set, so just log the error
          return;
        }

        // Update organizationId state if available (this won't change user object identity)
        if (profile?.organization_id !== organizationId) {
          console.log('[AuthContext] Updating organizationId:', profile?.organization_id)
          setOrganizationId(profile?.organization_id || null);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[AuthContext] Unexpected error loading user profile:', {
          error: errorMsg,
          userId: session.user.id,
          fullError: error
        });
        // User is already set, so just log the error
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      loadUserWithProfile(session).finally(() => setLoading(false));
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state change:', event, session?.user?.email)
      setSession(session)
      await loadUserWithProfile(session);
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Create stable extended user object with useMemo
  // This prevents unnecessary re-renders when user object identity changes
  // but the actual data (id and organizationId) hasn't changed
  const extendedUser = useMemo<ExtendedUser | null>(() => {
    if (!user) {
      console.log('[AuthContext] useMemo: No user')
      return null;
    }

    const extended = {
      ...user,
      organizationId
    };

    console.log('[AuthContext] useMemo: Creating extended user with orgId:', organizationId)
    return extended;
  }, [user?.id, organizationId]) // Only recreate when id or organizationId changes

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error:', {
          code: error.code,
          message: error.message,
          status: error.status,
          name: error.name
        })
        // Provide user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password')
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email to confirm your account')
        } else {
          throw new Error(error.message || 'Sign in failed')
        }
      }

      console.log('Sign in successful:', data.user?.email)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('Sign in failed:', errorMsg)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred during sign in')
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        console.error('Sign up error:', error)
        throw error
      }
    } catch (error) {
      console.error('Sign up failed:', error)
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = useMemo(() => ({
    user: extendedUser,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }), [extendedUser, session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}