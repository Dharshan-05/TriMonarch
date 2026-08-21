import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { QueryProvider } from '@/app/providers/QueryProvider';

describe('Router Foundation', () => {
  it('renders HomePage on root path', () => {
    render(
      <QueryProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </MemoryRouter>
      </QueryProvider>,
    );
    expect(
      screen.getByText(/Frontend Foundation Architecture/i),
    ).toBeInTheDocument();
  });

  it('renders NotFoundPage on unmapped path', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <Routes>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText(/404 — Page Not Found/i)).toBeInTheDocument();
  });
});
