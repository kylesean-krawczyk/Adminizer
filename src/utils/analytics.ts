import { CustomerData, SalesAnalysisResult, MonthlySalesTrend, CustomerRetentionData, SalesForecastData } from '../types';
import { format, subMonths } from 'date-fns';

export class SalesAnalytics {
  static analyzeData(customers: CustomerData[]): SalesAnalysisResult {
    const totalCustomers = customers.length;
    const totalAmount = customers.reduce((sum, customer) => sum + customer.totalAmount, 0);
    const saleCount = customers.reduce((sum, customer) => sum + customer.saleCount, 0);
    const averageSale = totalAmount / saleCount;

    const topCustomers = customers
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    const monthlyTrends = this.calculateMonthlyTrends(customers);
    const customerRetention = this.calculateRetention(customers);
    const forecast = this.generateForecast(monthlyTrends);

    return {
      totalCustomers,
      totalAmount,
      averageSale,
      saleCount,
      topCustomers,
      monthlyTrends,
      customerRetention,
      forecast
    };
  }

  private static calculateMonthlyTrends(customers: CustomerData[]): MonthlySalesTrend[] {
    const monthlyData = new Map<string, { amount: number; customers: Set<string> }>();

    // Debug: Log all sale dates to understand the data distribution
    const allDates = customers.flatMap(customer => 
      customer.sales.map(sale => sale.date.toISOString().substring(0, 10))
    );
    console.log('All sale dates:', [...new Set(allDates)].sort());

    customers.forEach(customer => {
      customer.sales.forEach(sale => {
        // Use a more robust date formatting
        const date = new Date(sale.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { amount: 0, customers: new Set() });
        }
        const data = monthlyData.get(monthKey)!;
        data.amount += sale.amount;
        data.customers.add(customer.id);
      });
    });

    console.log('Monthly data map:', Object.fromEntries(monthlyData));

    return Array.from(monthlyData.entries())
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return {
          month: format(date, 'MMM yyyy'),
          year: parseInt(year),
          amount: data.amount,
          customerCount: data.customers.size,
          averageSale: data.amount / data.customers.size
        };
      })
      .sort((a, b) => a.year - b.year || this.getMonthNumber(a.month.split(' ')[0]) - this.getMonthNumber(b.month.split(' ')[0]));
  }

  private static getMonthNumber(monthName: string): number {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(monthName) + 1;
  }

  private static calculateRetention(customers: CustomerData[]): CustomerRetentionData {
    // Find the most recent month with sales
    const allSaleDates = customers.flatMap(customer => customer.sales.map(s => s.date));
    if (allSaleDates.length === 0) {
      return { newCustomers: 0, returningCustomers: 0, retentionRate: 0, churnRate: 0 };
    }
    
    const mostRecentDate = new Date(Math.max(...allSaleDates.map(d => d.getTime())));
    const currentMonth = new Date(mostRecentDate.getFullYear(), mostRecentDate.getMonth(), 1);
    const lastMonth = subMonths(currentMonth, 1);
    
    const currentMonthCustomers = new Set<string>();
    const lastMonthCustomers = new Set<string>();

    customers.forEach(customer => {
      customer.sales.forEach(sale => {
        const saleDate = new Date(sale.date.getFullYear(), sale.date.getMonth(), 1);
        
        if (saleDate.getTime() === currentMonth.getTime()) {
          currentMonthCustomers.add(customer.id);
        }
        if (saleDate.getTime() === lastMonth.getTime()) {
          lastMonthCustomers.add(customer.id);
        }
      });
    });

    // Use frequency-based retention analysis for better representation
    const frequentCustomers = customers.filter(c => c.purchaseFrequency === 'frequent').length;
    const regularCustomers = customers.filter(c => c.purchaseFrequency === 'regular').length;
    const occasionalCustomers = customers.filter(c => c.purchaseFrequency === 'occasional').length;
    const oneTimeCustomers = customers.filter(c => c.purchaseFrequency === 'one-time').length;
    
    // Returning customers = those who have purchased multiple times
    const returningCustomers = frequentCustomers + regularCustomers + occasionalCustomers;
    const newCustomers = oneTimeCustomers;
    
    // Calculate retention rate based on overall customer behavior
    const retentionRate = customers.length > 0 ? returningCustomers / customers.length : 0;

    const churnRate = 1 - retentionRate;

    return {
      newCustomers,
      returningCustomers,
      retentionRate,
      churnRate
    };
  }

  protected static generateForecast(monthlyTrends: MonthlySalesTrend[]): SalesForecastData {
    if (monthlyTrends.length < 3) {
      return {
        nextMonth: { predictedAmount: 0, confidence: 0 },
        nextQuarter: { predictedAmount: 0, confidence: 0 },
        trendDirection: 'stable'
      };
    }

    const amounts = monthlyTrends.map(trend => trend.amount);
    const recentTrends = amounts.slice(-6); // Last 6 months
    
    // Simple linear regression for forecasting
    const regression = this.calculateLinearRegression(recentTrends);
    const nextMonthPrediction = regression.predict(recentTrends.length);
    const nextQuarterPrediction = (regression.predict(recentTrends.length + 1) + 
                                  regression.predict(recentTrends.length + 2) + 
                                  regression.predict(recentTrends.length + 3)) / 3;

    // Calculate confidence based on R-squared
    const confidence = Math.max(0, Math.min(1, regression.rSquared));

    // Determine trend direction
    const slope = regression.slope;
    const trendDirection = slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'stable';

    return {
      nextMonth: {
        predictedAmount: Math.max(0, nextMonthPrediction),
        confidence
      },
      nextQuarter: {
        predictedAmount: Math.max(0, nextQuarterPrediction),
        confidence
      },
      trendDirection
    };
  }

  private static calculateLinearRegression(values: number[]) {
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumXX = values.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = values.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const ssTot = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    return {
      slope,
      intercept,
      rSquared,
      predict: (x: number) => slope * x + intercept
    };
  }

  static comparePeriodsAnalysis(
    period1Data: CustomerData[],
    period2Data: CustomerData[]
  ): {
    period1: SalesAnalysisResult;
    period2: SalesAnalysisResult;
    comparison: {
      customerGrowth: number;
      amountGrowth: number;
      avgSaleGrowth: number;
    };
  } {
    const period1 = this.analyzeData(period1Data);
    const period2 = this.analyzeData(period2Data);

    const comparison = {
      customerGrowth: (period2.totalCustomers - period1.totalCustomers) / period1.totalCustomers,
      amountGrowth: (period2.totalAmount - period1.totalAmount) / period1.totalAmount,
      avgSaleGrowth: (period2.averageSale - period1.averageSale) / period1.averageSale
    };

    return {
      period1,
      period2,
      comparison
    };
  }
}