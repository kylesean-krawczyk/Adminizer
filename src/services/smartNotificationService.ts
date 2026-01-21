import { supabase } from '../lib/supabase';
import { addDays, isBefore, isAfter, differenceInDays } from 'date-fns';
import type {
  AINotification,
  NotificationAnalysisResult,
  NotificationPriority,
  NotificationType,
  NotificationPreference
} from '../types/contextAware';

export class SmartNotificationService {
  static async analyzeAndGenerateNotifications(
    organizationId: string
  ): Promise<NotificationAnalysisResult> {
    const insights: string[] = [];

    const [
      complianceNotifications,
      deadlineNotifications,
      patternNotifications,
      optimizationNotifications
    ] = await Promise.all([
      this.analyzeComplianceIssues(organizationId),
      this.analyzeUpcomingDeadlines(organizationId),
      this.analyzeDataPatterns(organizationId),
      this.analyzeOptimizationOpportunities(organizationId)
    ]);

    const allPartialNotifications = [
      ...complianceNotifications,
      ...deadlineNotifications,
      ...patternNotifications,
      ...optimizationNotifications
    ];

    const savedNotifications: AINotification[] = [];
    for (const partialNotification of allPartialNotifications) {
      const saved = await this.createNotification(partialNotification);
      if (saved) {
        savedNotifications.push(saved);
      }
    }

    const urgentCount = savedNotifications.filter(n => n.priority === 'urgent').length;

    if (urgentCount > 0) {
      insights.push(`${urgentCount} urgent items require immediate attention`);
    }

    return {
      notifications: savedNotifications,
      insights,
      urgentCount
    };
  }

  private static async analyzeComplianceIssues(
    organizationId: string
  ): Promise<Partial<AINotification>[]> {
    const notifications: Partial<AINotification>[] = [];

    try {
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId);

      if (!documents) return notifications;

      const expiredDocs = documents.filter(doc => {
        if (!doc.expiry_date) return false;
        return isBefore(new Date(doc.expiry_date), new Date());
      });

      if (expiredDocs.length > 0) {
        notifications.push({
          organization_id: organizationId,
          notification_type: 'compliance',
          priority: 'urgent',
          title: `${expiredDocs.length} Expired Documents`,
          message: `You have ${expiredDocs.length} documents that have expired and need immediate renewal.`,
          category: 'document_expired',
          related_entity_type: 'document',
          action_url: '/documents',
          action_label: 'Review Documents',
          data: {
            expired_count: expiredDocs.length,
            document_ids: expiredDocs.map(d => d.id).slice(0, 10)
          }
        });
      }

      const complianceCategories = ['compliance', 'legal', 'regulatory'];
      const missingCompliance = complianceCategories.some(category => {
        const categoryDocs = documents.filter(d =>
          d.category?.toLowerCase().includes(category)
        );
        return categoryDocs.length === 0;
      });

      if (missingCompliance) {
        notifications.push({
          organization_id: organizationId,
          notification_type: 'compliance',
          priority: 'high',
          title: 'Missing Compliance Documents',
          message: 'Some important compliance document categories appear to be empty. Ensure all required documents are uploaded.',
          category: 'missing_documents',
          action_url: '/upload',
          action_label: 'Upload Documents',
          data: { categories: complianceCategories }
        });
      }
    } catch (error) {
      console.error('Error analyzing compliance:', error);
    }

