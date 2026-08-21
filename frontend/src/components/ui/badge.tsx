import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground border-border',

        /* Enterprise Status Variants */
        success:
          'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium',
        warning:
          'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium',
        info:
          'border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300 font-medium',

        active:
          'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium',
        pending:
          'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium',
        approved:
          'border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300 font-medium',
        draft:
          'border-transparent bg-muted text-muted-foreground font-medium',
        processing:
          'border-transparent bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-medium',
        completed:
          'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium',
        cancelled:
          'border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-300 font-medium',
        low_stock:
          'border-transparent bg-orange-500/15 text-orange-700 dark:text-orange-300 font-medium',
        out_of_stock:
          'border-transparent bg-red-500/15 text-red-700 dark:text-red-300 font-medium',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.2 text-[10px]',
        lg: 'px-3 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants };
