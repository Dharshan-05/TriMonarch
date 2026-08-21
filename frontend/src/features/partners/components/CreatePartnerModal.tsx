import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreatePartnerInput, PartnerType, PartnerStatus } from '@/services/partners.service';
import { PARTNER_TYPE_OPTIONS, PARTNER_STATUS_OPTIONS } from '../types/partners.types';

interface CreatePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePartnerInput) => Promise<void>;
  isLoading?: boolean;
}

export const CreatePartnerModal: React.FC<CreatePartnerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<PartnerType>('customer');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<PartnerStatus>('active');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Partner / Company Name is required');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        type,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        status,
      });
      setName('');
      setType('customer');
      setEmail('');
      setPhone('');
      setAddress('');
      setStatus('active');
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setErrorMsg(errorObj?.response?.data?.error?.message || errorObj?.message || 'Failed to create partner');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Create Business Partner"
      description="Add a new customer or supplier profile to your ERP master data directory."
      className="max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={isLoading} onClick={handleSubmit} className="font-semibold">
            {isLoading ? 'Creating...' : 'Create Partner'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <Alert variant="destructive" className="py-2 text-xs">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <FormField label="Partner / Company Name" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Industrial Corp"
            required
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Partner Type</Label>
            <Select value={type} onChange={(e) => setType(e.target.value as PartnerType)} className="h-9 text-xs py-1">
              {PARTNER_TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">Initial Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as PartnerStatus)} className="h-9 text-xs py-1">
              {PARTNER_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <FormField label="Email Address">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@acme.com"
          />
        </FormField>

        <FormField label="Phone Number">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 019-2834"
          />
        </FormField>

        <FormField label="Business Address">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="100 Industrial Pkwy, Suite 400"
          />
        </FormField>
      </form>
    </Dialog>
  );
};
