export type PageType =
  | 'dashboard'
  | 'documents'
  | 'document_upload'
  | 'employees'
  | 'fundraising'
  | 'grants'
  | 'donors'
  | 'campaigns'
  | 'departments'
  | 'operations'
  | 'workflows'
  | 'settings'
  | 'analytics';

export type NotificationType =
  | 'compliance'
  | 'deadline'
  | 'pattern'
  | 'optimization';

export type NotificationPriority =
  | 'urgent'
  | 'high'
  | 'normal'
  | 'low';

export type NotificationStatus =
  | 'unread'
  | 'read'
  | 'dismissed'
  | 'actioned';

export type NotificationFrequency =
  | 'realtime'
  | 'hourly'
  | 'daily'
  | 'weekly';

export interface PageContextData {
  pageType: PageType;
  route: string;
  entityId?: string;
  entityType?: string;
  stats?: Record<string, any>;
  filters?: Record<string, any>;
  recentActions?: string[];
  timestamp: string;
}

export interface PageContext {
  id: string;
  user_id: string;
  organization_id?: string;
  page_type: PageType;
  page_route: string;
  context_data: Record<string, any>;
  created_at: string;
}

export interface AISuggestion {
  id: string;
  user_id: string;
  organization_id?: string;
  page_type: PageType;
  suggestion_text: string;
  suggestion_query?: string;
  priority: number;
  context_data: Record<string, any>;
  clicked: boolean;
  dismissed: boolean;
  expires_at?: string;
  created_at: string;
}

export interface AINotification {
  id: string;
  user_id?: string;
  organization_id: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  category: string;
  related_entity_type?: string;
  related_entity_id?: string;
  action_url?: string;
  action_label?: string;
  status: NotificationStatus;
  data: Record<string, any>;
  snoozed_until?: string;
  created_at: string;
  read_at?: string;
  actioned_at?: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  enabled: boolean;
  frequency: NotificationFrequency;
  min_priority: NotificationPriority;
  created_at: string;
  updated_at: string;
}

export interface NotificationRule {
  id: string;
  organization_id?: string;
  rule_name: string;
  notification_type: NotificationType;
  category: string;
  priority: NotificationPriority;
  conditions: Record<string, any>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SuggestionConfig {
  maxSuggestions?: number;
  expiryHours?: number;
  minPriority?: number;
}

export interface NotificationAnalysisResult {
  notifications: AINotification[];
  insights: string[];
  urgentCount: number;
}
