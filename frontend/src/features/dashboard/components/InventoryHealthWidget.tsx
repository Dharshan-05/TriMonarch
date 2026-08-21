import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryHealthData } from '../types/dashboard.types';
import { Boxes, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatNumber } from '@/lib/utils/formatters';

interface InventoryHealthWidgetProps {
  data?: InventoryHealthData;
  isLoading?: boolean;
  isError?: boolean;
}

export const InventoryHealthWidget: React.FC<InventoryHealthWidgetProps> = ({
  data,
  isLoading = false,
  isError = false,
}) => {
  if (isLoading) {
    return (
      <Card className="shadow-elevation-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40 mb-1" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="shadow-elevation-sm border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Inventory Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Unable to retrieve inventory health metrics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elevation-sm flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" /> Inventory Health Breakdown
          </CardTitle>
          <CardDescription className="text-xs">Stock distribution and reorder priorities</CardDescription>
        </div>
        <Link
          to="/inventory"
          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Status Distribution Badges */}
        <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-lg bg-surface border">
          <div>
            <div className="text-xs text-muted-foreground">In Stock</div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatNumber(data.inStockCount)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Low Stock</div>
            <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
              {formatNumber(data.lowStockCount)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Out of Stock</div>
            <div className="text-lg font-bold font-mono text-destructive">
              {formatNumber(data.outOfStockCount)}
            </div>
          </div>
        </div>

        {/* Low Stock Priority Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Reorder Action Items
          </h4>
          {data.lowStockItems.length === 0 ? (
            <div className="text-center py-6 border rounded-md bg-muted/20">
              <p className="text-xs text-muted-foreground">Inventory levels look healthy across all catalog SKUs.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead align="right">OnHand</TableHead>
                    <TableHead align="center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-medium">{item.sku}</TableCell>
                      <TableCell className="text-xs truncate max-w-[140px]">{item.name}</TableCell>
                      <TableCell align="right" className="font-mono text-xs font-bold">
                        {formatNumber(item.quantity)}
                      </TableCell>
                      <TableCell align="center">
                        <Badge variant={item.status === 'out_of_stock' ? 'out_of_stock' : 'low_stock'}>
                          {item.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
