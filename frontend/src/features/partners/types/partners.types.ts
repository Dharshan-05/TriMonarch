import { PartnerStatus, PartnerType } from '@/services/partners.service';

export interface PartnerFilterState {
  search: string;
  type: PartnerType | 'ALL';
  status: PartnerStatus | 'ALL';
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const PARTNER_TYPE_OPTIONS: { label: string; value: PartnerType }[] = [
  { label: 'Customer', value: 'customer' },
  { label: 'Supplier', value: 'supplier' },
];

export const PARTNER_STATUS_OPTIONS: { label: string; value: PartnerStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Pending', value: 'pending' },
];
