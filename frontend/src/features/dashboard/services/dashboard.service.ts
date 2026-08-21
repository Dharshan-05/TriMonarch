import { productsService } from '@/services/products.service';
import { inventoryService } from '@/services/inventory.service';
import { salesOrdersService } from '@/services/salesOrders.service';
import { purchaseOrdersService } from '@/services/purchaseOrders.service';
import { manufacturingService } from '@/services/manufacturing.service';
import { auditService } from '@/services/audit.service';
import { usersService } from '@/services/users.service';
import {
  InventoryHealthData,
  SalesSummaryData,
  PurchaseSummaryData,
  ManufacturingSummaryData,
  RecentActivityItem,
  LowStockItem,
} from '../types/dashboard.types';

export const dashboardService = {
  getInventoryHealth: async (): Promise<InventoryHealthData> => {
    try {
      const response = await inventoryService.getInventory({ pageSize: 50 });
      const items = response.data || [];
      let inStockCount = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;
      const lowStockItems: LowStockItem[] = [];

      items.forEach((rawItem) => {
        const item = rawItem as unknown as Record<string, unknown>;
        const qty = Number(item.quantityOnHand ?? item.quantity ?? 0);
        const reorder = Number(item.reorder_level ?? item.reorderPoint ?? item.minQuantity ?? 10);

        if (qty === 0) {
          outOfStockCount++;
          lowStockItems.push({
            id: String(item.id || item.product_id || 'item-id'),
            sku: String(item.sku || item.product_id || 'SKU-N/A'),
            name: String(item.product_name || item.name || 'Product Item'),
            quantity: 0,
            reorderPoint: reorder,
            status: 'out_of_stock',
          });
        } else if (qty <= reorder) {
          lowStockCount++;
          lowStockItems.push({
            id: String(item.id || item.product_id || 'item-id'),
            sku: String(item.sku || item.product_id || 'SKU-N/A'),
            name: String(item.product_name || item.name || 'Product Item'),
            quantity: qty,
            reorderPoint: reorder,
            status: 'low_stock',
          });
        } else {
          inStockCount++;
        }
      });

      return {
        totalItems: response.meta?.total || items.length,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        lowStockItems: lowStockItems.slice(0, 5),
      };
    } catch {
      return {
        totalItems: 0,
        inStockCount: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        lowStockItems: [],
      };
    }
  },

  getSalesSummary: async (): Promise<SalesSummaryData> => {
    try {
      const response = await salesOrdersService.getSalesOrders({ pageSize: 50 });
      const orders = response.data || [];
      let pendingCount = 0;
      let confirmedCount = 0;
      let deliveredCount = 0;
      let cancelledCount = 0;

      orders.forEach((rawOrder) => {
        const o = rawOrder as unknown as Record<string, unknown>;
        const status = String(o.status || '').toLowerCase();
        if (status === 'draft' || status === 'pending') pendingCount++;
        else if (status === 'confirmed' || status === 'approved') confirmedCount++;
        else if (status === 'shipped' || status === 'delivered' || status === 'completed') deliveredCount++;
        else if (status === 'cancelled') cancelledCount++;
      });

      return {
        totalOrders: orders.length,
        pendingCount,
        confirmedCount,
        deliveredCount,
        cancelledCount,
      };
    } catch {
      return { totalOrders: 0, pendingCount: 0, confirmedCount: 0, deliveredCount: 0, cancelledCount: 0 };
    }
  },

  getPurchaseSummary: async (): Promise<PurchaseSummaryData> => {
    try {
      const response = await purchaseOrdersService.getPurchaseOrders({ pageSize: 50 });
      const orders = response.data || [];
      let pendingCount = 0;
      let approvedCount = 0;
      let receivedCount = 0;

      orders.forEach((rawOrder) => {
        const o = rawOrder as unknown as Record<string, unknown>;
        const status = String(o.status || '').toLowerCase();
        if (status === 'draft' || status === 'pending') pendingCount++;
        else if (status === 'approved' || status === 'ordered') approvedCount++;
        else if (status === 'received' || status === 'closed' || status === 'completed') receivedCount++;
      });

      return {
        totalOrders: orders.length,
        pendingCount,
        approvedCount,
        receivedCount,
      };
    } catch {
      return { totalOrders: 0, pendingCount: 0, approvedCount: 0, receivedCount: 0 };
    }
  },

  getManufacturingSummary: async (): Promise<ManufacturingSummaryData> => {
    try {
      const orders = await manufacturingService.getOrders({ pageSize: 50 });
      let activeCount = 0;
      let pendingCount = 0;
      let completedCount = 0;

      orders.forEach((rawOrder) => {
        const o = rawOrder as unknown as Record<string, unknown>;
        const status = String(o.status || '').toLowerCase();
        if (status === 'in_progress' || status === 'active' || status === 'released') activeCount++;
        else if (status === 'draft' || status === 'planned') pendingCount++;
        else if (status === 'completed' || status === 'closed') completedCount++;
      });

      return {
        totalOrders: orders.length,
        activeCount,
        pendingCount,
        completedCount,
      };
    } catch {
      return { totalOrders: 0, activeCount: 0, pendingCount: 0, completedCount: 0 };
    }
  },

  getRecentActivity: async (): Promise<RecentActivityItem[]> => {
    try {
      const logs = await auditService.getLogs({ pageSize: 5 });
      return logs.map((rawLog) => {
        const log = rawLog as unknown as Record<string, unknown>;
        const statusStr = String(log.status || 'SUCCESS');
        return {
          id: String(log.id || Math.random()),
          timestamp: String(log.timestamp || log.created_at || new Date().toISOString()),
          actor: String(log.user_email || log.actor || log.user_id || 'System User'),
          action: String(log.action || log.event || 'System Event'),
          entity: String(log.resource || log.entity_type || 'System'),
          status: statusStr === 'SUCCESS' ? 'info' : 'warning',
        };
      });
    } catch {
      return [];
    }
  },

  getProductsCount: async (): Promise<number> => {
    try {
      const products = await productsService.getProducts({ pageSize: 1 });
      return Array.isArray(products) ? products.length : 0;
    } catch {
      return 0;
    }
  },

  getUsersCount: async (): Promise<number> => {
    try {
      const users = await usersService.getUsers({ pageSize: 1 });
      return Array.isArray(users) ? users.length : 0;
    } catch {
      return 0;
    }
  },
};
