'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Bug, X, ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';

interface ErrorInfo {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  stack?: string;
  file?: string;
  line?: number;
  column?: number;
  timestamp: Date;
  count: number;
}

interface ProductionErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ProductionErrorBoundary extends React.Component<
  ProductionErrorBoundaryProps,
  { hasError: boolean; error: Error | null; errorId: string }
> {
  constructor(props: ProductionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorId: '' };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error; errorId: string } {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Report to error tracking service
    this.reportError(error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  reportError = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // In production, send to error tracking service like Sentry
      if (process.env.NODE_ENV === 'production') {
        // await errorTracker.captureException(error, { extra: errorInfo });
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorId: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} reset={this.handleReset} />;
      }

      return (
        <ErrorFallback
          error={this.state.error!}
          errorId={this.state.errorId}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  errorId: string;
  onReset: () => void;
}

function ErrorFallback({ error, errorId, onReset }: ErrorFallbackProps) {
  const [copied, setCopied] = useState(false);

  const copyErrorDetails = async () => {
    const errorDetails = `
Error ID: ${errorId}
Message: ${error.message}
Stack: ${error.stack}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. Error ID: {errorId}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
              Error Details
            </h3>
            <p className="text-red-700 dark:text-red-300 text-sm font-mono">
              {error.message}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onReset} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            
            <Button variant="outline" onClick={copyErrorDetails} className="flex items-center gap-2">
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? 'Copied!' : 'Copy Details'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Reload Page
            </Button>
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
              Technical Details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs overflow-x-auto">
              <pre>{error.stack}</pre>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}

// Error Manager Component for displaying all errors
export function ErrorManager() {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorInfo: ErrorInfo = {
        id: `js_error_${Date.now()}`,
        type: 'error',
        title: 'JavaScript Error',
        message: event.message,
        stack: event.error?.stack,
        file: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: new Date(),
        count: 1,
      };

      setErrors(prev => {
        const existing = prev.find(e => e.message === errorInfo.message && e.file === errorInfo.file);
        if (existing) {
          return prev.map(e => e.id === existing.id ? { ...e, count: e.count + 1, timestamp: new Date() } : e);
        }
        return [errorInfo, ...prev.slice(0, 49)]; // Keep last 50 errors
      });
      
      setIsVisible(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorInfo: ErrorInfo = {
        id: `promise_error_${Date.now()}`,
        type: 'error',
        title: 'Unhandled Promise Rejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date(),
        count: 1,
      };

      setErrors(prev => [errorInfo, ...prev.slice(0, 49)]);
      setIsVisible(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const clearErrors = () => {
    setErrors([]);
    setIsVisible(false);
  };

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  };

  if (!isVisible || errors.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 z-50">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-red-500" />
              <CardTitle className="text-sm">
                Errors ({errors.length})
              </CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={clearErrors}>
                Clear All
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-64">
            <div className="p-3 space-y-2">
              {errors.map((error) => (
                <div
                  key={error.id}
                  className="p-2 border border-red-200 dark:border-red-800 rounded bg-red-50 dark:bg-red-900/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="destructive" className="text-xs">
                          {error.type}
                        </Badge>
                        {error.count > 1 && (
                          <Badge variant="outline" className="text-xs">
                            {error.count}x
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 truncate">
                        {error.title}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 truncate">
                        {error.message}
                      </p>
                      {error.file && (
                        <p className="text-xs text-gray-500 truncate">
                          {error.file}:{error.line}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeError(error.id)}
                      className="shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductionErrorBoundary;