'use client';

import { useState, useEffect } from 'react';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2, Play, Square } from 'lucide-react';
import { Button } from '../ui/button';

interface CompilationStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress: number;
  duration?: number;
  error?: string;
  logs?: string[];
}

interface ProgressCompilationProps {
  steps?: CompilationStep[];
  onStart?: () => void;
  onStop?: () => void;
  onRetry?: (stepId: string) => void;
  isRunning?: boolean;
  totalProgress?: number;
}

const defaultSteps: CompilationStep[] = [
  { id: 'install', name: 'Installing dependencies', status: 'pending', progress: 0 },
  { id: 'lint', name: 'Linting code', status: 'pending', progress: 0 },
  { id: 'typecheck', name: 'Type checking', status: 'pending', progress: 0 },
  { id: 'build', name: 'Building project', status: 'pending', progress: 0 },
  { id: 'test', name: 'Running tests', status: 'pending', progress: 0 },
  { id: 'bundle', name: 'Creating bundle', status: 'pending', progress: 0 },
];

export function ProgressCompilation({
  steps = defaultSteps,
  onStart,
  onStop,
  onRetry,
  isRunning = false,
  totalProgress = 0,
}: ProgressCompilationProps) {
  const [localSteps, setLocalSteps] = useState<CompilationStep[]>(steps);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  // Simulate compilation progress for demonstration
  useEffect(() => {
    if (!isRunning) return;

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex >= localSteps.length) {
        clearInterval(interval);
        return;
      }

      setCurrentStepIndex(stepIndex);
      
      setLocalSteps(prev => 
        prev.map((step, index) => {
          if (index < stepIndex) {
            return { ...step, status: 'completed' as const, progress: 100 };
          } else if (index === stepIndex) {
            const progress = Math.min(100, (Date.now() % 3000) / 30);
            return { 
              ...step, 
              status: 'running' as const, 
              progress 
            };
          }
          return step;
        })
      );

      // Move to next step after some time
      setTimeout(() => {
        setLocalSteps(prev => 
          prev.map((step, index) => 
            index === stepIndex 
              ? { ...step, status: 'completed' as const, progress: 100, duration: Math.random() * 5 + 1 }
              : step
          )
        );
        stepIndex++;
      }, 2000 + Math.random() * 3000);
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, localSteps.length]);

  const getStatusIcon = (status: CompilationStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'skipped':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: CompilationStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'running':
        return 'bg-blue-500';
      case 'skipped':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  };

  const completedSteps = localSteps.filter(step => step.status === 'completed').length;
  const failedSteps = localSteps.filter(step => step.status === 'failed').length;
  const overallProgress = (completedSteps / localSteps.length) * 100;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Compilation Progress
              <Badge variant={isRunning ? 'default' : 'secondary'}>
                {isRunning ? 'Running' : 'Idle'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {completedSteps} of {localSteps.length} steps completed
              {failedSteps > 0 && ` • ${failedSteps} failed`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <Button onClick={onStart} size="sm" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Start
              </Button>
            ) : (
              <Button onClick={onStop} variant="destructive" size="sm" className="flex items-center gap-2">
                <Square className="w-4 h-4" />
                Stop
              </Button>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {localSteps.map((step, index) => (
            <div key={step.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(step.status)}
                  <div>
                    <div className="font-medium text-sm">{step.name}</div>
                    {step.duration && step.status === 'completed' && (
                      <div className="text-xs text-gray-500">
                        Completed in {step.duration.toFixed(1)}s
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {step.status === 'failed' && onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRetry(step.id)}
                    >
                      Retry
                    </Button>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {step.progress}%
                  </Badge>
                </div>
              </div>

              {step.status === 'running' && (
                <div className="ml-8">
                  <Progress value={step.progress} className="h-1" />
                </div>
              )}

              {step.error && (
                <div className="ml-8 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                  {step.error}
                </div>
              )}

              {step.logs && step.logs.length > 0 && (
                <div className="ml-8">
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                      View logs ({step.logs.length} entries)
                    </summary>
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs max-h-32 overflow-y-auto">
                      {step.logs.map((log, logIndex) => (
                        <div key={logIndex}>{log}</div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Progress indicator for smaller spaces
export function CompilationIndicator({
  isRunning,
  progress,
  currentStep,
}: {
  isRunning: boolean;
  progress: number;
  currentStep?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {isRunning ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-gray-600">
            {currentStep || 'Building'} ({progress}%)
          </span>
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">Ready</span>
        </>
      )}
    </div>
  );
}