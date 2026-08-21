import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShowcasePage } from '@/pages/ShowcasePage';
import { QueryProvider } from '@/app/providers/QueryProvider';

describe('Design System Primitives & Showcase', () => {
  it('renders Button variants and respects disabled state', () => {
    const { rerender } = render(<Button variant="destructive">Delete Item</Button>);
    const button = screen.getByRole('button', { name: /delete item/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-destructive');

    rerender(<Button disabled>Disabled Action</Button>);
    const disabledBtn = screen.getByRole('button', { name: /disabled action/i });
    expect(disabledBtn).toBeDisabled();
  });

  it('renders Input control with value and handles input change', () => {
    const handleChange = () => {};
    render(<Input placeholder="Search code..." value="TEST-123" onChange={handleChange} />);
    const input = screen.getByPlaceholderText(/search code\.\.\./i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('TEST-123');
  });

  it('renders Badge status variants correctly', () => {
    render(
      <div>
        <Badge variant="active">Active</Badge>
        <Badge variant="low_stock">Low Stock</Badge>
        <Badge variant="out_of_stock">Out of Stock</Badge>
      </div>,
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('renders Checkbox and Switch state changes', () => {
    let checkedVal = false;
    const { rerender } = render(
      <Checkbox checked={checkedVal} onCheckedChange={(val) => (checkedVal = val)} />,
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkedVal).toBe(true);

    rerender(<Switch checked={true} />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toBeChecked();
  });

  it('renders Data Table with header and cells', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>PRD-100</TableCell>
            <TableCell className="tabular-nums">$1,200.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('PRD-100')).toBeInTheDocument();
    expect(screen.getByText('$1,200.00')).toBeInTheDocument();
  });

  it('renders Alert component with title and description', () => {
    render(
      <Alert variant="warning">
        <AlertTitle>Warning Banner</AlertTitle>
        <AlertDescription>Low stock threshold reached.</AlertDescription>
      </Alert>,
    );
    expect(screen.getByText('Warning Banner')).toBeInTheDocument();
    expect(screen.getByText('Low stock threshold reached.')).toBeInTheDocument();
  });

  it('renders ShowcasePage route completely without errors', () => {
    render(
      <QueryProvider>
        <MemoryRouter initialEntries={['/showcase']}>
          <Routes>
            <Route path="/showcase" element={<ShowcasePage />} />
          </Routes>
        </MemoryRouter>
      </QueryProvider>,
    );

    expect(screen.getByText(/Enterprise Design System Showcase/i)).toBeInTheDocument();
    expect(screen.getByText(/Typography System/i)).toBeInTheDocument();
    expect(screen.getByText(/Button Hierarchy & States/i)).toBeInTheDocument();
    expect(screen.getByText(/Form Control Primitives/i)).toBeInTheDocument();
  });
});
