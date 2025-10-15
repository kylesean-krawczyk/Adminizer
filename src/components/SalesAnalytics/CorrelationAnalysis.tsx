import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react';
import { MonthlySalesTrend, EconomicIndicator } from '../../types';
import { EconomicDataService } from '../../Services/economicDataService';
import { formatCurrency, formatNumber } from '../../utils/helpers';

interface CorrelationAnalysisProps {
  monthlyTrends: MonthlySalesTrend[];
}

interface CorrelationResult {
  coefficient: number;
  strength: 'Very Strong' | 'Strong' | 'Moderate' | 'Weak' | 'Very Weak';
  direction: 'Positive' | 'Negative';
  pValue: number;
  significance: 'Highly Significant' | 'Significant' | 'Not Significant';
}

interface CombinedDataPoint {
  month: string;
  salesAmount: number;
  economicValue: number;
  date: Date;
}

export const CorrelationAnalysis: React.FC<CorrelationAnalysisProps> = ({ monthlyTrends }) => {
  const [economicIndicators, setEconomicIndicators] = useState<EconomicIndicator[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [correlationResult, setCorrelationResult] = useState<CorrelationResult | null>(null);
  const [combinedData, setCombinedData] = useState<CombinedDataPoint[]>([]);

  useEffect(() => {
    loadEconomicIndicators();
  }, []);

  useEffect(() => {
    if (selectedIndicator && economicIndicators.length > 0) {
      calculateCorrelation();
    }
  }, [selectedIndicator, economicIndicators, monthlyTrends]);

  const loadEconomicIndicators = async () => {
    setLoading(true);
    try {
      const indicators = await EconomicDataService.getAllIndicators();
      setEconomicIndicators(indicators);
      if (indicators.length > 0) {
        setSelectedIndicator(indicators[0].name);
      }
    } catch (error) {
      console.error('Failed to load economic indicators:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCorrelation = () => {
    const indicator = economicIndicators.find(ind => ind.name === selectedIndicator);
    if (!indicator || monthlyTrends.length === 0) return;

    // Align data by month/year
    const alignedData: CombinedDataPoint[] = [];
    
    monthlyTrends.forEach(trend => {
      const trendDate = new Date(trend.year, getMonthIndex(trend.month.split(' ')[0]), 1);
      
      // Find matching economic data point (within same month/year)
      const economicPoint = indicator.data.find((econ: any) => {
        const econDate = new Date(econ.date);
        return econDate.getFullYear() === trendDate.getFullYear() && 
               econDate.getMonth() === trendDate.getMonth();
      });

      if (economicPoint) {
        alignedData.push({
          month: trend.month,
          salesAmount: trend.amount,
          economicValue: economicPoint.value,
          date: trendDate
        });
      }
    });

    setCombinedData(alignedData);

    if (alignedData.length < 3) {
      setCorrelationResult(null);
      return;
    }

    // Calculate Pearson correlation coefficient
    const correlation = calculatePearsonCorrelation(
      alignedData.map(d => d.salesAmount),
      alignedData.map(d => d.economicValue)
    );

    setCorrelationResult(correlation);
  };

  const calculatePearsonCorrelation = (x: number[], y: number[]): CorrelationResult => {
    const n = x.length;
    if (n === 0) return { coefficient: 0, strength: 'Very Weak', direction: 'Positive', pValue: 1, significance: 'Not Significant' };

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    const coefficient = denominator === 0 ? 0 : numerator / denominator;

    // Determine strength
    const absCoeff = Math.abs(coefficient);
    let strength: CorrelationResult['strength'];
    if (absCoeff >= 0.8) strength = 'Very Strong';
    else if (absCoeff >= 0.6) strength = 'Strong';
    else if (absCoeff >= 0.4) strength = 'Moderate';
    else if (absCoeff >= 0.2) strength = 'Weak';
    else strength = 'Very Weak';

    // Calculate approximate p-value (simplified)
    const tStat = coefficient * Math.sqrt((n - 2) / (1 - coefficient * coefficient));
    const pValue = Math.max(0.001, Math.min(0.999, 2 * (1 - Math.abs(tStat) / Math.sqrt(n - 2 + tStat * tStat))));

    const significance: CorrelationResult['significance'] = 
      pValue < 0.01 ? 'Highly Significant' : 
      pValue < 0.05 ? 'Significant' : 'Not Significant';

    return {
      coefficient,
      strength,
      direction: coefficient >= 0 ? 'Positive' : 'Negative',
      pValue,
      significance
    };
  };

  const getMonthIndex = (monthName: string): number => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(monthName);
  };

  const getCorrelationColor = (coefficient: number) => {
    if (Math.abs(coefficient) >= 0.6) return 'text-green-600';
    if (Math.abs(coefficient) >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (coefficient: number) => {
    if (coefficient > 0.1) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (coefficient < -0.1) return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <BarChart3 className="w-5 h-5 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading correlation analysis...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Economic Correlation Analysis</h3>
        <button
          onClick={loadEconomicIndicators}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Indicator Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Economic Indicator to Compare:
        </label>
        <select
          value={selectedIndicator}
          onChange={(e) => setSelectedIndicator(e.target.value)}
          className="w-full md:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {economicIndicators.map((indicator) => (
            <option key={indicator.name} value={indicator.name}>
              {indicator.name}
            </option>
          ))}
        </select>
      </div>

      {/* Correlation Results */}
      {correlationResult && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="flex items-center justify-center mb-2">
              {getTrendIcon(correlationResult.coefficient)}
            </div>
            <p className={`text-2xl font-bold ${getCorrelationColor(correlationResult.coefficient)}`}>
              {correlationResult.coefficient.toFixed(3)}
            </p>
            <p className="text-sm text-blue-600">Correlation</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-lg font-bold text-green-900">{correlationResult.strength}</p>
            <p className="text-sm text-green-600">Strength</p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <p className="text-lg font-bold text-purple-900">{correlationResult.direction}</p>
            <p className="text-sm text-purple-600">Direction</p>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <p className="text-lg font-bold text-orange-900">{correlationResult.significance}</p>
            <p className="text-sm text-orange-600">Statistical</p>
          </div>
        </div>
      )}

      {/* Combined Trend Chart */}
      {combinedData.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-3">Trend Comparison</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="sales"
                  orientation="left"
                  stroke="#2563eb"
                  fontSize={12}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis 
                  yAxisId="economic"
                  orientation="right"
                  stroke="#dc2626"
                  fontSize={12}
                  tickFormatter={(value) => 
                    selectedIndicator.includes('S&P') ? formatNumber(value) : `${value.toFixed(1)}%`
                  }
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'salesAmount' 
                      ? formatCurrency(value)
                      : selectedIndicator.includes('S&P') 
                        ? formatNumber(value) 
                        : `${value.toFixed(1)}%`,
                    name === 'salesAmount' ? 'Sales' : selectedIndicator
                  ]}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem'
                  }}
                />
                <Line 
                  yAxisId="sales"
                  type="monotone" 
                  dataKey="salesAmount" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  name="salesAmount"
                />
                <Line 
                  yAxisId="economic"
                  type="monotone" 
                  dataKey="economicValue" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                  name="economicValue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Interpretation */}
      {correlationResult && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Interpretation</h4>
          <p className="text-sm text-gray-600">
            {correlationResult.direction === 'Positive' 
              ? `There is a ${correlationResult.strength.toLowerCase()} positive correlation (${correlationResult.coefficient.toFixed(3)}) between ${selectedIndicator.toLowerCase()} and sales amounts. As the economic indicator increases, sales tend to increase.`
              : `There is a ${correlationResult.strength.toLowerCase()} negative correlation (${correlationResult.coefficient.toFixed(3)}) between ${selectedIndicator.toLowerCase()} and sales amounts. As the economic indicator increases, sales tend to decrease.`
            }
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <strong>Statistical Significance:</strong> {correlationResult.significance} 
            (p-value: {correlationResult.pValue.toFixed(3)})
          </p>
          {correlationResult.significance !== 'Not Significant' && (
            <p className="text-sm text-blue-600 mt-2">
              <strong>Sales Insight:</strong> This correlation suggests that monitoring {selectedIndicator.toLowerCase()} 
              can help predict sales trends and optimize campaign timing.
            </p>
          )}
        </div>
      )}

      {combinedData.length === 0 && !loading && (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            No overlapping data found between sales trends and selected economic indicator.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Try selecting a different economic indicator or ensure your sales data covers recent months.
          </p>
        </div>
      )}
    </div>
  );
};