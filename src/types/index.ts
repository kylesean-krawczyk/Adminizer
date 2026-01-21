export interface CustomerData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  sales: Sale[];
  totalAmount: number;
  saleCount: number;
  averageSale: number;
  firstSale: Date;
  lastSale: Date;
  purchaseFrequency: 'one-time' | 'occasional' | 'regular' | 'frequent';
}

export interface Sale {
  id: string;
  amount: number;
  date: Date;
  month: string;
  year: number;
  customerId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface SalesAnalysisResult {
  totalCustomers: number;
  totalAmount: number;
  averageSale: number;
  saleCount: number;
  topCustomers: CustomerData[];
  monthlyTrends: MonthlySalesTrend[];
  customerRetention: CustomerRetentionData;
  forecast: SalesForecastData;
}

export interface MonthlySalesTrend {
  month: string;
  year: number;
  amount: number;
  customerCount: number;
  averageSale: number;
}

export interface CustomerRetentionData {
  newCustomers: number;
  returningCustomers: number;
  retentionRate: number;
  churnRate: number;
}

export interface SalesForecastData {
  nextMonth: {
    predictedAmount: number;
    confidence: number;
  };
  nextQuarter: {
    predictedAmount: number;
    confidence: number;
  };
  trendDirection: 'up' | 'down' | 'stable';
}

export interface FileUploadResult {
  success: boolean;
  data?: CustomerData[];
  error?: string;
  recordsProcessed: number;
}

export interface ComparisonPeriod {
  label: string;
  startDate: Date;
  endDate: Date;
  data: SalesAnalysisResult;
}

export interface EconomicDataPoint {
  date: Date;
  value: number;
  indicator: string;
}

export interface EconomicIndicator {
  name: string;
  data: EconomicDataPoint[];
  impact: string;
  recommendation: string;
  currentValue: number;
  trend: 'up' | 'down' | 'stable';
  correlation: number; // Correlation coefficient with sales patterns
}

export interface EnhancedSalesForecastData extends SalesForecastData {
  economicFactors: {
    consumerConfidence: number;
    marketPerformance: number;
    unemploymentImpact: number;
    gdpGrowthImpact: number;
  };
  adjustedPredictions: {
    nextMonth: {
      baseAmount: number;
      economicAdjustment: number;
      finalAmount: number;
      confidence: number;
    };
    nextQuarter: {
      baseAmount: number;
      economicAdjustment: number;
      finalAmount: number;
      confidence: number;
    };
  };
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  hire_date: string;
  termination_date: string | null;
  status: 'active' | 'on_leave' | 'terminated';
  salary: number | null;
  manager_id: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Donor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  total_lifetime_giving: number;
  first_donation_date: string | null;
  last_donation_date: string | null;
  donor_category: 'major' | 'regular' | 'occasional' | 'lapsed';
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  goal_amount: number;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  description: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  donor_id: string | null;
  donor_name: string;
  donor_email: string | null;
  amount: number;
  donation_date: string;
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'online';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  purpose: string | null;
  campaign_id: string | null;
  notes: string | null;
  tax_deductible: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Grant {
  id: string;
  grant_name: string;
  granting_organization: string;
  contact_person: string | null;
  amount_requested: number;
  amount_awarded: number | null;
  application_date: string;
  submission_deadline: string | null;
  decision_date: string | null;
  status: 'draft' | 'submitted' | 'under_review' | 'awarded' | 'rejected' | 'withdrawn';
  purpose: string | null;
  notes: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsQuery {
  dataSource: 'employees' | 'donations' | 'grants' | 'donors' | 'campaigns';
  naturalLanguageQuery: string;
  timeRange?: {
    startDate?: string;
    endDate?: string;
    relativeRange?: string;
  };
  filters?: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'between';
    value: any;
  }>;
  aggregations?: Array<{
    type: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'median';
    field?: string;
  }>;
  groupBy?: string[];
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
}

export interface AnalyticsResult {
  success: boolean;
  query: AnalyticsQuery;
  data: any[];
  summary: {
    totalRecords: number;
    aggregations?: Record<string, number>;
    insights?: string[];
  };
  visualizationRecommendation?: {
    chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'table';
    xAxis?: string;
    yAxis?: string;
    groupBy?: string;
  };
  error?: string;
  suggestions?: string[];
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }>;
}

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel' | 'json' | 'png';
  filename: string;
  includeCharts?: boolean;
  includeRawData?: boolean;
  includeSummary?: boolean;
}