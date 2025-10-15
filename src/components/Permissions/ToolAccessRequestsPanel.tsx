import { useState } from 'react';
import { Clock, AlertTriangle, User, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useToolAccessRequests } from '../../hooks/useToolAccessRequests';
import RequestReviewModal from './RequestReviewModal';
import type { ToolAccessRequestWithDetails } from '../../types/permissions';

export default function ToolAccessRequestsPanel() {
  const {
    requests,
    urgentRequests,
    highPriorityRequests,
    normalPriorityRequests,
    lowPriorityRequests,
    loading,
    approveRequest,
    denyRequest,
    bulkApprove,
    bulkDeny
  } = useToolAccessRequests();

  const [selectedRequest, setSelectedRequest] = useState<ToolAccessRequestWithDetails | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkAction, setBulkAction] = useState<'approve' | 'deny' | null>(null);
  const [bulkComment, setBulkComment] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const handleReviewClick = (request: ToolAccessRequestWithDetails) => {
    setSelectedRequest(request);
    setShowReviewModal(true);
  };

  const handleToggleSelection = (requestId: string) => {
    const newSelection = new Set(selectedRequests);
    if (newSelection.has(requestId)) {
      newSelection.delete(requestId);
    } else {
      newSelection.add(requestId);
    }
    setSelectedRequests(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedRequests.size === filteredRequests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(filteredRequests.map(r => r.id)));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedRequests.size === 0 || bulkComment.length < 10) {
      return;
    }

    setBulkProcessing(true);

    try {
      const requestIds = Array.from(selectedRequests);

      if (bulkAction === 'approve') {
        await bulkApprove(requestIds, bulkComment);
      } else {
        await bulkDeny(requestIds, bulkComment);
      }

      setSelectedRequests(new Set());
      setBulkAction(null);
      setBulkComment('');
    } catch (error) {
      console.error('Error processing bulk action:', error);
    } finally {
      setBulkProcessing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getAgeInDays = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    const matchesSearch = !searchTerm ||
      request.user_profile?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.tool?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (loading) {
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Urgent</p>
              <p className="text-2xl font-bold text-red-900">{urgentRequests.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">High Priority</p>
              <p className="text-2xl font-bold text-orange-900">{highPriorityRequests.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Normal</p>
              <p className="text-2xl font-bold text-blue-900">{normalPriorityRequests.length}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Priority</p>
              <p className="text-2xl font-bold text-gray-900">{lowPriorityRequests.length}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {selectedRequests.size > 0 && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedRequests.size} request{selectedRequests.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <select
                    value={bulkAction || ''}
                    onChange={(e) => setBulkAction(e.target.value as 'approve' | 'deny')}
                    className="px-3 py-1 border border-blue-300 rounded text-sm"
                    disabled={bulkProcessing}
                  >
                    <option value="">Select action...</option>
                    <option value="approve">Bulk Approve</option>
                    <option value="deny">Bulk Deny</option>
                  </select>
                  {bulkAction && (
                    <>
                      <input
                        type="text"
                        placeholder="Review comment (10 char min)..."
                        value={bulkComment}
                        onChange={(e) => setBulkComment(e.target.value)}
                        className="px-3 py-1 border border-blue-300 rounded text-sm min-w-[200px]"
                        disabled={bulkProcessing}
                      />
                      <button
                        onClick={handleBulkAction}
                        disabled={bulkProcessing || bulkComment.length < 10}
                        className={`px-3 py-1 rounded text-sm text-white ${
                          bulkAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                        } disabled:opacity-50`}
                      >
                        {bulkProcessing ? 'Processing...' : 'Confirm'}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedRequests(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No access requests found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedRequests.size === filteredRequests.length && filteredRequests.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Tool</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Priority</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Requested</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Age</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => {
                  const age = getAgeInDays(request.created_at);
                  const isOld = age > 7;

                  return (
                    <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedRequests.has(request.id)}
                          onChange={() => handleToggleSelection(request.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.user_profile?.full_name || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">{request.user_profile?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-900">{request.tool?.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{request.tool?.category}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(request.priority)}`}>
                          {request.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(request.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm ${isOld ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {age} day{age !== 1 ? 's' : ''}
                          {isOld && ' 🔴'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {request.status === 'pending' ? (
                          <button
                            onClick={() => handleReviewClick(request)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Review
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedRequest && (
        <RequestReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onApprove={approveRequest}
          onDeny={denyRequest}
        />
      )}
    </div>
  );
}
