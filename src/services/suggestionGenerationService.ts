import { supabase } from '../lib/supabase';
import type {
  AISuggestion,
  PageContextData,
  PageType,
  SuggestionConfig
} from '../types/contextAware';

interface SuggestionTemplate {
  text: string;
  query: string;
  priority: number;
  condition?: (contextData: Record<string, any>) => boolean;
}

export class SuggestionGenerationService {
  private static readonly DEFAULT_CONFIG: SuggestionConfig = {
    maxSuggestions: 3,
    expiryHours: 24,
    minPriority: 5
  };

  private static readonly SUGGESTION_TEMPLATES: Record<PageType, SuggestionTemplate[]> = {
    dashboard: [
      {
        text: 'Show me insights from recent data',
        query: 'What are the key insights from my recent documents and activities?',
        priority: 8,
        condition: (ctx) => ctx.stats && Object.keys(ctx.stats).length > 0
      },
      {
        text: 'What documents are expiring soon?',
        query: 'Which documents are expiring in the next 30 days?',
        priority: 9,
        condition: (ctx) => ctx.stats?.expiringSoon > 0
      },
      {
        text: 'Any overdue items I should handle?',
        query: 'Show me all overdue documents and pending tasks',
        priority: 10,
        condition: (ctx) => ctx.stats?.overdue > 0
      },
      {
        text: 'Summarize my organization status',
        query: 'Give me a summary of my organization\'s current status including documents, employees, and activities',
        priority: 7
      }
    ],
    documents: [
      {
        text: 'Find compliance documents',
        query: 'Show me all compliance-related documents',
        priority: 8
      },
      {
        text: 'Which documents need renewal?',
        query: 'List all documents that need renewal in the next 60 days',
        priority: 9,
        condition: (ctx) => !ctx.filters?.category || ctx.filters.category !== 'compliance'
      },
      {
        text: 'Organize documents by priority',
        query: 'Help me organize my documents by priority - show expiring and critical items first',
        priority: 7
      }
    ],
    document_upload: [
      {
        text: 'What document types should I add?',
        query: 'What are the common document types I should be uploading?',
        priority: 6
      },
      {
        text: 'Best practices for document metadata',
        query: 'What metadata should I include when uploading documents?',
        priority: 5
      },
      {
        text: 'Check for missing required documents',
        query: 'What required documents am I missing for compliance?',
        priority: 8
      }
    ],
    employees: [
      {
        text: 'How many employees were hired recently?',
        query: 'How many employees were hired in the past 3 months?',
        priority: 7
      },
      {
        text: 'Show me employees needing reviews',
        query: 'Which employees have performance reviews due soon?',
        priority: 9
      },
      {
        text: 'Analyze employee department distribution',
        query: 'Show me the distribution of employees across departments',
        priority: 6
      }
    ],
    fundraising: [
      {
        text: 'Total donations this quarter',
        query: 'What is the total amount of donations received this quarter?',
        priority: 8
      },
      {
        text: 'Identify top donors',
        query: 'Who are our top 10 donors by total lifetime giving?',
        priority: 7
      },
      {
        text: 'Campaign performance summary',
        query: 'How are our active fundraising campaigns performing?',
        priority: 8
      }
    ],
    grants: [
      {
        text: 'Upcoming grant deadlines',
        query: 'What grant applications have deadlines in the next 30 days?',
        priority: 10
      },
      {
        text: 'Grant success rate analysis',
        query: 'What is our grant application success rate?',
        priority: 7
      },
      {
        text: 'Suggest potential grant opportunities',
        query: 'Based on our organization profile, what types of grants should we be pursuing?',
        priority: 6
      }
    ],
    donors: [
      {
        text: 'Analyze donor retention',
        query: 'What is our donor retention rate and how can we improve it?',
        priority: 8
      },
      {
        text: 'Identify lapsed donors',
        query: 'Which donors haven\'t given in the past year?',
        priority: 7
      },
      {
        text: 'Average donation trends',
        query: 'How has the average donation amount changed over time?',
        priority: 6
      }
    ],
    campaigns: [
      {
        text: 'Active campaign status',
        query: 'Show me the status and progress of all active campaigns',
        priority: 8
      },
      {
        text: 'Best performing campaigns',
        query: 'Which campaigns have been most successful?',
        priority: 7
      },
      {
        text: 'Campaign optimization suggestions',
        query: 'How can we improve our current campaign strategies?',
        priority: 6
      }
    ],
    departments: [
      {
        text: 'Department resource allocation',
        query: 'How are resources allocated across departments?',
        priority: 7
      },
      {
        text: 'Department-specific pending tasks',
        query: 'What tasks are pending for this department?',
        priority: 8,
        condition: (ctx) => ctx.entityId
      },
      {
        text: 'Department performance metrics',
        query: 'Show me key performance indicators for this department',
        priority: 7
      }
    ],
    operations: [
      {
        text: 'System status overview',
        query: 'What is the current status of all operational systems?',
        priority: 8
      },
      {
        text: 'Pending approval workflows',
        query: 'Show me all workflows pending approval',
        priority: 9
      },
      {
        text: 'Integration health check',
        query: 'Check the status of all connected integrations',
        priority: 7
      }
    ],
    workflows: [
      {
        text: 'Active workflow status',
        query: 'Show me the status of all active workflows',
        priority: 8
      },
      {
        text: 'Workflow efficiency analysis',
        query: 'Which workflows are taking longer than expected?',
        priority: 7
      },
      {
        text: 'Create employee onboarding workflow',
        query: 'Help me set up an employee onboarding workflow',
        priority: 6
      }
    ],
    settings: [
      {
        text: 'Recommended settings review',
        query: 'What settings should I review for optimal performance?',
        priority: 6
      },
      {
        text: 'Security best practices',
        query: 'What security settings should I configure?',
        priority: 7
      },
      {
        text: 'Feature recommendations',
        query: 'What features should I enable for my organization?',
        priority: 5
      }
    ],
    analytics: [
      {
        text: 'Generate comprehensive report',
        query: 'Generate a comprehensive analytics report for the past quarter',
        priority: 8
      },
      {
        text: 'Identify data trends',
        query: 'What are the key trends in our organizational data?',
        priority: 7
      },
      {
        text: 'Benchmark analysis',
        query: 'How do our metrics compare to industry benchmarks?',
        priority: 6
      }
    ]
  };

