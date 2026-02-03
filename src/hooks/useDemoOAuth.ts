import { useState } from 'react'

export interface OAuthConnection {
  id: string
  provider_id: string
  user_id: string
  organization_id: string
  access_token: string
  refresh_token?: string
  expires_at: string
  scopes: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

const demoConnections: OAuthConnection[] = [
  {
    id: 'demo-conn-1',
    provider_id: 'google-workspace',
    user_id: 'demo-admin-id',
    organization_id: 'demo-org-1',
    access_token: 'demo-access-token-1',
    refresh_token: 'demo-refresh-token-1',
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    scopes: ['https://www.googleapis.com/auth/userinfo.email'],
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'demo-conn-2',
    provider_id: 'youtube',
    user_id: 'demo-admin-id',
    organization_id: 'demo-org-1',
    access_token: 'demo-access-token-2',
    refresh_token: 'demo-refresh-token-2',
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    scopes: ['https://www.googleapis.com/auth/youtube'],
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }
]

export const useDemoOAuth = () => {
  const [connections, setConnections] = useState<OAuthConnection[]>(demoConnections)
  const [loading, _setLoading] = useState(false)
  const [error, _setError] = useState<string | null>(null)

  const initiateOAuth = (providerId: string) => {
    console.log(`Demo: Initiating OAuth for ${providerId}`)
    // In demo mode, just show a success message
    alert(`Demo: OAuth connection to ${providerId} would be initiated here`)
  }

  const handleOAuthCallback = async (_code: string, _state: string, _providerId: string) => {
    // Simulate successful callback
    return true
  }

  const disconnectProvider = async (connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId))
  }

  const getAccessToken = async (providerId: string): Promise<string | null> => {
    const connection = connections.find(conn => conn.provider_id === providerId && conn.is_active)
    return connection?.access_token || null
  }

  const isConnected = (providerId: string): boolean => {
    return connections.some(conn => conn.provider_id === providerId && conn.is_active)
  }

  const getConnection = (providerId: string): OAuthConnection | null => {
    return connections.find(conn => conn.provider_id === providerId && conn.is_active) || null
  }

  const launchService = async (providerId: string, serviceUrl: string) => {
    console.log(`Demo: Launching ${providerId} service`)
    window.open(serviceUrl, '_blank')
  }

  const refetch = async () => {
    // Demo mode doesn't need to refetch
  }

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
    refetch
  }
}