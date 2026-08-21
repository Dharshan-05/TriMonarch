import React from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StockLedgerEntry } from '@/services/stockLedger.service';
import { formatDate, formatNumber } from '@/lib/utils/formatters';
import { Eye, ArrowDownRight, ArrowUpRight, Sliders, RefreshCw, FileText } from 'lucide-react';

interface StockLedgerTableProps {
  entries: StockLedgerEntry[];
  isLoading?: boolean;
  onViewDetail: (entry: StockLedgerEntry) => void;
}

export const StockLedgerTable: React.FC<StockLedgerTableProps> = ({
  entries,
  isLoading = false,
  onViewDetail,
}) => {
  const getMovementBadge = (type: string, qtyStr: string) => {
    const qty = parseFloat(qtyStr || '0');
    switch (type) {
      case 'IN':
      case 'RECEIPT':
      case 'PURCHASE':
        return (
          <Badge variant="active" className="text-[10px] gap-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            <ArrowDownRight className="h-3 w-3" /> IN
          </Badge>
        );
      case 'OUT':
      case 'ISSUE':
      case 'SALE':
        return (
          <Badge variant="destructive" className="text-[10px] gap-1">
            <ArrowUpRight className="h-3 w-3" /> OUT
          </Badge>
        );
      case 'ADJUSTMENT':
        return (
          <Badge variant="warning" className="text-[10px] gap-1">
            <Sliders className="h-3 w-3" /> ADJUSTMENT
          </Badge>
        );
      case 'TRANSFER_IN':
      case 'TRANSFER_OUT':
      case 'TRANSFER':
        return (
          <Badge variant="secondary" className="text-[10px] gap-1">
            <RefreshCw className="h-3 w-3" /> {type.replace('_', ' ')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {type || (qty >= 0 ? 'IN' : 'OUT')}
          </Badge>
        );
    }
  };

  const formatSignedQuantity = (qtyStr: string, movementType: string) => {
    const num = parseFloat(qtyStr || '0');
    let prefix = '';

    if (movementType === 'OUT' || movementType === 'TRANSFER_OUT') {
      prefix = '-';
    } else if (movementType === 'IN' || movementType === 'TRANSFER_IN') {
      prefix = '+';
    } else if (num > 0) {
      prefix = '+';
    }

    const formattedVal = formatNumber(Math.abs(num));
    const isNegative = prefix === '-' || num < 0;

    return (
      <span
        className={`font-mono text-xs font-bold tabular-nums ${
          isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
        }`}
      >
        {prefix}
        {formattedVal}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Product / SKU</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Movement Type</TableHead>
              <TableHead align="right">Qty Change</TableHead>
              <TableHead align="right">Balance After</TableHead>
              <TableHead>Reference / Reason</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell align="right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell align="right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell align="right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">No stock ledger entries found</h3>
        <p className="text-xs text-muted-foreground">
          No inventory movement transactions match your active query or context filters.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date / Time</TableHead>
            <TableHead>Product / SKU</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Movement Type</TableHead>
            <TableHead align="right">Qty Change</TableHead>
            <TableHead align="right">Balance After</TableHead>
            <TableHead>Reference / Reason</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="hover:bg-muted/40 transition-colors">
              <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                {formatDate(entry.created_at)}
              </TableCell>

              <TableCell>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs text-foreground truncate">
                    {entry.product_name || `Product: ${entry.product_id.substring(0, 8)}`}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground truncate">
                    {entry.sku || `ID: ${entry.product_id}`}
                  </span>
                </div>
              </TableCell>

              <TableCell className="text-xs text-muted-foreground truncate">
                {entry.warehouse_name || entry.warehouse_id}
              </TableCell>

              <TableCell>{getMovementBadge(entry.movement_type, entry.quantity)}</TableCell>

              <TableCell align="right">
                {formatSignedQuantity(entry.quantity, entry.movement_type)}
              </TableCell>

              <TableCell align="right" className="font-mono text-xs text-foreground tabular-nums">
                {entry.balance_after ? formatNumber(parseFloat(entry.balance_after)) : '—'}
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
                  <span className="truncate">
                    {entry.reference_type ? `${entry.reference_type} #${entry.reference_id || ''}` : entry.notes || entry.reason || 'Manual Adjustment'}
                  </span>
                </div>
              </TableCell>

              <TableCell align="right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetail(entry)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  title="View Audit Detail"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
