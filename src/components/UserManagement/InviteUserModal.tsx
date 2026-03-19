import React, { useState, useEffect } from 'react'
import { X, Mail, UserPlus, Copy, Check, Building2, Plus } from 'lucide-react'
import { useUserManagement } from '../../hooks'
import { useTerminology } from '../../hooks'
import { supabase } from '../../lib/supabase'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Organization {
  id: string
  name: string
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose }) => {
  const { inviteUser, organization, isSuperAdmin } = useUserManagement()
  const { term } = useTerminology()
  const [loading, setLoading] = useState(false)
  const [invitationSent, setInvitationSent] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    role: 'user' as 'admin' | 'user',
    full_name: '',
    organization_id: '',
    create_new_organization: false,
    new_organization_name: ''
  })

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!isSuperAdmin || !isOpen) return

      setLoadingOrgs(true)
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name')
          .order('name')

        if (error) throw error
        setOrganizations(data || [])
      } catch (error) {
        console.error('Error fetching organizations:', error)
      } finally {
        setLoadingOrgs(false)
      }
    }

    fetchOrganizations()
  }, [isSuperAdmin, isOpen])

  useEffect(() => {
    if (isOpen && organization && !isSuperAdmin) {
      setFormData(prev => ({ ...prev, organization_id: organization.id }))
    }
  }, [isOpen, organization, isSuperAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const invitation = await inviteUser(formData)
      setInvitationSent(invitation)
      setFormData({
        email: '',
        role: 'user',
        full_name: '',
        organization_id: organization?.id || '',
        create_new_organization: false,
        new_organization_name: ''
      })
    } catch (error) {
      alert('Failed to send invitation: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setInvitationSent(null)
    setFormData({
      email: '',
      role: 'user',
      full_name: '',
      organization_id: organization?.id || '',
      create_new_organization: false,
      new_organization_name: ''
    })
    setCopied(false)
    onClose()
  }

  const copyInviteLink = async () => {
    if (!invitationSent) return

    const inviteUrl = `${window.location.origin}/invite/${invitationSent.token}`
    
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = inviteUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {invitationSent ? 'Invitation Sent' : term('inviteUser', { capitalize: 'title' })}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6">
            {invitationSent ? (
              <div className="text-center space-y-4">
                <div className="bg-green-100 rounded-full p-6 mx-auto w-24 h-24 flex items-center justify-center">
                  <Check className="h-12 w-12 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Invitation sent successfully!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    An invitation has been sent to <strong>{invitationSent.email}</strong>
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Share this invitation link:</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/invite/${invitationSent.token}`}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    />
                    <button
                      onClick={copyInviteLink}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        copied 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="user@example.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {term('user', { capitalize: 'first' })}s can view and manage documents. {term('admin', { capitalize: 'first' })}s can also invite and manage other {term('users')}.
                  </p>
                </div>

                {isSuperAdmin ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building2 className="inline h-4 w-4 mr-1" />
                      Organization Assignment
                    </label>

                    <div className="space-y-3">
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          checked={!formData.create_new_organization}
                          onChange={() => setFormData(prev => ({
                            ...prev,
                            create_new_organization: false,
                            new_organization_name: ''
                          }))}
                          className="mr-3"
                          disabled={loading}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Existing Organization</p>
                          <p className="text-xs text-gray-500">Add user to an existing organization</p>
                        </div>
                      </label>

                      {!formData.create_new_organization && (
                        <select
                          value={formData.organization_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, organization_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ml-6"
                          disabled={loading || loadingOrgs}
                          required={!formData.create_new_organization}
                        >
                          <option value="">Select organization...</option>
                          {organizations.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                          ))}
                        </select>
                      )}

                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          checked={formData.create_new_organization}
                          onChange={() => setFormData(prev => ({
                            ...prev,
                            create_new_organization: true,
                            organization_id: ''
                          }))}
                          className="mr-3"
                          disabled={loading}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            <Plus className="inline h-4 w-4 mr-1" />
                            New Organization
                          </p>
                          <p className="text-xs text-gray-500">Create a new organization for this user (they will be the admin)</p>
                        </div>
                      </label>

                      {formData.create_new_organization && (
                        <input
                          type="text"
                          value={formData.new_organization_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, new_organization_name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ml-6"
                          placeholder="New organization name"
                          disabled={loading}
                          required={formData.create_new_organization}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>{term('organization', { capitalize: 'first' })}:</strong> {organization?.name}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      The invited {term('user')} will be added to this {term('organization')}.
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{loading ? 'Sending...' : `Send Invitation`}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InviteUserModal