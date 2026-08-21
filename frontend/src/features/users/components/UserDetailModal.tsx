import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User } from '@/services/users.service';
import { formatDate } from '@/lib/utils/formatters';

interface UserDetailModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, isOpen, onClose }) => {
  if (!user) return null;

  const roleName = user.role || (user.roles && user.roles[0]) || 'EMPLOYEE';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="User Account Profile"
      description="Detailed information for system account user identity and access rights."
      className="max-w-md"
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4 py-2 text-xs">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0 border border-primary/20">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-foreground truncate">{user.name}</span>
            <span className="text-xs text-muted-foreground font-mono truncate">{user.email}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border p-3 rounded-lg bg-card">
          <div>
            <span className="text-[11px] text-muted-foreground block mb-1">System Role</span>
            <Badge variant="outline" className="font-semibold uppercase tracking-wider text-[10px]">
              {roleName}
            </Badge>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block mb-1">Account Status</span>
            <Badge variant={user.status === 'active' ? 'active' : 'secondary'} className="capitalize text-[10px]">
              {user.status}
            </Badge>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Phone Number</span>
            <span className="font-medium text-foreground">{user.phone || 'Not provided'}</span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Organization ID</span>
            <span className="font-mono text-[10px] text-foreground truncate block">
              {user.organization_id || 'System Default'}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Created Date</span>
            <span className="font-mono text-foreground">{user.created_at ? formatDate(user.created_at) : 'N/A'}</span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Last Updated</span>
            <span className="font-mono text-foreground">{user.updated_at ? formatDate(user.updated_at) : 'N/A'}</span>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
