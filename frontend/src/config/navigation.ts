import { NavigationGroup } from '@/features/authorization/types/authorization.types';
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Boxes,
  ScrollText,
  Warehouse,
  ShoppingCart,
  Truck,
  ShoppingBag,
  PackageCheck,
  Cpu,
  Factory,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const navigationConfig: NavigationGroup[] = [
  {
    id: 'main',
    title: 'Main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 'master-data',
    title: 'Master Data',
    items: [
      {
        id: 'users',
        label: 'Users',
        path: '/users',
        icon: Users,
        access: { permissions: ['user:read'] },
      },
      {
        id: 'partners',
        label: 'Business Partners',
        path: '/partners',
        icon: Building2,
        access: { permissions: ['partner:read'] },
      },
      {
        id: 'products',
        label: 'Products & Items',
        path: '/products',
        icon: Package,
        access: { permissions: ['product:read'] },
      },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    items: [
      {
        id: 'inventory-stock',
        label: 'Stock Levels',
        path: '/inventory',
        icon: Boxes,
        access: { permissions: ['inventory:read'] },
      },
      {
        id: 'stock-ledger',
        label: 'Stock Ledger',
        path: '/inventory/ledger',
        icon: ScrollText,
        access: { permissions: ['inventory:read'] },
      },
      {
        id: 'warehouses',
        label: 'Warehouses',
        path: '/warehouses',
        icon: Warehouse,
        access: { permissions: ['inventory:read'] },
      },
    ],
  },
  {
    id: 'sales',
    title: 'Sales Management',
    items: [
      {
        id: 'sales-orders',
        label: 'Sales Orders',
        path: '/sales/orders',
        icon: ShoppingCart,
        access: { permissions: ['sales_order:read'] },
      },
      {
        id: 'deliveries',
        label: 'Sales Deliveries',
        path: '/sales/deliveries',
        icon: Truck,
        access: { permissions: ['sales_order:read'] },
      },
    ],
  },
  {
    id: 'purchasing',
    title: 'Purchasing',
    items: [
      {
        id: 'purchase-orders',
        label: 'Purchase Orders',
        path: '/purchasing/orders',
        icon: ShoppingBag,
        access: { permissions: ['purchase_order:read'] },
      },
      {
        id: 'purchase-receipts',
        label: 'Goods Receipts',
        path: '/purchasing/receipts',
        icon: PackageCheck,
        access: { permissions: ['purchase_order:read'] },
      },
    ],
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing',
    items: [
      {
        id: 'bom',
        label: 'Bill of Materials',
        path: '/manufacturing/bom',
        icon: Cpu,
        access: { permissions: ['bom:read'] },
      },
      {
        id: 'manufacturing-orders',
        label: 'Work Orders',
        path: '/manufacturing/orders',
        icon: Factory,
        access: { permissions: ['manufacturing_order:read'] },
      },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    items: [
      {
        id: 'audit-logs',
        label: 'Audit Trail',
        path: '/audit',
        icon: ShieldCheck,
        access: { permissions: ['audit:read'] },
      },
      {
        id: 'design-showcase',
        label: 'UI Showcase',
        path: '/showcase',
        icon: Sparkles,
      },
    ],
  },
];
