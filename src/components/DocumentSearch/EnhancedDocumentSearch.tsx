import { useState } from 'react';
import { Search, Filter, X, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { DocumentSearchService, type SearchFilters } from '../../services/documentSearchService';
import { DocumentQueryParser } from '../../services/documentQueryParser';
import type { Document } from '../../lib/supabase';

interface SearchResult extends Document {
  relevance_score?: number;
}

interface EnhancedDocumentSearchProps {
  onSelectDocument?: (document: Document) => void;
  organizationId?: string;
  userId?: string;
}

export const EnhancedDocumentSearch = ({
  onSelectDocument,
  organizationId,
  userId
}: EnhancedDocumentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [searchSummary, setSearchSummary] = useState<string>('');

  const documentTypes = [
    'invoice', 'contract', 'report', 'policy', 'handbook', 'manual',
    'guideline', 'presentation', 'spreadsheet', 'form', 'checklist',
    'certificate', 'agreement', 'memo', 'letter', 'proposal', 'other'
  ];

  const categories = [
    'HR', 'Accounting', 'Branding', 'Social Media', 'Communications',
    'Volunteer/People Management', 'Streaming: Video & Podcast', 'Reports',
    'Governance', 'Legal', 'Funding', 'Financial', 'Operations', 'Other'
  ];

  const departments = [
    'Finance', 'Human Resources', 'Marketing', 'Sales', 'Operations',
    'IT', 'Legal', 'Administration', 'Executive', 'Customer Service'
  ];

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setSuggestions([]);
    setSearchSummary('');

    try {
      const response = await DocumentSearchService.searchDocuments(
        searchTerm,
        userId,
        organizationId,
        50
      );

      setSearchResults(response.results);

      if (response.results.length === 0 && response.suggestions) {
        setSuggestions(response.suggestions);
      }

      const parsedQuery = await DocumentQueryParser.parseQuery(searchTerm);
      if (parsedQuery.parsed.confidence < 0.6 && parsedQuery.clarificationQuestions) {
        setSuggestions(parsedQuery.clarificationQuestions);
      }

      const summary = generateSearchSummary(response.results.length, searchTerm, parsedQuery.parsed);
      setSearchSummary(summary);

      if (userId && !recentSearches.includes(searchTerm)) {
        setRecentSearches(prev => [searchTerm, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([
        'Try a simpler search query',
        'Check your spelling',
        'Browse documents by category'
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const generateSearchSummary = (count: number, query: string, parsed: any): string => {
    if (count === 0) {
      return `No documents found for "${query}". Try the suggestions below or adjust your filters.`;
    }

    const parts = [`Found ${count} document${count === 1 ? '' : 's'}`];

    if (parsed.documentType) parts.push(`of type "${parsed.documentType}"`);
    if (parsed.category) parts.push(`in "${parsed.category}"`);
    if (parsed.dateRange?.startDate) parts.push(`since ${parsed.dateRange.startDate}`);

    return parts.join(' ') + '.';
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setActiveFilters((prev: SearchFilters) => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilter = (filterType: keyof SearchFilters) => {
    setActiveFilters((prev: SearchFilters) => {
      const updated = { ...prev };
      delete updated[filterType];
      return updated;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({});
  };

  const applyFilters = async () => {
    if (Object.keys(activeFilters).length === 0) return;

    setIsSearching(true);
    try {
      const response = await DocumentSearchService.searchWithFilters(
        activeFilters,
        userId,
        organizationId,
        50
      );
      setSearchResults(response.results);
      setSearchSummary(`Applied ${Object.keys(activeFilters).length} filter${Object.keys(activeFilters).length > 1 ? 's' : ''}.`);
    } catch (error) {
      console.error('Filter error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const loadUserSuggestions = async () => {
    if (userId) {
      const userSuggestions = await DocumentSearchService.getSuggestionsForUser(userId, 5);
      setRecentSearches(userSuggestions);
    }

    const popular = await DocumentSearchService.getPopularSearches(5);
    setPopularSearches(popular);
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Document Search</h3>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search with natural language (e.g., 'find Q3 financial report from last year')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {Object.keys(activeFilters).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-gray-600 self-center">Active filters:</span>
            {Object.entries(activeFilters).map(([key, value]) =>
              value ? (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  <span className="capitalize">{key}:</span>
                  <span className="font-medium">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                  <button
                    onClick={() => clearFilter(key as keyof SearchFilters)}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : null
            )}
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-700 underline"
            >
              Clear all
            </button>
          </div>
        )}

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <select
                value={activeFilters.documentType || ''}
                onChange={(e) => handleFilterChange('documentType', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {documentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={activeFilters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={activeFilters.department || ''}
                onChange={(e) => handleFilterChange('department', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={activeFilters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={activeFilters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {!searchQuery && recentSearches.length === 0 && popularSearches.length === 0 && (
          <button
            onClick={loadUserSuggestions}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Show search suggestions
          </button>
        )}

        {!searchQuery && recentSearches.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Recent Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(search)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {!searchQuery && popularSearches.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Popular Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(search)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {searchSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">{searchSummary}</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">Suggestions:</h4>
          <ul className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-yellow-800">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-medium text-gray-900">
              Search Results ({searchResults.length})
            </h4>
          </div>
          <div className="divide-y divide-gray-200">
            {searchResults.map((doc) => (
              <div
                key={doc.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onSelectDocument?.(doc)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-1">{doc.name}</h5>
                    {doc.description && (
                      <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {doc.category}
                      </span>
                      {doc.document_type && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                          {doc.document_type}
                        </span>
                      )}
                      {doc.department && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
                          {doc.department}
                        </span>
                      )}
                      <span className="text-gray-500">{formatFileSize(doc.size)}</span>
                      <span className="text-gray-500">
                        {new Date(doc.upload_date).toLocaleDateString()}
                      </span>
                      {doc.relevance_score !== undefined && doc.relevance_score > 0 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          Relevance: {Math.round(doc.relevance_score * 10) / 10}
                        </span>
                      )}
                    </div>
                    {doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
