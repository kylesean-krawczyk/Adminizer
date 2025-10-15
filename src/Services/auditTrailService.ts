import { supabase } from '../lib/supabase';
import type {
  PermissionAuditEntry,
  PermissionAuditEntryWithDetails,
  AuditTrailFilters
} from '../types/permissions';

export class AuditTrailService {
  static async fetchAuditTrail(
    filters?: AuditTrailFilters,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ data: PermissionAuditEntryWithDetails[]; total: number; error?: string }> {
    try {
      let query = supabase
        .from('ai_permission_audit_trail')
        .select(`
          *,
          user_profile:user_profiles!ai_permission_audit_trail_user_id_fkey(id, email, full_name),
          tool:ai_tool_registry(id, name, slug),
          performer_profile:user_profiles!ai_permission_audit_trail_performed_by_fkey(id, email, full_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters?.tool_id) {
        query = query.eq('tool_id', filters.tool_id);
      }

      if (filters?.action_type) {
        query = query.eq('action_type', filters.action_type);
      }

      if (filters?.performed_by) {
        query = query.eq('performed_by', filters.performed_by);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters?.show_denials_only) {
        query = query.in('action_type', ['check_denied', 'deny', 'revoke']);
      }

      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: (data || []) as PermissionAuditEntryWithDetails[],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      return {
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async exportAuditTrailCSV(
    filters?: AuditTrailFilters
  ): Promise<{ success: boolean; csv?: string; error?: string }> {
    try {
      const { data, error } = await this.fetchAuditTrail(filters, 1, 10000);

      if (error) throw new Error(error);

      const headers = [
        'Date/Time',
        'User Email',
        'User Name',
        'Tool Name',
        'Action Type',
        'Performed By',
        'Reason',
        'IP Address'
      ];

      const rows = data.map(entry => [
        new Date(entry.created_at).toISOString(),
        entry.user_profile?.email || 'N/A',
        entry.user_profile?.full_name || 'N/A',
        entry.tool?.name || 'N/A',
        entry.action_type,
        entry.performer_profile?.email || 'System',
        entry.reason || 'N/A',
        entry.ip_address || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row =>
          row.map(cell => {
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          }).join(',')
        )
      ].join('\n');

      return { success: true, csv: csvContent };
    } catch (error) {
      console.error('Error exporting audit trail:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getAuditStats(): Promise<{
    total_entries: number;
    entries_today: number;
    grants_today: number;
    revokes_today: number;
    denials_today: number;
    top_actions: Array<{ action_type: string; count: number }>;
    top_performers: Array<{ performer_id: string; performer_email: string; count: number }>;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: allEntries } = await supabase
        .from('ai_permission_audit_trail')
        .select('action_type, created_at, performed_by');

      const { data: performers } = await supabase
        .from('ai_permission_audit_trail')
        .select(`
          performed_by,
          performer_profile:user_profiles!ai_permission_audit_trail_performed_by_fkey(email)
        `)
        .not('performed_by', 'is', null);

      if (!allEntries) {
        return {
          total_entries: 0,
          entries_today: 0,
          grants_today: 0,
          revokes_today: 0,
          denials_today: 0,
          top_actions: [],
          top_performers: []
        };
      }

      const todayEntries = allEntries.filter(e =>
        e.created_at.startsWith(today)
      );

      const actionCounts: Record<string, number> = {};
      allEntries.forEach(entry => {
        actionCounts[entry.action_type] = (actionCounts[entry.action_type] || 0) + 1;
      });

      const performerCounts: Record<string, { email: string; count: number }> = {};
      if (performers) {
        performers.forEach((entry: any) => {
          if (entry.performed_by) {
            if (!performerCounts[entry.performed_by]) {
              performerCounts[entry.performed_by] = {
                email: entry.performer_profile?.email || 'Unknown',
                count: 0
              };
            }
            performerCounts[entry.performed_by].count++;
          }
        });
      }

      const top_actions = Object.entries(actionCounts)
        .map(([action_type, count]) => ({ action_type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const top_performers = Object.entries(performerCounts)
        .map(([performer_id, data]) => ({
          performer_id,
          performer_email: data.email,
          count: data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        total_entries: allEntries.length,
        entries_today: todayEntries.length,
        grants_today: todayEntries.filter(e => e.action_type === 'grant').length,
        revokes_today: todayEntries.filter(e => e.action_type === 'revoke').length,
        denials_today: todayEntries.filter(e =>
          e.action_type === 'deny' || e.action_type === 'check_denied'
        ).length,
        top_actions,
        top_performers
      };
    } catch (error) {
      console.error('Error getting audit stats:', error);
      return {
        total_entries: 0,
        entries_today: 0,
        grants_today: 0,
        revokes_today: 0,
        denials_today: 0,
        top_actions: [],
        top_performers: []
      };
    }
  }

  static subscribeToAuditTrail(
    callback: (entry: PermissionAuditEntry) => void
  ): { unsubscribe: () => void } {
    const subscription = supabase
      .channel('audit-trail-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_permission_audit_trail'
        },
        (payload) => {
          callback(payload.new as PermissionAuditEntry);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        subscription.unsubscribe();
      }
    };
  }

  static downloadCSV(csv: string, filename: string = 'audit-trail.csv'): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  static formatActionType(actionType: string): string {
    const actionMap: Record<string, string> = {
      'grant': 'Permission Granted',
      'revoke': 'Permission Revoked',
      'request': 'Access Requested',
      'approve': 'Request Approved',
      'deny': 'Request Denied',
      'expire': 'Permission Expired',
      'check_denied': 'Access Denied',
      'check_allowed': 'Access Allowed'
    };
    return actionMap[actionType] || actionType;
  }

  static getActionTypeColor(actionType: string): string {
    const colorMap: Record<string, string> = {
      'grant': 'bg-green-100 text-green-800',
      'revoke': 'bg-red-100 text-red-800',
      'request': 'bg-blue-100 text-blue-800',
      'approve': 'bg-green-100 text-green-800',
      'deny': 'bg-red-100 text-red-800',
      'expire': 'bg-yellow-100 text-yellow-800',
      'check_denied': 'bg-orange-100 text-orange-800',
      'check_allowed': 'bg-gray-100 text-gray-800'
    };
    return colorMap[actionType] || 'bg-gray-100 text-gray-800';
  }
}
