import { supabase } from '../lib/supabase';
import { PermissionService } from './permissionService';
import type {
  ToolAccessRequest,
  ToolAccessRequestWithDetails,
  ToolAccessRequestCreate,
  ToolAccessRequestReview,
  AccessRequestStatus,
  PermissionFilters
} from '../types/permissions';

export class ToolAccessRequestService {
  static async createAccessRequest(
    userId: string,
    request: ToolAccessRequestCreate
  ): Promise<{ success: boolean; request?: ToolAccessRequest; error?: string }> {
    try {
      const existingRequest = await this.getPendingRequestForTool(userId, request.tool_id);
      if (existingRequest) {
        return {
          success: false,
          error: 'You already have a pending request for this tool'
        };
      }

      const { data, error } = await supabase
        .from('ai_tool_access_requests')
        .insert({
          user_id: userId,
          tool_id: request.tool_id,
          request_reason: request.request_reason,
          business_justification: request.business_justification,
          requested_duration_days: request.requested_duration_days,
          is_temporary: request.is_temporary,
          priority: request.priority || 'normal',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('ai_permission_audit_trail')
        .insert({
          user_id: userId,
          tool_id: request.tool_id,
          action_type: 'request',
          reason: request.request_reason,
          metadata: {
            business_justification: request.business_justification,
            requested_duration_days: request.requested_duration_days,
            priority: request.priority
          }
        });

      return { success: true, request: data };
    } catch (error) {
      console.error('Error creating access request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getPendingRequestForTool(
    userId: string,
    toolId: string
  ): Promise<ToolAccessRequest | null> {
    try {
      const { data } = await supabase
        .from('ai_tool_access_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('tool_id', toolId)
        .eq('status', 'pending')
        .maybeSingle();

      return data;
    } catch (error) {
      console.error('Error checking pending request:', error);
      return null;
    }
  }

  static async getMyRequests(userId: string): Promise<ToolAccessRequestWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('ai_tool_access_requests')
        .select(`
          *,
          tool:ai_tool_registry(id, name, slug, description, category),
          reviewer_profile:user_profiles!reviewed_by(id, email, full_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user requests:', error);
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      return (data || []) as ToolAccessRequestWithDetails[];
    } catch (error) {
      console.error('Error fetching user requests:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        console.error('Error message:', error.message);
      }
      return [];
    }
  }

  static async getPendingRequests(filters?: PermissionFilters): Promise<ToolAccessRequestWithDetails[]> {
    try {
      let query = supabase
        .from('ai_tool_access_requests')
        .select(`
          *,
          user_profile:user_profiles!user_id(id, email, full_name, role),
          tool:ai_tool_registry(id, name, slug, description, category)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pending requests:', error);
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      return (data || []) as ToolAccessRequestWithDetails[];
    } catch (error) {
      console.error('Error fetching pending requests - returning empty array:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        console.error('Error message:', error.message);
      }
      return [];
    }
  }

  static async getAllRequests(filters?: PermissionFilters): Promise<ToolAccessRequestWithDetails[]> {
    try {
      let query = supabase
        .from('ai_tool_access_requests')
        .select(`
          *,
          user_profile:user_profiles!user_id(id, email, full_name, role),
          tool:ai_tool_registry(id, name, slug, description, category),
          reviewer_profile:user_profiles!reviewed_by(id, email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters?.tool_id) {
        query = query.eq('tool_id', filters.tool_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all requests:', error);
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      return (data || []) as ToolAccessRequestWithDetails[];
    } catch (error) {
      console.error('Error fetching all requests:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        console.error('Error message:', error.message);
      }
      return [];
    }
  }

  static async reviewRequest(
    review: ToolAccessRequestReview,
    reviewedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: request } = await supabase
        .from('ai_tool_access_requests')
        .select('user_id, tool_id')
        .eq('id', review.request_id)
        .single();

      if (!request) {
        return { success: false, error: 'Request not found' };
      }

      const { error: updateError } = await supabase
        .from('ai_tool_access_requests')
        .update({
          status: review.status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          review_comment: review.review_comment
        })
        .eq('id', review.request_id);

      if (updateError) throw updateError;

      if (review.status === 'approved') {
        const grantResult = await PermissionService.grantToolAccess(
          request.user_id,
          request.tool_id,
          reviewedBy,
          `Approved access request: ${review.review_comment}`,
          review.grant_duration_days
        );

        if (!grantResult.success) {
          return {
            success: false,
            error: `Request approved but failed to grant permission: ${grantResult.error}`
          };
        }
      }

      await supabase
        .from('ai_permission_audit_trail')
        .insert({
          user_id: request.user_id,
          tool_id: request.tool_id,
          action_type: review.status === 'approved' ? 'approve' : 'deny',
          performed_by: reviewedBy,
          reason: review.review_comment,
          metadata: {
            request_id: review.request_id,
            grant_duration_days: review.grant_duration_days
          }
        });

      return { success: true };
    } catch (error) {
      console.error('Error reviewing request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async cancelRequest(
    requestId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ai_tool_access_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error cancelling request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async bulkApproveRequests(
    requestIds: string[],
    reviewedBy: string,
    reviewComment: string,
    grantDurationDays?: number
  ): Promise<{ success: boolean; approved: number; failed: number; error?: string }> {
    let approved = 0;
    let failed = 0;

    for (const requestId of requestIds) {
      const result = await this.reviewRequest(
        {
          request_id: requestId,
          status: 'approved',
          review_comment: reviewComment,
          grant_duration_days: grantDurationDays
        },
        reviewedBy
      );

      if (result.success) {
        approved++;
      } else {
        failed++;
      }
    }

    return {
      success: true,
      approved,
      failed
    };
  }

  static async bulkDenyRequests(
    requestIds: string[],
    reviewedBy: string,
    reviewComment: string
  ): Promise<{ success: boolean; denied: number; failed: number; error?: string }> {
    let denied = 0;
    let failed = 0;

    for (const requestId of requestIds) {
      const result = await this.reviewRequest(
        {
          request_id: requestId,
          status: 'denied',
          review_comment: reviewComment
        },
        reviewedBy
      );

      if (result.success) {
        denied++;
      } else {
        failed++;
      }
    }

    return {
      success: true,
      denied,
      failed
    };
  }

  static async expireOldRequests(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('ai_tool_access_requests')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lt('created_at', thirtyDaysAgo.toISOString())
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Error expiring old requests:', error);
      return 0;
    }
  }

  static async getRequestStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    denied: number;
    expired: number;
    cancelled: number;
    approved_today: number;
    denied_today: number;
  }> {
    try {
      const { data: allRequests } = await supabase
        .from('ai_tool_access_requests')
        .select('status, reviewed_at');

      if (!allRequests) {
        return {
          total: 0,
          pending: 0,
          approved: 0,
          denied: 0,
          expired: 0,
          cancelled: 0,
          approved_today: 0,
          denied_today: 0
        };
      }

      const today = new Date().toISOString().split('T')[0];

      const stats = {
        total: allRequests.length,
        pending: 0,
        approved: 0,
        denied: 0,
        expired: 0,
        cancelled: 0,
        approved_today: 0,
        denied_today: 0
      };

      for (const request of allRequests) {
        const status = request.status as AccessRequestStatus;
        stats[status]++;

        if (request.reviewed_at) {
          const reviewDate = request.reviewed_at.split('T')[0];
          if (reviewDate === today) {
            if (status === 'approved') stats.approved_today++;
            if (status === 'denied') stats.denied_today++;
          }
        }
      }

      return stats;
    } catch (error) {
      console.error('Error fetching request stats:', error);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        denied: 0,
        expired: 0,
        cancelled: 0,
        approved_today: 0,
        denied_today: 0
      };
    }
  }
}
