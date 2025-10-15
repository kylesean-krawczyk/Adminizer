import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ToolAccessRequestService } from '../services/toolAccessRequestService';
import { supabase } from '../lib/supabase';
import type { AccessRequestPriority } from '../types/permissions';

export interface RequestNotificationData {
  total: number;
  urgent: number;
  high: number;
  normal: number;
  low: number;
  badgeColor: 'red' | 'orange' | 'blue' | 'gray';
  badgeText: string;
}

export function useRequestNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RequestNotificationData>({
    total: 0,
    urgent: 0,
    high: 0,
    normal: 0,
    low: 0,
    badgeColor: 'gray',
    badgeText: '0'
  });
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const pendingRequests = await ToolAccessRequestService.getPendingRequests();

      const priorityCounts: Record<AccessRequestPriority, number> = {
        urgent: 0,
        high: 0,
        normal: 0,
        low: 0
      };

      pendingRequests.forEach(request => {
        priorityCounts[request.priority]++;
      });

      const total = pendingRequests.length;
      const urgent = priorityCounts.urgent;
      const high = priorityCounts.high;
      const normal = priorityCounts.normal;
      const low = priorityCounts.low;

      let badgeColor: 'red' | 'orange' | 'blue' | 'gray' = 'gray';
      let badgeText = '0';

      if (urgent > 0) {
        badgeColor = 'red';
        badgeText = urgent.toString();
      } else if (high > 0) {
        badgeColor = 'orange';
        badgeText = high.toString();
      } else if (normal > 0) {
        badgeColor = 'blue';
        badgeText = normal.toString();
      } else if (low > 0) {
        badgeColor = 'gray';
        badgeText = low.toString();
      }

      setNotifications({
        total,
        urgent,
        high,
        normal,
        low,
        badgeColor,
        badgeText
      });
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('request-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_tool_access_requests'
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, loadNotifications]);

  const refreshNotifications = useCallback(() => {
    loadNotifications();
  }, [loadNotifications]);

  const hasUrgentRequests = notifications.urgent > 0;
  const hasHighPriorityRequests = notifications.high > 0;
  const hasPendingRequests = notifications.total > 0;

  return {
    notifications,
    loading,
    hasUrgentRequests,
    hasHighPriorityRequests,
    hasPendingRequests,
    refreshNotifications
  };
}
