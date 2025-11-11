import { supabase } from '../lib/supabase';
import type { PageContext, PageContextData, PageType } from '../types/contextAware';

interface TrackingError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}

export class ContextTrackingService {
  private static validateContextData(contextData: PageContextData): { valid: boolean; error?: string } {
    if (!contextData.pageType || contextData.pageType.trim() === '') {
      return { valid: false, error: 'pageType is required and cannot be empty' };
    }

    if (!contextData.route || contextData.route.trim() === '') {
      return { valid: false, error: 'route is required and cannot be empty' };
    }

    if (!contextData.timestamp) {
      return { valid: false, error: 'timestamp is required' };
    }

    return { valid: true };
  }

  private static sanitizeContextData(contextData: PageContextData): Record<string, any> {
    return {
      stats: contextData.stats || {},
      filters: contextData.filters || {},
      recentActions: Array.isArray(contextData.recentActions) ? contextData.recentActions : [],
      entityId: contextData.entityId || null,
      entityType: contextData.entityType || null,
      timestamp: contextData.timestamp || new Date().toISOString()
    };
  }

  static async trackPageContext(
    userId: string,
    organizationId: string | undefined,
    contextData: PageContextData
  ): Promise<PageContext | null> {
    try {
      if (!userId || userId.trim() === '') {
        console.error('[ContextTracking] Invalid userId provided:', userId);
        return null;
      }

      const validation = this.validateContextData(contextData);
      if (!validation.valid) {
        console.error('[ContextTracking] Validation failed:', validation.error);
        console.error('[ContextTracking] Context data:', contextData);
        return null;
      }

      const sanitizedContextData = this.sanitizeContextData(contextData);

      const insertData = {
        user_id: userId,
        organization_id: organizationId || null,
        page_type: contextData.pageType.trim(),
        page_route: contextData.route.trim(),
        page_url: null,
        context_data: sanitizedContextData
      };

      console.log('[ContextTracking] Attempting to insert context:', {
        user_id: insertData.user_id,
        page_type: insertData.page_type,
        page_route: insertData.page_route,
        has_org_id: !!insertData.organization_id
      });

      const { data, error } = await supabase
        .from('ai_page_context')
        .insert(insertData)
        .select()
        .maybeSingle();

      if (error) {
        const trackingError = error as TrackingError;
        console.error('[ContextTracking] Database error:', {
          code: trackingError.code,
          message: trackingError.message,
          details: trackingError.details,
          hint: trackingError.hint
        });
        throw error;
      }

      if (!data) {
        console.warn('[ContextTracking] No data returned after insert');
        return null;
      }

      console.log('[ContextTracking] Successfully tracked context:', data.id);
      return data;
    } catch (error) {
      const trackingError = error as TrackingError;
      console.error('[ContextTracking] Error tracking page context:', {
        error: trackingError.message || error,
        code: trackingError.code,
        userId,
        pageType: contextData.pageType,
        route: contextData.route
      });
      return null;
    }
  }

  static async getRecentContext(
    userId: string,
    limit: number = 5
  ): Promise<PageContext[]> {
    try {
      if (!userId || userId.trim() === '') {
        console.error('[ContextTracking] Invalid userId for getRecentContext:', userId);
        return [];
      }

      if (limit < 1 || limit > 100) {
        console.warn('[ContextTracking] Invalid limit, defaulting to 5:', limit);
        limit = 5;
      }

      const { data, error } = await supabase
        .from('ai_page_context')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        const trackingError = error as TrackingError;
        console.error('[ContextTracking] Error fetching recent context:', {
          code: trackingError.code,
          message: trackingError.message
        });
        throw error;
      }

      console.log(`[ContextTracking] Retrieved ${data?.length || 0} recent contexts for user ${userId}`);
      return data || [];
    } catch (error) {
      console.error('[ContextTracking] Error fetching recent context:', error);
      return [];
    }
  }

  static async getCurrentPageContext(
    userId: string,
    pageType: PageType
  ): Promise<PageContext | null> {
    try {
      if (!userId || userId.trim() === '') {
        console.error('[ContextTracking] Invalid userId for getCurrentPageContext:', userId);
        return null;
      }

      if (!pageType || pageType.trim() === '') {
        console.error('[ContextTracking] Invalid pageType for getCurrentPageContext:', pageType);
        return null;
      }

      const { data, error } = await supabase
        .from('ai_page_context')
        .select('*')
        .eq('user_id', userId)
        .eq('page_type', pageType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        const trackingError = error as TrackingError;
        console.error('[ContextTracking] Error fetching current page context:', {
          code: trackingError.code,
          message: trackingError.message,
          pageType
        });
        throw error;
      }

      if (data) {
        console.log(`[ContextTracking] Found current context for ${pageType}:`, data.id);
      }

      return data;
    } catch (error) {
      console.error('[ContextTracking] Error fetching current page context:', error);
      return null;
    }
  }

  static async cleanupOldContext(daysToKeep: number = 7): Promise<boolean> {
    try {
      if (daysToKeep < 1) {
        console.warn('[ContextTracking] Invalid daysToKeep, defaulting to 7:', daysToKeep);
        daysToKeep = 7;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      console.log(`[ContextTracking] Cleaning up contexts older than ${cutoffDate.toISOString()}`);

      const { error, count } = await supabase
        .from('ai_page_context')
        .delete({ count: 'exact' })
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        const trackingError = error as TrackingError;
        console.error('[ContextTracking] Error during cleanup:', {
          code: trackingError.code,
          message: trackingError.message
        });
        throw error;
      }

      console.log(`[ContextTracking] Cleaned up ${count || 0} old context entries`);
      return true;
    } catch (error) {
      console.error('[ContextTracking] Error cleaning up old context:', error);
      return false;
    }
  }

  static buildContextSummary(contexts: PageContext[]): string {
    if (contexts.length === 0) return '';

    const summary: string[] = [];

    summary.push('Recent user activity:');

    contexts.slice(0, 3).forEach((ctx, index) => {
      const pageLabel = this.getPageLabel(ctx.page_type);
      const actions = ctx.context_data?.recentActions || [];

      summary.push(`${index + 1}. ${pageLabel}`);

      if (actions.length > 0) {
        summary.push(`   Actions: ${actions.join(', ')}`);
      }

      if (ctx.context_data?.stats) {
        const statsStr = Object.entries(ctx.context_data.stats)
          .slice(0, 2)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        if (statsStr) {
          summary.push(`   Stats: ${statsStr}`);
        }
      }
    });

    return summary.join('\n');
  }

  private static getPageLabel(pageType: PageType): string {
    const labels: Record<PageType, string> = {
      dashboard: 'Dashboard',
      documents: 'Documents',
      document_upload: 'Document Upload',
      employees: 'Employees',
      fundraising: 'Fundraising',
      grants: 'Grants',
      donors: 'Donors',
      campaigns: 'Campaigns',
      departments: 'Departments',
      operations: 'Operations',
      workflows: 'Workflows',
      settings: 'Settings',
      analytics: 'Analytics'
    };

    return labels[pageType] || pageType;
  }
}
