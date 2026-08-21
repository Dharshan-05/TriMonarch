import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Check } from 'lucide-react';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <label
        className={cn(
          'relative inline-flex items-center justify-center h-5 w-5 rounded border border-input bg-background cursor-pointer select-none transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          checked && 'bg-primary border-primary text-primary-foreground',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          ref={ref}
          {...props}
        />
        {checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
