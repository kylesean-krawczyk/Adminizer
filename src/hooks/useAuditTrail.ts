import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuditTrailService } from '../services/auditTrailService';
import type {
  PermissionAuditEntryWithDetails,
  AuditTrailFilters
} from '../types/permissions';

export function useAuditTrail(initialFilters?: AuditTrailFilters) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PermissionAuditEntryWithDetails[]>([]);
  const [filters, setFilters] = useState<AuditTrailFilters | undefined>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total_entries: number;
    entries_today: number;
    grants_today: number;
    revokes_today: number;
    denials_today: number;
  }>({
    total_entries: 0,
    entries_today: 0,
    grants_today: 0,
    revokes_today: 0,
    denials_today: 0
  });

  const loadAuditTrail = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, total: totalCount, error: fetchError } = await AuditTrailService.fetchAuditTrail(
        filters,
        page,
        pageSize
      );

      if (fetchError) {
        throw new Error(fetchError);
      }

      setEntries(data);
      setTotal(totalCount);
    } catch (err) {
      console.error('Error loading audit trail:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  }, [user?.id, filters, page, pageSize]);

  const loadStats = useCallback(async () => {
    try {
      const auditStats = await AuditTrailService.getAuditStats();
      setStats(auditStats);
    } catch (err) {
      console.error('Error loading audit stats:', err);
    }
  }, []);

  useEffect(() => {
    loadAuditTrail();
    loadStats();
  }, [loadAuditTrail, loadStats]);

  useEffect(() => {
    if (!user?.id) return;

    const subscription = AuditTrailService.subscribeToAuditTrail(() => {
      loadAuditTrail();
      loadStats();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, loadAuditTrail, loadStats]);

  const exportToCSV = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { success, csv, error: exportError } = await AuditTrailService.exportAuditTrailCSV(filters);

      if (!success || !csv) {
        return { success: false, error: exportError || 'Failed to export' };
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `audit-trail-${timestamp}.csv`;

      AuditTrailService.downloadCSV(csv, filename);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export audit trail';
      return { success: false, error: errorMessage };
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: AuditTrailFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(undefined);
    setPage(1);
  }, []);

  const nextPage = useCallback(() => {
    if (page * pageSize < total) {
      setPage(p => p + 1);
    }
  }, [page, pageSize, total]);

  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage(p => p - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    const maxPage = Math.ceil(total / pageSize);
    if (newPage >= 1 && newPage <= maxPage) {
      setPage(newPage);
    }
  }, [total, pageSize]);

  const refreshAuditTrail = useCallback(() => {
    loadAuditTrail();
    loadStats();
  }, [loadAuditTrail, loadStats]);

  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    entries,
    filters,
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    loading,
    error,
    stats,
    exportToCSV,
    updateFilters,
    clearFilters,
    nextPage,
    previousPage,
    goToPage,
    refreshAuditTrail
  };
}
