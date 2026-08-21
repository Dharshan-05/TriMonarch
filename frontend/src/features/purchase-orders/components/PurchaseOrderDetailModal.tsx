import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { PurchaseOrder } from '@/services/purchaseOrders.service';
import { PurchaseOrderStatusBadge } from './PurchaseOrderStatusBadge';
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils/formatters';
import { PackageCheck, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PurchaseOrderDetailModalProps {
  order: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!order) return null;

  const subtotalNum = parseFloat(order.subtotal || '0');
  const taxNum = parseFloat(order.tax_amount || '0');
  const discountNum = parseFloat(order.discount_amount || '0');
  const totalNum = parseFloat(order.total_amount || '0');
  const items = order.items || [];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Purchase Order Summary Profile"
      description="Detailed breakdown of procurement order line items, vendor details, and financial totals."
      className="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/purchasing/receipts');
              }}
              className="gap-1.5 text-xs font-semibold"
            >
              <PackageCheck className="h-3.5 w-3.5" /> View Goods Receipts
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/stock-ledger');
              }}
              className="gap-1.5 text-xs font-semibold"
            >
              <History className="h-3.5 w-3.5" /> View Stock Ledger
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2 text-xs max-h-[75vh] overflow-y-auto pr-1">
        {/* Order Header */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface border">
          <div>
            <span className="text-[11px] text-muted-foreground block">Purchase Order Number</span>
            <span className="font-mono font-bold text-base text-foreground">{order.order_number}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-muted-foreground block mb-1">Status</span>
            <PurchaseOrderStatusBadge status={order.status} />
          </div>
        </div>

        {/* Supplier & Date Context */}
        <div className="grid grid-cols-2 gap-3 border p-3 rounded-lg bg-card">
          <div>
            <span className="text-[11px] text-muted-foreground block">Supplier Reference</span>
            <span className="font-semibold text-foreground text-xs block">
              {order.supplier_name || `Supplier ID: ${order.supplier_id}`}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block">Order Date</span>
            <span className="font-mono text-foreground font-semibold block">
              {formatDate(order.order_date)}
            </span>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Procurement Items ({items.length})
          </h4>
          {items.length === 0 ? (
            <div className="p-4 text-center border rounded text-muted-foreground text-xs">
              No line item breakdown available.
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Product / SKU</TableHead>
                    <TableHead align="right">Qty</TableHead>
                    <TableHead align="right">Unit Cost</TableHead>
                    <TableHead align="right">Tax Rate</TableHead>
                    <TableHead align="right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={item.id || idx}>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground">
                            {item.product_name || `Product: ${item.product_id.substring(0, 8)}`}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">{item.sku || item.product_id}</span>
                        </div>
                      </TableCell>
                      <TableCell align="right" className="font-mono text-xs tabular-nums">
                        {formatNumber(parseFloat(item.quantity || '0'))}
                      </TableCell>
                      <TableCell align="right" className="font-mono text-xs tabular-nums">
                        {formatCurrency(parseFloat(item.unit_cost || '0'), order.currency)}
                      </TableCell>
                      <TableCell align="right" className="font-mono text-xs tabular-nums text-muted-foreground">
                        {parseFloat(item.tax_rate || '0')}%
                      </TableCell>
                      <TableCell align="right" className="font-mono text-xs font-bold text-foreground tabular-nums">
                        {formatCurrency(parseFloat(item.line_total || '0'), order.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Financial Breakdown Box */}
        <div className="p-3 border rounded-lg bg-card space-y-1.5 font-mono text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotalNum, order.currency)}</span>
          </div>
          {discountNum > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Discount:</span>
              <span>-{formatCurrency(discountNum, order.currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Tax Amount:</span>
            <span>{formatCurrency(taxNum, order.currency)}</span>
          </div>
          <div className="flex justify-between font-bold text-foreground text-sm border-t pt-1.5">
            <span>Grand Total:</span>
            <span>{formatCurrency(totalNum, order.currency)}</span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="p-3 border rounded-lg bg-muted/20 space-y-1 text-xs">
            <span className="font-semibold text-muted-foreground block">Order Notes:</span>
            <p className="text-foreground">{order.notes}</p>
          </div>
        )}
      </div>
    </Dialog>
  );
};
