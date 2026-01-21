import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DepartmentLandingCustomization } from './Customization/DepartmentLandingCustomization'

const DepartmentLandingCustomizationPage: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>()
  const navigate = useNavigate()

  if (!departmentId) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Invalid Department</h2>
          <p className="text-red-700 mb-4">No department ID was provided.</p>
          <button
            onClick={() => navigate('/settings/organization-customization?tab=departments')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Customization
          </button>
        </div>
      </div>
    )
  }

  const departmentName = departmentId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/department/${departmentId}`)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to {departmentName}</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Customize {departmentName} Landing Page
        </h1>
        <p className="text-gray-600 mt-2">
          Customize stat cards, features, tools, integrations, and quick actions for this department.
        </p>
      </div>

      <DepartmentLandingCustomization
        departmentId={departmentId}
        departmentName={departmentName}
      />
    </div>
  )
}

export default DepartmentLandingCustomizationPage
