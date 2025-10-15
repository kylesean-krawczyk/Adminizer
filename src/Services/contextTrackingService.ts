import { supabase } from '../lib/supabase';
import type { PageContext, PageContextData, PageType } from '../types/contextAware';

export class ContextTrackingService {
  static async trackPageContext(
    userId: string,
    organizationId: string | undefined,
    contextData: PageContextData
  ): Promise<PageContext | null> {
    try {
      const { data, error } = await supabase
        .from('ai_page_context')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          page_type: contextData.pageType,
          page_route: contextData.route,
          context_data: {
            stats: contextData.stats || {},
            filters: contextData.filters || {},
            recentActions: contextData.recentActions || [],
            entityId: contextData.entityId,
            entityType: contextData.entityType,
            timestamp: contextData.timestamp
          }
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error tracking page context:', error);
      return null;
    }
  }

  static async getRecentContext(
    userId: string,
    limit: number = 5
  ): Promise<PageContext[]> {
    try {
      const { data, error } = await supabase
        .from('ai_page_context')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent context:', error);
      return [];
    }
  }

  static async getCurrentPageContext(
    userId: string,
    pageType: PageType
  ): Promise<PageContext | null> {
    try {
      const { data, error } = await supabase
        .from('ai_page_context')
        .select('*')
        .eq('user_id', userId)
        .eq('page_type', pageType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching current page context:', error);
      return null;
    }
  }

  static async cleanupOldContext(daysToKeep: number = 7): Promise<boolean> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabase
        .from('ai_page_context')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error cleaning up old context:', error);
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
