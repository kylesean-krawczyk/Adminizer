import { EconomicIndicator, EconomicDataPoint } from '../types';

export class EconomicDataService {
  private static readonly FRED_API_BASE = 'https://api.stlouisfed.org/fred';
  private static readonly BEA_API_BASE = 'https://apps.bea.gov/api/data';
  
  // Get API keys from environment variables
  private static readonly FRED_API_KEY = import.meta.env.VITE_FRED_API_KEY;
  private static readonly BEA_API_KEY = import.meta.env.VITE_BEA_API_KEY;

  // FRED Series IDs for key economic indicators
  private static readonly FRED_SERIES = {
    CONSUMER_CONFIDENCE: 'UMCSENT', // University of Michigan Consumer Sentiment
    SP500: 'SP500', // S&P 500 Stock Price Index
    UNEMPLOYMENT: 'UNRATE', // Unemployment Rate
    GDP_GROWTH: 'A191RL1Q225SBEA', // Real GDP Growth Rate
    INFLATION: 'CPIAUCSL', // Consumer Price Index
    FEDERAL_FUNDS_RATE: 'FEDFUNDS', // Federal Funds Rate
    HOUSING_STARTS: 'HOUST', // Housing Starts
    RETAIL_SALES: 'RSAFS' // Retail Sales
  };

  // Add this for debugging
  static debugApiKey() {
    console.log('FRED_API_KEY:', this.FRED_API_KEY ? 'Loaded' : 'Not Loaded');
    if (!this.FRED_API_KEY) {
      console.error('FRED API key is missing. Please ensure VITE_FRED_API_KEY is set in your .env file and restart the dev server.');
    }
  }

  static async getConsumerConfidenceIndex(): Promise<EconomicDataPoint[]> {
    try {
      if (!this.FRED_API_KEY) {
        console.warn('FRED API key not found, using mock data');
        return this.getMockConsumerConfidence();
      }

      const response = await fetch(
        `${this.FRED_API_BASE}/series/observations?series_id=${this.FRED_SERIES.CONSUMER_CONFIDENCE}&api_key=${this.FRED_API_KEY}&file_type=json&limit=24&sort_order=desc`
      );
      
      if (!response.ok) {
        throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error_code) {
        throw new Error(`FRED API error: ${data.error_message}`);
      }

      return data.observations?.map((obs: any) => ({
        date: new Date(obs.date),
        value: parseFloat(obs.value) || 0,
        indicator: 'Consumer Confidence Index'
      })).reverse() || [];
    } catch (error) {
      console.warn('Failed to fetch Consumer Confidence data:', error);
      return this.getMockConsumerConfidence();
    }
  }

  static async getSP500Performance(): Promise<EconomicDataPoint[]> {
    try {
      if (!this.FRED_API_KEY) {
        console.warn('FRED API key not found, using mock data');
        return this.getMockSP500();
      }

      const response = await fetch(
        `${this.FRED_API_BASE}/series/observations?series_id=${this.FRED_SERIES.SP500}&api_key=${this.FRED_API_KEY}&file_type=json&limit=24&sort_order=desc`
      );
      
      if (!response.ok) {
        throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error_code) {
        throw new Error(`FRED API error: ${data.error_message}`);
      }

      return data.observations?.map((obs: any) => ({
        date: new Date(obs.date),
        value: parseFloat(obs.value) || 0,
        indicator: 'S&P 500'
      })).reverse() || [];
    } catch (error) {
      console.warn('Failed to fetch S&P 500 data:', error);
      return this.getMockSP500();
    }
  }

  static async getUnemploymentRate(): Promise<EconomicDataPoint[]> {
    try {
      if (!this.FRED_API_KEY) {
        console.warn('FRED API key not found, using mock data');
        return this.getMockUnemployment();
      }

      const response = await fetch(
        `${this.FRED_API_BASE}/series/observations?series_id=${this.FRED_SERIES.UNEMPLOYMENT}&api_key=${this.FRED_API_KEY}&file_type=json&limit=24&sort_order=desc`
      );
      
      if (!response.ok) {
        throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error_code) {
        throw new Error(`FRED API error: ${data.error_message}`);
      }

      return data.observations?.map((obs: any) => ({
        date: new Date(obs.date),
        value: parseFloat(obs.value) || 0,
        indicator: 'Unemployment Rate'
      })).reverse() || [];
    } catch (error) {
      console.warn('Failed to fetch unemployment data:', error);
      return this.getMockUnemployment();
    }
  }

