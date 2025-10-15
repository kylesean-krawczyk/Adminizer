import { useState, useEffect } from 'react';
import { Bell, Save, RefreshCw } from 'lucide-react';
import { SmartNotificationService } from '../../services/smartNotificationService';
import { useAuth } from '../../contexts/AuthContext';
import type {
  NotificationPreference,
  NotificationType,
  NotificationFrequency,
  NotificationPriority
} from '../../types/contextAware';

export default function NotificationPreferencesPage() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const notificationTypes: Array<{
    type: NotificationType;
    label: string;
    description: string;
  }> = [
    {
      type: 'compliance',
      label: 'Compliance Alerts',
      description: 'Missing or expired documents, regulatory requirements'
    },
    {
      type: 'deadline',
      label: 'Deadline Notifications',
      description: 'Upcoming deadlines for grants, documents, and reviews'
    },
    {
      type: 'pattern',
      label: 'Data Pattern Alerts',
      description: 'Unusual patterns in donations, employees, or activities'
    },
    {
      type: 'optimization',
      label: 'Optimization Suggestions',
      description: 'Opportunities to improve workflows and efficiency'
    }
  ];

  const frequencies: NotificationFrequency[] = ['realtime', 'hourly', 'daily', 'weekly'];
  const priorities: NotificationPriority[] = ['urgent', 'high', 'normal', 'low'];

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id]);

  const loadPreferences = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const prefs = await SmartNotificationService.getUserPreferences(user.id);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPreference = (type: NotificationType): NotificationPreference => {
    const existing = preferences.find(p => p.notification_type === type);

    if (existing) return existing;

    return {
      id: '',
      user_id: user?.id || '',
      notification_type: type,
      enabled: true,
      frequency: 'realtime',
      min_priority: 'low',
      created_at: '',
      updated_at: ''
    };
  };

  const handleToggleEnabled = (type: NotificationType) => {
    const pref = getPreference(type);
    const updated = { ...pref, enabled: !pref.enabled };

    setPreferences(prev => {
      const filtered = prev.filter(p => p.notification_type !== type);
      if (pref.id) {
        return [...filtered, updated];
      }
      return prev;
    });
  };

  const handleFrequencyChange = (type: NotificationType, frequency: NotificationFrequency) => {
    const pref = getPreference(type);
    const updated = { ...pref, frequency };

    setPreferences(prev => {
      const filtered = prev.filter(p => p.notification_type !== type);
      if (pref.id) {
        return [...filtered, updated];
      }
      return prev;
    });
  };

  const handlePriorityChange = (type: NotificationType, priority: NotificationPriority) => {
    const pref = getPreference(type);
    const updated = { ...pref, min_priority: priority };

    setPreferences(prev => {
      const filtered = prev.filter(p => p.notification_type !== type);
      if (pref.id) {
        return [...filtered, updated];
      }
      return prev;
    });
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      for (const type of notificationTypes) {
        const pref = getPreference(type.type);

        await SmartNotificationService.updatePreference(user.id, type.type, {
          enabled: pref.enabled,
          frequency: pref.frequency,
          min_priority: pref.min_priority
        });
      }

      setSaveMessage('Preferences saved successfully!');
      await loadPreferences();

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveMessage('Error saving preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
            <p className="text-gray-600 mt-1">Loading your preferences...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
          <p className="text-gray-600 mt-1">
            Configure how and when you receive AI-powered notifications
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-lg ${
          saveMessage.includes('success')
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveMessage}
        </div>
      )}

      <div className="space-y-4">
        {notificationTypes.map(({ type, label, description }) => {
          const pref = getPreference(type);

          return (
            <div key={type} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <Bell className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={pref.enabled}
                    onChange={() => handleToggleEnabled(type)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {pref.enabled && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency
                    </label>
                    <select
                      value={pref.frequency}
                      onChange={(e) => handleFrequencyChange(type, e.target.value as NotificationFrequency)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {frequencies.map(freq => (
                        <option key={freq} value={freq}>
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Priority
                    </label>
                    <select
                      value={pref.min_priority}
                      onChange={(e) => handlePriorityChange(type, e.target.value as NotificationPriority)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">About Smart Notifications</h4>
        <p className="text-sm text-blue-800">
          Our AI-powered notification system monitors your organization's data continuously
          to identify compliance issues, upcoming deadlines, unusual patterns, and optimization
          opportunities. Configure your preferences above to control when and how you receive
          these intelligent alerts.
        </p>
      </div>
    </div>
  );
}
