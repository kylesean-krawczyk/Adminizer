import type { AnalyticsQuery } from '../types';

export class QueryParser {
  private static dataSourceKeywords: Record<string, string[]> = {
    employees: ['employee', 'employees', 'staff', 'worker', 'workers', 'hire', 'hired', 'team', 'personnel'],
    donations: ['donation', 'donations', 'giving', 'gift', 'gifts', 'donate', 'donated', 'contribution', 'contributions', 'donor'],
    grants: ['grant', 'grants', 'funding', 'application', 'applications', 'award', 'awarded'],
    donors: ['donor', 'donors', 'giver', 'givers', 'supporter', 'supporters', 'contributor', 'contributors'],
    campaigns: ['campaign', 'campaigns', 'fundraiser', 'fundraisers', 'drive', 'drives']
  };

  private static aggregationKeywords: Record<string, string[]> = {
    count: ['how many', 'count', 'number of', 'total number', 'quantity'],
    sum: ['total', 'sum', 'total amount', 'combined'],
    avg: ['average', 'mean', 'avg', 'typical'],
    min: ['minimum', 'lowest', 'smallest', 'min', 'least'],
    max: ['maximum', 'highest', 'largest', 'max', 'most', 'top', 'best']
  };


  static parse(naturalLanguageQuery: string): AnalyticsQuery {
    const lowerQuery = naturalLanguageQuery.toLowerCase();

    const dataSource = this.detectDataSource(lowerQuery);
    const timeRange = this.parseTimeRange(lowerQuery);
    const filters = this.parseFilters(lowerQuery, dataSource);
    const aggregations = this.parseAggregations(lowerQuery, dataSource);
    const groupBy = this.parseGroupBy(lowerQuery, dataSource);
    const sortBy = this.parseSortBy(lowerQuery);
    const limit = this.parseLimit(lowerQuery);

    return {
      dataSource,
      naturalLanguageQuery,
      timeRange,
      filters,
      aggregations,
      groupBy,
      sortBy,
      limit
    };
  }