  static async generateSuggestions(
    userId: string,
    organizationId: string | undefined,
    context: PageContextData,
    config: SuggestionConfig = {}
  ): Promise<AISuggestion[]> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const templates = this.SUGGESTION_TEMPLATES[context.pageType] || [];

    const validTemplates = templates
      .filter(template => {
        if (template.condition) {
          return template.condition(context.stats || {});
        }
        return true;
      })
      .filter(template => template.priority >= finalConfig.minPriority!)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, finalConfig.maxSuggestions);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + finalConfig.expiryHours!);

    const suggestions: AISuggestion[] = [];

    for (const template of validTemplates) {
      const suggestion = await this.createSuggestion(
        userId,
        organizationId,
        context.pageType,
        template,
        context,
        expiresAt
      );

      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  private static async createSuggestion(
    userId: string,
    organizationId: string | undefined,
    pageType: PageType,
    template: SuggestionTemplate,
    context: PageContextData,
    expiresAt: Date
  ): Promise<AISuggestion | null> {
    try {
      const { data, error } = await supabase
        .from('ai_suggestions')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          page_type: pageType,
          suggestion_text: template.text,
          suggestion_query: template.query,
          priority: template.priority,
          context_data: {
            pageStats: context.stats || {},
            filters: context.filters || {},
            timestamp: context.timestamp
          },
          expires_at: expiresAt.toISOString()
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating suggestion:', error);
      return null;
    }
  }

  static async getActiveSuggestions(
    userId: string,
    pageType?: PageType
  ): Promise<AISuggestion[]> {
    try {
      let query = supabase
        .from('ai_suggestions')
        .select('*')
        .eq('user_id', userId)
        .eq('clicked', false)
        .eq('dismissed', false)
        .gt('expires_at', new Date().toISOString());

      if (pageType) {
        query = query.eq('page_type', pageType);
      }

      const { data, error } = await query
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active suggestions:', error);
      return [];
    }
  }

  static async markSuggestionClicked(suggestionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ clicked: true })
        .eq('id', suggestionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking suggestion as clicked:', error);
      return false;
    }
  }

  static async markSuggestionDismissed(suggestionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ dismissed: true })
        .eq('id', suggestionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking suggestion as dismissed:', error);
      return false;
    }
  }

  static async cleanupExpiredSuggestions(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error cleaning up expired suggestions:', error);
      return false;
    }
  }
}
