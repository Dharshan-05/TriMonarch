import React from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@/services/users.service';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';
import { Eye, Edit3, UserX } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';

interface UserTableProps {
  users: User[];
  isLoading?: boolean;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading = false,
  onView,
  onEdit,
  onDeactivate,
}) => {
  const { hasPermission } = useAuthorization();
  const canUpdate = hasPermission('user:update');
  const canDelete = hasPermission('user:delete');

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'active';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      case 'pending':
        return 'warning';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell align="right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">No users found</h3>
        <p className="text-xs text-muted-foreground">Try clearing filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Identity</TableHead>
            <TableHead>System Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const roleName = user.role || (user.roles && user.roles[0]) || 'EMPLOYEE';
            return (
              <TableRow key={user.id} className="hover:bg-muted/40 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 border border-primary/20">
                      {getInitials(user.name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-foreground truncate">{user.name}</span>
                      <span className="text-[11px] text-muted-foreground font-mono truncate">{user.email}</span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase">
                    {roleName}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge variant={getStatusBadgeVariant(user.status)} className="capitalize text-[10px]">
                    {user.status}
                  </Badge>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground font-mono">
                  {user.created_at ? formatDate(user.created_at) : 'N/A'}
                </TableCell>

                <TableCell align="right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(user)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {canUpdate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(user)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        title="Edit User"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}

                    {canDelete && user.status !== 'inactive' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeactivate(user)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Deactivate User"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
