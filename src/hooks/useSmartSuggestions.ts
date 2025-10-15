import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserManagement } from './index';
import { usePageContext } from '../contexts/PageContextContext';
import { SuggestionGenerationService } from '../services/suggestionGenerationService';
import type { AISuggestion } from '../types/contextAware';

export function useSmartSuggestions() {
  const { user } = useAuth();
  const { organization } = useUserManagement();
  const { currentContext } = usePageContext();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const generateSuggestions = useCallback(async () => {
    if (!user?.id || !currentContext) return;

    setLoading(true);
    try {
      const newSuggestions = await SuggestionGenerationService.generateSuggestions(
        user.id,
        organization?.id,
        currentContext
      );

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, organization?.id, currentContext]);

  const loadActiveSuggestions = useCallback(async () => {
    if (!user?.id || !currentContext) return;

    setLoading(true);
    try {
      const activeSuggestions = await SuggestionGenerationService.getActiveSuggestions(
        user.id,
        currentContext.pageType
      );

      setSuggestions(activeSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentContext]);

  useEffect(() => {
    loadActiveSuggestions();
  }, [loadActiveSuggestions]);

  const markClicked = useCallback(async (suggestionId: string) => {
    await SuggestionGenerationService.markSuggestionClicked(suggestionId);
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  const markDismissed = useCallback(async (suggestionId: string) => {
    await SuggestionGenerationService.markSuggestionDismissed(suggestionId);
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  return {
    suggestions,
    loading,
    generateSuggestions,
    loadActiveSuggestions,
    markClicked,
    markDismissed
  };
}
