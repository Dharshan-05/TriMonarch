import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';
import { navigationConfig } from '@/config/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { env } from '@/app/config/env.config';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const { canAccess, roles } = useAuthorization();

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter navigation groups and items according to current user authorization
  const filteredGroups = navigationConfig
    .map((group) => {
      if (group.access && !canAccess(group.access)) return null;
      const visibleItems = group.items.filter((item) => !item.access || canAccess(item.access));
      if (visibleItems.length === 0) return null;
      return { ...group, items: visibleItems };
    })
    .filter(Boolean);

  const primaryRole = roles[0] || 'ADMIN';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Unified Responsive Sidebar */}
      <aside
        id="app-sidebar"
        aria-label="Sidebar Navigation"
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col h-full bg-surface border-r border-border text-foreground transition-all duration-200 ease-in-out',
          'md:static md:z-auto md:translate-x-0 md:h-screen md:sticky md:top-0 md:flex-shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'w-64 md:w-16' : 'w-64',
        )}
      >
        {/* Sidebar Header / Branding */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-primary flex-shrink-0 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
              M
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-sm tracking-tight truncate">{env.VITE_APP_TITLE}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                    {primaryRole.toLowerCase()}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="md:hidden text-muted-foreground hover:text-foreground p-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Desktop collapse toggle button */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Group Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {filteredGroups.map((group) => group && (
            <div key={group.id} className="space-y-1">
              {!isCollapsed && (
                <h2 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {group.title}
                </h2>
              )}
              <nav aria-label={group.title} className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 768) onClose();
                      }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group relative min-h-[44px] md:min-h-[36px]',
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                        isCollapsed && 'justify-center px-2 md:justify-center',
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {Icon && (
                        <Icon
                          className={cn(
                            'h-4 w-4 flex-shrink-0',
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
                          )}
                        />
                      )}
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                      {item.badge && !isCollapsed && (
                        <span className="ml-auto text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};