    return notifications;
  }

  private static async analyzeUpcomingDeadlines(
    organizationId: string
  ): Promise<Partial<AINotification>[]> {
    const notifications: Partial<AINotification>[] = [];

    try {
      const thirtyDaysFromNow = addDays(new Date(), 30);

      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .not('expiry_date', 'is', null);

      if (documents) {
        const expiringSoon = documents.filter(doc => {
          const expiryDate = new Date(doc.expiry_date);
          return isAfter(expiryDate, new Date()) && isBefore(expiryDate, thirtyDaysFromNow);
        });

        if (expiringSoon.length > 0) {
          const daysUntil = differenceInDays(
            new Date(expiringSoon[0].expiry_date),
            new Date()
          );

          notifications.push({
            organization_id: organizationId,
            notification_type: 'deadline',
            priority: daysUntil <= 7 ? 'urgent' : 'high',
            title: `${expiringSoon.length} Documents Expiring Soon`,
            message: `${expiringSoon.length} documents will expire within the next 30 days. Plan renewals accordingly.`,
            category: 'document_expiry',
            action_url: '/documents',
            action_label: 'View Expiring Documents',
            data: {
              count: expiringSoon.length,
              nearest_expiry_days: daysUntil
            }
          });
        }
      }

      const { data: grants } = await supabase
        .from('grants')
        .select('*')
        .eq('organization_id', organizationId)
        .in('status', ['draft', 'submitted', 'under_review'])
        .not('submission_deadline', 'is', null);

      if (grants) {
        const upcomingDeadlines = grants.filter(grant => {
          const deadline = new Date(grant.submission_deadline);
          return isAfter(deadline, new Date()) && isBefore(deadline, addDays(new Date(), 14));
        });

        if (upcomingDeadlines.length > 0) {
          notifications.push({
            organization_id: organizationId,
            notification_type: 'deadline',
            priority: 'high',
            title: `${upcomingDeadlines.length} Grant Deadlines Approaching`,
            message: `You have grant applications with deadlines in the next 14 days.`,
            category: 'grant_deadline',
            action_url: '/operations/grants',
            action_label: 'Review Grants',
            data: {
              count: upcomingDeadlines.length,
              grants: upcomingDeadlines.map(g => ({
                id: g.id,
                name: g.grant_name,
                deadline: g.submission_deadline
              }))
            }
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing deadlines:', error);
    }

    return notifications;
  }

  private static async analyzeDataPatterns(
    organizationId: string
  ): Promise<Partial<AINotification>[]> {
    const notifications: Partial<AINotification>[] = [];

    try {
      const { data: donations } = await supabase
        .from('donations')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('donation_date', addDays(new Date(), -90).toISOString());

      if (donations && donations.length > 0) {
        const recentAmount = donations
          .filter(d => isAfter(new Date(d.donation_date), addDays(new Date(), -30)))
          .reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);

        const previousAmount = donations
          .filter(d => {
            const date = new Date(d.donation_date);
            return isBefore(date, addDays(new Date(), -30)) &&
                   isAfter(date, addDays(new Date(), -60));
          })
          .reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);

        if (previousAmount > 0) {
          const changePercent = ((recentAmount - previousAmount) / previousAmount) * 100;

          if (Math.abs(changePercent) > 30) {
            notifications.push({
              organization_id: organizationId,
              notification_type: 'pattern',
              priority: 'normal',
              title: changePercent > 0 ? 'Donation Increase Detected' : 'Donation Decrease Alert',
              message: `Donations have ${changePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercent).toFixed(1)}% compared to the previous period.`,
              category: 'donation_anomaly',
              action_url: '/operations/fundraising',
              action_label: 'View Analytics',
              data: {
                change_percent: changePercent,
                recent_amount: recentAmount,
                previous_amount: previousAmount
              }
            });
          }
        }
      }

      const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      if (employees) {
        const recentHires = employees.filter(emp =>
          isAfter(new Date(emp.hire_date), addDays(new Date(), -90))
        );

        if (recentHires.length >= 5) {
          notifications.push({
            organization_id: organizationId,
            notification_type: 'pattern',
            priority: 'normal',
            title: 'Rapid Growth Detected',
            message: `You've hired ${recentHires.length} employees in the past 90 days. Consider reviewing onboarding processes.`,
            category: 'employee_growth',
            action_url: '/users',
            action_label: 'View Employees',
            data: {
              recent_hires: recentHires.length,
              total_employees: employees.length
            }
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing patterns:', error);
    }

    return notifications;
  }

  private static async analyzeOptimizationOpportunities(
    organizationId: string
  ): Promise<Partial<AINotification>[]> {
    const notifications: Partial<AINotification>[] = [];

    try {
      const { data: documents } = await supabase
        .from('documents')
        .select('category')
        .eq('organization_id', organizationId);

      if (documents) {
        const categoryCounts = documents.reduce((acc, doc) => {
          const category = doc.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const uncategorized = categoryCounts['Uncategorized'] || 0;

        if (uncategorized > 10) {
          notifications.push({
            organization_id: organizationId,
            notification_type: 'optimization',
            priority: 'low',
            title: 'Document Organization Opportunity',
            message: `${uncategorized} documents are uncategorized. Organizing them will improve searchability.`,
            category: 'document_organization',
            action_url: '/documents',
            action_label: 'Organize Documents',
            data: { uncategorized_count: uncategorized }
          });
        }
      }

      const { data: workflows } = await supabase
        .from('workflow_instances')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'in_progress');

      if (workflows && workflows.length > 0) {
        const stuckWorkflows = workflows.filter(wf => {
          const createdDate = new Date(wf.created_at);
          return differenceInDays(new Date(), createdDate) > 7;
        });

        if (stuckWorkflows.length > 0) {
          notifications.push({
            organization_id: organizationId,
            notification_type: 'optimization',
            priority: 'normal',
            title: 'Workflow Bottleneck Detected',
            message: `${stuckWorkflows.length} workflows have been in progress for over 7 days. Review for potential bottlenecks.`,
            category: 'workflow_efficiency',
            action_url: '/workflows',
            action_label: 'Review Workflows',
            data: { stuck_count: stuckWorkflows.length }
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing optimization opportunities:', error);
    }

    return notifications;
  }

  private static async createNotification(
    notification: Partial<AINotification>
  ): Promise<AINotification | null> {
    try {
      const existing = await supabase
        .from('ai_notifications')
        .select('id')
        .eq('organization_id', notification.organization_id!)
        .eq('category', notification.category!)
        .eq('status', 'unread')
        .maybeSingle();

      if (existing.data) {
        return null;
      }

      const { data, error } = await supabase
        .from('ai_notifications')
        .insert({
          ...notification,
          status: 'unread'
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  static async getNotifications(
    userId: string,
    organizationId: string,
    filters?: {
      status?: string;
      type?: NotificationType;
      priority?: NotificationPriority;
    }
  ): Promise<AINotification[]> {
    try {
      let query = supabase
        .from('ai_notifications')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`user_id.eq.${userId},user_id.is.null`);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.type) {
        query = query.eq('notification_type', filters.type);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async markNotificationRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  static async dismissNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_notifications')
        .update({ status: 'dismissed' })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error dismissing notification:', error);
      return false;
    }
  }

  static async snoozeNotification(
    notificationId: string,
    hours: number
  ): Promise<boolean> {
    try {
      const snoozedUntil = addDays(new Date(), hours / 24);

      const { error } = await supabase
        .from('ai_notifications')
        .update({
          snoozed_until: snoozedUntil.toISOString(),
          status: 'read'
        })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error snoozing notification:', error);
      return false;
    }
  }

  static async getUserPreferences(
    userId: string
  ): Promise<NotificationPreference[]> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching preferences:', error);
      return [];
    }
  }

  static async updatePreference(
    userId: string,
    notificationType: NotificationType,
    updates: Partial<NotificationPreference>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          notification_type: notificationType,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating preference:', error);
      return false;
    }
  }
}
