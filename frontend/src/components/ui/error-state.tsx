import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils/cn';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
  retryText = 'Try Again',
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-lg border border-destructive/20 bg-destructive/5',
        className,
      )}
      role="alert"
      {...props}
    >
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h4 className="mt-3 text-base font-semibold text-foreground">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground max-w-md">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="mt-4 gap-2 border-destructive/30 hover:bg-destructive/10"
        >
          <RefreshCw className="h-4 w-4" />
          {retryText}
        </Button>
      )}
    </div>
  );
};
