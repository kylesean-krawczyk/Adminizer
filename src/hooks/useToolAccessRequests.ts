import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ToolAccessRequestService } from '../services/toolAccessRequestService';
import { supabase } from '../lib/supabase';
import type {
  ToolAccessRequestWithDetails,
  ToolAccessRequestReview,
  PermissionFilters
} from '../types/permissions';

export function useToolAccessRequests(filters?: PermissionFilters) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ToolAccessRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await ToolAccessRequestService.getAllRequests(filters);
      setRequests(data);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [user?.id, filters]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('access-request-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_tool_access_requests'
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, loadRequests]);

  const approveRequest = useCallback(
    async (
      requestId: string,
      reviewComment: string,
      grantDurationDays?: number
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id) {
        return { success: false, error: 'User not authenticated' };
      }

      try {
        const review: ToolAccessRequestReview = {
          request_id: requestId,
          status: 'approved',
          review_comment: reviewComment,
          grant_duration_days: grantDurationDays
        };

        const result = await ToolAccessRequestService.reviewRequest(review, user.id);

        if (result.success) {
          await loadRequests();
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to approve request';
        return { success: false, error: errorMessage };
      }
    },
    [user?.id, loadRequests]
  );

  const denyRequest = useCallback(
    async (
      requestId: string,
      reviewComment: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id) {
        return { success: false, error: 'User not authenticated' };
      }

      try {
        const review: ToolAccessRequestReview = {
          request_id: requestId,
          status: 'denied',
          review_comment: reviewComment
        };

        const result = await ToolAccessRequestService.reviewRequest(review, user.id);

        if (result.success) {
          await loadRequests();
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to deny request';
        return { success: false, error: errorMessage };
      }
    },
    [user?.id, loadRequests]
  );

  const bulkApprove = useCallback(
    async (
      requestIds: string[],
      reviewComment: string,
      grantDurationDays?: number
    ): Promise<{ success: boolean; approved: number; failed: number; error?: string }> => {
      if (!user?.id) {
        return { success: false, approved: 0, failed: requestIds.length, error: 'User not authenticated' };
      }

      try {
        const result = await ToolAccessRequestService.bulkApproveRequests(
          requestIds,
          user.id,
          reviewComment,
          grantDurationDays
        );

        if (result.approved > 0) {
          await loadRequests();
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to bulk approve';
        return { success: false, approved: 0, failed: requestIds.length, error: errorMessage };
      }
    },
    [user?.id, loadRequests]
  );

  const bulkDeny = useCallback(
    async (
      requestIds: string[],
      reviewComment: string
    ): Promise<{ success: boolean; denied: number; failed: number; error?: string }> => {
      if (!user?.id) {
        return { success: false, denied: 0, failed: requestIds.length, error: 'User not authenticated' };
      }

      try {
        const result = await ToolAccessRequestService.bulkDenyRequests(
          requestIds,
          user.id,
          reviewComment
        );

        if (result.denied > 0) {
          await loadRequests();
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to bulk deny';
        return { success: false, denied: 0, failed: requestIds.length, error: errorMessage };
      }
    },
    [user?.id, loadRequests]
  );

  const refreshRequests = useCallback(() => {
    loadRequests();
  }, [loadRequests]);

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const urgentRequests = pendingRequests.filter(r => r.priority === 'urgent');
  const highPriorityRequests = pendingRequests.filter(r => r.priority === 'high');
  const normalPriorityRequests = pendingRequests.filter(r => r.priority === 'normal');
  const lowPriorityRequests = pendingRequests.filter(r => r.priority === 'low');

  return {
    requests,
    pendingRequests,
    urgentRequests,
    highPriorityRequests,
    normalPriorityRequests,
    lowPriorityRequests,
    loading,
    error,
    approveRequest,
    denyRequest,
    bulkApprove,
    bulkDeny,
    refreshRequests
  };
}
