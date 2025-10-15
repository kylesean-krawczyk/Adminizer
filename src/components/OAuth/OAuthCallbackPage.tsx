import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import { useOAuth } from '../../hooks'

const OAuthCallbackPage = () => {
  const { provider } = useParams<{ provider: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleOAuthCallback } = useOAuth()
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')

      if (error) {
        setStatus('error')
        setMessage(`OAuth error: ${error}`)
        return
      }

      if (!code || !state || !provider) {
        setStatus('error')
        setMessage('Missing required OAuth parameters')
        return
      }

      try {
        const success = await handleOAuthCallback(code, state, provider)
        if (success) {
          setStatus('success')
          setMessage('Successfully connected to ' + provider)
          setTimeout(() => navigate('/'), 2000)
        } else {
          setStatus('error')
          setMessage('Failed to complete OAuth connection')
        }
      } catch (err) {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'OAuth callback failed')
      }
    }

    processCallback()
  }, [searchParams, provider, handleOAuthCallback, navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {status === 'loading' && (
            <>
              <Loader className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Connecting to {provider}...
              </h2>
              <p className="text-gray-600">
                Please wait while we complete the connection.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Connection Successful!
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">
                Redirecting you back to Adminezer...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Connection Failed
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default OAuthCallbackPage