import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider, useToast, ToastContainer } from '@/features/notifications';
import { formatApiError } from '@/lib/api/error-formatter';
import { ApiError } from '@/lib/api/errors';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';

const TestComponent: React.FC = () => {
  const { notify } = useToast();
  return (
    <div className="space-y-2">
      <button onClick={() => notify.success('Product created', 'Success Title')}>Trigger Success</button>
      <button onClick={() => notify.error('Validation failed', 'Error Title')}>Trigger Error</button>
      <button onClick={() => notify.warning('Low stock warning')}>Trigger Warning</button>
      <button onClick={() => notify.info('System update notice')}>Trigger Info</button>
    </div>
  );
};

describe('Phase 099 — Centralized Notifications & UX Suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders ToastProvider and emits success, error, warning, and info notifications', () => {
    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('Trigger Success'));
    expect(screen.getByText('Success Title')).toBeInTheDocument();
    expect(screen.getByText('Product created')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Trigger Error'));
    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Validation failed')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Trigger Warning'));
    expect(screen.getByText('Low stock warning')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Trigger Info'));
    expect(screen.getByText('System update notice')).toBeInTheDocument();
  });

  it('automatically dismisses toasts after specified duration', () => {
    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('Trigger Success'));
    expect(screen.getByText('Product created')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4500);
    });

    expect(screen.queryByText('Product created')).not.toBeInTheDocument();
  });

  it('manually dismisses toast when dismiss button is clicked', () => {
    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('Trigger Error'));
    expect(screen.getByText('Validation failed')).toBeInTheDocument();

    const dismissBtn = screen.getByLabelText('Dismiss notification');
    fireEvent.click(dismissBtn);

    expect(screen.queryByText('Validation failed')).not.toBeInTheDocument();
  });

  it('normalizes HTTP status codes into human-readable enterprise messaging with formatApiError', () => {
    const err400 = new ApiError('SKU field required', 'BAD_REQUEST', 'VALIDATION_ERROR', 400);
    expect(formatApiError(err400)).toEqual({
      title: 'Invalid Request',
      message: 'SKU field required',
      category: 'VALIDATION_ERROR',
      status: 400,
    });

    const err403 = new ApiError('Forbidden', 'FORBIDDEN', 'UNAUTHORIZED', 403);
    expect(formatApiError(err403)).toEqual({
      title: 'Access Denied',
      message: 'You do not have permission to perform this action.',
      category: 'UNAUTHORIZED',
      status: 403,
    });

    const err409 = new ApiError('Duplicate SKU', 'CONFLICT', 'CONFLICT', 409);
    expect(formatApiError(err409)).toEqual({
      title: 'Conflict Detected',
      message: 'Duplicate SKU',
      category: 'CONFLICT',
      status: 409,
    });

    const dbErr = new ApiError('PostgreSQL error: duplicate key value violates unique constraint', 'DB_ERR', 'SERVER_ERROR', 500);
    const formattedDb = formatApiError(dbErr);
    expect(formattedDb.message).not.toContain('PostgreSQL');
    expect(formattedDb.message).toContain('duplicate');
  });

  it('renders standardized ConfirmationModal primitive', () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <ConfirmationModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Cancel Purchase Order"
        description="Are you sure you want to cancel PO-2026-001?"
        confirmLabel="Yes, Cancel Order"
      />,
    );

    expect(screen.getByText('Cancel Purchase Order')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to cancel PO-2026-001?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Yes, Cancel Order'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Cancel'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('disables ConfirmationModal buttons during pending loading state to prevent double submission', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete Record"
        description="Are you sure?"
        isLoading={true}
      />,
    );

    const confirmBtn = screen.getByRole('button', { name: /Processing.../i });
    expect(confirmBtn).toBeDisabled();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    expect(cancelBtn).toBeDisabled();
  });

  it('renders ErrorState and LoadingState UI primitives with accessibility roles', () => {
    render(
      <div>
        <LoadingState message="Fetching audit logs..." />
        <ErrorState title="Failed to Load" message="Server connection lost" />
      </div>,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Fetching audit logs...')).toBeInTheDocument();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to Load')).toBeInTheDocument();
    expect(screen.getByText('Server connection lost')).toBeInTheDocument();
  });
});
