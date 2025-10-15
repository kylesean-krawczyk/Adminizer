import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PermissionService } from '../services/permissionService';
import { supabase } from '../lib/supabase';
import type {
  PermissionCheckResult,
  UserPermissionSummary,
  PermissionLevel
} from '../types/permissions';
import type { ToolDefinition } from '../types/toolRegistry';

export function usePermissions() {
  const { user } = useAuth();
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>('viewer');
  const [availableTools, setAvailableTools] = useState<ToolDefinition[]>([]);
  const [permissionSummary, setPermissionSummary] = useState<UserPermissionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [level, tools, summary] = await Promise.all([
        PermissionService.getUserPermissionLevel(user.id),
        PermissionService.getAvailableTools(user.id),
        PermissionService.getUserPermissionSummary(user.id)
      ]);

      setPermissionLevel(level);
      setAvailableTools(tools);
      setPermissionSummary(summary);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('permission-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_user_permissions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadPermissions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, loadPermissions]);

  const checkToolAccess = useCallback(
    async (toolId: string): Promise<PermissionCheckResult> => {
      if (!user?.id) {
        return {
          allowed: false,
          reason: 'User not authenticated',
          permission_level: 'viewer',
          source: 'denied'
        };
      }

      return await PermissionService.checkToolAccess(user.id, toolId);
    },
    [user?.id]
  );

  const hasToolAccess = useCallback(
    (toolSlug: string): boolean => {
      return availableTools.some(tool => tool.slug === toolSlug);
    },
    [availableTools]
  );

  const refreshPermissions = useCallback(() => {
    if (user?.id) {
      PermissionService.clearCache(user.id);
      loadPermissions();
    }
  }, [user?.id, loadPermissions]);

  const isAdmin = permissionLevel === 'admin' || permissionLevel === 'master_admin';
  const isMasterAdmin = permissionLevel === 'master_admin';
  const isManager = permissionLevel === 'manager' || isAdmin;
  const isEmployee = permissionLevel === 'employee' || isManager;

  return {
    permissionLevel,
    availableTools,
    permissionSummary,
    loading,
    checkToolAccess,
    hasToolAccess,
    refreshPermissions,
    isAdmin,
    isMasterAdmin,
    isManager,
    isEmployee
  };
}
