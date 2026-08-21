import { UserStatus } from '@/services/users.service';

export interface UserFilterState {
  search: string;
  status: UserStatus | 'ALL';
  role: string | 'ALL';
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const USER_STATUS_OPTIONS: { label: string; value: UserStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Pending', value: 'pending' },
];

export const SYSTEM_ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
  { label: 'Administrator', value: 'ADMIN' },
  { label: 'Manager', value: 'MANAGER' },
  { label: 'Employee', value: 'EMPLOYEE' },
  { label: 'Auditor', value: 'AUDITOR' },
];
