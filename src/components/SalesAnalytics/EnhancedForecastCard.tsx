import React from 'react';
import { EnhancedSalesForecastData } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils/helpers';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface EnhancedForecastCardProps {
  forecast: EnhancedSalesForecastData;
}

export const EnhancedForecastCard: React.FC<EnhancedForecastCardProps> = ({ forecast }) => {
  const getTrendIcon = () => {
    switch (forecast.trendDirection) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (forecast.trendDirection) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAdjustmentColor = (adjustment: number) => {
    if (adjustment > 0) return 'text-green-600';
    if (adjustment < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Enhanced Sales Forecast</h3>
        <div className="flex items-center space-x-1">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {forecast.trendDirection}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Next Month Forecast */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-800">Next Month</span>
            <span className="text-xs text-blue-600">
              {formatPercentage(forecast.adjustedPredictions.nextMonth.confidence)} confidence
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Base Prediction:</span>
              <span className="text-sm font-medium text-blue-900">
                {formatCurrency(forecast.adjustedPredictions.nextMonth.baseAmount)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Economic Adjustment:</span>
              <span className={`text-sm font-medium ${getAdjustmentColor(forecast.adjustedPredictions.nextMonth.economicAdjustment)}`}>
                {forecast.adjustedPredictions.nextMonth.economicAdjustment >= 0 ? '+' : ''}
                {formatCurrency(forecast.adjustedPredictions.nextMonth.economicAdjustment)}
              </span>
            </div>
            
            <div className="border-t border-blue-200 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-blue-800">Final Prediction:</span>
                <span className="text-lg font-bold text-blue-900">
                  {formatCurrency(forecast.adjustedPredictions.nextMonth.finalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Quarter Forecast */}
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-purple-800">Next Quarter</span>
            <span className="text-xs text-purple-600">
              {formatPercentage(forecast.adjustedPredictions.nextQuarter.confidence)} confidence
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Base Prediction:</span>
              <span className="text-sm font-medium text-purple-900">
                {formatCurrency(forecast.adjustedPredictions.nextQuarter.baseAmount)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Economic Adjustment:</span>
              <span className={`text-sm font-medium ${getAdjustmentColor(forecast.adjustedPredictions.nextQuarter.economicAdjustment)}`}>
                {forecast.adjustedPredictions.nextQuarter.economicAdjustment >= 0 ? '+' : ''}
                {formatCurrency(forecast.adjustedPredictions.nextQuarter.economicAdjustment)}
              </span>
            </div>
            
            <div className="border-t border-purple-200 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-purple-800">Final Prediction:</span>
                <span className="text-lg font-bold text-purple-900">
                  {formatCurrency(forecast.adjustedPredictions.nextQuarter.finalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Economic Factors Impact */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Economic Factors Impact</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Consumer Confidence:</span>
              <span className={getAdjustmentColor(forecast.economicFactors.consumerConfidence)}>
                {(forecast.economicFactors.consumerConfidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Market Performance:</span>
              <span className={getAdjustmentColor(forecast.economicFactors.marketPerformance)}>
                {(forecast.economicFactors.marketPerformance * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Unemployment Impact:</span>
              <span className={getAdjustmentColor(forecast.economicFactors.unemploymentImpact)}>
                {(forecast.economicFactors.unemploymentImpact * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">GDP Growth Impact:</span>
              <span className={getAdjustmentColor(forecast.economicFactors.gdpGrowthImpact)}>
                {(forecast.economicFactors.gdpGrowthImpact * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          Enhanced forecast incorporates real-time economic indicators from Federal Reserve 
          and Bureau of Labor Statistics data to improve prediction accuracy.
        </p>
      </div>
    </div>
  );
};