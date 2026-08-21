import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Label } from './label';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  required?: boolean;
  error?: string;
  description?: string;
  htmlFor?: string;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, required, error, description, htmlFor, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-1.5', className)} {...props}>
        {label && (
          <Label htmlFor={htmlFor} required={required}>
            {label}
          </Label>
        )}
        {children}
        {description && !error && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </div>
    );
  },
);
FormField.displayName = 'FormField';
