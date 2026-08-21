import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, UpdateUserInput, UserStatus } from '@/services/users.service';
import { SYSTEM_ROLE_OPTIONS, USER_STATUS_OPTIONS } from '../types/users.types';

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateUserInput) => Promise<void>;
  isLoading?: boolean;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [status, setStatus] = useState<UserStatus>('active');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setRole(user.role || (user.roles && user.roles[0]) || 'EMPLOYEE');
      setStatus(user.status || 'active');
      setErrorMsg(null);
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Full Name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Valid Email address is required');
      return;
    }

    try {
      await onSubmit(user.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        role,
        status,
      });
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setErrorMsg(errorObj?.response?.data?.error?.message || errorObj?.message || 'Failed to update user');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Edit User Information"
      description="Update account properties, contact details, or assigned permissions."
      className="max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={isLoading} onClick={handleSubmit} className="font-semibold">
            {isLoading ? 'Saving...' : 'Save Changes'}
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

        <FormField label="Full Name" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane Doe"
            required
          />
        </FormField>

        <FormField label="Email Address" required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane.doe@organization.com"
            required
          />
        </FormField>

        <FormField label="Phone Number">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Assign Role</Label>
            <Select value={role} onChange={(e) => setRole(e.target.value)} className="h-9 text-xs py-1">
              {SYSTEM_ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">Account Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as UserStatus)} className="h-9 text-xs py-1">
              {USER_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
