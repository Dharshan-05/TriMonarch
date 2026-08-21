import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { Container } from '@/components/ui/container';
import { env } from '@/app/config/env.config';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Unhandled Application Error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container className="flex items-center justify-center min-h-[60vh] py-12">
          <div className="w-full max-w-lg">
            <ErrorState
              title="Application Error"
              message="An unexpected client error occurred. Please refresh the page or try again."
              onRetry={this.handleReset}
              retryText="Reload Component"
            />
            {env.VITE_APP_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 border rounded-md bg-muted/50 text-left text-xs font-mono overflow-auto max-h-48">
                <summary className="font-semibold cursor-pointer text-muted-foreground mb-2">
                  Development Diagnostic Details
                </summary>
                <p className="text-destructive font-bold mb-1">
                  {this.state.error.toString()}
                </p>
                <pre className="text-muted-foreground whitespace-pre-wrap">
                  {this.state.errorInfo?.componentStack || this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </Container>
      );
    }

    return this.props.children || null;
  }
}