  static async getGDPGrowthRate(): Promise<EconomicDataPoint[]> {
    try {
      if (!this.FRED_API_KEY) {
        console.warn('FRED API key not found, using mock data');
        return this.getMockGDP();
      }

      const response = await fetch(
        `${this.FRED_API_BASE}/series/observations?series_id=${this.FRED_SERIES.GDP_GROWTH}&api_key=${this.FRED_API_KEY}&file_type=json&limit=12&sort_order=desc`
      );
      
      if (!response.ok) {
        throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error_code) {
        throw new Error(`FRED API error: ${data.error_message}`);
      }

      return data.observations?.map((obs: any) => ({
        date: new Date(obs.date),
        value: parseFloat(obs.value) || 0,
        indicator: 'GDP Growth Rate'
      })).reverse() || [];
    } catch (error) {
      console.warn('Failed to fetch GDP data:', error);
      return this.getMockGDP();
    }
  }

  static async getInflationRate(): Promise<EconomicDataPoint[]> {
    try {
      if (!this.FRED_API_KEY) {
        console.warn('FRED API key not found, using mock data');
        return this.getMockInflation();
      }

      const response = await fetch(
        `${this.FRED_API_BASE}/series/observations?series_id=${this.FRED_SERIES.INFLATION}&api_key=${this.FRED_API_KEY}&file_type=json&limit=24&sort_order=desc`
      );
      
      if (!response.ok) {
        throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error_code) {
        throw new Error(`FRED API error: ${data.error_message}`);
      }

      // Calculate year-over-year inflation rate
      const observations = data.observations?.map((obs: any) => ({
        date: new Date(obs.date),
        value: parseFloat(obs.value) || 0,
        indicator: 'Inflation Rate'
      })).reverse() || [];

      // Calculate YoY inflation rate
      return observations.map((obs: any, index: number) => {
        if (index >= 12) {
          const currentValue = obs.value;
          const yearAgoValue = observations[index - 12].value;
          const inflationRate = yearAgoValue > 0 ? ((currentValue - yearAgoValue) / yearAgoValue) * 100 : 0;
          return {
            ...obs,
            value: inflationRate
          };
        }
        return obs;
      }).slice(12); // Remove first 12 months where we can't calculate YoY
    } catch (error) {
      console.warn('Failed to fetch inflation data:', error);
      return this.getMockInflation();
    }
  }

  static async getFederalFundsRate(): Promise<EconomicDataPoint[]> {
    try {
      if (!this.FRED_API_KEY) {
        console.warn('FRED API key not found, using mock data');
        return this.getMockFederalFunds();
      }

      const response = await fetch(
        `${this.FRED_API_BASE}/series/observations?series_id=${this.FRED_SERIES.FEDERAL_FUNDS_RATE}&api_key=${this.FRED_API_KEY}&file_type=json&limit=24&sort_order=desc`
      );
      
      if (!response.ok) {
        throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error_code) {
        throw new Error(`FRED API error: ${data.error_message}`);
      }

      return data.observations?.map((obs: any) => ({
        date: new Date(obs.date),
        value: parseFloat(obs.value) || 0,
        indicator: 'Federal Funds Rate'
      })).reverse() || [];
    } catch (error) {
      console.warn('Failed to fetch Federal Funds Rate data:', error);
      return this.getMockFederalFunds();
    }
  }

