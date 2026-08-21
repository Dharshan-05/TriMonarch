import { ComponentType } from 'react';

export interface KpiMetric {
  id: string;
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  icon?: ComponentType<{ className?: string }>;
}

export interface LowStockItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  reorderPoint?: number;
  status: 'low_stock' | 'out_of_stock';
}

export interface InventoryHealthData {
  totalItems: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockItems: LowStockItem[];
}

export interface SalesSummaryData {
  totalOrders: number;
  pendingCount: number;
  confirmedCount: number;
  deliveredCount: number;
  cancelledCount: number;
}

export interface PurchaseSummaryData {
  totalOrders: number;
  pendingCount: number;
  approvedCount: number;
  receivedCount: number;
}

export interface ManufacturingSummaryData {
  totalOrders: number;
  activeCount: number;
  pendingCount: number;
  completedCount: number;
}

export interface RecentActivityItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  status: 'success' | 'warning' | 'destructive' | 'info';
}
