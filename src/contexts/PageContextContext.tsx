import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useUserManagement } from '../hooks';
import { ContextTrackingService } from '../services/contextTrackingService';
import type { PageContextData, PageType, PageContext } from '../types/contextAware';

interface PageContextContextType {
  currentContext: PageContextData | null;
  updateContext: (context: Partial<PageContextData>) => void;
  trackContext: (context: PageContextData) => Promise<void>;
  recentContexts: PageContext[];
  contextSummary: string;
}

const PageContextContext = createContext<PageContextContextType | undefined>(undefined);

export function PageContextProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const { organization } = useUserManagement();
  const [currentContext, setCurrentContext] = useState<PageContextData | null>(null);
  const [recentContexts, setRecentContexts] = useState<PageContext[]>([]);

  const inferPageType = useCallback((pathname: string): PageType => {
    if (pathname === '/' || pathname === '/dashboard') return 'dashboard';
    if (pathname.startsWith('/documents')) return 'documents';
    if (pathname.startsWith('/upload')) return 'document_upload';
    if (pathname.startsWith('/users')) return 'employees';
    if (pathname.includes('fundraising')) return 'fundraising';
    if (pathname.includes('grants')) return 'grants';
    if (pathname.includes('donors')) return 'donors';
    if (pathname.includes('campaigns')) return 'campaigns';
    if (pathname.startsWith('/department')) return 'departments';
    if (pathname.startsWith('/operations')) return 'operations';
    if (pathname.startsWith('/workflows')) return 'workflows';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.includes('analytics')) return 'analytics';
    return 'dashboard';
  }, []);

  const updateContext = useCallback((contextUpdate: Partial<PageContextData>) => {
    setCurrentContext(prev => {
      if (!prev) {
        return {
          pageType: inferPageType(location.pathname),
          route: location.pathname,
          timestamp: new Date().toISOString(),
          ...contextUpdate
        };
      }

      return {
        ...prev,
        ...contextUpdate,
        timestamp: new Date().toISOString()
      };
    });
  }, [location.pathname, inferPageType]);

  const trackContext = useCallback(async (context: PageContextData) => {
    if (!user?.id) return;

    await ContextTrackingService.trackPageContext(
      user.id,
      organization?.id,
      context
    );

    const recent = await ContextTrackingService.getRecentContext(user.id);
    setRecentContexts(recent);
  }, [user?.id, organization?.id]);

  useEffect(() => {
    const pageType = inferPageType(location.pathname);
    const newContext: PageContextData = {
      pageType,
      route: location.pathname,
      timestamp: new Date().toISOString()
    };

    setCurrentContext(newContext);

    if (user?.id) {
      trackContext(newContext);
    }
  }, [location.pathname, inferPageType, trackContext, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const loadRecentContexts = async () => {
      const recent = await ContextTrackingService.getRecentContext(user.id);
      setRecentContexts(recent);
    };

    loadRecentContexts();
  }, [user?.id]);

  const contextSummary = ContextTrackingService.buildContextSummary(recentContexts);

  return (
    <PageContextContext.Provider
      value={{
        currentContext,
        updateContext,
        trackContext,
        recentContexts,
        contextSummary
      }}
    >
      {children}
    </PageContextContext.Provider>
  );
}

export function usePageContext() {
  const context = useContext(PageContextContext);
  if (context === undefined) {
    throw new Error('usePageContext must be used within a PageContextProvider');
  }
  return context;
}
