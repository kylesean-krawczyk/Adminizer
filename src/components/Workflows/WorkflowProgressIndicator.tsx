import { CheckCircle, Circle, Clock, XCircle } from 'lucide-react';
import type { WorkflowStep, WorkflowStatus } from '../../types/workflow';

interface WorkflowProgressIndicatorProps {
  steps: WorkflowStep[];
  currentStepId: string;
  status: WorkflowStatus;
}

export default function WorkflowProgressIndicator({ steps, currentStepId, status }: WorkflowProgressIndicatorProps) {
  const sortedSteps = [...steps].sort((a, b) => a.step_order - b.step_order);
  const currentStepIndex = sortedSteps.findIndex(s => s.id === currentStepId);

  const getStepStatus = (index: number): 'completed' | 'current' | 'pending' | 'failed' => {
    if (status === 'failed' && index === currentStepIndex) {
      return 'failed';
    }

    if (index < currentStepIndex) {
      return 'completed';
    }

    if (index === currentStepIndex && status === 'in_progress') {
      return 'current';
    }

    return 'pending';
  };

  const getStepIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'current':
        return <Clock className="w-6 h-6 text-blue-600 animate-pulse" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Circle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStepColor = (stepStatus: string): string => {
    switch (stepStatus) {
      case 'completed':
        return 'border-green-600 bg-green-50';
      case 'current':
        return 'border-blue-600 bg-blue-50';
      case 'failed':
        return 'border-red-600 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getConnectorColor = (index: number): string => {
    if (index < currentStepIndex) {
      return 'bg-green-600';
    }
    return 'bg-gray-300';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Workflow Progress</h2>

      <div className="relative">
        {sortedSteps.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const isLast = index === sortedSteps.length - 1;

          return (
            <div key={step.id} className="relative">
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getStepColor(stepStatus)}`}>
                    {getStepIcon(stepStatus)}
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 h-16 mt-2 ${getConnectorColor(index)}`}></div>
                  )}
                </div>

                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-semibold ${stepStatus === 'current' ? 'text-blue-900' : 'text-gray-900'}`}>
                        Step {step.step_order}: {step.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {step.step_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {stepStatus === 'completed' && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          Completed
                        </span>
                      )}
                      {stepStatus === 'current' && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          In Progress
                        </span>
                      )}
                      {stepStatus === 'failed' && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                          Failed
                        </span>
                      )}
                      {stepStatus === 'pending' && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {step.timeout_minutes && (
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>Timeout: {step.timeout_minutes} minutes</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {sortedSteps.filter((_, i) => i < currentStepIndex).length}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {status === 'in_progress' ? '1' : '0'}
            </p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {sortedSteps.filter((_, i) => i > currentStepIndex).length}
            </p>
            <p className="text-sm text-gray-600">Remaining</p>
          </div>
        </div>
      </div>
    </div>
  );
}
