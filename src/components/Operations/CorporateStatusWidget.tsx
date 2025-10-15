import React, { useState, useEffect } from 'react'
import { Building, Calendar, AlertTriangle, CheckCircle, Edit3, Save, X } from 'lucide-react'
import { format, isBefore, addDays } from 'date-fns'
import { isDemoMode } from '../../lib/demo'

interface CorporateStatus {
  entityName: string
  entityType: string
  status: 'Active' | 'Inactive' | 'Suspended' | 'Unknown'
  filingDate: string
  nextDueDate: string
  annualReportStatus: 'Current' | 'Due Soon' | 'Overdue' | 'Unknown'
  lastUpdated: string
}

const CorporateStatusWidget: React.FC = () => {
  // Use different default names based on demo mode
  const getDefaultEntityName = () => {
    return isDemoMode ? 'Acme Nonprofit Foundation' : 'Redemption Church Flagstaff'
  }

  const [corporateStatus, setCorporateStatus] = useState<CorporateStatus>({
    entityName: getDefaultEntityName(),
    entityType: 'Non-Profit Corporation',
    status: 'Unknown',
    filingDate: '',
    nextDueDate: '',
    annualReportStatus: 'Unknown',
    lastUpdated: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<CorporateStatus>(corporateStatus)

  // Load status from localStorage on component mount
  useEffect(() => {
    const storageKey = isDemoMode ? 'demo-corporate-status' : 'corporate-status'
    const savedStatus = localStorage.getItem(storageKey)
    if (savedStatus) {
      const parsed = JSON.parse(savedStatus)
      setCorporateStatus(parsed)
      setEditForm(parsed)
    } else {
      // Set default entity name based on mode if no saved data
      const defaultStatus = {
        ...corporateStatus,
        entityName: getDefaultEntityName()
      }
      setCorporateStatus(defaultStatus)
      setEditForm(defaultStatus)
    }
  }, [])

  // Calculate alert status based on due dates
  const getAlertStatus = () => {
    if (!corporateStatus.nextDueDate) return 'unknown'
    
    const dueDate = new Date(corporateStatus.nextDueDate)
    const today = new Date()
    const thirtyDaysFromNow = addDays(today, 30)
    
    if (isBefore(dueDate, today)) return 'overdue'
    if (isBefore(dueDate, thirtyDaysFromNow)) return 'due-soon'
    return 'current'
  }

  const alertStatus = getAlertStatus()

  const handleSave = () => {
    const updatedStatus = {
      ...editForm,
      lastUpdated: new Date().toISOString()
    }
    setCorporateStatus(updatedStatus)
    
    // Use different storage keys for demo vs production
    const storageKey = isDemoMode ? 'demo-corporate-status' : 'corporate-status'
    localStorage.setItem(storageKey, JSON.stringify(updatedStatus))
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditForm(corporateStatus)
    setIsEditing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Current':
        return 'text-green-800 bg-green-100'
      case 'Due Soon':
        return 'text-yellow-800 bg-yellow-100'
      case 'Overdue':
      case 'Suspended':
        return 'text-red-800 bg-red-100'
      case 'Inactive':
        return 'text-gray-800 bg-gray-100'
      default:
        return 'text-blue-800 bg-blue-100'
    }
  }

  const getAlertIcon = () => {
    switch (alertStatus) {
      case 'current':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'due-soon':
        return <Calendar className="h-5 w-5 text-yellow-600" />
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Building className="h-5 w-5 text-blue-600" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getAlertIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Corporate Status Dashboard</h3>
              <p className="text-sm text-gray-600">
                {isDemoMode ? 'Demo Corporate Filing Status' : 'Arizona Corporation Commission Filing Status'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={isEditing ? 'Cancel' : 'Edit Status'}
          >
            {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entity Name
                </label>
                <input
                  type="text"
                  value={editForm.entityName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, entityName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entity Type
                </label>
                <select
                  value={editForm.entityType}
                  onChange={(e) => setEditForm(prev => ({ ...prev, entityType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Non-Profit Corporation">Non-Profit Corporation</option>
                  <option value="Corporation">Corporation</option>
                  <option value="LLC">LLC</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Filing Date
                </label>
                <input
                  type="date"
                  value={editForm.filingDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, filingDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Due Date
                </label>
                <input
                  type="date"
                  value={editForm.nextDueDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nextDueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Report Status
                </label>
                <select
                  value={editForm.annualReportStatus}
                  onChange={(e) => setEditForm(prev => ({ ...prev, annualReportStatus: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Current">Current</option>
                  <option value="Due Soon">Due Soon</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save Status</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Alert Banner */}
            {alertStatus !== 'current' && alertStatus !== 'unknown' && (
              <div className={`p-4 rounded-lg border ${
                alertStatus === 'overdue' 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className={`h-5 w-5 ${
                    alertStatus === 'overdue' ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                  <div>
                    <h4 className={`font-medium ${
                      alertStatus === 'overdue' ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {alertStatus === 'overdue' ? 'Filing Overdue!' : 'Filing Due Soon'}
                    </h4>
                    <p className={`text-sm ${
                      alertStatus === 'overdue' ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      {corporateStatus.nextDueDate && 
                        `Next filing due: ${format(new Date(corporateStatus.nextDueDate), 'MMMM dd, yyyy')}`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Entity Name</label>
                  <p className="text-lg font-semibold text-gray-900">{corporateStatus.entityName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Entity Type</label>
                  <p className="text-gray-900">{corporateStatus.entityType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Status</label>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(corporateStatus.status)}`}>
                    {corporateStatus.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Filing Date</label>
                  <p className="text-gray-900">
                    {corporateStatus.filingDate 
                      ? format(new Date(corporateStatus.filingDate), 'MMMM dd, yyyy')
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Next Due Date</label>
                  <p className="text-gray-900">
                    {corporateStatus.nextDueDate 
                      ? format(new Date(corporateStatus.nextDueDate), 'MMMM dd, yyyy')
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Annual Report Status</label>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(corporateStatus.annualReportStatus)}`}>
                    {corporateStatus.annualReportStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                {!isDemoMode ? (
                  <>
                    <a
                      href="https://ecorp.azcc.gov/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Building className="h-4 w-4" />
                      <span>Access AZ Corp Commission</span>
                    </a>
                    <a
                      href="https://ecorp.azcc.gov/EntitySearch/PublicSearch"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>Search Entity Status</span>
                    </a>
                  </>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Demo Mode</h4>
                        <p className="text-sm text-blue-800">
                          In production, this would link to your state's corporate filing system for real status updates.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Last Updated */}
            {corporateStatus.lastUpdated && (
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                Last updated: {format(new Date(corporateStatus.lastUpdated), 'MMM dd, yyyy HH:mm')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CorporateStatusWidget