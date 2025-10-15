import { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, Target, Zap } from 'lucide-react';

interface ReasoningDisplayProps {
  reasoning?: string;
  toolsConsidered?: string[];
  toolsSelected?: string[];
  confidence?: number;
  intent?: string;
  compact?: boolean;
}

export default function ReasoningDisplay({
  reasoning,
  toolsConsidered,
  toolsSelected,
  confidence,
  intent,
  compact = false
}: ReasoningDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  if (!reasoning && !toolsConsidered && !toolsSelected && !intent) {
    return null;
  }

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600 bg-green-100';
    if (conf >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">AI Reasoning & Decision Process</span>
          {confidence !== undefined && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getConfidenceColor(confidence)}`}>
              {Math.round(confidence * 100)}% confidence
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-blue-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-blue-600" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {intent && (
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Detected Intent
                </span>
              </div>
              <p className="text-sm text-gray-700">{intent}</p>
            </div>
          )}

          {reasoning && (
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Decision Process
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{reasoning}</p>
            </div>
          )}

          {(toolsConsidered && toolsConsidered.length > 0) && (
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Tools Considered
              </p>
              <div className="flex flex-wrap gap-2">
                {toolsConsidered.map(tool => {
                  const isSelected = toolsSelected?.includes(tool);
                  return (
                    <span
                      key={tool}
                      className={`text-xs px-2 py-1 rounded-md ${
                        isSelected
                          ? 'bg-green-100 text-green-700 font-medium border border-green-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {tool}
                      {isSelected && ' ✓'}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {(toolsSelected && toolsSelected.length > 0 && !toolsConsidered) && (
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Selected Tools
              </p>
              <div className="flex flex-wrap gap-2">
                {toolsSelected.map(tool => (
                  <span
                    key={tool}
                    className="text-xs px-2 py-1 rounded-md bg-green-100 text-green-700 font-medium border border-green-300"
                  >
                    {tool} ✓
                  </span>
                ))}
              </div>
            </div>
          )}

          {confidence !== undefined && (
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Confidence Level
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      confidence >= 0.8 ? 'bg-green-500' : confidence >= 0.6 ? 'bg-yellow-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700 min-w-[3rem] text-right">
                  {Math.round(confidence * 100)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {confidence >= 0.8 && 'High confidence in tool selection'}
                {confidence >= 0.6 && confidence < 0.8 && 'Moderate confidence in tool selection'}
                {confidence < 0.6 && 'Lower confidence - consider rephrasing for better results'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
