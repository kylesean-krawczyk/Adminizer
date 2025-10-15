import React, { useState } from 'react'
import { Building, Users, ArrowRight } from 'lucide-react'
import { useUserManagement } from '../../hooks'

const OrganizationSetup = () => {
  const { createOrganization } = useUserManagement()
  const [organizationName, setOrganizationName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organizationName.trim()) return

    setLoading(true)
    try {
      await createOrganization(organizationName.trim())
    } catch (error) {
      alert('Failed to create organization: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
        </form>
      </div>
    </div>
  )
}

export default OrganizationSetup