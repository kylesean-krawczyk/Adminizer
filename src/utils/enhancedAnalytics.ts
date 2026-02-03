import { CustomerData, SalesAnalysisResult, EconomicIndicator, EnhancedSalesForecastData } from '../types';
import { SalesAnalytics } from './analytics';

export class EnhancedSalesAnalytics extends SalesAnalytics {
  static async analyzeDataWithEconomicFactors(customers: CustomerData[], economicIndicators?: EconomicIndicator[]): Promise<SalesAnalysisResult & { enhancedForecast: EnhancedSalesForecastData }> {
    const baseAnalysis = this.analyzeData(customers);
    const indicators = economicIndicators || this.getMockIndicators();
    const enhancedForecast = this.generateEnhancedForecast(baseAnalysis.monthlyTrends, indicators);

    return {
      ...baseAnalysis,
      enhancedForecast
    };
  }

  private static generateEnhancedForecast(
    monthlyTrends: any[],
    economicIndicators: EconomicIndicator[]
  ): EnhancedSalesForecastData {
    const baseForecast = super.generateForecast(monthlyTrends);
    
    // Calculate economic impact factors
    const economicFactors = this.calculateEconomicImpact(economicIndicators);
    
    // Apply economic adjustments to base predictions
    const adjustedPredictions = this.applyEconomicAdjustments(baseForecast, economicFactors);

    return {
      ...baseForecast,
      economicFactors,
      adjustedPredictions
    };
  }

  private static getMockIndicators(): EconomicIndicator[] {
    return [
      {
        name: 'Consumer Confidence Index',
        data: [],
        impact: 'High correlation with discretionary spending',
        recommendation: 'Monitor monthly CCI reports for campaign timing',
        currentValue: 98.5,
        trend: 'up',
        correlation: 0.75
      },
      {
        name: 'S&P 500 Performance',
        data: [],
        impact: 'Stock market gains often increase consumer spending',
        recommendation: 'Track quarterly performance for sales timing',
        currentValue: 4350.2,
        trend: 'up',
        correlation: 0.68
      },
      {
        name: 'Unemployment Rate',
        data: [],
        impact: 'Inverse relationship with consumer spending',
        recommendation: 'Adjust sales strategies during economic downturns',
        currentValue: 3.7,
        trend: 'down',
        correlation: -0.62
      },
      {
        name: 'GDP Growth Rate',
        data: [],
        impact: 'Economic expansion correlates with increased spending',
        recommendation: 'Capitalize on growth periods for major campaigns',
        currentValue: 2.4,
        trend: 'stable',
        correlation: 0.71
      }
    ];
  }

  private static calculateEconomicImpact(indicators: EconomicIndicator[]): EnhancedSalesForecastData['economicFactors'] {
    const cci = indicators.find(i => i.name === 'Consumer Confidence Index');
    const sp500 = indicators.find(i => i.name === 'S&P 500 Performance');
    const unemployment = indicators.find(i => i.name === 'Unemployment Rate');
    const gdp = indicators.find(i => i.name === 'GDP Growth Rate');

    return {
      consumerConfidence: this.calculateIndicatorImpact(cci),
      marketPerformance: this.calculateIndicatorImpact(sp500),
      unemploymentImpact: this.calculateIndicatorImpact(unemployment),
      gdpGrowthImpact: this.calculateIndicatorImpact(gdp)
    };
  }

  private static calculateIndicatorImpact(indicator?: EconomicIndicator): number {
    if (!indicator || indicator.data.length < 2) return 0;

    const recent = indicator.data.slice(-3);
    const historical = indicator.data.slice(-12, -3);
    
    const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
    const historicalAvg = historical.reduce((sum, d) => sum + d.value, 0) / historical.length;
    
    const percentChange = (recentAvg - historicalAvg) / historicalAvg;
    
    // Apply correlation coefficient to weight the impact
    return percentChange * Math.abs(indicator.correlation);
  }

  private static applyEconomicAdjustments(
    baseForecast: any,
    economicFactors: EnhancedSalesForecastData['economicFactors']
  ): EnhancedSalesForecastData['adjustedPredictions'] {
    // Calculate composite economic adjustment factor
    const economicAdjustment = (
      economicFactors.consumerConfidence * 0.3 +
      economicFactors.marketPerformance * 0.25 +
      economicFactors.unemploymentImpact * 0.25 +
      economicFactors.gdpGrowthImpact * 0.2
    );

    // Apply adjustment with dampening to prevent extreme swings
    const dampedAdjustment = Math.max(-0.3, Math.min(0.3, economicAdjustment));

    const nextMonthAdjustment = baseForecast.nextMonth.predictedAmount * dampedAdjustment;
    const nextQuarterAdjustment = baseForecast.nextQuarter.predictedAmount * dampedAdjustment;

    return {
      nextMonth: {
        baseAmount: baseForecast.nextMonth.predictedAmount,
        economicAdjustment: nextMonthAdjustment,
        finalAmount: baseForecast.nextMonth.predictedAmount + nextMonthAdjustment,
        confidence: Math.min(0.95, baseForecast.nextMonth.confidence + Math.abs(dampedAdjustment) * 0.1)
      },
      nextQuarter: {
        baseAmount: baseForecast.nextQuarter.predictedAmount,
        economicAdjustment: nextQuarterAdjustment,
        finalAmount: baseForecast.nextQuarter.predictedAmount + nextQuarterAdjustment,
        confidence: Math.min(0.95, baseForecast.nextQuarter.confidence + Math.abs(dampedAdjustment) * 0.1)
      }
    };
  }

  static calculateOptimalCampaignTiming(
    economicIndicators: EconomicIndicator[],
    customerData: CustomerData[]
  ): {
    recommendedMonths: string[];
    reasoning: string;
    confidenceScore: number;
  } {
    const cci = economicIndicators.find(i => i.name === 'Consumer Confidence Index');
    const sp500 = economicIndicators.find(i => i.name === 'S&P 500 Performance');
    
    let score = 0;
    let reasoning = '';
    
    if (cci && cci.trend === 'up' && cci.currentValue > 95) {
      score += 0.3;
      reasoning += 'Consumer confidence is rising, indicating favorable spending conditions. ';
    }
    
    if (sp500 && sp500.trend === 'up') {
      score += 0.25;
      reasoning += 'Stock market performance is positive, potentially increasing consumer wealth. ';
    }
    
    // Analyze historical sales patterns
    const monthlySales = this.analyzeSeasonalPatterns(customerData);
    const bestMonths = monthlySales
      .sort((a, b) => b.averageAmount - a.averageAmount)
      .slice(0, 3)
      .map(m => m.month);
    
    score += 0.45; // Base score for historical patterns
    reasoning += `Historical data shows strongest sales in ${bestMonths.join(', ')}.`;

    return {
      recommendedMonths: bestMonths,
      reasoning,
      confidenceScore: Math.min(1, score)
    };
  }

  private static analyzeSeasonalPatterns(customerData: CustomerData[]): any[] {
    // Group sales by month and calculate averages
    const monthlyData = new Map<string, { amount: number; count: number }>();
    
    customerData.forEach(customer => {
      customer.sales.forEach(sale => {
        const date = new Date(sale.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { amount: 0, count: 0 });
        }
        const data = monthlyData.get(monthKey)!;
        data.amount += sale.amount;
        data.count += 1;
      });
    });
    
    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      averageAmount: data.amount / data.count,
      saleCount: data.count
    }));
  }
}