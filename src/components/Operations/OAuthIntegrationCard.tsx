import React, { useState, useEffect } from 'react'
import { Edit3, Save, X, Phone, Mail, User, Building, ExternalLink, Settings, Link2, CheckCircle, AlertTriangle } from 'lucide-react'
import { useUserManagement } from '../../hooks'
import { useOAuth } from '../../hooks'
import { oauthManager } from '../../lib/oauth'

interface ContactInfo {
  name: string
  title: string
  email: string
  phone: string
  company: string
  notes: string
}

interface Integration {
  name: string
  description: string
  url: string
  category: string
  supportsOAuth?: boolean
  note?: string
}

interface OAuthIntegrationCardProps {
  integration: Integration
  color: string
  onEditIntegration?: (integration: Integration) => void
}

const OAuthIntegrationCard: React.FC<OAuthIntegrationCardProps> = ({ 
  integration, 
  color, 
  onEditIntegration 
}) => {
  const { isMasterAdmin } = useUserManagement()
  const { isConnected, launchService, initiateOAuth } = useOAuth()
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    name: '',
    title: '',
    email: '',
    phone: '',
    company: '',
    notes: ''
  })

  // Determine if this integration supports OAuth
  const providerId = integration.name.toLowerCase().replace(/\s+/g, '-')
  const supportsOAuth = integration.supportsOAuth !== false && oauthManager.supportsOAuth(providerId)
  const connected = isConnected(providerId)

  // Load contact info from localStorage on component mount
  useEffect(() => {
    const savedContact = localStorage.getItem(`integration-contact-${integration.name.toLowerCase().replace(/\s+/g, '-')}`)
    if (savedContact) {
      setContactInfo(JSON.parse(savedContact))
    }
  }, [integration.name])

  const handleSaveContact = () => {
    localStorage.setItem(`integration-contact-${integration.name.toLowerCase().replace(/\s+/g, '-')}`, JSON.stringify(contactInfo))
    setIsEditingContact(false)
  }

  const handleCancelContact = () => {
    const savedContact = localStorage.getItem(`integration-contact-${integration.name.toLowerCase().replace(/\s+/g, '-')}`)
    if (savedContact) {
      setContactInfo(JSON.parse(savedContact))
    }
    setIsEditingContact(false)
  }

  const handleLaunchService = () => {
    if (supportsOAuth) {
      launchService(providerId, integration.url)
    } else {
      window.open(integration.url, '_blank')
    }
  }

  const handleConnect = () => {
    if (supportsOAuth) {
      initiateOAuth(providerId)
    }
  }

  const hasContactInfo = contactInfo.name || contactInfo.email || contactInfo.phone

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
            <span className={`inline-block px-2 py-1 text-xs rounded-full bg-${color}-100 text-${color}-800`}>
              {integration.category}
            </span>
            {supportsOAuth ? (
              <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                connected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {connected ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    OAuth Connected
                  </>
                ) : (
                  <>
                    <Link2 className="h-3 w-3 mr-1" />
                    OAuth Available
                  </>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Manual Access
              </span>
            )}
            {isMasterAdmin && onEditIntegration && (
              <button
                onClick={() => onEditIntegration(integration)}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit Integration"
              >
                <Settings className="h-3 w-3" />
              </button>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-3">{integration.description}</p>
          {integration.note && (
            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded mb-3">
              💡 {integration.note}
            </p>
          )}
        </div>
        <ExternalLink className="h-5 w-5 text-gray-400 flex-shrink-0" />
      </div>

      {/* OAuth Status */}
      {supportsOAuth && (
        <div className={`mb-4 p-3 rounded-lg ${
          connected ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {connected ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Link2 className="h-4 w-4 text-yellow-600" />
              )}
              <span className={`text-sm font-medium ${
                connected ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {connected ? 'OAuth Connected' : 'OAuth Available'}
              </span>
            </div>
            {!connected && (
              <button
                onClick={handleConnect}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Connect
              </button>
            )}
          </div>
          <p className={`text-xs mt-1 ${
            connected ? 'text-green-700' : 'text-yellow-700'
          }`}>
            {connected 
              ? 'Seamless access enabled - no manual login required'
              : 'Connect for seamless access without manual login'
            }
          </p>
        </div>
      )}

      {/* Contact Information Section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Primary Contact</h4>
          <button
            onClick={() => setIsEditingContact(!isEditingContact)}
            className={`p-1.5 rounded-md transition-colors ${
              isEditingContact 
                ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100' 
                : `text-${color}-600 hover:text-${color}-700 hover:bg-${color}-50`
            }`}
            title={isEditingContact ? 'Cancel' : 'Edit Contact'}
          >
            {isEditingContact ? <X className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
          </button>
        </div>

        {isEditingContact ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <User className="inline h-3 w-3 mr-1" />
                  Contact Name
                </label>
                <input
                  type="text"
                  value={contactInfo.name}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contact name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={contactInfo.title}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Account Manager, Support Rep, etc."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Mail className="inline h-3 w-3 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="contact@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Phone className="inline h-3 w-3 mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Building className="inline h-3 w-3 mr-1" />
                  Department/Team
                </label>
                <input
                  type="text"
                  value={contactInfo.company}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Customer Success, Sales, Support"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={contactInfo.notes}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Account details, preferences, etc."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={handleCancelContact}
                className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveContact}
                className={`flex items-center space-x-1 px-2 py-1 text-xs bg-${color}-600 text-white rounded hover:bg-${color}-700 transition-colors`}
              >
                <Save className="h-3 w-3" />
                <span>Save</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {hasContactInfo ? (
              <>
                {contactInfo.name && (
                  <div className="flex items-center space-x-2">
                    <User className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">{contactInfo.name}</p>
                      {contactInfo.title && (
                        <p className="text-xs text-gray-600 truncate">{contactInfo.title}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {contactInfo.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <a 
                      href={`mailto:${contactInfo.email}`}
                      className={`text-xs text-${color}-600 hover:text-${color}-700 hover:underline truncate`}
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                )}
                
                {contactInfo.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <a 
                      href={`tel:${contactInfo.phone}`}
                      className={`text-xs text-${color}-600 hover:text-${color}-700 hover:underline`}
                    >
                      {contactInfo.phone}
                    </a>
                  </div>
                )}
                
                {contactInfo.company && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <p className="text-xs text-gray-700 truncate">{contactInfo.company}</p>
                  </div>
                )}
                
                {contactInfo.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 line-clamp-2">{contactInfo.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-3">
                <User className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-500">No contact assigned</p>
                <p className="text-xs text-gray-400">Click edit to add contact</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={handleLaunchService}
          className={`flex-1 bg-${color}-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-${color}-700 transition-colors text-center flex items-center justify-center space-x-1`}
        >
          {supportsOAuth && connected && <CheckCircle className="h-3 w-3" />}
          <span>{supportsOAuth && connected ? 'Launch (OAuth)' : 'Open Platform'}</span>
        </button>
        <button className="px-3 py-2 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Configure
        </button>
      </div>
    </div>
  )
}

export default OAuthIntegrationCard