import React from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Product } from '@/services/products.service';
import { useAuthorization } from '@/features/authorization/hooks/useAuthorization';
import { Eye, Edit3, Trash2, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';

interface ProductTableProps {
  products: Product[];
  isLoading?: boolean;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
}) => {
  const { hasPermission } = useAuthorization();
  const canWrite = hasPermission('product:write');

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'active';
      case 'inactive':
        return 'secondary';
      case 'discontinued':
        return 'destructive';
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
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead align="right">Selling Price</TableHead>
              <TableHead align="right">Cost Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell align="right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell align="right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell align="right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">No products found</h3>
        <p className="text-xs text-muted-foreground">Try clearing search terms or active category filters.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Product Identity</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>UOM</TableHead>
            <TableHead align="right">Selling Price</TableHead>
            <TableHead align="right">Unit Cost</TableHead>
            <TableHead>Status</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const priceNum = parseFloat(product.price || '0');
            const costNum = parseFloat(product.cost || '0');

            return (
              <TableRow key={product.id} className="hover:bg-muted/40 transition-colors">
                <TableCell>
                  <Badge variant="outline" className="font-mono text-[11px] bg-muted/30 border-muted-foreground/30">
                    {product.sku}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Package className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-foreground truncate">{product.name}</span>
                      {product.description && (
                        <span className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                          {product.description}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground font-medium">
                  {product.category || 'Uncategorized'}
                </TableCell>

                <TableCell className="text-xs text-muted-foreground font-mono">
                  {product.unit || 'pcs'}
                </TableCell>

                <TableCell align="right" className="font-mono text-xs font-semibold text-foreground tabular-nums">
                  {formatCurrency(priceNum)}
                </TableCell>

                <TableCell align="right" className="font-mono text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(costNum)}
                </TableCell>

                <TableCell>
                  <Badge variant={getStatusBadgeVariant(product.status)} className="capitalize text-[10px]">
                    {product.status}
                  </Badge>
                </TableCell>

                <TableCell align="right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(product)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title="View Product Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(product)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        title="Edit Product"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}

                    {canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(product)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete Product"
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