  private static detectDataSource(query: string): AnalyticsQuery['dataSource'] {
    for (const [source, keywords] of Object.entries(this.dataSourceKeywords)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return source as AnalyticsQuery['dataSource'];
        }
      }
    }
    return 'employees';
  }

  private static parseTimeRange(query: string): AnalyticsQuery['timeRange'] | undefined {
    const now = new Date();
    const timeRange: AnalyticsQuery['timeRange'] = {};

    if (query.includes('today')) {
      timeRange.startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
      timeRange.endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString().split('T')[0];
      timeRange.relativeRange = 'today';
    } else if (query.includes('yesterday')) {
      const yesterday = new Date(now.setDate(now.getDate() - 1));
      timeRange.startDate = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
      timeRange.endDate = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString().split('T')[0];
      timeRange.relativeRange = 'yesterday';
    } else if (query.includes('this week')) {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      timeRange.startDate = new Date(startOfWeek.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
      timeRange.endDate = new Date().toISOString().split('T')[0];
      timeRange.relativeRange = 'this_week';
    } else if (query.includes('last week')) {
      const lastWeekStart = new Date(now.setDate(now.getDate() - now.getDay() - 7));
      const lastWeekEnd = new Date(now.setDate(now.getDate() - now.getDay() - 1));
      timeRange.startDate = new Date(lastWeekStart.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
      timeRange.endDate = new Date(lastWeekEnd.setHours(23, 59, 59, 999)).toISOString().split('T')[0];
      timeRange.relativeRange = 'last_week';
    } else if (query.includes('this month')) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      timeRange.startDate = startOfMonth.toISOString().split('T')[0];
      timeRange.endDate = new Date().toISOString().split('T')[0];
      timeRange.relativeRange = 'this_month';
    } else if (query.includes('last month')) {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      timeRange.startDate = startOfLastMonth.toISOString().split('T')[0];
      timeRange.endDate = endOfLastMonth.toISOString().split('T')[0];
      timeRange.relativeRange = 'last_month';
    } else if (query.includes('this quarter') || query.match(/q[1-4]/i)) {
      const quarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
      timeRange.startDate = startOfQuarter.toISOString().split('T')[0];
      timeRange.endDate = new Date().toISOString().split('T')[0];
      timeRange.relativeRange = 'this_quarter';
    } else if (query.includes('last quarter')) {
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
      const year = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const adjustedQuarter = lastQuarter < 0 ? 3 : lastQuarter;
      const startOfLastQuarter = new Date(year, adjustedQuarter * 3, 1);
      const endOfLastQuarter = new Date(year, (adjustedQuarter + 1) * 3, 0);
      timeRange.startDate = startOfLastQuarter.toISOString().split('T')[0];
      timeRange.endDate = endOfLastQuarter.toISOString().split('T')[0];
      timeRange.relativeRange = 'last_quarter';
    } else if (query.includes('this year') || query.includes('ytd') || query.includes('year to date')) {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      timeRange.startDate = startOfYear.toISOString().split('T')[0];
      timeRange.endDate = new Date().toISOString().split('T')[0];
      timeRange.relativeRange = 'this_year';
    } else if (query.includes('last year')) {
      const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
      timeRange.startDate = startOfLastYear.toISOString().split('T')[0];
      timeRange.endDate = endOfLastYear.toISOString().split('T')[0];
      timeRange.relativeRange = 'last_year';
    } else if (query.match(/past (\d+) months?/)) {
      const match = query.match(/past (\d+) months?/);
      if (match) {
        const months = parseInt(match[1]);
        const startDate = new Date(now.setMonth(now.getMonth() - months));
        timeRange.startDate = startDate.toISOString().split('T')[0];
        timeRange.endDate = new Date().toISOString().split('T')[0];
        timeRange.relativeRange = `past_${months}_months`;
      }
    } else if (query.match(/past (\d+) days?/)) {
      const match = query.match(/past (\d+) days?/);
      if (match) {
        const days = parseInt(match[1]);
        const startDate = new Date(now.setDate(now.getDate() - days));
        timeRange.startDate = startDate.toISOString().split('T')[0];
        timeRange.endDate = new Date().toISOString().split('T')[0];
        timeRange.relativeRange = `past_${days}_days`;
      }
    }

    return Object.keys(timeRange).length > 0 ? timeRange : undefined;
  }

  private static parseFilters(query: string, dataSource: string): AnalyticsQuery['filters'] {
    const filters: AnalyticsQuery['filters'] = [];

    if (dataSource === 'employees') {
      const departmentMatch = query.match(/(?:in|from|for)\s+(?:the\s+)?(\w+(?:\s+\w+)?)\s+(?:department|ministry|team)/i);
      if (departmentMatch) {
        filters.push({
          field: 'department',
          operator: 'contains',
          value: departmentMatch[1]
        });
      }

      if (query.includes('active')) {
        filters.push({
          field: 'status',
          operator: 'equals',
          value: 'active'
        });
      } else if (query.includes('terminated') || query.includes('left')) {
        filters.push({
          field: 'status',
          operator: 'equals',
          value: 'terminated'
        });
      }
    } else if (dataSource === 'donations') {
      const amountMatch = query.match(/(?:over|above|greater than|more than)\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        filters.push({
          field: 'amount',
          operator: 'gte',
          value: amount
        });
      }

      const belowAmountMatch = query.match(/(?:under|below|less than)\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
      if (belowAmountMatch) {
        const amount = parseFloat(belowAmountMatch[1].replace(/,/g, ''));
        filters.push({
          field: 'amount',
          operator: 'lte',
          value: amount
        });
      }

      if (query.includes('completed') || query.includes('successful')) {
        filters.push({
          field: 'payment_status',
          operator: 'equals',
          value: 'completed'
        });
      }
    } else if (dataSource === 'grants') {
      if (query.includes('awarded') || query.includes('approved')) {
        filters.push({
          field: 'status',
          operator: 'equals',
          value: 'awarded'
        });
      } else if (query.includes('pending') || query.includes('under review')) {
        filters.push({
          field: 'status',
          operator: 'equals',
          value: 'under_review'
        });
      } else if (query.includes('rejected') || query.includes('denied')) {
        filters.push({
          field: 'status',
          operator: 'equals',
          value: 'rejected'
        });
      }
    }

    return filters.length > 0 ? filters : undefined;
  }

  private static parseAggregations(query: string, dataSource: string): AnalyticsQuery['aggregations'] {
    const aggregations: AnalyticsQuery['aggregations'] = [];

    for (const [aggType, keywords] of Object.entries(this.aggregationKeywords)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          if (aggType === 'count') {
            aggregations.push({ type: 'count' });
          } else if ((aggType === 'sum' || aggType === 'avg') && (dataSource === 'donations' || dataSource === 'grants')) {
            aggregations.push({
              type: aggType as 'sum' | 'avg',
              field: dataSource === 'donations' ? 'amount' : 'amount_requested'
            });
          }
          break;
        }
      }
    }

    if (aggregations.length === 0) {
      aggregations.push({ type: 'count' });
    }

    return aggregations;
  }

  private static parseGroupBy(query: string, dataSource: string): AnalyticsQuery['groupBy'] {
    const groupBy: string[] = [];

    if (query.includes('by department') || query.includes('per department') || query.includes('each department')) {
      groupBy.push('department');
    }

    if (query.includes('by month') || query.includes('monthly')) {
      groupBy.push('month');
    }

    if (query.includes('by quarter') || query.includes('quarterly')) {
      groupBy.push('quarter');
    }

    if (query.includes('by year') || query.includes('yearly')) {
      groupBy.push('year');
    }

    if (dataSource === 'donations' && (query.includes('by campaign') || query.includes('per campaign'))) {
      groupBy.push('campaign_id');
    }

    if (dataSource === 'grants' && (query.includes('by status') || query.includes('per status'))) {
      groupBy.push('status');
    }

    return groupBy.length > 0 ? groupBy : undefined;
  }

  private static parseSortBy(query: string): AnalyticsQuery['sortBy'] {
    if (query.includes('highest') || query.includes('most') || query.includes('largest') || query.includes('top')) {
      return {
        field: 'value',
        direction: 'desc'
      };
    }

    if (query.includes('lowest') || query.includes('least') || query.includes('smallest') || query.includes('bottom')) {
      return {
        field: 'value',
        direction: 'asc'
      };
    }

    if (query.includes('recent') || query.includes('latest') || query.includes('newest')) {
      return {
        field: 'date',
        direction: 'desc'
      };
    }

    if (query.includes('oldest') || query.includes('earliest')) {
      return {
        field: 'date',
        direction: 'asc'
      };
    }

    return undefined;
  }

  private static parseLimit(query: string): number | undefined {
    const topMatch = query.match(/top (\d+)/i);
    if (topMatch) {
      return parseInt(topMatch[1]);
    }

    const limitMatch = query.match(/limit (\d+)/i);
    if (limitMatch) {
      return parseInt(limitMatch[1]);
    }

    const firstMatch = query.match(/first (\d+)/i);
    if (firstMatch) {
      return parseInt(firstMatch[1]);
    }

    return undefined;
  }

  static generateSuggestions(_query: string, dataSource: string): string[] {
    const suggestions: string[] = [];

    if (dataSource === 'employees') {
      suggestions.push('Try adding a time range: "hired this quarter"');
      suggestions.push('Filter by department: "in the Finance department"');
      suggestions.push('Get specific counts: "How many employees were hired this year?"');
    } else if (dataSource === 'donations') {
      suggestions.push('Add amount filters: "donations over $1000"');
      suggestions.push('Group by campaign: "donations by campaign"');
      suggestions.push('Get averages: "What\'s the average donation amount?"');
    } else if (dataSource === 'grants') {
      suggestions.push('Filter by status: "awarded grants"');
      suggestions.push('Add time range: "grants from the past 6 months"');
      suggestions.push('Get totals: "total amount of awarded grants"');
    }

    return suggestions;
  }
}
