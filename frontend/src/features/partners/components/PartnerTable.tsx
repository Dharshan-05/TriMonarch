import React from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Partner } from '@/services/partners.service';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';
import { Eye, Edit3, Trash2, Building2, ShoppingBag } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';

interface PartnerTableProps {
  partners: Partner[];
  isLoading?: boolean;
  onView: (partner: Partner) => void;
  onEdit: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
}

export const PartnerTable: React.FC<PartnerTableProps> = ({
  partners,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
}) => {
  const { hasPermission } = useAuthorization();
  const canUpdate = hasPermission('partner:update');
  const canDelete = hasPermission('partner:delete');

  const getInitials = (name: string) => {
    if (!name) return 'P';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner Identity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact Info</TableHead>
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
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
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

  if (partners.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">No partners found</h3>
        <p className="text-xs text-muted-foreground">Try clearing search terms or active filters.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Partner Identity</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.map((partner) => {
            const isCustomer = partner.type === 'customer';
            return (
              <TableRow key={partner.id} className="hover:bg-muted/40 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs border ${
                        isCustomer
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                      }`}
                    >
                      {getInitials(partner.name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-foreground truncate">{partner.name}</span>
                      <span className="text-[11px] text-muted-foreground font-mono truncate">
                        {partner.email || 'No email provided'}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={`gap-1.5 capitalize text-[10px] font-semibold ${
                      isCustomer ? 'border-blue-500/30 text-blue-600' : 'border-purple-500/30 text-purple-600'
                    }`}
                  >
                    {isCustomer ? <Building2 className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
                    {partner.type}
                  </Badge>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  <div>{partner.phone || 'No phone'}</div>
                  {partner.address && (
                    <div className="text-[10px] text-muted-foreground/80 truncate max-w-[160px]">
                      {partner.address}
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <Badge variant={partner.status === 'active' ? 'active' : 'secondary'} className="capitalize text-[10px]">
                    {partner.status}
                  </Badge>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground font-mono">
                  {partner.created_at ? formatDate(partner.created_at) : 'N/A'}
                </TableCell>

                <TableCell align="right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(partner)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title="View Partner Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {canUpdate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(partner)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        title="Edit Partner"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}

                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(partner)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete Partner"
                      >
                        <Trash2 className="h-4 w-4" />
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
