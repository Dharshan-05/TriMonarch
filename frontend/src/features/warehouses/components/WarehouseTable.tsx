import React from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Warehouse } from '@/services/warehouses.service';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';
import { formatDate } from '@/lib/utils/formatters';
import { Eye, Edit3, Warehouse as WarehouseIcon, MapPin, Boxes } from 'lucide-react';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';
import { useNavigate } from 'react-router-dom';

interface WarehouseTableProps {
  warehouses: Warehouse[];
  isLoading?: boolean;
  onView: (warehouse: Warehouse) => void;
  onEdit: (warehouse: Warehouse) => void;
}

export const WarehouseTable: React.FC<WarehouseTableProps> = ({
  warehouses,
  isLoading = false,
  onView,
  onEdit,
}) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuthorization();
  const canWrite = hasPermission('inventory:write');

  if (isLoading) {
    return (
      <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Facility Name</TableHead>
              <TableHead>Location Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell align="right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (warehouses.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">No warehouse facilities found</h3>
        <p className="text-xs text-muted-foreground">Try adjusting search parameters or facility status filters.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Warehouse Code</TableHead>
            <TableHead>Facility Name</TableHead>
            <TableHead>Location Reference</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {warehouses.map((wh) => (
            <TableRow key={wh.id} className="hover:bg-muted/40 transition-colors">
              <TableCell className="font-mono text-xs font-bold text-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <WarehouseIcon className="h-3.5 w-3.5" />
                  </div>
                  <span>{wh.code}</span>
                </div>
              </TableCell>

              <TableCell className="font-semibold text-xs text-foreground truncate">
                {wh.name}
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
                  <span className="truncate">{wh.location || 'Location Not Specified'}</span>
                </div>
              </TableCell>

              <TableCell>
                <WarehouseStatusBadge status={wh.status} />
              </TableCell>

              <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                {formatDate(wh.created_at)}
              </TableCell>

              <TableCell align="right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(wh)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    title="View Facility Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/inventory?warehouseId=${wh.id}`)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                    title="View Warehouse Inventory"
                  >
                    <Boxes className="h-4 w-4" />
                  </Button>

                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(wh)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      title="Edit Warehouse Parameters"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
