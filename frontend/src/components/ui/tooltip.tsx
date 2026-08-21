import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  className,
}) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-primary px-2.5 py-1 text-xs text-primary-foreground shadow-md transition-all animate-in fade-in z-50 pointer-events-none',
            className,
          )}
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-primary" />
        </div>
      )}
    </div>
  );
};
