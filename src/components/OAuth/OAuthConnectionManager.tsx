import { useState } from 'react'
import { Link2, Unlink, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import { useOAuth } from '../../hooks'
import { oauthProviders } from '../../lib/oauth'
import { format } from 'date-fns'

const OAuthConnectionManager = () => {
  const { connections, loading, isConnected, initiateOAuth, disconnectProvider } = useOAuth()
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const handleConnect = (providerId: string) => {
    initiateOAuth(providerId)
  }

  const handleDisconnect = async (connectionId: string, providerName: string) => {
    if (window.confirm(`Are you sure you want to disconnect ${providerName}?`)) {
      setDisconnecting(connectionId)
      try {
        await disconnectProvider(connectionId)
      } catch (error) {
        alert('Failed to disconnect: ' + (error instanceof Error ? error.message : 'Unknown error'))
      } finally {
        setDisconnecting(null)
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">OAuth Connections</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Securely connect to third-party services using OAuth authentication
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {Object.values(oauthProviders).map((provider) => {
            const connection = connections.find(conn => conn.provider_id === provider.id && conn.is_active)
            const connected = isConnected(provider.id)

            return (
              <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      connected ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {connected ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{provider.name}</h4>
                      <p className="text-sm text-gray-600">{provider.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {provider.category}
                        </span>
                        {connected && connection && (
                          <span className="text-xs text-gray-500">
                            Connected {format(new Date(connection.created_at), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {connected && connection ? (
                      <>
                        <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                          Connected
                        </span>
                        <button
                          onClick={() => handleDisconnect(connection.id, provider.name)}
                          disabled={disconnecting === connection.id}
                          className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Unlink className="h-4 w-4" />
                          <span>{disconnecting === connection.id ? 'Disconnecting...' : 'Disconnect'}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnect(provider.id)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <Link2 className="h-4 w-4" />
                        <span>Connect</span>
                      </button>
                    )}
                  </div>
                </div>

                {connected && connection && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Scopes:</span>
                        <div className="mt-1">
                          {connection.scopes.map((scope, index) => (
                            <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded mr-1 mb-1">
                              {scope.split('/').pop() || scope}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Expires:</span>
                        <p className="text-gray-900 mt-1">
                          {format(new Date(connection.expires_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">About OAuth Security</h4>
              <p className="text-sm text-blue-800 mt-1">
                OAuth connections allow secure access to third-party services without storing your passwords. 
                Tokens are automatically refreshed and can be revoked at any time. Your credentials remain 
                secure and are never stored in Adminezer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OAuthConnectionManager