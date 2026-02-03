export interface OAuthProvider {
  id: string
  name: string
  description: string
  category: string
  authUrl: string
  tokenUrl: string
  clientId?: string
  scopes: string[]
  redirectUri: string
  isConfigured: boolean
  supportsOAuth: boolean
}

export interface OAuthToken {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope?: string
  expires_at: number
}

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

export interface OAuthConfig {
  provider_id: string
  client_id: string
  client_secret: string
  redirect_uri: string
  scopes: string[]
  organization_id: string
}