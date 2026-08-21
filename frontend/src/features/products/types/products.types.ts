import { ProductStatus } from '@/services/products.service';

export interface ProductFilterState {
  search: string;
  category: string;
  status: ProductStatus | 'ALL';
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const PRODUCT_STATUS_OPTIONS: { label: string; value: ProductStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Discontinued', value: 'discontinued' },
];

export const COMMON_PRODUCT_CATEGORIES = [
  'Raw Material',
  'Finished Goods',
  'Assembly / Component',
  'Packaging',
  'Consumable',
  'Service',
];

export const COMMON_UNITS_OF_MEASURE = [
  'pcs',
  'kg',
  'm',
  'liter',
  'box',
  'set',
  'unit',
];
