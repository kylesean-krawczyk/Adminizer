import React, { useState, useEffect } from 'react'
import { Building, Users, ArrowRight, CheckCircle } from 'lucide-react'
import { useUserManagement } from '../../hooks'
import { useNavigate } from 'react-router-dom'

const OrganizationSetup = () => {
  const { createOrganization, userProfile } = useUserManagement()
  const [organizationName, setOrganizationName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const navigate = useNavigate()

  // Redirect if user already has organization
  useEffect(() => {
    if (userProfile?.organization_id) {
      console.log('User already has organization, redirecting to dashboard')
      navigate('/', { replace: true })
    }
  }, [userProfile, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organizationName.trim()) return

    setLoading(true)
    setErrorMessage(null)

    try {
      await createOrganization(organizationName.trim())
      setSuccess(true)

      // Show success message briefly before redirecting
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 1500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setErrorMessage('Failed to create organization: ' + message)
      console.error('Organization creation error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
            <Building className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Set up your organization
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your organization to start managing users and documents
          </p>
        </div>

        {success ? (
          <div className="mt-8 text-center space-y-4">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Organization Created!</h3>
              <p className="text-sm text-gray-600 mt-2">Redirecting to your dashboard...</p>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="organization-name" className="block text-sm font-medium text-gray-700">
              Organization Name
            </label>
            <div className="mt-1">
              <input
                id="organization-name"
                name="organization-name"
                type="text"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your organization name"
                disabled={loading}
              />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">What happens next?</h3>
                <ul className="mt-2 text-sm text-blue-800 space-y-1">
                  <li>• You'll become the master administrator</li>
                  <li>• You can invite team members to join</li>
                  <li>• Manage user roles and permissions</li>
                  <li>• Control access to documents and features</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !organizationName.trim()}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating organization...
                </div>
              ) : (
                <div className="flex items-center">
                  <span>Create Organization</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}
        </form>
        )}

        {/* Help text for users without organization */}
        {!success && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Why do I need an organization?</h4>
            <p className="text-sm text-gray-600">
              Organizations help you collaborate with your team, manage user permissions,
              and share documents securely. You'll be the master administrator with full control.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrganizationSetup