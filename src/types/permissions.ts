export type PermissionLevel = 'master_admin' | 'admin' | 'manager' | 'employee' | 'viewer';

export type AccessRequestStatus = 'pending' | 'approved' | 'denied' | 'expired' | 'cancelled';

export type AccessRequestPriority = 'low' | 'normal' | 'high' | 'urgent';

export type PermissionAuditAction =
  | 'grant'
  | 'revoke'
  | 'request'
  | 'approve'
  | 'deny'
  | 'expire'
  | 'check_denied'
  | 'check_allowed';

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permission_level: PermissionLevel;
  tool_permissions: {
    all?: boolean;
    allowed_tools?: string[];
    denied_tools?: string[];
  };
  is_system_template: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  tool_id: string;
  granted: boolean;
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
  reason?: string;
  is_temporary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ToolAccessRequest {
  id: string;
  user_id: string;
  tool_id: string;
  status: AccessRequestStatus;
  request_reason: string;
  business_justification: string;
  requested_duration_days?: number;
  is_temporary: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  review_comment?: string;
  expires_at?: string;
  priority: AccessRequestPriority;
  created_at: string;
  updated_at: string;
}

export interface ToolAccessRequestWithDetails extends ToolAccessRequest {
  user_profile?: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  };
  tool?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
  };
  reviewer_profile?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export interface PermissionAuditEntry {
  id: string;
  user_id: string;
  tool_id?: string;
  action_type: PermissionAuditAction;
  permission_before?: Record<string, any>;
  permission_after?: Record<string, any>;
  performed_by?: string;
  reason?: string;
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface PermissionAuditEntryWithDetails extends PermissionAuditEntry {
  user_profile?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  tool?: {
    id: string;
    name: string;
    slug: string;
  };
  performer_profile?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  permission_level: PermissionLevel;
  source: 'role' | 'template' | 'override' | 'denied';
}

export interface UserPermissionSummary {
  user_id: string;
  role: string;
  template_id?: string;
  template_name?: string;
  granted_tools: string[];
  denied_tools: string[];
  temporary_permissions: UserPermission[];
  effective_permission_level: PermissionLevel;
}

export interface ToolAccessRequestCreate {
  tool_id: string;
  request_reason: string;
  business_justification: string;
  requested_duration_days?: number;
  is_temporary: boolean;
  priority?: AccessRequestPriority;
}

export interface ToolAccessRequestReview {
  request_id: string;
  status: 'approved' | 'denied';
  review_comment: string;
  grant_duration_days?: number;
}

export interface BulkPermissionUpdate {
  user_ids: string[];
  tool_id: string;
  granted: boolean;
  reason: string;
  is_temporary?: boolean;
  expires_in_days?: number;
}

export interface PermissionFilters {
  user_id?: string;
  tool_id?: string;
  status?: AccessRequestStatus;
  priority?: AccessRequestPriority;
  date_from?: string;
  date_to?: string;
  action_type?: PermissionAuditAction;
}

export interface AuditTrailFilters extends PermissionFilters {
  show_denials_only?: boolean;
  performed_by?: string;
}

export interface PermissionStats {
  total_users: number;
  users_by_level: Record<PermissionLevel, number>;
  pending_requests: number;
  approved_today: number;
  denied_today: number;
  expired_permissions: number;
  most_requested_tools: Array<{
    tool_id: string;
    tool_name: string;
    request_count: number;
  }>;
}
