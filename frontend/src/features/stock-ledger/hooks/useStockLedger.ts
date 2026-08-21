import { useQuery } from '@tanstack/react-query';
import { stockLedgerService, StockLedgerQueryParams } from '@/services/stockLedger.service';
import { queryKeys } from '@/queries/query-keys';

export const useStockLedgerQuery = (params?: StockLedgerQueryParams) => {
  return useQuery({
    queryKey: queryKeys.stockLedger.list(params),
    queryFn: () => stockLedgerService.getLedgerEntries(params),
    staleTime: 5 * 60 * 1000, // 5 minutes stale time for auditable history
  });
};

export const useStockLedgerDetailQuery = (id: string, inventoryId?: string) => {
  return useQuery({
    queryKey: queryKeys.stockLedger.detail(id),
    queryFn: () => stockLedgerService.getLedgerEntryById(id, inventoryId),
    enabled: Boolean(id),
  });
};
