import { supabase } from '../lib/supabase';
import type { AnalyticsQuery, AnalyticsResult, Employee, Donation, Grant, Donor, Campaign } from '../types';

export class AnalyticsService {
  static async executeQuery(query: AnalyticsQuery, organizationId: string): Promise<AnalyticsResult> {
    try {
      const { dataSource, timeRange, filters, aggregations, groupBy, sortBy, limit } = query;

      let data: any[] = [];
      let summary: AnalyticsResult['summary'] = { totalRecords: 0 };
      let visualizationRecommendation: AnalyticsResult['visualizationRecommendation'];

      switch (dataSource) {
        case 'employees':
          data = await this.queryEmployees(organizationId, timeRange, filters, groupBy, sortBy, limit);
          break;
        case 'donations':
          data = await this.queryDonations(organizationId, timeRange, filters, groupBy, sortBy, limit);
          break;
        case 'grants':
          data = await this.queryGrants(organizationId, timeRange, filters, groupBy, sortBy, limit);
          break;
        case 'donors':
          data = await this.queryDonors(organizationId, filters, sortBy, limit);
          break;
        case 'campaigns':
          data = await this.queryCampaigns(organizationId, filters, sortBy, limit);
          break;
      }

      summary.totalRecords = data.length;

      if (aggregations && aggregations.length > 0) {
        summary.aggregations = this.calculateAggregations(data, aggregations);
      }

      visualizationRecommendation = this.recommendVisualization(data, groupBy, aggregations);

      summary.insights = this.generateInsights(data, query, summary);

      return {
        success: true,
        query,
        data,
        summary,
        visualizationRecommendation
      };
    } catch (error) {
      console.error('Error executing analytics query:', error);
      return {
        success: false,
        query,
        data: [],
        summary: { totalRecords: 0 },
        error: error instanceof Error ? error.message : 'An error occurred while executing the query',
        suggestions: [
          'Try simplifying your query',
          'Check if the data exists in the system',
          'Verify your date range is correct'
        ]
      };
    }
  }

