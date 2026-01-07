'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8 bg-white dark:bg-clio-gray-950">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-black text-clio-gray-900 dark:text-white uppercase tracking-tight">
                Something went wrong
              </h2>
              <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium">
                We encountered an unexpected error. Please try again or contact support.
              </p>
              {this.state.error && (
                <details className="mt-6 text-left group">
                  <summary className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 cursor-pointer hover:text-clio-gray-600 dark:hover:text-clio-gray-200 transition-colors">
                    Technical details
                  </summary>
                  <pre className="mt-3 text-xs font-mono text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-100 dark:border-red-900/20 overflow-auto max-h-40">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                onClick={this.handleReset} 
                className="bg-clio-blue hover:bg-clio-blue-hover text-white font-black uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-clio-blue/20"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.href = '/dashboard/quotes'} 
                variant="outline"
                className="border-clio-gray-200 dark:border-clio-gray-800 text-clio-gray-900 dark:text-white font-black uppercase tracking-widest h-12 px-8 rounded-xl hover:bg-clio-gray-50 dark:hover:bg-clio-gray-900"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
