import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className,
  ...props
}) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1.5 text-xs text-muted-foreground', className)}
      {...props}
    >
      <Link
        to="/"
        className="flex items-center hover:text-foreground transition-colors"
        aria-label="Home"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="hover:text-foreground transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-foreground" aria-current="page">
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
