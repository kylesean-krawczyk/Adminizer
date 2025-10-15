import { supabase } from './supabase'
import type { OAuthProvider, OAuthToken, OAuthConnection } from '../types/oauth'

// OAuth provider configurations
export const oauthProviders: Record<string, OAuthProvider> = {
  'google-workspace': {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Access Gmail, Drive, Calendar, and other Google services',
    category: 'Productivity',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/calendar.readonly'
    ],
    redirectUri: `${window.location.origin}/oauth/callback/google-workspace`,
    isConfigured: false,
    supportsOAuth: true
  },
  'google-search-console': {
    id: 'google-search-console',
    name: 'Google Search Console',
    description: 'Monitor and optimize your website\'s search performance',
    category: 'Analytics',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/webmasters'
    ],
    redirectUri: `${window.location.origin}/oauth/callback/google-search-console`,
    isConfigured: false,
    supportsOAuth: true
  },
  'youtube': {
    id: 'youtube',
    name: 'YouTube',
    description: 'Video hosting and management platform',
    category: 'Video Platform',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtubepartner'
    ],
    redirectUri: `${window.location.origin}/oauth/callback/youtube`,
    isConfigured: false,
    supportsOAuth: true
  },
  'microsoft-365': {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    description: 'Access Outlook, OneDrive, Teams, and other Microsoft services',
    category: 'Productivity',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: [
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/Files.Read',
      'https://graph.microsoft.com/Calendars.Read'
    ],
    redirectUri: `${window.location.origin}/oauth/callback/microsoft-365`,
    isConfigured: false,
    supportsOAuth: true
  },
  'quickbooks': {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    description: 'Access your QuickBooks accounting data',
    category: 'Accounting',
    authUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    scopes: ['com.intuit.quickbooks.accounting'],
    redirectUri: `${window.location.origin}/oauth/callback/quickbooks`,
    isConfigured: false,
    supportsOAuth: true
  },
  'slack': {
    id: 'slack',
    name: 'Slack',
    description: 'Access your Slack workspace',
    category: 'Communication',
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['channels:read', 'chat:write', 'users:read'],
    redirectUri: `${window.location.origin}/oauth/callback/slack`,
    isConfigured: false,
    supportsOAuth: true
  },
  'mailchimp': {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Access your Mailchimp marketing campaigns',
    category: 'Marketing',
    authUrl: 'https://login.mailchimp.com/oauth2/authorize',
    tokenUrl: 'https://login.mailchimp.com/oauth2/token',
    scopes: [],
    redirectUri: `${window.location.origin}/oauth/callback/mailchimp`,
    isConfigured: false,
    supportsOAuth: true
  },
  'gusto': {
    id: 'gusto',
    name: 'Gusto',
    description: 'Payroll, benefits, and HR management',
    category: 'Payroll',
    authUrl: 'https://api.gusto-demo.com/oauth/authorize',
    tokenUrl: 'https://api.gusto-demo.com/oauth/token',
    scopes: ['employee:read', 'company:read', 'payroll:read'],
    redirectUri: `${window.location.origin}/oauth/callback/gusto`,
    isConfigured: false,
    supportsOAuth: true
  },
  'bamboohr': {
    id: 'bamboohr',
    name: 'BambooHR',
    description: 'HR software with employee data management',
    category: 'HRIS',
    authUrl: 'https://api.bamboohr.com/api/gateway.php/[company]/v1/login',
    tokenUrl: 'https://api.bamboohr.com/api/gateway.php/[company]/v1/login',
    scopes: ['employee:read', 'company:read'],
    redirectUri: `${window.location.origin}/oauth/callback/bamboohr`,
    isConfigured: false,
    supportsOAuth: true
  },
  'github': {
    id: 'github',
    name: 'GitHub',
    description: 'Code repository and collaboration platform',
    category: 'Development',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['repo', 'user:email', 'read:org'],
    redirectUri: `${window.location.origin}/oauth/callback/github`,
    isConfigured: false,
    supportsOAuth: true
  }
}

export class OAuthManager {
  private static instance: OAuthManager
  
  static getInstance(): OAuthManager {
    if (!OAuthManager.instance) {
      OAuthManager.instance = new OAuthManager()
    }
    return OAuthManager.instance
  }

  // Generate OAuth authorization URL
  generateAuthUrl(providerId: string, state?: string): string {
    const provider = oauthProviders[providerId]
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`)
    }

    const params = new URLSearchParams({
      client_id: provider.clientId || '',
      redirect_uri: provider.redirectUri,
      scope: provider.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: state || crypto.randomUUID()
    })

    return `${provider.authUrl}?${params.toString()}`
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(providerId: string, code: string): Promise<OAuthToken> {
    const provider = oauthProviders[providerId]
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`)
    }

    // Get OAuth config for this provider
    const config = await this.getOAuthConfig(providerId)
    if (!config) {
      throw new Error(`OAuth not configured for ${providerId}`)
    }

    const tokenData = {
      client_id: config.client_id,
      client_secret: config.client_secret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: provider.redirectUri
    }

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(tokenData)
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`)
    }

    const token: OAuthToken = await response.json()
    token.expires_at = Date.now() + (token.expires_in * 1000)

    return token
  }

  // Store OAuth connection
  async storeConnection(providerId: string, token: OAuthToken, userId: string, organizationId: string): Promise<OAuthConnection> {
    const { data, error } = await supabase
      .from('oauth_connections')
      .insert({
        provider_id: providerId,
        user_id: userId,
        organization_id: organizationId,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: new Date(token.expires_at).toISOString(),
        scopes: oauthProviders[providerId].scopes,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get OAuth connection
  async getConnection(providerId: string, userId: string): Promise<OAuthConnection | null> {
    const { data, error } = await supabase
      .from('oauth_connections')
      .select('*')
      .eq('provider_id', providerId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)

    if (error) throw error
    return data && data.length > 0 ? data[0] : null
  }

  // Refresh access token
  async refreshToken(connection: OAuthConnection): Promise<OAuthToken> {
    const provider = oauthProviders[connection.provider_id]
    if (!provider || !connection.refresh_token) {
      throw new Error('Cannot refresh token')
    }

    const config = await this.getOAuthConfig(connection.provider_id)
    if (!config) {
      throw new Error(`OAuth not configured for ${connection.provider_id}`)
    }

    const tokenData = {
      client_id: config.client_id,
      client_secret: config.client_secret,
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token'
    }

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(tokenData)
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`)
    }

    const token: OAuthToken = await response.json()
    token.expires_at = Date.now() + (token.expires_in * 1000)

    // Update stored connection
    await supabase
      .from('oauth_connections')
      .update({
        access_token: token.access_token,
        refresh_token: token.refresh_token || connection.refresh_token,
        expires_at: new Date(token.expires_at).toISOString()
      })
      .eq('id', connection.id)

    return token
  }

  // Get valid access token (refresh if needed)
  async getValidToken(providerId: string, userId: string): Promise<string | null> {
    const connection = await this.getConnection(providerId, userId)
    if (!connection) return null

    const now = Date.now()
    const expiresAt = new Date(connection.expires_at).getTime()

    // If token expires in less than 5 minutes, refresh it
    if (expiresAt - now < 5 * 60 * 1000) {
      try {
        const newToken = await this.refreshToken(connection)
        return newToken.access_token
      } catch (error) {
        console.error('Failed to refresh token:', error)
        return null
      }
    }

    return connection.access_token
  }

  // Revoke OAuth connection
  async revokeConnection(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('oauth_connections')
      .update({ is_active: false })
      .eq('id', connectionId)

    if (error) throw error
  }

  // Get OAuth configuration for provider
  private async getOAuthConfig(providerId: string): Promise<any> {
    const { data, error } = await supabase
      .from('oauth_configs')
      .select('*')
      .eq('provider_id', providerId)
      .limit(1)

    if (error) throw error
    return data && data.length > 0 ? data[0] : null
  }

  // Check if provider supports OAuth
  supportsOAuth(providerId: string): boolean {
    const provider = oauthProviders[providerId]
    return provider?.supportsOAuth || false
  }

  // Get all configured providers for organization
  async getConfiguredProviders(organizationId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('oauth_configs')
      .select('provider_id')
      .eq('organization_id', organizationId)

    if (error) throw error
    return data.map(config => config.provider_id)
  }
}

export const oauthManager = OAuthManager.getInstance()