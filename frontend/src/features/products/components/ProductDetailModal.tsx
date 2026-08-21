import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/services/products.service';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, isOpen, onClose }) => {
  if (!product) return null;

  const priceNum = parseFloat(product.price || '0');
  const costNum = parseFloat(product.cost || '0');
  const taxRateNum = (parseFloat(product.tax_rate || '0') * 100).toFixed(2);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Product Master Record"
      description="Detailed ERP SKU parameters, pricing, and master data specifications."
      className="max-w-md"
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4 py-2 text-xs">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border">
          <div className="h-10 w-10 rounded bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 border border-primary/20">
            {product.sku.substring(0, 4).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground truncate">{product.name}</span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {product.sku}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground truncate">
              {product.category || 'Uncategorized Category'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border p-3 rounded-lg bg-card">
          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Unit of Measure</span>
            <span className="font-mono font-semibold text-foreground uppercase">{product.unit || 'pcs'}</span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-1">Status</span>
            <Badge variant={product.status === 'active' ? 'active' : 'secondary'} className="capitalize text-[10px]">
              {product.status}
            </Badge>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Selling Price</span>
            <span className="font-mono font-bold text-foreground text-sm">{formatCurrency(priceNum)}</span>
            <span className="text-[10px] text-muted-foreground block font-mono">
              (Raw: {product.price || '0.0000'})
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Unit Cost</span>
            <span className="font-mono font-bold text-foreground text-sm">{formatCurrency(costNum)}</span>
            <span className="text-[10px] text-muted-foreground block font-mono">
              (Raw: {product.cost || '0.0000'})
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Tax Rate</span>
            <span className="font-mono font-medium text-foreground">{taxRateNum}%</span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Organization ID</span>
            <span className="font-mono text-[10px] text-foreground truncate block">
              {product.organization_id || 'System Default'}
            </span>
          </div>

          {product.description && (
            <div className="col-span-2 pt-1 border-t">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Description</span>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}

          <div className="col-span-2 pt-1 border-t flex justify-between text-[11px] text-muted-foreground font-mono">
            <span>Created: {product.created_at ? formatDate(product.created_at) : 'N/A'}</span>
            <span>Updated: {product.updated_at ? formatDate(product.updated_at) : 'N/A'}</span>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
