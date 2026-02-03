import { X, Sparkles } from 'lucide-react';
import type { AISuggestion } from '../../types/contextAware';

interface SuggestionChipsProps {
  suggestions: AISuggestion[];
  onSuggestionClick: (suggestion: AISuggestion) => void;
  onDismiss: (suggestionId: string) => void;
}

export default function SuggestionChips({
  suggestions,
  onSuggestionClick,
  onDismiss
}: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-blue-100">
      <div className="flex items-start space-x-2 mb-2">
        <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <span className="text-xs font-medium text-blue-900">
          Suggested based on this page
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSuggestionClick(suggestion)}
            className="group relative inline-flex items-center space-x-2 px-3 py-1.5 bg-white border border-blue-200 rounded-full text-sm text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow"
          >
            <span className="text-xs">{suggestion.suggestion_text}</span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(suggestion.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-blue-100 rounded-full"
              aria-label="Dismiss suggestion"
            >
              <X className="w-3 h-3" />
            </button>

            {suggestion.priority >= 8 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-2 italic">
        Click a suggestion to ask, or dismiss if not relevant
      </p>
    </div>
  );
}
