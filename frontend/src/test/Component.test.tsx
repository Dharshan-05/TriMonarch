import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

describe('Foundation UI Components', () => {
  it('renders Button component with variants', () => {
    render(<Button variant="outline">Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('border');
  });

  it('renders Card hierarchy correctly', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card Title</CardTitle>
        </CardHeader>
        <CardContent>Test Card Body</CardContent>
      </Card>,
    );
    expect(screen.getByText('Test Card Title')).toBeInTheDocument();
    expect(screen.getByText('Test Card Body')).toBeInTheDocument();
  });

  it('renders LoadingState with message', () => {
    render(<LoadingState message="Fetching data..." />);
    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  it('renders ErrorState with retry option', () => {
    render(
      <ErrorState
        title="Failed to Load"
        message="Network error"
        onRetry={() => {}}
      />,
    );
    expect(screen.getByText('Failed to Load')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
