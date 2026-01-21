import React, { useState } from 'react'
import { X, Save, Tag, FileText, Globe, Settings } from 'lucide-react'

interface Integration {
  name: string
  description: string
  url: string
  category: string
}

interface IntegrationEditModalProps {
  isOpen: boolean
  onClose: () => void
  integration: Integration | null
  onSave: (updatedIntegration: Integration) => void
}

const IntegrationEditModal: React.FC<IntegrationEditModalProps> = ({
  isOpen,
  onClose,
  integration,
  onSave
}) => {
  const [formData, setFormData] = useState<Integration>({
    name: '',
    description: '',
    url: '',
    category: ''
  })

  const businessCategories = [
    'HRIS',
    'Payroll',
    'Benefits',
    'Safety',
    'Insurance',
    'Accounting',
    'Invoicing',
    'Free',
    'Legal Services',
    'E-Signature',
    'Practice Management',
    'Contract Management',
    'Compliance',
    'Design',
    'Professional',
    'UI/UX',
    'Monitoring',
    'Management',
    'Scheduling',
    'Enterprise',
    'Visual',
    'Internal',
    'Email Marketing',
    'Video',
    'Volunteer',
    'Opportunities',
    'Streaming',
    'Podcast',
    'Custom'
  ]

  React.useEffect(() => {
    if (integration) {
      setFormData(integration)
    }
  }, [integration])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  const handleCancel = () => {
    if (integration) {
      setFormData(integration)
    }
    onClose()
  }

  if (!isOpen || !integration) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleCancel} />
      
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Integration</h2>
              <p className="text-sm text-gray-600 mt-1">Customize integration details for your organization</p>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="inline h-4 w-4 mr-1" />
                Service Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Service name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe how this service helps your organization..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Customize this description to reflect how your organization uses this service
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="inline h-4 w-4 mr-1" />
                Service URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Link to your organization's login page or dashboard for this service
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline h-4 w-4 mr-1" />
                Business Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {businessCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose the category that best describes this service's role in your business
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Customization Tips</h4>
                  <ul className="mt-1 text-sm text-blue-800 space-y-1">
                    <li>• Update the description to reflect your specific use case</li>
                    <li>• Use your organization's direct login URL if available</li>
                    <li>• Choose categories that match your business structure</li>
                    <li>• Consider creating custom categories for unique services</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default IntegrationEditModal