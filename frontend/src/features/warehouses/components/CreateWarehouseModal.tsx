import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { CreateWarehouseInput, WarehouseStatus } from '@/services/warehouses.service';

interface CreateWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWarehouseInput) => Promise<void>;
  isLoading?: boolean;
}

export const CreateWarehouseModal: React.FC<CreateWarehouseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<WarehouseStatus>('active');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Warehouse code is required.');
      return;
    }
    if (!name.trim()) {
      setError('Warehouse facility name is required.');
      return;
    }

    try {
      setError(null);
      await onSubmit({
        code: code.trim(),
        name: name.trim(),
        location: location.trim() || null,
        status,
      });
      setCode('');
      setName('');
      setLocation('');
      setStatus('active');
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to create warehouse facility.');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Add New Warehouse Facility"
      description="Register a new storage location or physical fulfillment hub."
      className="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Register Warehouse'}
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

        <FormField label="Warehouse Code *" description="Unique identifier (e.g. WH-MAIN, WH-NORTH)">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. WH-MAIN-01"
            className="font-mono text-xs"
            required
          />
        </FormField>

        <FormField label="Facility Name *" description="Full descriptive name of the warehouse location">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Main Central Distribution Center"
            className="text-xs"
            required
          />
        </FormField>

        <FormField label="Physical Location / Address" description="Physical address or zone designation">
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Building 4, Logistics Park, Sector 62"
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
