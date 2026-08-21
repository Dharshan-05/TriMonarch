import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Inventory } from '@/services/inventory.service';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';
import { Eye, SlidersHorizontal, Edit3, Trash2, Warehouse, Package, History } from 'lucide-react';
import { formatNumber } from '@/lib/utils/formatters';

interface InventoryTableProps {
  inventory: Inventory[];
  isLoading?: boolean;
  onView: (item: Inventory) => void;
  onAdjust: (item: Inventory) => void;
  onEdit: (item: Inventory) => void;
  onDelete: (item: Inventory) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  inventory,
  isLoading = false,
  onView,
  onAdjust,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuthorization();
  const canAdjust = hasPermission('inventory:adjust') || hasPermission('inventory:write');
  const canWrite = hasPermission('inventory:write');
  const canDelete = hasPermission('inventory:delete');

  const getStockStatusBadge = (qtyStr: string, reorderStr: string) => {
    const qty = parseFloat(qtyStr || '0');
    const reorder = parseFloat(reorderStr || '0');

    if (qty <= 0) {
      return <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>;
    }
    if (reorder > 0 && qty <= reorder) {
      return <Badge variant="warning" className="text-[10px]">Low Stock</Badge>;
    }
    return <Badge variant="active" className="text-[10px]">In Stock</Badge>;
  };

  if (isLoading) {
    return (
      <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU / Product</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead align="right">On Hand Qty</TableHead>
              <TableHead align="right">Reorder Level</TableHead>
              <TableHead>Stock Status</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell align="right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell align="right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell align="right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (inventory.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">No inventory records found</h3>
        <p className="text-xs text-muted-foreground">Try adjusting search parameters or active stock filters.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Identity</TableHead>
            <TableHead>Warehouse / Location</TableHead>
            <TableHead align="right">On Hand Qty</TableHead>
            <TableHead align="right">Reorder Threshold</TableHead>
            <TableHead>Stock Status</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map((item) => {
            const qtyNum = parseFloat(item.quantity || '0');
            const reorderNum = parseFloat(item.reorder_level || '0');

            return (
              <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Package className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {item.product_name || `Product: ${item.product_id.substring(0, 8)}...`}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground truncate">
                        {item.sku || `ID: ${item.product_id}`}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Warehouse className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span className="truncate">{item.warehouse_name || `Warehouse: ${item.warehouse_id.substring(0, 8)}`}</span>
                  </div>
                </TableCell>

                <TableCell align="right" className="font-mono text-xs font-bold text-foreground tabular-nums">
                  {formatNumber(qtyNum)}
                </TableCell>

                <TableCell align="right" className="font-mono text-xs text-muted-foreground tabular-nums">
                  {formatNumber(reorderNum)}
                </TableCell>

                <TableCell>{getStockStatusBadge(item.quantity, item.reorder_level)}</TableCell>

                <TableCell align="right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(item)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/stock-ledger?inventoryId=${item.id}`)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      title="View Movement History"
                    >
                      <History className="h-4 w-4" />
                    </Button>

                    {canAdjust && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAdjust(item)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        title="Adjust Stock Quantity"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    )}

                    {canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        title="Edit Reorder Threshold"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}

                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete Inventory Record"
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
