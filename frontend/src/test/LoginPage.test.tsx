import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { authService } from '@/features/auth/services/auth.service';
import { ApiError } from '@/lib/api/errors';

describe('LoginPage UI & Validation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders login form with email and password fields', () => {
    render(
      <QueryProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryProvider>,
    );

    expect(screen.getByLabelText(/work email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('displays field validation errors when submitting empty form', async () => {
    render(
      <QueryProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryProvider>,
    );

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Email address is required')).toBeInTheDocument();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
  });

  it('displays authentication error alert on invalid credentials', async () => {
    vi.spyOn(authService, 'login').mockRejectedValue(
      new ApiError('Invalid email or password', 'INVALID_CREDENTIALS', 'UNAUTHENTICATED', 401),
    );

    render(
      <QueryProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryProvider>,
    );

    const emailInput = screen.getByLabelText(/work email address/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Invalid email address or password.')).toBeInTheDocument();
  });
});
