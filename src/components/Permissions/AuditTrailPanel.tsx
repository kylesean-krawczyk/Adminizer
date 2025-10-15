import { useState } from 'react';
import { Download, Search, Filter, ChevronLeft, ChevronRight, FileText, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useAuditTrail } from '../../hooks/useAuditTrail';
import { AuditTrailService } from '../../services/auditTrailService';
import type { AuditTrailFilters } from '../../types/permissions';

export default function AuditTrailPanel() {
  const [filters, setFilters] = useState<AuditTrailFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDenialsOnly, setShowDenialsOnly] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const {
    entries,
    page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    loading,
    stats,
    exportToCSV,
    updateFilters,
    nextPage,
    previousPage,
    goToPage
  } = useAuditTrail(filters);

  const handleSearch = () => {
    const newFilters: AuditTrailFilters = {};

    if (actionFilter !== 'all') {
      newFilters.action_type = actionFilter as any;
    }

    if (dateFrom) {
      newFilters.date_from = new Date(dateFrom).toISOString();
    }

    if (dateTo) {
      newFilters.date_to = new Date(dateTo).toISOString();
    }

    if (showDenialsOnly) {
      newFilters.show_denials_only = true;
    }

    setFilters(newFilters);
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setDateFrom('');
    setDateTo('');
    setShowDenialsOnly(false);
    setFilters({});
    updateFilters({});
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToCSV();
    } catch (error) {
      console.error('Error exporting audit trail:', error);
    } finally {
      setExporting(false);
    }
  };

  const toggleRowExpansion = (entryId: string) => {
    setExpandedRow(expandedRow === entryId ? null : entryId);
  };

  const filteredEntries = entries.filter(entry => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      entry.user_profile?.email?.toLowerCase().includes(term) ||
      entry.user_profile?.full_name?.toLowerCase().includes(term) ||
      entry.tool?.name?.toLowerCase().includes(term) ||
      entry.performer_profile?.email?.toLowerCase().includes(term)
    );
  });

  if (loading && entries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Entries</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total_entries}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Grants Today</p>
              <p className="text-2xl font-bold text-green-900">{stats.grants_today}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Revokes Today</p>
              <p className="text-2xl font-bold text-red-900">{stats.revokes_today}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Denials Today</p>
              <p className="text-2xl font-bold text-orange-900">{stats.denials_today}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 border-b border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">All Actions</option>
                <option value="grant">Grant</option>
                <option value="revoke">Revoke</option>
                <option value="request">Request</option>
                <option value="approve">Approve</option>
                <option value="deny">Deny</option>
                <option value="expire">Expire</option>
                <option value="check_denied">Check Denied</option>
                <option value="check_allowed">Check Allowed</option>
              </select>
            </div>

            <input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showDenialsOnly}
                  onChange={(e) => setShowDenialsOnly(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">Show denials only</span>
              </label>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredEntries.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No audit entries found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Date/Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Tool</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Action</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Performed By</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <>
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm:ss')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.user_profile?.full_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">{entry.user_profile?.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">{entry.tool?.name || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${AuditTrailService.getActionTypeColor(entry.action_type)}`}>
                          {AuditTrailService.formatActionType(entry.action_type)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {entry.performer_profile?.email || 'System'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleRowExpansion(entry.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {expandedRow === entry.id ? 'Hide' : 'View'}
                        </button>
                      </td>
                    </tr>
                    {expandedRow === entry.id && (
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td colSpan={6} className="py-4 px-4">
                          <div className="space-y-3 text-sm">
                            {entry.reason && (
                              <div>
                                <span className="font-medium text-gray-700">Reason: </span>
                                <span className="text-gray-600">{entry.reason}</span>
                              </div>
                            )}
                            {entry.ip_address && (
                              <div>
                                <span className="font-medium text-gray-700">IP Address: </span>
                                <span className="text-gray-600">{entry.ip_address}</span>
                              </div>
                            )}
                            {entry.permission_before && (
                              <div>
                                <span className="font-medium text-gray-700">Before: </span>
                                <span className="text-gray-600">
                                  {JSON.stringify(entry.permission_before)}
                                </span>
                              </div>
                            )}
                            {entry.permission_after && (
                              <div>
                                <span className="font-medium text-gray-700">After: </span>
                                <span className="text-gray-600">
                                  {JSON.stringify(entry.permission_after)}
                                </span>
                              </div>
                            )}
                            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                              <div>
                                <span className="font-medium text-gray-700">Metadata: </span>
                                <pre className="mt-1 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(entry.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={previousPage}
                disabled={!hasPreviousPage}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 border rounded text-sm ${
                      page === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={nextPage}
                disabled={!hasNextPage}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
