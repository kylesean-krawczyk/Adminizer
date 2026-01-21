import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, Check, ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AINotification } from '../../types/contextAware';

interface NotificationCardProps {
  notification: AINotification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, hours: number) => void;
  icon: LucideIcon;
}

export default function NotificationCard({
  notification,
  onMarkRead,
  onDismiss,
  onSnooze,
  icon: Icon
}: NotificationCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);

  const priorityColors = {
    urgent: 'border-red-500 bg-red-50',
    high: 'border-orange-500 bg-orange-50',
    normal: 'border-blue-500 bg-blue-50',
    low: 'border-gray-500 bg-gray-50'
  };

  const priorityTextColors = {
    urgent: 'text-red-700',
    high: 'text-orange-700',
    normal: 'text-blue-700',
    low: 'text-gray-700'
  };

  const handleAction = () => {
    if (notification.action_url) {
      navigate(notification.action_url);
      onMarkRead(notification.id);
    }
  };

  const handleSnooze = (hours: number) => {
    onSnooze(notification.id, hours);
    setShowSnoozeMenu(false);
  };

  const isUnread = notification.status === 'unread';

  return (
    <div
      className={`rounded-lg border-l-4 transition-all duration-200 ${
        priorityColors[notification.priority]
      } ${isUnread ? 'shadow-md' : 'opacity-75'}`}
    >
      <div className="p-3 bg-white">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-lg ${priorityColors[notification.priority]}`}>
            <Icon className={`w-4 h-4 ${priorityTextColors[notification.priority]}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={`text-sm font-semibold ${priorityTextColors[notification.priority]}`}>
                  {notification.title}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {notification.message}
                </p>
              </div>

              <button
                onClick={() => onDismiss(notification.id)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors ml-2"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  notification.priority === 'urgent'
                    ? 'bg-red-100 text-red-700'
                    : notification.priority === 'high'
                    ? 'bg-orange-100 text-orange-700'
                    : notification.priority === 'normal'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {notification.priority}
                </span>

                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
              </div>

              {notification.related_entity_type && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span>Details</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                <div>
                  <span className="font-medium">Type:</span> {notification.notification_type}
                </div>
                <div>
                  <span className="font-medium">Category:</span> {notification.category}
                </div>
                {notification.related_entity_type && (
                  <div>
                    <span className="font-medium">Related:</span> {notification.related_entity_type}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2 mt-3">
              {notification.action_url && notification.action_label && (
                <button
                  onClick={handleAction}
                  className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {notification.action_label}
                </button>
              )}

              {isUnread && (
                <button
                  onClick={() => onMarkRead(notification.id)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
                  title="Mark as read"
                >
                  <Check className="w-3 h-3" />
                  <span>Read</span>
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
                  title="Snooze"
                >
                  <Clock className="w-3 h-3" />
                </button>

                {showSnoozeMenu && (
                  <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 whitespace-nowrap">
                    <button
                      onClick={() => handleSnooze(1)}
                      className="block w-full px-4 py-2 text-xs text-left text-gray-700 hover:bg-gray-100"
                    >
                      1 hour
                    </button>
                    <button
                      onClick={() => handleSnooze(4)}
                      className="block w-full px-4 py-2 text-xs text-left text-gray-700 hover:bg-gray-100"
                    >
                      4 hours
                    </button>
                    <button
                      onClick={() => handleSnooze(24)}
                      className="block w-full px-4 py-2 text-xs text-left text-gray-700 hover:bg-gray-100"
                    >
                      Tomorrow
                    </button>
                    <button
                      onClick={() => handleSnooze(168)}
                      className="block w-full px-4 py-2 text-xs text-left text-gray-700 hover:bg-gray-100"
                    >
                      Next week
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
