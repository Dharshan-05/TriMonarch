import { apiClient } from '@/lib/api/client';
import { BaseQueryParams, ApiPaginatedResponse } from '@/types/api';

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | string;

export interface StockLedgerEntry {
  id: string;
  organization_id?: string;
  inventory_id?: string;
  product_id: string;
  warehouse_id: string;
  movement_type: StockMovementType;
  quantity: string;
  unit?: string;
  balance_after?: string;
  reference_type?: string | null;
  reference_id?: string | null;
  notes?: string | null;
  reason?: string | null;
  created_by?: string | null;
  created_at: string;
  // Joined or derived fields for operational table display
  product_name?: string;
  sku?: string;
  warehouse_name?: string;
  user_name?: string;
}

export interface StockLedgerQueryParams extends BaseQueryParams {
  inventoryId?: string;
  inventory_id?: string;
  productId?: string;
  product_id?: string;
  warehouseId?: string;
  warehouse_id?: string;
  movementType?: StockMovementType;
  movement_type?: StockMovementType;
  referenceType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const stockLedgerService = {
  getLedgerEntries: async (
    params?: StockLedgerQueryParams,
  ): Promise<ApiPaginatedResponse<StockLedgerEntry>> => {
    const invId = params?.inventoryId || params?.inventory_id;
    if (invId) {
      return apiClient.get<ApiPaginatedResponse<StockLedgerEntry>>(`/inventory/${invId}/movements`, {
        params,
      });
    }
    // Fallback/Direct general stock ledger endpoint
    return apiClient.get<ApiPaginatedResponse<StockLedgerEntry>>('/stock-ledger', { params });
  },

  getLedgerEntryById: async (id: string, inventoryId?: string): Promise<StockLedgerEntry> => {
    if (inventoryId) {
      const response = await apiClient.get<ApiPaginatedResponse<StockLedgerEntry>>(
        `/inventory/${inventoryId}/movements`,
      );
      const entry = (response.data || []).find((item) => item.id === id);
      if (entry) return entry;
    }
    return apiClient.get<StockLedgerEntry>(`/stock-ledger/${id}`);
  },
};
