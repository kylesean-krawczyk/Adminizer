import { supabase, type Document } from '../lib/supabase';
import { DocumentQueryParser, type ParsedDocumentQuery } from './documentQueryParser';

export interface SearchResult extends Document {
  relevance_score?: number;
  match_highlights?: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  query: ParsedDocumentQuery;
  suggestions?: string[];
  didYouMean?: string;
  relatedDocuments?: SearchResult[];
  searchId?: string;
}

export interface SearchFilters {
  documentType?: string;
  category?: string;
  department?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  author?: string;
  status?: string;
  minSize?: number;
  maxSize?: number;
}

export class DocumentSearchService {
  static async searchDocuments(
    query: string,
    userId?: string,
    organizationId?: string,
    maxResults: number = 50
  ): Promise<SearchResponse> {
    try {
      const parsedQuery = await DocumentQueryParser.parseQuery(query);
      const filters = this.convertParsedQueryToFilters(parsedQuery.parsed);

      let searchResults: SearchResult[] = [];

      if (parsedQuery.parsed.keywords.length > 0 || Object.keys(filters).length > 0) {
        searchResults = await this.executeSearch(
          parsedQuery.parsed.keywords.join(' '),
          filters,
          maxResults
        );
      }

      if (userId && organizationId) {
        await this.recordSearchHistory(
          userId,
          organizationId,
          query,
          parsedQuery.parsed,
          searchResults.length
        );
      }

      const suggestions = searchResults.length === 0
        ? await this.generateSearchSuggestions(parsedQuery.parsed, filters)
        : undefined;

      const relatedDocuments = searchResults.length > 0 && searchResults.length <= 5
        ? await this.findRelatedDocuments(searchResults[0].id, 3)
        : undefined;

      return {
        results: searchResults,
        totalCount: searchResults.length,
        query: parsedQuery.parsed,
        suggestions,
        relatedDocuments
      };
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  static async searchWithFilters(
    filters: SearchFilters,
    _userId?: string,
    _organizationId?: string,
    maxResults: number = 50
  ): Promise<SearchResponse> {
    try {
      const searchResults = await this.executeSearch('', filters, maxResults);

      return {
        results: searchResults,
        totalCount: searchResults.length,
        query: {
          keywords: [],
          documentType: filters.documentType,
          category: filters.category,
          department: filters.department,
          dateRange: filters.dateFrom || filters.dateTo
            ? { startDate: filters.dateFrom, endDate: filters.dateTo }
            : undefined,
          tags: filters.tags,
          author: filters.author,
          confidence: 1.0,
          originalQuery: 'filter-based search'
        }
      };
    } catch (error) {
      console.error('Error searching with filters:', error);
      throw error;
    }
  }

  private static convertParsedQueryToFilters(parsed: ParsedDocumentQuery): SearchFilters {
    const filters: SearchFilters = {};

    if (parsed.documentType) filters.documentType = parsed.documentType;
    if (parsed.category) filters.category = parsed.category;
    if (parsed.department) filters.department = parsed.department;
    if (parsed.dateRange?.startDate) filters.dateFrom = parsed.dateRange.startDate;
    if (parsed.dateRange?.endDate) filters.dateTo = parsed.dateRange.endDate;
    if (parsed.tags && parsed.tags.length > 0) filters.tags = parsed.tags;
    if (parsed.author) filters.author = parsed.author;

    return filters;
  }

  private static async executeSearch(
    searchText: string,
    filters: SearchFilters,
    maxResults: number
  ): Promise<SearchResult[]> {
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .limit(maxResults);

      if (filters.documentType) {
        query = query.eq('document_type', filters.documentType);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.department) {
        query = query.eq('department', filters.department);
      }

      if (filters.author) {
        query = query.eq('author', filters.author);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.dateFrom) {
        query = query.gte('upload_date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('upload_date', filters.dateTo);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.minSize) {
        query = query.gte('size', filters.minSize);
      }

      if (filters.maxSize) {
        query = query.lte('size', filters.maxSize);
      }

      if (searchText && searchText.trim().length > 0) {
        query = query.or(
          `name.ilike.%${searchText}%,` +
          `description.ilike.%${searchText}%,` +
          `tags.cs.{${searchText}},` +
          `indexed_keywords.cs.{${searchText}}`
        );
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(doc => ({
        ...doc,
        relevance_score: this.calculateRelevanceScore(doc, searchText, filters)
      })).sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));

    } catch (error) {
      console.error('Error executing search:', error);
      return [];
    }
  }

  private static calculateRelevanceScore(
    document: Document,
    searchText: string,
    filters: SearchFilters
  ): number {
    let score = 0;

    const searchLower = searchText.toLowerCase();
    const nameLower = document.name.toLowerCase();
    const descLower = (document.description || '').toLowerCase();

    if (nameLower.includes(searchLower)) {
      score += 10;
      if (nameLower.startsWith(searchLower)) {
        score += 5;
      }
    }

    if (descLower.includes(searchLower)) {
      score += 5;
    }

    if (document.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
      score += 8;
    }

    if (document.indexed_keywords?.some(kw => kw.toLowerCase().includes(searchLower))) {
      score += 7;
    }

    if (filters.documentType && document.document_type === filters.documentType) {
      score += 3;
    }

    if (filters.category && document.category === filters.category) {
      score += 3;
    }

    if (filters.department && document.department === filters.department) {
      score += 2;
    }

    const daysSinceUpload = Math.floor(
      (Date.now() - new Date(document.upload_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    const recencyScore = Math.max(0, 5 - daysSinceUpload / 30);
    score += recencyScore;

    return score;
  }

  private static async recordSearchHistory(
    userId: string,
    organizationId: string,
    query: string,
    parsedQuery: ParsedDocumentQuery,
    resultsCount: number
  ): Promise<void> {
    try {
      await supabase.from('document_search_history').insert({
        user_id: userId,
        organization_id: organizationId,
        query,
        extracted_params: parsedQuery,
        results_count: resultsCount
      });
    } catch (error) {
      console.error('Error recording search history:', error);
    }
  }

  private static async generateSearchSuggestions(
    parsedQuery: ParsedDocumentQuery,
    filters: SearchFilters
  ): Promise<string[]> {
    const suggestions: string[] = [];

    if (filters.documentType) {
      suggestions.push(`Try searching for "${filters.documentType}" without other filters`);
    }

    if (filters.category) {
      suggestions.push(`Browse all documents in ${filters.category} category`);
    }

    if (filters.dateFrom || filters.dateTo) {
      suggestions.push('Try expanding the date range');
    }

    if (parsedQuery.keywords.length > 0) {
      suggestions.push(`Search for documents tagged with "${parsedQuery.keywords[0]}"`);
    }

    suggestions.push('View all recent documents');
    suggestions.push('Browse by category');

    try {
      const { data } = await supabase
        .from('documents')
        .select('category, document_type')
        .limit(100);

      if (data && data.length > 0) {
        const categories = [...new Set(data.map(d => d.category))];
        const types = [...new Set(data.map(d => d.document_type).filter(Boolean))];

        if (categories.length > 0 && !filters.category) {
          suggestions.push(`Try searching in ${categories[0]} category`);
        }

        if (types.length > 0 && !filters.documentType) {
          suggestions.push(`Try searching for ${types[0]} documents`);
        }
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }

    return suggestions.slice(0, 5);
  }

  private static async findRelatedDocuments(
    documentId: string,
    limit: number = 3
  ): Promise<SearchResult[]> {
    try {
      const { data: relationships, error: relError } = await supabase
        .from('document_relationships')
        .select('related_document_id, similarity_score')
        .eq('document_id', documentId)
        .order('similarity_score', { ascending: false })
        .limit(limit);

      if (relError || !relationships || relationships.length === 0) {
        return [];
      }

      const relatedIds = relationships.map(r => r.related_document_id);

      const { data: relatedDocs, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .in('id', relatedIds);

      if (docsError || !relatedDocs) {
        return [];
      }

      return relatedDocs.map(doc => {
        const rel = relationships.find(r => r.related_document_id === doc.id);
        return {
          ...doc,
          relevance_score: rel?.similarity_score || 0
        };
      });

    } catch (error) {
      console.error('Error finding related documents:', error);
      return [];
    }
  }

  static async getSuggestionsForUser(
    userId: string,
    limit: number = 5
  ): Promise<string[]> {
    try {
      const { data } = await supabase
        .from('document_search_history')
        .select('query, results_count')
        .eq('user_id', userId)
        .order('search_timestamp', { ascending: false })
        .limit(10);

      if (!data || data.length === 0) {
        return [
          'Recent financial reports',
          'Employee handbooks',
          'Compliance documents',
          'This month\'s documents',
          'All contracts'
        ];
      }

      const successfulSearches = data.filter(s => s.results_count > 0);
      const uniqueQueries = [...new Set(successfulSearches.map(s => s.query))];

      return uniqueQueries.slice(0, limit);

    } catch (error) {
      console.error('Error getting user suggestions:', error);
      return [];
    }
  }

  static async getPopularSearches(limit: number = 5): Promise<string[]> {
    try {
      const { data } = await supabase
        .from('document_search_history')
        .select('query, results_count')
        .gt('results_count', 0)
        .order('search_timestamp', { ascending: false })
        .limit(50);

      if (!data || data.length === 0) {
        return [];
      }

      const queryCounts: Record<string, number> = {};
      data.forEach(item => {
        queryCounts[item.query] = (queryCounts[item.query] || 0) + 1;
      });

      const sortedQueries = Object.entries(queryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([query]) => query);

      return sortedQueries.slice(0, limit);

    } catch (error) {
      console.error('Error getting popular searches:', error);
      return [];
    }
  }
}
