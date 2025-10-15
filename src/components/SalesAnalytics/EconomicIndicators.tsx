import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, BarChart3, Activity, RefreshCw, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EconomicDataService } from '../../services/economicDataService';
import { EconomicIndicator } from '../../types';
import { formatNumber, formatPercentage } from '../../utils/helpers';

export const EconomicIndicators: React.FC = () => {
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<EconomicIndicator | null>(null);
  const [apiStatus, setApiStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    testApiConnection();
    loadEconomicData();
  }, []);

  const testApiConnection = async () => {
    try {
      const status = await EconomicDataService.testFredConnection();
      setApiStatus(status);
    } catch (err) {
      setApiStatus({
        success: false,
        message: 'Failed to test API connection'
      });
    }
  };

  const loadEconomicData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await EconomicDataService.getAllIndicators();
      setIndicators(data);
      if (data.length > 0) {
        setSelectedIndicator(data[0]);
      }
    } catch (err) {
      setError('Failed to load economic data. Using sample data for demonstration.');
      console.error('Economic data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIconForIndicator = (name: string) => {
    switch (name) {
      case 'Consumer Confidence Index':
        return <Activity className="w-5 h-5 text-blue-600" />;
      case 'S&P 500 Performance':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'Unemployment Rate':
        return <BarChart3 className="w-5 h-5 text-red-600" />;
      case 'GDP Growth Rate':
        return <DollarSign className="w-5 h-5 text-purple-600" />;
      case 'Inflation Rate':
        return <Activity className="w-5 h-5 text-orange-600" />;
      case 'Federal Funds Rate':
        return <BarChart3 className="w-5 h-5 text-indigo-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading economic indicators...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Connection Status */}
      {apiStatus && (
        <div className={`rounded-lg p-4 border ${
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <p className="font-medium text-blue-800">
              Demo Mode: {apiStatus.message}
            </p>
          </div>
          <p className="text-sm text-blue-600 mt-2">
            Real-time data integration requires backend server deployment to avoid CORS restrictions.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      {/* Economic Indicators Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indicators.map((indicator, index) => (
          <div 
            key={index} 
            className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all ${
              selectedIndicator?.name === indicator.name 
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedIndicator(indicator)}
          >
            <div className="flex items-center justify-between mb-2">
              {getIconForIndicator(indicator.name)}
              <span className={`text-sm font-medium ${getTrendColor(indicator.trend)}`}>
                {getTrendIcon(indicator.trend)} {indicator.trend}
              </span>
            </div>
            <h4 className="font-medium text-gray-900 text-sm mb-1">{indicator.name}</h4>
            <p className="text-lg font-bold text-gray-900">
              {indicator.name.includes('Rate') || indicator.name.includes('Growth') 
                ? `${indicator.currentValue.toFixed(1)}%`
                : formatNumber(indicator.currentValue)
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Correlation: {formatPercentage(Math.abs(indicator.correlation))}
            </p>
          </div>
        ))}
      </div>

      {/* Selected Indicator Chart */}
      {selectedIndicator && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedIndicator.name} Trend
            </h3>
            <button
              onClick={loadEconomicData}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
          
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedIndicator.data.slice(-12)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => 
                    selectedIndicator.name.includes('S&P') ? formatNumber(value) : `${value.toFixed(1)}%`
                  }
                />
                <Tooltip 
                  formatter={(value: number) => [
                    selectedIndicator.name.includes('S&P') ? formatNumber(value) : `${value.toFixed(1)}%`,
                    selectedIndicator.name
                  ]}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Impact on Sales</p>
              <p className="text-sm text-gray-600 mt-1">{selectedIndicator.impact}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-700">Recommendation</p>
              <p className="text-sm text-blue-600 mt-1">{selectedIndicator.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* API Integration Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Data Integration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800">Federal Reserve Economic Data (FRED)</h4>
            <p className="text-sm text-green-600 mt-1">
              Consumer Confidence, S&P 500, Unemployment, GDP, Inflation, Federal Funds Rate
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800">Bureau of Economic Analysis (BEA)</h4>
            <p className="text-sm text-blue-600 mt-1">
              Personal Income Growth, Corporate Profits, GDP Components
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-800">Bureau of Labor Statistics (BLS)</h4>
            <p className="text-sm text-purple-600 mt-1">
              Labor Force Participation, Average Hourly Earnings, Job Openings
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Data Sources:</strong> All economic data is sourced directly from official U.S. government agencies 
            to provide the most current economic insights for sales strategy optimization.
          </p>
        </div>
      </div>
    </div>
  );
};