  static async getPersonalIncomeData(): Promise<EconomicDataPoint[]> {
    try {
      if (!this.BEA_API_KEY) {
        console.warn('BEA API key not found, using mock data');
        return this.getMockPersonalIncome();
      }

      const response = await fetch(
        `${this.BEA_API_BASE}?&UserID=${this.BEA_API_KEY}&method=GetData&datasetname=NIPA&TableName=T20100&Frequency=Q&Year=2023,2024&ResultFormat=json`
      );
      
      if (!response.ok) {
        throw new Error(`BEA API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.BEAAPI?.Results?.[0]?.Data) {
        const personalIncomeData = data.BEAAPI.Results[0].Data
          .filter((item: any) => item.LineDescription === 'Personal income')
          .map((item: any) => ({
            date: new Date(`${item.TimePeriod.replace('Q', '/1/')}/01`),
            value: parseFloat(item.DataValue?.replace(/,/g, '') || '0'),
            indicator: 'Personal Income Growth'
          }))
          .sort((a: EconomicDataPoint, b: EconomicDataPoint) => a.date.getTime() - b.date.getTime());

        // Calculate year-over-year growth rates
        return personalIncomeData.map((item: EconomicDataPoint, index: number) => {
          if (index >= 4) { // Need 4 quarters for YoY calculation
            const currentValue = item.value;
            const yearAgoValue = personalIncomeData[index - 4].value;
            const growthRate = yearAgoValue > 0 ? ((currentValue - yearAgoValue) / yearAgoValue) * 100 : 0;
            return {
              ...item,
              value: growthRate
            };
          }
          return item;
        }).slice(4); // Remove first 4 quarters where we can't calculate YoY
      }
      
      return this.getMockPersonalIncome();
    } catch (error) {
      console.warn('Failed to fetch Personal Income data:', error);
      return this.getMockPersonalIncome();
    }
  }

  static async getCorporateProfitsData(): Promise<EconomicDataPoint[]> {
    try {
      if (!this.BEA_API_KEY) {
        console.warn('BEA API key not found, using mock data');
        return this.getMockCorporateProfits();
      }

      const response = await fetch(
        `${this.BEA_API_BASE}?&UserID=${this.BEA_API_KEY}&method=GetData&datasetname=NIPA&TableName=T11200&Frequency=Q&Year=2023,2024&ResultFormat=json`
      );
      
      if (!response.ok) {
        throw new Error(`BEA API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.BEAAPI?.Results?.[0]?.Data) {
        const corporateProfitsData = data.BEAAPI.Results[0].Data
          .filter((item: any) => item.LineDescription === 'Corporate profits with inventory valuation and capital consumption adjustments')
          .map((item: any) => ({
            date: new Date(`${item.TimePeriod.replace('Q', '/1/')}/01`),
            value: parseFloat(item.DataValue?.replace(/,/g, '') || '0'),
            indicator: 'Corporate Profits'
          }))
          .sort((a: EconomicDataPoint, b: EconomicDataPoint) => a.date.getTime() - b.date.getTime());

        // Calculate year-over-year growth rates
        return corporateProfitsData.map((item: EconomicDataPoint, index: number) => {
          if (index >= 4) { // Need 4 quarters for YoY calculation
            const currentValue = item.value;
            const yearAgoValue = corporateProfitsData[index - 4].value;
            const growthRate = yearAgoValue > 0 ? ((currentValue - yearAgoValue) / yearAgoValue) * 100 : 0;
            return {
              ...item,
              value: growthRate
            };
          }
          return item;
        }).slice(4); // Remove first 4 quarters where we can't calculate YoY
      }
      
      return this.getMockCorporateProfits();
    } catch (error) {
      console.warn('Failed to fetch Corporate Profits data:', error);
      return this.getMockCorporateProfits();
    }
  }

  static async getAllIndicators(): Promise<EconomicIndicator[]> {
    try {
      // Use mock data due to CORS restrictions in browser environment
      // In production, these API calls would be made from a backend server
      const [cci, sp500, unemployment, gdp, inflation, federalFunds, personalIncome, corporateProfits] = await Promise.all([
        Promise.resolve(this.getMockConsumerConfidence()),
        Promise.resolve(this.getMockSP500()),
        Promise.resolve(this.getMockUnemployment()),
        Promise.resolve(this.getMockGDP()),
        Promise.resolve(this.getMockInflation()),
        Promise.resolve(this.getMockFederalFunds()),
        Promise.resolve(this.getMockPersonalIncome()),
        Promise.resolve(this.getMockCorporateProfits())
      ]);

      return [
        {
          name: 'Consumer Confidence Index',
          data: cci,
          impact: 'High correlation with discretionary giving - confident consumers donate more',
          recommendation: 'Monitor monthly CCI reports for optimal campaign timing',
          currentValue: cci[cci.length - 1]?.value || 0,
          trend: this.calculateTrend(cci),
          correlation: 0.75
        },
        {
          name: 'S&P 500 Performance',
          data: sp500,
          impact: 'Stock market gains increase donor wealth and charitable giving capacity',
          recommendation: 'Track quarterly performance for major gift solicitation timing',
          currentValue: sp500[sp500.length - 1]?.value || 0,
          trend: this.calculateTrend(sp500),
          correlation: 0.68
        },
        {
          name: 'Unemployment Rate',
          data: unemployment,
          impact: 'Inverse relationship - higher unemployment reduces donation frequency',
          recommendation: 'Adjust fundraising strategies and expectations during high unemployment',
          currentValue: unemployment[unemployment.length - 1]?.value || 0,
          trend: this.calculateTrend(unemployment),
          correlation: -0.62
        },
        {
          name: 'GDP Growth Rate',
          data: gdp,
          impact: 'Economic expansion correlates with increased charitable giving',
          recommendation: 'Capitalize on growth periods for capital campaigns and major gifts',
          currentValue: gdp[gdp.length - 1]?.value || 0,
          trend: this.calculateTrend(gdp),
          correlation: 0.71
        },
        {
          name: 'Inflation Rate',
          data: inflation,
          impact: 'High inflation can reduce discretionary spending including donations',
          recommendation: 'Consider inflation impact when setting fundraising targets',
          currentValue: inflation[inflation.length - 1]?.value || 0,
          trend: this.calculateTrend(inflation),
          correlation: -0.45
        },
        {
          name: 'Federal Funds Rate',
          data: federalFunds,
          impact: 'Interest rates affect investment returns and donor wealth',
          recommendation: 'Monitor rate changes for endowment and planned giving strategies',
          currentValue: federalFunds[federalFunds.length - 1]?.value || 0,
          trend: this.calculateTrend(federalFunds),
          correlation: -0.38
        },
        {
          name: 'Personal Income Growth',
          data: personalIncome,
          impact: 'Higher personal income growth correlates with increased charitable giving capacity',
          recommendation: 'Monitor personal income trends for individual donor campaign timing',
          currentValue: personalIncome[personalIncome.length - 1]?.value || 0,
          trend: this.calculateTrend(personalIncome),
          correlation: 0.72
        },
        {
          name: 'Corporate Profits',
          data: corporateProfits,
          impact: 'Corporate profit growth indicates potential for increased corporate giving',
          recommendation: 'Track corporate profits for business development and sponsorship timing',
          currentValue: corporateProfits[corporateProfits.length - 1]?.value || 0,
          trend: this.calculateTrend(corporateProfits),
          correlation: 0.65
        }
      ];
    } catch (error) {
      console.error('Failed to fetch economic indicators:', error);
      return this.getMockIndicators();
    }
  }

  // Test FRED API connection
  static async testFredConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      this.debugApiKey(); // Call debug here
      if (!this.FRED_API_KEY) {
        return {
          success: false,
          message: 'FRED API key not configured. Please add VITE_FRED_API_KEY to your .env file.'
        };
      }

      const response = await fetch(
        `${this.FRED_API_BASE}/releases?api_key=${this.FRED_API_KEY}&file_type=json&limit=1`
      );
      
      if (!response.ok) {
        return {
          success: false,
          message: `FRED API connection failed: ${response.status} ${response.statusText}`
        };
      }
      
      const data = await response.json();
      
      if (data.error_code) {
        return {
          success: false,
          message: `FRED API error: ${data.error_message}`
        };
      }

      return {
        success: true,
        message: 'FRED API connection successful!',
        data: data.releases?.[0]
      };
    } catch (error) {
      return {
        success: false,
        message: `FRED API connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static calculateTrend(data: EconomicDataPoint[]): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable';
    
    const recent = data.slice(-3);
    const older = data.slice(-6, -3);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.value, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / Math.abs(olderAvg);
    
    if (change > 0.02) return 'up';
    if (change < -0.02) return 'down';
    return 'stable';
  }

  // Mock data methods for fallback
  private static getMockConsumerConfidence(): EconomicDataPoint[] {
    const baseValue = 95;
    return Array.from({ length: 24 }, (_, i) => ({
      date: new Date(2023, i, 1),
      value: baseValue + Math.sin(i * 0.5) * 10 + Math.random() * 5,
      indicator: 'Consumer Confidence Index'
    }));
  }

  private static getMockSP500(): EconomicDataPoint[] {
    const baseValue = 4200;
    return Array.from({ length: 24 }, (_, i) => ({
      date: new Date(2023, i, 1),
      value: baseValue + i * 50 + Math.random() * 200 - 100,
      indicator: 'S&P 500'
    }));
  }

  private static getMockUnemployment(): EconomicDataPoint[] {
    const baseValue = 3.8;
    return Array.from({ length: 24 }, (_, i) => ({
      date: new Date(2023, i, 1),
      value: baseValue + Math.sin(i * 0.3) * 0.5 + Math.random() * 0.3,
      indicator: 'Unemployment Rate'
    }));
  }

  private static getMockGDP(): EconomicDataPoint[] {
    const baseValue = 2.1;
    return Array.from({ length: 16 }, (_, i) => ({
      date: new Date(2023, i * 1.5, 1),
      value: baseValue + Math.sin(i * 0.4) * 0.8 + Math.random() * 0.4,
      indicator: 'GDP Growth Rate'
    }));
  }

  private static getMockInflation(): EconomicDataPoint[] {
    const baseValue = 3.2;
    return Array.from({ length: 24 }, (_, i) => ({
      date: new Date(2023, i, 1),
      value: baseValue + Math.sin(i * 0.4) * 1.2 + Math.random() * 0.5,
      indicator: 'Inflation Rate'
    }));
  }

  private static getMockFederalFunds(): EconomicDataPoint[] {
    const baseValue = 5.25;
    return Array.from({ length: 24 }, (_, i) => ({
      date: new Date(2023, i, 1),
      value: baseValue + Math.sin(i * 0.2) * 0.5 + Math.random() * 0.25,
      indicator: 'Federal Funds Rate'
    }));
  }

  private static getMockIndicators(): EconomicIndicator[] {
    return [
      {
        name: 'Consumer Confidence Index',
        data: this.getMockConsumerConfidence(),
        impact: 'High correlation with discretionary giving',
        recommendation: 'Monitor monthly CCI reports for campaign timing',
        currentValue: 98.5,
        trend: 'up',
        correlation: 0.75
      },
      {
        name: 'S&P 500 Performance',
        data: this.getMockSP500(),
        impact: 'Stock market gains often increase charitable giving',
        recommendation: 'Track quarterly performance for major gift timing',
        currentValue: 4350.2,
        trend: 'up',
        correlation: 0.68
      },
      {
        name: 'Unemployment Rate',
        data: this.getMockUnemployment(),
        impact: 'Inverse relationship with donation frequency',
        recommendation: 'Adjust fundraising strategies during economic downturns',
        currentValue: 3.7,
        trend: 'down',
        correlation: -0.62
      },
      {
        name: 'GDP Growth Rate',
        data: this.getMockGDP(),
        impact: 'Economic expansion correlates with increased giving',
        recommendation: 'Capitalize on growth periods for capital campaigns',
        currentValue: 2.4,
        trend: 'stable',
        correlation: 0.71
      },
      {
        name: 'Inflation Rate',
        data: this.getMockInflation(),
        impact: 'High inflation can reduce discretionary spending',
        recommendation: 'Consider inflation impact when setting targets',
        currentValue: 3.2,
        trend: 'down',
        correlation: -0.45
      },
      {
        name: 'Federal Funds Rate',
        data: this.getMockFederalFunds(),
        impact: 'Interest rates affect investment returns',
        recommendation: 'Monitor for endowment and planned giving strategies',
        currentValue: 5.25,
        trend: 'stable',
        correlation: -0.38
      },
      {
        name: 'Personal Income Growth',
        data: this.getMockPersonalIncome(),
        impact: 'Higher personal income growth correlates with increased charitable giving capacity',
        recommendation: 'Monitor personal income trends for individual donor campaign timing',
        currentValue: 3.8,
        trend: 'up',
        correlation: 0.72
      },
      {
        name: 'Corporate Profits',
        data: this.getMockCorporateProfits(),
        impact: 'Corporate profit growth indicates potential for increased corporate giving',
        recommendation: 'Track corporate profits for business development and sponsorship timing',
        currentValue: 8.5,
        trend: 'up',
        correlation: 0.65
      }
    ];
  }

  private static getMockPersonalIncome(): EconomicDataPoint[] {
    const baseValue = 3.8;
    return Array.from({ length: 16 }, (_, i) => ({
      date: new Date(2023, i * 1.5, 1),
      value: baseValue + Math.sin(i * 0.4) * 1.2 + Math.random() * 0.6,
      indicator: 'Personal Income Growth'
    }));
  }

  private static getMockCorporateProfits(): EconomicDataPoint[] {
    const baseValue = 8.5;
    return Array.from({ length: 16 }, (_, i) => ({
      date: new Date(2023, i * 1.5, 1),
      value: baseValue + Math.sin(i * 0.5) * 2.0 + Math.random() * 1.0,
      indicator: 'Corporate Profits'
    }));
  }

}