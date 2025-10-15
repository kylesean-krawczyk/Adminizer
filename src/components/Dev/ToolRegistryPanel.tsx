import { useState, useEffect } from 'react';
import { useUserManagement } from '../../hooks';
import { ToolRegistryService } from '../../services/toolRegistryService';
import { Wrench, Search, Filter, CheckCircle, XCircle, AlertCircle, Eye, TestTube } from 'lucide-react';
import type { ToolDefinition, ToolCategory } from '../../types/toolRegistry';
import ToolDetailModal from './ToolDetailModal';
import ToolTestingPanel from './ToolTestingPanel';

export default function ToolRegistryPanel() {
  const { userProfile } = useUserManagement();
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [filteredTools, setFilteredTools] = useState<ToolDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTestingPanel, setShowTestingPanel] = useState(false);
  const [testingTool, setTestingTool] = useState<ToolDefinition | null>(null);

  useEffect(() => {
    if (userProfile?.role !== 'master_admin') {
      return;
    }
    loadTools();
  }, [userProfile?.role]);

  useEffect(() => {
    applyFilters();
  }, [tools, selectedCategory, searchQuery]);

  const loadTools = async () => {
    try {
      setLoading(true);
      const allTools = await ToolRegistryService.fetchAllTools();
      setTools(allTools);
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = tools;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tool => tool.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.slug.toLowerCase().includes(query)
      );
    }

    setFilteredTools(filtered);
  };

  const handleToggleEnabled = async (tool: ToolDefinition) => {
    try {
      await ToolRegistryService.updateTool(tool.id, {
        is_enabled: !tool.is_enabled
      });
      await loadTools();
    } catch (error) {
      console.error('Failed to toggle tool:', error);
    }
  };

  const handleViewDetails = (tool: ToolDefinition) => {
    setSelectedTool(tool);
    setShowDetailModal(true);
  };

  const handleTestTool = (tool: ToolDefinition) => {
    setTestingTool(tool);
    setShowTestingPanel(true);
  };

  const getCategoryColor = (category: ToolCategory): string => {
    const colors: Record<ToolCategory, string> = {
      documents: 'bg-blue-100 text-blue-800',
      employees: 'bg-green-100 text-green-800',
      reports: 'bg-orange-100 text-orange-800',
      system: 'bg-red-100 text-red-800',
      analytics: 'bg-cyan-100 text-cyan-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getPermissionColor = (level: string): string => {
    const colors: Record<string, string> = {
      master_admin: 'bg-red-50 text-red-700 border border-red-200',
      admin: 'bg-orange-50 text-orange-700 border border-orange-200',
      user: 'bg-green-50 text-green-700 border border-green-200',
      public: 'bg-gray-50 text-gray-700 border border-gray-200'
    };
    return colors[level] || 'bg-gray-50 text-gray-700';
  };

  if (userProfile?.role !== 'master_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only Master Administrators can access the Tool Registry.</p>
        </div>
      </div>
    );
  }

  const categories: Array<{ value: ToolCategory | 'all'; label: string }> = [
    { value: 'all', label: 'All Tools' },
    { value: 'documents', label: 'Documents' },
    { value: 'employees', label: 'Employees' },
    { value: 'reports', label: 'Reports' },
    { value: 'system', label: 'System' },
    { value: 'analytics', label: 'Analytics' }
  ];

  const stats = {
    total: tools.length,
    enabled: tools.filter(t => t.is_enabled).length,
    disabled: tools.filter(t => !t.is_enabled).length,
    requiresConfirmation: tools.filter(t => t.requires_confirmation).length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Wrench className="w-8 h-8 text-gray-700" />
              <h1 className="text-3xl font-bold text-gray-900">AI Tool Registry</h1>
            </div>
          </div>
          <p className="text-gray-600">
            Manage and monitor AI tools available to the assistant
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Total Tools</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Enabled</div>
            <div className="text-2xl font-bold text-green-600">{stats.enabled}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Disabled</div>
            <div className="text-2xl font-bold text-red-600">{stats.disabled}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Requires Confirmation</div>
            <div className="text-2xl font-bold text-orange-600">{stats.requiresConfirmation}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as ToolCategory | 'all')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tools...</p>
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tools found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map(tool => (
              <div key={tool.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">{tool.name}</h3>
                    {tool.is_enabled ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 ml-2" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" />
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{tool.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(tool.category)}`}>
                      {tool.category}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPermissionColor(tool.permission_level)}`}>
                      {tool.permission_level.replace('_', ' ')}
                    </span>
                    {tool.requires_confirmation && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Requires Confirmation
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    Slug: <code className="bg-gray-100 px-1 py-0.5 rounded">{tool.slug}</code>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(tool)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </button>
                    <button
                      onClick={() => handleTestTool(tool)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <TestTube className="w-4 h-4" />
                      Test
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleEnabled(tool)}
                    className={`w-full mt-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                      tool.is_enabled
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {tool.is_enabled ? 'Disable Tool' : 'Enable Tool'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDetailModal && selectedTool && (
        <ToolDetailModal
          tool={selectedTool}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTool(null);
          }}
        />
      )}

      {showTestingPanel && testingTool && (
        <ToolTestingPanel
          tool={testingTool}
          onClose={() => {
            setShowTestingPanel(false);
            setTestingTool(null);
          }}
        />
      )}
    </div>
  );
}
