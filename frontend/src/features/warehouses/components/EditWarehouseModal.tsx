import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { Warehouse, UpdateWarehouseInput, WarehouseStatus } from '@/services/warehouses.service';

interface EditWarehouseModalProps {
  warehouse: Warehouse | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateWarehouseInput) => Promise<void>;
  isLoading?: boolean;
}

export const EditWarehouseModal: React.FC<EditWarehouseModalProps> = ({
  warehouse,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<WarehouseStatus>('active');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (warehouse) {
      setName(warehouse.name || '');
      setLocation(warehouse.location || '');
      setStatus(warehouse.status || 'active');
      setError(null);
    }
  }, [warehouse]);

  if (!warehouse) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Warehouse facility name is required.');
      return;
    }

    try {
      setError(null);
      await onSubmit(warehouse.id, {
        name: name.trim(),
        location: location.trim() || null,
        status,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to update warehouse parameters.');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Edit Warehouse Facility"
      description="Update operational status, facility naming, and location references."
      className="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Save Parameters'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
        {error && (
          <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs border border-destructive/20 font-medium">
            {error}
          </div>
        )}

        <FormField label="Warehouse Code" description="Immutable system identifier">
          <Input value={warehouse.code} disabled className="font-mono text-xs bg-muted/30" />
        </FormField>

        <FormField label="Facility Name *" description="Full descriptive facility name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Main Distribution Hub"
            className="text-xs"
            required
          />
        </FormField>

        <FormField label="Physical Location / Address">
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Building 4, Logistics Park"
            className="text-xs"
          />
        </FormField>

        <FormField label="Operational Status">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as WarehouseStatus)}
            className="text-xs"
          >
            <option value="active">Active (Operational)</option>
            <option value="inactive">Inactive (Decommissioned)</option>
          </Select>
        </FormField>
      </form>
    </Dialog>
  );
};