  private static async queryEmployees(
    organizationId: string,
    timeRange?: AnalyticsQuery['timeRange'],
    filters?: AnalyticsQuery['filters'],
    groupBy?: string[],
    sortBy?: AnalyticsQuery['sortBy'],
    limit?: number
  ): Promise<Employee[]> {
    let query = supabase
      .from('employees')
      .select('*')
      .eq('organization_id', organizationId);

    if (timeRange?.startDate && timeRange?.endDate) {
      query = query
        .gte('hire_date', timeRange.startDate)
        .lte('hire_date', timeRange.endDate);
    }

    if (filters) {
      for (const filter of filters) {
        switch (filter.operator) {
          case 'equals':
            query = query.eq(filter.field, filter.value);
            break;
          case 'contains':
            query = query.ilike(filter.field, `%${filter.value}%`);
            break;
          case 'gt':
            query = query.gt(filter.field, filter.value);
            break;
          case 'gte':
            query = query.gte(filter.field, filter.value);
            break;
          case 'lt':
            query = query.lt(filter.field, filter.value);
            break;
          case 'lte':
            query = query.lte(filter.field, filter.value);
            break;
        }
      }
    }

    if (sortBy) {
      const sortField = sortBy.field === 'date' ? 'hire_date' : sortBy.field;
      query = query.order(sortField, { ascending: sortBy.direction === 'asc' });
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (groupBy && groupBy.length > 0) {
      return this.groupData(data || [], groupBy);
    }

    return data || [];
  }

  private static async queryDonations(
    organizationId: string,
    timeRange?: AnalyticsQuery['timeRange'],
    filters?: AnalyticsQuery['filters'],
    groupBy?: string[],
    sortBy?: AnalyticsQuery['sortBy'],
    limit?: number
  ): Promise<Donation[]> {
    let query = supabase
      .from('donations')
      .select('*')
      .eq('organization_id', organizationId);

    if (timeRange?.startDate && timeRange?.endDate) {
      query = query
        .gte('donation_date', timeRange.startDate)
        .lte('donation_date', timeRange.endDate);
    }

    if (filters) {
      for (const filter of filters) {
        switch (filter.operator) {
          case 'equals':
            query = query.eq(filter.field, filter.value);
            break;
          case 'contains':
            query = query.ilike(filter.field, `%${filter.value}%`);
            break;
          case 'gt':
            query = query.gt(filter.field, filter.value);
            break;
          case 'gte':
            query = query.gte(filter.field, filter.value);
            break;
          case 'lt':
            query = query.lt(filter.field, filter.value);
            break;
          case 'lte':
            query = query.lte(filter.field, filter.value);
            break;
        }
      }
    }

    if (sortBy) {
      const sortField = sortBy.field === 'date' ? 'donation_date' : sortBy.field === 'value' ? 'amount' : sortBy.field;
      query = query.order(sortField, { ascending: sortBy.direction === 'asc' });
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (groupBy && groupBy.length > 0) {
      return this.groupData(data || [], groupBy);
    }

    return data || [];
  }

  private static async queryGrants(
    organizationId: string,
    timeRange?: AnalyticsQuery['timeRange'],
    filters?: AnalyticsQuery['filters'],
    groupBy?: string[],
    sortBy?: AnalyticsQuery['sortBy'],
    limit?: number
  ): Promise<Grant[]> {
    let query = supabase
      .from('grants')
      .select('*')
      .eq('organization_id', organizationId);

    if (timeRange?.startDate && timeRange?.endDate) {
      query = query
        .gte('application_date', timeRange.startDate)
        .lte('application_date', timeRange.endDate);
    }

    if (filters) {
      for (const filter of filters) {
        switch (filter.operator) {
          case 'equals':
            query = query.eq(filter.field, filter.value);
            break;
          case 'contains':
            query = query.ilike(filter.field, `%${filter.value}%`);
            break;
          case 'gt':
            query = query.gt(filter.field, filter.value);
            break;
          case 'gte':
            query = query.gte(filter.field, filter.value);
            break;
          case 'lt':
            query = query.lt(filter.field, filter.value);
            break;
          case 'lte':
            query = query.lte(filter.field, filter.value);
            break;
        }
      }
    }

    if (sortBy) {
      const sortField = sortBy.field === 'date' ? 'application_date' : sortBy.field === 'value' ? 'amount_requested' : sortBy.field;
      query = query.order(sortField, { ascending: sortBy.direction === 'asc' });
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (groupBy && groupBy.length > 0) {
      return this.groupData(data || [], groupBy);
    }

    return data || [];
  }

  private static async queryDonors(
    organizationId: string,
    filters?: AnalyticsQuery['filters'],
    sortBy?: AnalyticsQuery['sortBy'],
    limit?: number
  ): Promise<Donor[]> {
    let query = supabase
      .from('donors')
      .select('*')
      .eq('organization_id', organizationId);

    if (filters) {
      for (const filter of filters) {
        switch (filter.operator) {
          case 'equals':
            query = query.eq(filter.field, filter.value);
            break;
          case 'contains':
            query = query.ilike(filter.field, `%${filter.value}%`);
            break;
          case 'gt':
            query = query.gt(filter.field, filter.value);
            break;
          case 'gte':
            query = query.gte(filter.field, filter.value);
            break;
          case 'lt':
            query = query.lt(filter.field, filter.value);
            break;
          case 'lte':
            query = query.lte(filter.field, filter.value);
            break;
        }
      }
    }

    if (sortBy) {
      query = query.order(sortBy.field, { ascending: sortBy.direction === 'asc' });
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  private static async queryCampaigns(
    organizationId: string,
    filters?: AnalyticsQuery['filters'],
    sortBy?: AnalyticsQuery['sortBy'],
    limit?: number
  ): Promise<Campaign[]> {
    let query = supabase
      .from('campaigns')
      .select('*')
      .eq('organization_id', organizationId);

    if (filters) {
      for (const filter of filters) {
        switch (filter.operator) {
          case 'equals':
            query = query.eq(filter.field, filter.value);
            break;
          case 'contains':
            query = query.ilike(filter.field, `%${filter.value}%`);
            break;
        }
      }
    }

    if (sortBy) {
      query = query.order(sortBy.field, { ascending: sortBy.direction === 'asc' });
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  private static groupData(data: any[], groupByFields: string[]): any[] {
    if (!groupByFields || groupByFields.length === 0) return data;

    const grouped = new Map<string, any[]>();

    for (const item of data) {
      let key = '';

      for (const field of groupByFields) {
        if (field === 'month') {
          const dateField = item.hire_date || item.donation_date || item.application_date;
          if (dateField) {
            const date = new Date(dateField);
            key += `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}_`;
          }
        } else if (field === 'quarter') {
          const dateField = item.hire_date || item.donation_date || item.application_date;
          if (dateField) {
            const date = new Date(dateField);
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            key += `${date.getFullYear()}-Q${quarter}_`;
          }
        } else if (field === 'year') {
          const dateField = item.hire_date || item.donation_date || item.application_date;
          if (dateField) {
            const date = new Date(dateField);
            key += `${date.getFullYear()}_`;
          }
        } else {
          key += `${item[field] || 'unknown'}_`;
        }
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    }

    const result: any[] = [];
    for (const [key, items] of grouped.entries()) {
      const keyParts = key.split('_').filter(p => p);
      const groupObj: any = {
        group: keyParts.join(' - '),
        count: items.length,
        items
      };

      if (items[0].amount !== undefined) {
        groupObj.totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        groupObj.averageAmount = groupObj.totalAmount / items.length;
      }

      if (items[0].amount_requested !== undefined) {
        groupObj.totalRequested = items.reduce((sum, item) => sum + parseFloat(item.amount_requested || 0), 0);
        groupObj.totalAwarded = items.reduce((sum, item) => sum + parseFloat(item.amount_awarded || 0), 0);
      }

      result.push(groupObj);
    }

    return result;
  }

  private static calculateAggregations(data: any[], aggregations: AnalyticsQuery['aggregations']): Record<string, number> {
    const results: Record<string, number> = {};

    if (!aggregations) return results;

    for (const agg of aggregations) {
      switch (agg.type) {
        case 'count':
          results.count = data.length;
          break;
        case 'sum':
          if (agg.field) {
            results[`sum_${agg.field}`] = data.reduce((sum, item) => sum + parseFloat(item[agg.field!] || 0), 0);
          }
          break;
        case 'avg':
          if (agg.field) {
            const sum = data.reduce((sum, item) => sum + parseFloat(item[agg.field!] || 0), 0);
            results[`avg_${agg.field}`] = data.length > 0 ? sum / data.length : 0;
          }
          break;
        case 'min':
          if (agg.field) {
            results[`min_${agg.field}`] = Math.min(...data.map(item => parseFloat(item[agg.field!] || 0)));
          }
          break;
        case 'max':
          if (agg.field) {
            results[`max_${agg.field}`] = Math.max(...data.map(item => parseFloat(item[agg.field!] || 0)));
          }
          break;
      }
    }

    return results;
  }

  private static recommendVisualization(
    data: any[],
    groupBy?: string[],
    aggregations?: AnalyticsQuery['aggregations']
  ): AnalyticsResult['visualizationRecommendation'] {
    if (!data || data.length === 0) {
      return { chartType: 'table' };
    }

    if (groupBy && groupBy.includes('month')) {
      return {
        chartType: 'line',
        xAxis: 'month',
        yAxis: 'value',
        groupBy: groupBy[0]
      };
    }

    if (groupBy && groupBy.includes('quarter')) {
      return {
        chartType: 'bar',
        xAxis: 'quarter',
        yAxis: 'value',
        groupBy: groupBy[0]
      };
    }

    if (groupBy && (groupBy.includes('department') || groupBy.includes('status') || groupBy.includes('category'))) {
      if (data.length <= 6) {
        return {
          chartType: 'pie',
          groupBy: groupBy[0]
        };
      }
      return {
        chartType: 'bar',
        xAxis: groupBy[0],
        yAxis: 'count'
      };
    }

    if (aggregations && aggregations.length > 0 && data.length === 1) {
      return { chartType: 'table' };
    }

    if (data.length > 20) {
      return { chartType: 'table' };
    }

    return {
      chartType: 'bar',
      xAxis: 'name',
      yAxis: 'value'
    };
  }

  private static generateInsights(data: any[], query: AnalyticsQuery, summary: AnalyticsResult['summary']): string[] {
    const insights: string[] = [];

    if (data.length === 0) {
      insights.push('No records found matching your criteria.');
      return insights;
    }

    if (summary.aggregations) {
      if (summary.aggregations.count !== undefined) {
        insights.push(`Found ${summary.aggregations.count} record${summary.aggregations.count === 1 ? '' : 's'}.`);
      }

      if (summary.aggregations.sum_amount !== undefined) {
        insights.push(`Total amount: $${summary.aggregations.sum_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      }

      if (summary.aggregations.avg_amount !== undefined) {
        insights.push(`Average amount: $${summary.aggregations.avg_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      }
    }

    if (query.timeRange?.relativeRange) {
      const timeFrameMap: Record<string, string> = {
        today: 'today',
        this_week: 'this week',
        this_month: 'this month',
        this_quarter: 'this quarter',
        this_year: 'this year',
        last_month: 'last month',
        last_quarter: 'last quarter',
        last_year: 'last year'
      };
      const timeFrame = timeFrameMap[query.timeRange.relativeRange] || query.timeRange.relativeRange;
      insights.push(`Data is from ${timeFrame}.`);
    }

    return insights;
  }
}
