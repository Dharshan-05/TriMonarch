import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center text-muted-foreground',
        className,
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <Loader2 className={cn('animate-spin text-primary', sizeMap[size])} />
      {message && <p className="mt-3 text-sm font-medium">{message}</p>}
      <span className="sr-only">Loading content</span>
    </div>
  );
};
