import { supabase } from '../lib/supabase';
import type {
  PermissionTemplate,
  UserPermission,
  PermissionCheckResult,
  UserPermissionSummary,
  BulkPermissionUpdate,
  PermissionLevel
} from '../types/permissions';
import type { ToolDefinition } from '../types/toolRegistry';

export class PermissionService {
  private static permissionCache: Map<string, PermissionCheckResult> = new Map();
  private static cacheExpiry: Map<string, number> = new Map();
  private static readonly CACHE_TTL = 5 * 60 * 1000;

  private static readonly PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
    'viewer': 0,
    'employee': 1,
    'manager': 2,
    'admin': 3,
    'master_admin': 4
  };

  static clearCache(userId?: string): void {
    if (userId) {
      for (const key of this.permissionCache.keys()) {
        if (key.startsWith(`${userId}:`)) {
          this.permissionCache.delete(key);
          this.cacheExpiry.delete(key);
        }
      }
    } else {
      this.permissionCache.clear();
      this.cacheExpiry.clear();
    }
  }

  private static getCacheKey(userId: string, toolId: string): string {
    return `${userId}:${toolId}`;
  }

  private static isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry) return false;
    return Date.now() < expiry;
  }

  static async getUserPermissionLevel(userId: string): Promise<PermissionLevel> {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, default_permission_template')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) return 'viewer';

      const roleLevel = profile.role as PermissionLevel;

      if (roleLevel === 'master_admin' || roleLevel === 'admin') {
        return roleLevel;
      }

      if (profile.default_permission_template) {
        const { data: template } = await supabase
          .from('ai_permission_templates')
          .select('permission_level')
          .eq('id', profile.default_permission_template)
          .maybeSingle();

        if (template) {
          return template.permission_level as PermissionLevel;
        }
      }

      return this.roleToPermissionLevel(roleLevel);
    } catch (error) {
      console.error('Error getting user permission level:', error);
      return 'viewer';
    }
  }

  private static roleToPermissionLevel(role: string): PermissionLevel {
    const mapping: Record<string, PermissionLevel> = {
      'master_admin': 'master_admin',
      'admin': 'admin',
      'user': 'employee'
    };
    return mapping[role] || 'viewer';
  }

  static async checkToolAccess(
    userId: string,
    toolId: string,
    skipCache: boolean = false
  ): Promise<PermissionCheckResult> {
    const cacheKey = this.getCacheKey(userId, toolId);

    if (!skipCache && this.isCacheValid(cacheKey)) {
      const cached = this.permissionCache.get(cacheKey);
      if (cached) return cached;
    }

    const result = await this.performPermissionCheck(userId, toolId);

    this.permissionCache.set(cacheKey, result);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

    await this.logPermissionCheck(userId, toolId, result);

    return result;
  }

  private static async performPermissionCheck(
    userId: string,
    toolId: string
  ): Promise<PermissionCheckResult> {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, default_permission_template, permission_overrides')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) {
        return {
          allowed: false,
          reason: 'User profile not found',
          permission_level: 'viewer',
          source: 'denied'
        };
      }

      if (profile.role === 'master_admin') {
        return {
          allowed: true,
          reason: 'Master admin has full access',
          permission_level: 'master_admin',
          source: 'role'
        };
      }

      const { data: userPermission } = await supabase
        .from('ai_user_permissions')
        .select('granted, expires_at, reason')
        .eq('user_id', userId)
        .eq('tool_id', toolId)
        .maybeSingle();

      if (userPermission) {
        if (userPermission.expires_at) {
          const expiryDate = new Date(userPermission.expires_at);
          if (expiryDate < new Date()) {
            return {
              allowed: false,
              reason: 'Permission expired',
              permission_level: await this.getUserPermissionLevel(userId),
              source: 'denied'
            };
          }
        }

        return {
          allowed: userPermission.granted,
          reason: userPermission.reason || (userPermission.granted ? 'Explicit permission granted' : 'Explicitly denied'),
          permission_level: await this.getUserPermissionLevel(userId),
          source: 'override'
        };
      }

      if (profile.default_permission_template) {
        const { data: template } = await supabase
          .from('ai_permission_templates')
          .select('tool_permissions, permission_level')
          .eq('id', profile.default_permission_template)
          .maybeSingle();

        if (template) {
          const { data: tool } = await supabase
            .from('ai_tool_registry')
            .select('slug')
            .eq('id', toolId)
            .maybeSingle();

          if (tool && template.tool_permissions) {
            if (template.tool_permissions.all === true) {
              return {
                allowed: true,
                reason: 'Template grants full access',
                permission_level: template.permission_level as PermissionLevel,
                source: 'template'
              };
            }

            if (template.tool_permissions.allowed_tools?.includes(tool.slug)) {
              return {
                allowed: true,
                reason: 'Tool allowed by permission template',
                permission_level: template.permission_level as PermissionLevel,
                source: 'template'
              };
            }

            if (template.tool_permissions.denied_tools?.includes(tool.slug)) {
              return {
                allowed: false,
                reason: 'Tool explicitly denied by template',
                permission_level: template.permission_level as PermissionLevel,
                source: 'denied'
              };
            }
          }
        }
      }

      const { data: tool } = await supabase
        .from('ai_tool_registry')
        .select('permission_level')
        .eq('id', toolId)
        .maybeSingle();

      if (!tool) {
        return {
          allowed: false,
          reason: 'Tool not found',
          permission_level: await this.getUserPermissionLevel(userId),
          source: 'denied'
        };
      }

      const userLevel = await this.getUserPermissionLevel(userId);
      const requiredLevel = tool.permission_level as PermissionLevel;

      const hasAccess = this.PERMISSION_HIERARCHY[userLevel] >= this.PERMISSION_HIERARCHY[requiredLevel];

      return {
        allowed: hasAccess,
        reason: hasAccess
          ? `User has ${userLevel} level, tool requires ${requiredLevel}`
          : `Insufficient permission: requires ${requiredLevel}, user has ${userLevel}`,
        permission_level: userLevel,
        source: 'role'
      };
    } catch (error) {
      console.error('Error checking tool access:', error);
      return {
        allowed: false,
        reason: 'Error checking permissions',
        permission_level: 'viewer',
        source: 'denied'
      };
    }
  }

  private static async logPermissionCheck(
    userId: string,
    toolId: string,
    result: PermissionCheckResult
  ): Promise<void> {
    try {
      await supabase
        .from('ai_permission_audit_trail')
        .insert({
          user_id: userId,
          tool_id: toolId,
          action_type: result.allowed ? 'check_allowed' : 'check_denied',
          metadata: {
            permission_level: result.permission_level,
            source: result.source,
            reason: result.reason
          }
        });
    } catch (error) {
      console.error('Error logging permission check:', error);
    }
  }

  static async getAvailableTools(userId: string): Promise<ToolDefinition[]> {
    try {
      const { data: tools } = await supabase
        .from('ai_tool_registry')
        .select('*')
        .eq('is_enabled', true)
        .order('name');

      if (!tools) return [];

      const availableTools: ToolDefinition[] = [];

      for (const tool of tools) {
        const accessCheck = await this.checkToolAccess(userId, tool.id);
        if (accessCheck.allowed) {
          availableTools.push(tool);
        }
      }

      return availableTools;
    } catch (error) {
      console.error('Error getting available tools:', error);
      return [];
    }
  }

  static async getUserPermissionSummary(userId: string): Promise<UserPermissionSummary | null> {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, default_permission_template')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) return null;

      const { data: permissions } = await supabase
        .from('ai_user_permissions')
        .select('tool_id, granted, expires_at, is_temporary')
        .eq('user_id', userId);

      const { data: template } = profile.default_permission_template
        ? await supabase
            .from('ai_permission_templates')
            .select('name')
            .eq('id', profile.default_permission_template)
            .maybeSingle()
        : { data: null };

      const grantedTools: string[] = [];
      const deniedTools: string[] = [];
      const temporaryPermissions: UserPermission[] = [];

      if (permissions) {
        for (const perm of permissions) {
          if (perm.granted) {
            grantedTools.push(perm.tool_id);
            if (perm.is_temporary) {
              temporaryPermissions.push(perm as UserPermission);
            }
          } else {
            deniedTools.push(perm.tool_id);
          }
        }
      }

      return {
        user_id: userId,
        role: profile.role,
        template_id: profile.default_permission_template || undefined,
        template_name: template?.name || undefined,
        granted_tools: grantedTools,
        denied_tools: deniedTools,
        temporary_permissions: temporaryPermissions,
        effective_permission_level: await this.getUserPermissionLevel(userId)
      };
    } catch (error) {
      console.error('Error getting user permission summary:', error);
      return null;
    }
  }

  static async grantToolAccess(
    userId: string,
    toolId: string,
    grantedBy: string,
    reason: string,
    expiresInDays?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('ai_user_permissions')
        .upsert({
          user_id: userId,
          tool_id: toolId,
          granted: true,
          granted_by: grantedBy,
          granted_at: new Date().toISOString(),
          expires_at: expiresAt,
          reason,
          is_temporary: !!expiresInDays
        }, {
          onConflict: 'user_id,tool_id'
        });

      if (error) throw error;

      await supabase
        .from('ai_permission_audit_trail')
        .insert({
          user_id: userId,
          tool_id: toolId,
          action_type: 'grant',
          performed_by: grantedBy,
          reason,
          permission_after: {
            granted: true,
            expires_at: expiresAt,
            is_temporary: !!expiresInDays
          }
        });

      this.clearCache(userId);

      return { success: true };
    } catch (error) {
      console.error('Error granting tool access:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async revokeToolAccess(
    userId: string,
    toolId: string,
    revokedBy: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ai_user_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('tool_id', toolId);

      if (error) throw error;

      await supabase
        .from('ai_permission_audit_trail')
        .insert({
          user_id: userId,
          tool_id: toolId,
          action_type: 'revoke',
          performed_by: revokedBy,
          reason,
          permission_after: { granted: false }
        });

      this.clearCache(userId);

      return { success: true };
    } catch (error) {
      console.error('Error revoking tool access:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async bulkUpdatePermissions(
    update: BulkPermissionUpdate,
    performedBy: string
  ): Promise<{ success: boolean; error?: string; updated: number }> {
    try {
      let updated = 0;

      for (const userId of update.user_ids) {
        if (update.granted) {
          const result = await this.grantToolAccess(
            userId,
            update.tool_id,
            performedBy,
            update.reason,
            update.expires_in_days
          );
          if (result.success) updated++;
        } else {
          const result = await this.revokeToolAccess(
            userId,
            update.tool_id,
            performedBy,
            update.reason
          );
          if (result.success) updated++;
        }
      }

      return { success: true, updated };
    } catch (error) {
      console.error('Error bulk updating permissions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        updated: 0
      };
    }
  }

  static async getPermissionTemplates(): Promise<PermissionTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('ai_permission_templates')
        .select('*')
        .order('permission_level');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching permission templates:', error);
      return [];
    }
  }

  static async applyTemplateToUser(
    userId: string,
    templateId: string,
    appliedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ default_permission_template: templateId })
        .eq('id', userId);

      if (error) throw error;

      await supabase
        .from('ai_permission_audit_trail')
        .insert({
          user_id: userId,
          action_type: 'grant',
          performed_by: appliedBy,
          reason: `Applied permission template ${templateId}`,
          metadata: { template_id: templateId }
        });

      this.clearCache(userId);

      return { success: true };
    } catch (error) {
      console.error('Error applying template to user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
