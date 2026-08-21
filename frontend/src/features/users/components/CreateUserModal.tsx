import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateUserInput, UserStatus } from '@/services/users.service';
import { SYSTEM_ROLE_OPTIONS, USER_STATUS_OPTIONS } from '../types/users.types';
import { Eye, EyeOff } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserInput) => Promise<void>;
  isLoading?: boolean;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [status, setStatus] = useState<UserStatus>('active');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    if (password && password.length < 12) {
      setErrorMsg('Password must be at least 12 characters if provided');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password: password || undefined,
        phone: phone.trim() || undefined,
        role,
        status,
      });
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setRole('EMPLOYEE');
      setStatus('active');
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setErrorMsg(errorObj?.response?.data?.error?.message || errorObj?.message || 'Failed to create user');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Create System User"
      description="Add a new user account to your organization with role-based access controls."
      className="max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={isLoading} onClick={handleSubmit} className="font-semibold">
            {isLoading ? 'Creating...' : 'Create User'}
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

        <FormField label="Password" description="Must be at least 12 characters">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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
