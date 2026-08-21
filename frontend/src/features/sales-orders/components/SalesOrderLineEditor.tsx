import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { DraftOrderLine } from '../types/sales-orders.types';
import { useProductsQuery } from '@/hooks/queries/use-products-query';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';

interface SalesOrderLineEditorProps {
  lines: DraftOrderLine[];
  onLinesChange: (lines: DraftOrderLine[]) => void;
  currency?: string;
}

export const SalesOrderLineEditor: React.FC<SalesOrderLineEditorProps> = ({
  lines,
  onLinesChange,
  currency = 'USD',
}) => {
  const { data: productsData } = useProductsQuery({ pageSize: 100 });
  const productsList = productsData?.data || [];

  const handleAddLine = () => {
    const newLine: DraftOrderLine = {
      id: `line-${Date.now()}-${Math.random()}`,
      product_id: '',
      quantity: '1.0000',
      unit_price: '0.0000',
      tax_rate: '0.000000',
      discount_amount: '0.0000',
      tax_amount: '0.0000',
      line_total: '0.0000',
    };
    onLinesChange([...lines, newLine]);
  };

  const handleRemoveLine = (index: number) => {
    const updated = lines.filter((_, i) => i !== index);
    onLinesChange(updated);
  };

  const handleUpdateLine = (index: number, updatedFields: Partial<DraftOrderLine>) => {
    const updated = [...lines];
    const current = { ...updated[index]!, ...updatedFields };

    // If product selection changed, autofill product details and price if available
    if (updatedFields.product_id) {
      const selectedProd = productsList.find((p) => p.id === updatedFields.product_id);
      if (selectedProd) {
        current.product_name = selectedProd.name;
        current.sku = selectedProd.sku;
        if (selectedProd.price) {
          current.unit_price = selectedProd.price;
        }
      }
    }

    // Recalculate line subtotal, tax amount, and line total decimal strings
    const qtyNum = parseFloat(current.quantity || '0');
    const priceNum = parseFloat(current.unit_price || '0');
    const discountNum = parseFloat(current.discount_amount || '0');
    const taxRateNum = parseFloat(current.tax_rate || '0');

    const subtotal = Math.max(0, qtyNum * priceNum - discountNum);
    const taxVal = subtotal * (taxRateNum / 100);
    const totalVal = subtotal + taxVal;

    current.tax_amount = taxVal.toFixed(4);
    current.line_total = totalVal.toFixed(4);

    updated[index] = current;
    onLinesChange(updated);
  };

  // Compute Order Financial Totals
  let calculatedSubtotal = 0;
  let calculatedTax = 0;
  let calculatedTotal = 0;

  lines.forEach((l) => {
    const qtyNum = parseFloat(l.quantity || '0');
    const priceNum = parseFloat(l.unit_price || '0');
    const discountNum = parseFloat(l.discount_amount || '0');
    const taxRateNum = parseFloat(l.tax_rate || '0');

    const subtotal = Math.max(0, qtyNum * priceNum - discountNum);
    const taxVal = subtotal * (taxRateNum / 100);

    calculatedSubtotal += subtotal;
    calculatedTax += taxVal;
    calculatedTotal += subtotal + taxVal;
  });

  return (
    <div className="space-y-3 border p-3 rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Order Line Items ({lines.length})
        </h4>
        <Button type="button" variant="outline" size="sm" onClick={handleAddLine} className="h-7 gap-1 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Product Line
        </Button>
      </div>

      {lines.length === 0 ? (
        <div className="text-center py-6 border border-dashed rounded text-xs text-muted-foreground">
          No items added. Click &quot;Add Product Line&quot; to begin building order payload.
        </div>
      ) : (
        <div className="space-y-3">
          {lines.map((line, idx) => (
            <div key={line.id} className="grid grid-cols-12 gap-2 items-end border-b pb-2 text-xs">
              <div className="col-span-12 sm:col-span-4">
                <FormField label="Product" required>
                  <Select
                    value={line.product_id}
                    onChange={(e) => handleUpdateLine(idx, { product_id: e.target.value })}
                    className="h-8 text-xs py-0.5"
                  >
                    <option value="">-- Select Product --</option>
                    {productsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name} (${p.price})
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <div className="col-span-4 sm:col-span-2">
                <FormField label="Quantity" required>
                  <Input
                    value={line.quantity}
                    onChange={(e) => handleUpdateLine(idx, { quantity: e.target.value })}
                    placeholder="1.0000"
                    className="h-8 font-mono text-xs"
                  />
                </FormField>
              </div>

              <div className="col-span-4 sm:col-span-2">
                <FormField label="Unit Price" required>
                  <Input
                    value={line.unit_price}
                    onChange={(e) => handleUpdateLine(idx, { unit_price: e.target.value })}
                    placeholder="0.0000"
                    className="h-8 font-mono text-xs"
                  />
                </FormField>
              </div>

              <div className="col-span-3 sm:col-span-2">
                <FormField label="Tax %">
                  <Select
                    value={line.tax_rate}
                    onChange={(e) => handleUpdateLine(idx, { tax_rate: e.target.value })}
                    className="h-8 text-xs py-0.5 font-mono"
                  >
                    <option value="0.000000">0% Standard</option>
                    <option value="5.000000">5% Reduced</option>
                    <option value="12.000000">12% State</option>
                    <option value="18.000000">18% VAT/GST</option>
                  </Select>
                </FormField>
              </div>

              <div className="col-span-1 flex justify-end pb-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLine(idx)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  title="Remove Line"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="col-span-12 flex justify-between items-center text-[11px] text-muted-foreground font-mono bg-muted/20 px-2 py-1 rounded">
                <span>SKU: {line.sku || 'N/A'}</span>
                <span>
                  Line Total: <strong className="text-foreground">{formatCurrency(parseFloat(line.line_total || '0'), currency)}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Financial Totals Summary Box */}
      <div className="pt-2 border-t flex flex-col items-end text-xs space-y-1 font-mono">
        <div className="flex justify-between w-48 text-muted-foreground">
          <span>Subtotal:</span>
          <span>{formatCurrency(calculatedSubtotal, currency)}</span>
        </div>
        <div className="flex justify-between w-48 text-muted-foreground">
          <span>Tax Amount:</span>
          <span>{formatCurrency(calculatedTax, currency)}</span>
        </div>
        <div className="flex justify-between w-48 font-bold text-foreground text-sm border-t pt-1">
          <span>Total:</span>
          <span>{formatCurrency(calculatedTotal, currency)}</span>
        </div>
      </div>
    </div>
  );
};
