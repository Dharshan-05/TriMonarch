import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Search, Filter, X } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearchChange?: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  className,
  value,
  onChange,
  onSearchChange,
  placeholder = 'Search records...',
  ...props
}) => {
  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        value={value}
        onChange={(e) => {
          onChange?.(e);
          onSearchChange?.(e.target.value);
        }}
        placeholder={placeholder}
        className="pl-9"
        {...props}
      />
    </div>
  );
};

export interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  value,
  onRemove,
}) => {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground border">
      <span className="text-muted-foreground">{label}:</span>
      <span>{value}</span>
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-muted focus:outline-none"
        aria-label={`Remove filter for ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
};

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  activeFiltersCount?: number;
  onClearFilters?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  activeFiltersCount = 0,
  onClearFilters,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border bg-card shadow-subtle',
        className,
      )}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-3 flex-1">{children}</div>
      {activeFiltersCount > 0 && onClearFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          <Filter className="h-3.5 w-3.5" />
          Clear Filters ({activeFiltersCount})
        </Button>
      )}
    </div>
  );
};
