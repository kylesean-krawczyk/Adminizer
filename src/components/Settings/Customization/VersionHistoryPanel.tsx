import React, { useState, useEffect } from 'react'
import { Clock, Star, RotateCcw, User as UserIcon } from 'lucide-react'
import { VerticalId } from '../../../config/types'
import { CustomizationHistory } from '../../../types/organizationCustomization'
import {
  getCustomizationHistory,
  rollbackToVersion,
  markAsMilestone
} from '../../../services/organizationCustomizationService'
import { format } from 'date-fns'

interface VersionHistoryPanelProps {
  organizationId: string
  verticalId: VerticalId
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({ organizationId, verticalId }) => {
  const [history, setHistory] = useState<CustomizationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [showMilestonesOnly, setShowMilestonesOnly] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [organizationId, verticalId, showMilestonesOnly])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await getCustomizationHistory(organizationId, verticalId, {
        limit: 50,
        milestonesOnly: showMilestonesOnly
      })
      setHistory(data)
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRollback = async (historyId: string) => {
    if (!window.confirm('Are you sure you want to rollback to this version? This will create a new version with the previous configuration.')) {
      return
    }

    try {
      await rollbackToVersion(historyId, organizationId, verticalId)
      alert('Successfully rolled back to previous version!')
      loadHistory()
    } catch (error) {
      alert('Failed to rollback to previous version')
    }
  }

  const handleMarkMilestone = async (historyId: string) => {
    const milestoneName = prompt('Enter a name for this milestone:')
    if (!milestoneName) return

    const notes = prompt('Enter optional notes for this milestone:')

    try {
      await markAsMilestone({ historyId, milestoneName, notes: notes || undefined })
      alert('Marked as milestone successfully!')
      loadHistory()
    } catch (error) {
      alert('Failed to mark as milestone')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
          <p className="text-sm text-gray-600 mt-1">
            View and restore previous configurations
          </p>
        </div>
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={showMilestonesOnly}
            onChange={(e) => setShowMilestonesOnly(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-gray-700">Show milestones only</span>
        </label>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No version history available yet</p>
          <p className="text-sm text-gray-500 mt-1">
            History will be created when you make changes
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => (
            <div
              key={entry.id}
              className={`border rounded-lg p-4 ${
                entry.is_milestone ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {entry.is_milestone && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                    <h3 className="font-medium text-gray-900">
                      {entry.milestone_name || entry.change_description || 'Configuration Update'}
                    </h3>
                    <span className="text-xs text-gray-500">
                      v{entry.version_number}
                    </span>
                  </div>

                  {entry.change_note && (
                    <p className="text-sm text-gray-600 mb-2">{entry.change_note}</p>
                  )}

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    {entry.changed_by_profile && (
                      <div className="flex items-center space-x-1">
                        <UserIcon className="h-3 w-3" />
                        <span>
                          {entry.changed_by_profile.full_name || entry.changed_by_profile.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {!entry.is_milestone && (
                    <button
                      onClick={() => handleMarkMilestone(entry.id)}
                      className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="Mark as milestone"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRollback(entry.id)}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Restore</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <h4 className="font-semibold text-gray-900 mb-2">Retention Policy</h4>
        <ul className="space-y-1">
          <li>• Last 20 changes are always kept</li>
          <li>• All changes from last 90 days are kept</li>
          <li>• Milestone versions are kept indefinitely</li>
          <li>• Older versions outside these rules are automatically cleaned up</li>
        </ul>
      </div>
    </div>
  )
}

export default VersionHistoryPanel
