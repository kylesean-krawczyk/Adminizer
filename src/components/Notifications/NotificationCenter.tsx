import { useState, useEffect } from 'react';
import { Bell, X, Check, Clock, AlertTriangle, TrendingUp, Lightbulb, FileX } from 'lucide-react';
import { SmartNotificationService } from '../../services/smartNotificationService';
import { useAuth } from '../../contexts/AuthContext';
import { useUserManagement } from '../../hooks';
import NotificationCard from './NotificationCard';
import type { AINotification, NotificationType } from '../../types/contextAware';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AINotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const { user } = useAuth();
  const { organization } = useUserManagement();

  useEffect(() => {
    if (user?.id && organization?.id) {
      loadNotifications();
    }
  }, [user?.id, organization?.id, filter, typeFilter]);

  const loadNotifications = async () => {
    if (!user?.id || !organization?.id) return;

    const filters: any = {};

    if (filter === 'unread') {
      filters.status = 'unread';
    }

    if (typeFilter !== 'all') {
      filters.type = typeFilter;
    }

    const data = await SmartNotificationService.getNotifications(
      user.id,
      organization.id,
      filters
    );

    setNotifications(data);
  };

  const handleMarkRead = async (notificationId: string) => {
    await SmartNotificationService.markNotificationRead(notificationId);
    loadNotifications();
  };

  const handleDismiss = async (notificationId: string) => {
    await SmartNotificationService.dismissNotification(notificationId);
    loadNotifications();
  };

  const handleSnooze = async (notificationId: string, hours: number) => {
    await SmartNotificationService.snoozeNotification(notificationId, hours);
    loadNotifications();
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && n.status === 'unread').length;

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'compliance':
        return FileX;
      case 'deadline':
        return Clock;
      case 'pattern':
        return TrendingUp;
      case 'optimization':
        return Lightbulb;
      default:
        return Bell;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 ${urgentCount > 0 ? 'bg-red-500' : 'bg-blue-500'} text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed right-4 top-16 w-96 max-h-[80vh] bg-white rounded-lg shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-500">
                    {unreadCount} unread {urgentCount > 0 && `(${urgentCount} urgent)`}
                  </p>
                )}
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-2 p-4 border-b border-gray-200">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    filter === 'all'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    filter === 'unread'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Unread
                </button>
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
                className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="compliance">Compliance</option>
                <option value="deadline">Deadlines</option>
                <option value="pattern">Patterns</option>
                <option value="optimization">Optimization</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">All caught up!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications to show'}
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onDismiss={handleDismiss}
                    onSnooze={handleSnooze}
                    icon={getIconForType(notification.notification_type)}
                  />
                ))
              )}
            </div>

            {urgentCount > 0 && (
              <div className="p-4 bg-red-50 border-t border-red-100">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-800">
                    <span className="font-semibold">{urgentCount} urgent item{urgentCount !== 1 ? 's' : ''}</span>
                    {' '}require immediate attention
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
