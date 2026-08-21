import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/features/auth/context/auth-context';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';
import { env } from '@/app/config/env.config';
import { Menu, LogOut, User as UserIcon, Shield } from 'lucide-react';

export const ApplicationShell: React.FC = () => {
  const { user, logout } = useAuth();
  const { roles } = useAuthorization();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const primaryRole = roles[0] || 'ADMIN';

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:font-bold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header boundary */}
        <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Container className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="app-sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight hidden sm:inline">
                  {env.VITE_APP_TITLE}
                </span>
                <span className="text-xs rounded-full bg-primary/10 px-2.5 py-0.5 text-primary font-medium">
                  Phase 100
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                  <UserIcon className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground hidden sm:inline">{user.email}</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                    <Shield className="h-3 w-3 mr-1 text-primary inline" />
                    {primaryRole}
                  </Badge>
                </div>
              )}
              <ThemeToggle />
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-destructive min-h-[36px]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              )}
            </div>
          </Container>
        </header>

        {/* Main Content Body */}
        <main id="main-content" tabIndex={-1} className="flex-1 py-8 focus:outline-none">
          <Container>
            <Outlet />
          </Container>
        </main>

        {/* Footer */}
        <footer className="border-t py-4 text-center text-xs text-muted-foreground bg-surface mt-auto">
          <Container className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} Mini ERP System. Role Authorization Active.</p>
            <div className="flex items-center gap-4">
              <Link to="/showcase" className="hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
                UI Showcase
              </Link>
              <span className="font-mono">Env: {env.VITE_APP_ENV}</span>
            </div>
          </Container>
        </footer>
      </div>
    </div>
  );
};
