import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/DemoAuthContext'
import { useUserManagement } from '../hooks'
import { oauthManager, oauthProviders } from '../lib/oauth'
import type { OAuthConnection } from '../types/oauth'

export const useOAuth = () => {
  const { user } = useAuth()
  const { userProfile } = useUserManagement()
  const [connections, setConnections] = useState<OAuthConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's OAuth connections
  const fetchConnections = async () => {
    if (!user || !userProfile?.organization_id) return

    try {
      setLoading(true)
      const userConnections: OAuthConnection[] = []
      
      for (const providerId of Object.keys(oauthProviders)) {
        const connection = await oauthManager.getConnection(providerId, user.id)
        if (connection) {
          userConnections.push(connection)
        }
      }
      
      setConnections(userConnections)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch connections')
    } finally {
      setLoading(false)
    }
  }

  // Initiate OAuth flow
  const initiateOAuth = (providerId: string) => {
    try {
      const state = crypto.randomUUID()
      localStorage.setItem('oauth_state', state)
      localStorage.setItem('oauth_provider', providerId)
      
      const authUrl = oauthManager.generateAuthUrl(providerId, state)
      window.location.href = authUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate OAuth')
    }
  }

  // Handle OAuth callback
  const handleOAuthCallback = async (code: string, state: string, providerId: string) => {
    try {
      const storedState = localStorage.getItem('oauth_state')
      const storedProvider = localStorage.getItem('oauth_provider')
      
      if (state !== storedState || providerId !== storedProvider) {
        throw new Error('Invalid OAuth state')
      }

      if (!user || !userProfile?.organization_id) {
        throw new Error('User not authenticated')
      }

      const token = await oauthManager.exchangeCodeForToken(providerId, code)
      await oauthManager.storeConnection(providerId, token, user.id, userProfile.organization_id)
      
      localStorage.removeItem('oauth_state')
      localStorage.removeItem('oauth_provider')
      
      await fetchConnections()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth callback failed')
      return false
    }
  }

  // Disconnect OAuth provider
  const disconnectProvider = async (connectionId: string) => {
    try {
      await oauthManager.revokeConnection(connectionId)
      await fetchConnections()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect provider')
    }
  }

  // Get access token for provider
  const getAccessToken = async (providerId: string): Promise<string | null> => {
    if (!user) return null
    
    try {
      return await oauthManager.getValidToken(providerId, user.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get access token')
      return null
    }
  }

  // Check if provider is connected
  const isConnected = (providerId: string): boolean => {
    return connections.some(conn => conn.provider_id === providerId && conn.is_active)
  }

  // Get connection for provider
  const getConnection = (providerId: string): OAuthConnection | null => {
    return connections.find(conn => conn.provider_id === providerId && conn.is_active) || null
  }

  // Launch service with OAuth token
  const launchService = async (providerId: string, serviceUrl: string) => {
    const token = await getAccessToken(providerId)
    
    if (token) {
      // For services that support token-based authentication, we can append the token
      // This varies by service - some use query params, others use headers
      
      // Example implementations for different services
      switch (providerId) {
        case 'google-workspace':
          // Google services often work with the token in localStorage or cookies
          // The actual implementation would depend on the specific service
          window.open(serviceUrl, '_blank')
          break
        case 'microsoft-365':
          // Microsoft Graph API services
          window.open(serviceUrl, '_blank')
          break
        default:
          // For other services, open normally
          window.open(serviceUrl, '_blank')
      }
    } else {
      // If no token, initiate OAuth flow
      initiateOAuth(providerId)
    }
  }

  useEffect(() => {
    if (user && userProfile?.organization_id) {
      fetchConnections()
    }
  }, [user, userProfile])

  return {
    connections,
    loading,
    error,
    initiateOAuth,
    handleOAuthCallback,
    disconnectProvider,
    getAccessToken,
    isConnected,
    getConnection,
    launchService,
    refetch: fetchConnections
  }
}