import { useState, useEffect } from 'react';
import { Plus, Play, Clock, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { WorkflowDefinitionService } from '../../services/workflowDefinitionService';
import { WorkflowExecutionEngine } from '../../services/workflowExecutionEngine';
import { useAuth } from '../../contexts/AuthContext';
import { useUserManagement } from '../../hooks';
import { useNavigate } from 'react-router-dom';
import type { WorkflowDefinition, WorkflowCategory } from '../../types/workflow';

export default function WorkflowListPage() {
  const { user } = useAuth();
  const { isAdmin } = useUserManagement();
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<WorkflowCategory | 'all'>('all');
  const [initiatingWorkflow, setInitiatingWorkflow] = useState<string | null>(null);

  const categories: Array<{ value: WorkflowCategory | 'all'; label: string }> = [
    { value: 'all', label: 'All Workflows' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'approval', label: 'Approvals' },
    { value: 'operations', label: 'Operations' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'custom', label: 'Custom' }
  ];

  useEffect(() => {
    loadWorkflows();
  }, [selectedCategory]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const filters = selectedCategory !== 'all' ? { category: selectedCategory, isActive: true } : { isActive: true };
      const data = await WorkflowDefinitionService.fetchAllWorkflows(filters);
      setWorkflows(data);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkflow = async (workflowId: string) => {
    if (!user?.organizationId) {
      alert('Organization ID not found');
      return;
    }

    try {
      setInitiatingWorkflow(workflowId);
      const result = await WorkflowExecutionEngine.createInstance(
        { workflowId },
        user.id,
        user.organizationId
      );

      window.location.href = `/workflows/instance/${result.instanceId}`;
    } catch (error) {
      console.error('Error starting workflow:', error);
      alert(`Failed to start workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setInitiatingWorkflow(null);
    }
  };

  const getCategoryColor = (category: WorkflowCategory): string => {
    const colors: Record<WorkflowCategory, string> = {
      onboarding: 'bg-blue-100 text-blue-800',
      approval: 'bg-green-100 text-green-800',
      operations: 'bg-orange-100 text-orange-800',
      compliance: 'bg-red-100 text-red-800',
      analytics: 'bg-indigo-100 text-indigo-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: WorkflowCategory) => {
    const icons: Record<WorkflowCategory, any> = {
      onboarding: Plus,
      approval: CheckCircle,
      operations: Clock,
      compliance: AlertCircle,
      analytics: Clock,
      custom: Clock
    };
    const Icon = icons[category] || Clock;
    return <Icon className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
            <p className="mt-2 text-gray-600">Automate multi-step processes with intelligent workflows</p>
          </div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
          <div className="bg-yellow-100 rounded-full p-4 mx-auto w-20 h-20 flex items-center justify-center mb-4">
            <ShieldAlert className="h-10 w-10 text-yellow-600" />
          </div>
          <h3 className="text-xl font-semibold text-yellow-900 mb-2">Access Restricted</h3>
          <p className="text-yellow-800 mb-4">
            Employee onboarding workflows are restricted to administrators and managers.
          </p>
          <p className="text-yellow-700 text-sm">
            If you need access to this feature, please contact your organization administrator.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
          <p className="mt-2 text-gray-600">Automate multi-step processes with intelligent workflows</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows available</h3>
          <p className="text-gray-600">
            {selectedCategory === 'all'
              ? 'No active workflows found'
              : `No active workflows in the ${selectedCategory} category`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map(workflow => (
            <div
              key={workflow.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(workflow.category)}`}>
                    {getCategoryIcon(workflow.category)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${getCategoryColor(workflow.category)}`}>
                      {workflow.category}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{workflow.description}</p>

              {workflow.metadata.estimatedDuration && (
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Est. {workflow.metadata.estimatedDuration}</span>
                </div>
              )}

              <button
                onClick={() => handleStartWorkflow(workflow.id)}
                disabled={initiatingWorkflow === workflow.id}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {initiatingWorkflow === workflow.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Start Workflow</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
