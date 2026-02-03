import React from 'react';
import { SalesAnalysisResult } from '../../types';
import { MetricsCard } from './MetricsCard';
import { SalesChart } from './SalesChart';
import { RetentionChart } from './RetentionChart';
import { EnhancedForecastCard } from './EnhancedForecastCard';
import { CorrelationAnalysis } from './CorrelationAnalysis';
import { AIDialogBox } from './AIDialogBox';
import { Users, DollarSign, TrendingUp, ShoppingCart, Brain } from 'lucide-react';
import { formatNumber, formatCurrency, formatPercentage } from '../../utils/helpers';

interface DashboardProps {
  analysis: SalesAnalysisResult;
  customerData: any[];
}

export const Dashboard: React.FC<DashboardProps> = ({ analysis, customerData }) => {
  const [enhancedAnalysis, setEnhancedAnalysis] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const loadEnhancedAnalysis = async () => {
      setLoading(true);
      try {
        const enhanced = {
          ...analysis,
          enhancedForecast: {
            ...analysis.forecast,
            economicFactors: {
              consumerConfidence: 0.05,
              marketPerformance: 0.03,
              unemploymentImpact: -0.02,
              gdpGrowthImpact: 0.04
            },
            adjustedPredictions: {
              nextMonth: {
                baseAmount: analysis.forecast.nextMonth.predictedAmount,
                economicAdjustment: analysis.forecast.nextMonth.predictedAmount * 0.08,
                finalAmount: analysis.forecast.nextMonth.predictedAmount * 1.08,
                confidence: Math.min(0.95, analysis.forecast.nextMonth.confidence + 0.05)
              },
              nextQuarter: {
                baseAmount: analysis.forecast.nextQuarter.predictedAmount,
                economicAdjustment: analysis.forecast.nextQuarter.predictedAmount * 0.06,
                finalAmount: analysis.forecast.nextQuarter.predictedAmount * 1.06,
                confidence: Math.min(0.95, analysis.forecast.nextQuarter.confidence + 0.03)
              }
            }
          }
        };
        setEnhancedAnalysis(enhanced);
      } catch (error) {
        console.error('Failed to load enhanced analysis:', error);
        setEnhancedAnalysis(analysis);
      } finally {
        setLoading(false);
      }
    };

    loadEnhancedAnalysis();
  }, [analysis]);

  return (
    <div className="space-y-6 relative">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Customers"
          value={formatNumber(analysis.totalCustomers)}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <MetricsCard
          title="Total Revenue"
          value={formatCurrency(analysis.totalAmount)}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />
        <MetricsCard
          title="Average Sale"
          value={formatCurrency(analysis.averageSale)}
          icon={<TrendingUp className="w-6 h-6" />}
          color="purple"
        />
        <MetricsCard
          title="Total Sales"
          value={formatNumber(analysis.saleCount)}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trends</h3>
          <SalesChart data={analysis.monthlyTrends} />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Retention</h3>
          <RetentionChart data={analysis.customerRetention} />
        </div>
      </div>

      {/* Forecast Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ) : enhancedAnalysis?.enhancedForecast ? (
            <EnhancedForecastCard forecast={enhancedAnalysis.enhancedForecast} />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-500">Enhanced forecast unavailable</p>
            </div>
          )}
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-800">Customer Retention Rate</span>
                <span className="text-lg font-bold text-blue-900">
                  {formatPercentage(analysis.customerRetention.retentionRate)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-800">Average Sale Size</span>
                <span className="text-lg font-bold text-green-900">
                  {formatCurrency(analysis.averageSale)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-purple-800">Total Sales</span>
                <span className="text-lg font-bold text-purple-900">
                  {formatNumber(analysis.saleCount)}
                </span>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  View detailed customer profiles in the <strong>All Customers</strong> tab
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Economic Correlation Analysis */}
      <div>
        <CorrelationAnalysis monthlyTrends={analysis.monthlyTrends} />
      </div>

      {/* AI Dialog Box */}
      <AIDialogBox 
        customerData={customerData}
        isOpen={isAIDialogOpen}
        onClose={() => setIsAIDialogOpen(false)}
      />

      {/* AI Assistant Button */}
      {!isAIDialogOpen && (
        <button
          onClick={() => setIsAIDialogOpen(true)}
          className="fixed top-20 right-4 z-40 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
          title="Open AI Assistant"
        >
          <Brain className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};