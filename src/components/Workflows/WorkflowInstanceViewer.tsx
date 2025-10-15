import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { WorkflowExecutionEngine } from '../../services/workflowExecutionEngine';
import { WorkflowDefinitionService } from '../../services/workflowDefinitionService';
import { useAuth } from '../../contexts/AuthContext';
import { useUserManagement } from '../../hooks';
import WorkflowProgressIndicator from './WorkflowProgressIndicator';
import DynamicFormRenderer from './DynamicFormRenderer';
import type { WorkflowInstance, WorkflowStep, WorkflowDefinition, WorkflowStatus } from '../../types/workflow';

export default function WorkflowInstanceViewer() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserManagement();

  const [instance, setInstance] = useState<WorkflowInstance | null>(null);
  const [definition, setDefinition] = useState<WorkflowDefinition | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [currentStep, setCurrentStep] = useState<WorkflowStep | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (instanceId) {
      loadWorkflowInstance();
    }
  }, [instanceId]);

  const loadWorkflowInstance = async () => {
    try {
      setLoading(true);
      const instanceData = await WorkflowExecutionEngine.fetchInstance(instanceId!);

      if (!instanceData) {
        alert('Workflow instance not found');
        navigate('/workflows');
        return;
      }

      setInstance(instanceData);

      const definitionData = await WorkflowDefinitionService.fetchWorkflowWithSteps(instanceData.workflow_id);

      if (definitionData) {
        setDefinition(definitionData);
        setSteps(definitionData.steps);

        if (instanceData.current_step_id) {
          const current = definitionData.steps.find((s: WorkflowStep) => s.id === instanceData.current_step_id);
          setCurrentStep(current || null);
        }
      }
    } catch (error) {
      console.error('Error loading workflow instance:', error);
      alert('Failed to load workflow instance');
    } finally {
      setLoading(false);
    }
  };

  const handleStepSubmit = async (data: Record<string, any>) => {
    if (!currentStep || !instance || !user) return;

    try {
      setExecuting(true);
      const result = await WorkflowExecutionEngine.executeStep({
        instanceId: instance.id,
        stepId: currentStep.id,
        inputData: data,
        userId: user.id
      });

      if (result.success) {
        await loadWorkflowInstance();
      } else {
        alert(`Step execution failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error executing step:', error);
      alert('Failed to execute step');
    } finally {
      setExecuting(false);
    }
  };

  const handleCancelWorkflow = async () => {
    if (!instance || !user) return;

    if (!confirm('Are you sure you want to cancel this workflow?')) {
      return;
    }

    try {
      await WorkflowExecutionEngine.cancelWorkflow(instance.id, user.id);
      await loadWorkflowInstance();
    } catch (error) {
      console.error('Error cancelling workflow:', error);
      alert('Failed to cancel workflow');
    }
  };

  const getStatusColor = (status: WorkflowStatus): string => {
    const colors: Record<WorkflowStatus, string> = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting_approval: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: WorkflowStatus) => {
    const icons: Record<WorkflowStatus, any> = {
      pending: Clock,
      in_progress: Clock,
      waiting_approval: AlertCircle,
      completed: CheckCircle,
      failed: XCircle,
      cancelled: XCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!instance || !definition) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Workflow not found</h3>
        <button
          onClick={() => navigate('/workflows')}
          className="text-blue-600 hover:text-blue-700"
        >
          Return to workflows
        </button>
      </div>
    );
  }

  const isInitiator = user && instance && instance.initiator_id === user.id;
  const hasAccess = isAdmin || isInitiator;

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/workflows')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Workflows
          </button>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
          <div className="bg-yellow-100 rounded-full p-4 mx-auto w-20 h-20 flex items-center justify-center mb-4">
            <ShieldAlert className="h-10 w-10 text-yellow-600" />
          </div>
          <h3 className="text-xl font-semibold text-yellow-900 mb-2">Access Denied</h3>
          <p className="text-yellow-800 mb-4">
            You do not have permission to view this workflow instance.
          </p>
          <p className="text-yellow-700 text-sm mb-6">
            Only the workflow initiator and administrators can access workflow instances.
          </p>
          <button
            onClick={() => navigate('/workflows')}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Return to Workflows
          </button>
        </div>
      </div>
    );
  }

  const canExecuteStep = instance.status === 'in_progress' && currentStep && ['form_input', 'approval_gate'].includes(currentStep.step_type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/workflows')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Workflows
        </button>

        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${getStatusColor(instance.status)}`}>
            {getStatusIcon(instance.status)}
            <span className="font-medium capitalize">{instance.status.replace('_', ' ')}</span>
          </div>

          {instance.status === 'in_progress' && (
            <button
              onClick={handleCancelWorkflow}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Cancel Workflow
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{definition.name}</h1>
        <p className="text-gray-600">{definition.description}</p>
      </div>

      <WorkflowProgressIndicator
        steps={steps}
        currentStepId={instance.current_step_id || ''}
        status={instance.status}
      />

      {canExecuteStep && currentStep && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{currentStep.name}</h2>

          <DynamicFormRenderer
            step={currentStep}
            context={instance.context_data}
            onSubmit={handleStepSubmit}
            disabled={executing}
          />
        </div>
      )}

      {instance.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Workflow Completed</h3>
              <p className="text-green-700">All steps have been executed successfully.</p>
            </div>
          </div>
        </div>
      )}

      {instance.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <XCircle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Workflow Failed</h3>
              <p className="text-red-700">
                {instance.metadata.errorMessage || 'An error occurred during execution.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {instance.status === 'cancelled' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <XCircle className="w-8 h-8 text-gray-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Workflow Cancelled</h3>
              <p className="text-gray-700">This workflow was cancelled by the initiator.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
