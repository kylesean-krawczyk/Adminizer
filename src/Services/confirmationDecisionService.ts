import { supabase } from '../lib/supabase';
import type { ConfirmationDecision, ConfirmationStatus } from '../types/toolRegistry';

export class ConfirmationDecisionService {
  static async createDecision(decision: {
    tool_id: string;
    session_id?: string;
    execution_log_id?: string;
    original_parameters: Record<string, any>;
    modified_parameters: Record<string, any>;
    parameters_changed: boolean;
    approval_status: ConfirmationStatus;
    modification_count: number;
    decision_time_ms?: number;
  }): Promise<ConfirmationDecision | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('confirmation_decisions')
        .insert({
          user_id: user.id,
          tool_id: decision.tool_id,
          session_id: decision.session_id,
          execution_log_id: decision.execution_log_id,
          original_parameters: decision.original_parameters,
          modified_parameters: decision.modified_parameters,
          parameters_changed: decision.parameters_changed,
          approval_status: decision.approval_status,
          modification_count: decision.modification_count,
          decision_time_ms: decision.decision_time_ms
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating confirmation decision:', error);
      return null;
    }
  }

  static async getUserDecisionHistory(
    toolId?: string,
    limit: number = 10
  ): Promise<ConfirmationDecision[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('confirmation_decisions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (toolId) {
        query = query.eq('tool_id', toolId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching decision history:', error);
      return [];
    }
  }

  static async getToolApprovalRate(toolId: string): Promise<{
    totalDecisions: number;
    approvedCount: number;
    rejectedCount: number;
    approvalRate: number;
    avgModificationCount: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('confirmation_decisions')
        .select('approval_status, modification_count')
        .eq('user_id', user.id)
        .eq('tool_id', toolId);

      if (error) throw error;

      const decisions = data || [];
      const totalDecisions = decisions.length;
      const approvedCount = decisions.filter(d => d.approval_status === 'approved').length;
      const rejectedCount = decisions.filter(d => d.approval_status === 'rejected').length;
      const approvalRate = totalDecisions > 0 ? (approvedCount / totalDecisions) * 100 : 0;

      const totalModifications = decisions.reduce((sum, d) => sum + (d.modification_count || 0), 0);
      const avgModificationCount = totalDecisions > 0 ? totalModifications / totalDecisions : 0;

      return {
        totalDecisions,
        approvedCount,
        rejectedCount,
        approvalRate: Math.round(approvalRate * 10) / 10,
        avgModificationCount: Math.round(avgModificationCount * 10) / 10
      };
    } catch (error) {
      console.error('Error calculating approval rate:', error);
      return {
        totalDecisions: 0,
        approvedCount: 0,
        rejectedCount: 0,
        approvalRate: 0,
        avgModificationCount: 0
      };
    }
  }

  static async getAvgDecisionTime(toolId: string): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('confirmation_decisions')
        .select('decision_time_ms')
        .eq('user_id', user.id)
        .eq('tool_id', toolId)
        .eq('approval_status', 'approved')
        .not('decision_time_ms', 'is', null);

      if (error) throw error;

      const decisions = data || [];
      if (decisions.length === 0) return 0;

      const totalTime = decisions.reduce((sum, d) => sum + (d.decision_time_ms || 0), 0);
      return Math.round(totalTime / decisions.length);
    } catch (error) {
      console.error('Error calculating average decision time:', error);
      return 0;
    }
  }

  static async getSessionDecisions(sessionId: string): Promise<ConfirmationDecision[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('confirmation_decisions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching session decisions:', error);
      return [];
    }
  }

  static calculateParameterChanges(
    original: Record<string, any>,
    modified: Record<string, any>
  ): {
    changed: boolean;
    changeCount: number;
    changes: Array<{ field: string; original: any; modified: any }>;
  } {
    const changes: Array<{ field: string; original: any; modified: any }> = [];

    const allKeys = new Set([
      ...Object.keys(original),
      ...Object.keys(modified)
    ]);

    for (const key of allKeys) {
      if (JSON.stringify(original[key]) !== JSON.stringify(modified[key])) {
        changes.push({
          field: key,
          original: original[key],
          modified: modified[key]
        });
      }
    }

    return {
      changed: changes.length > 0,
      changeCount: changes.length,
      changes
    };
  }
}
