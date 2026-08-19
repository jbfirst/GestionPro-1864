import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

interface SaleFilters {
  search?: string;
  from?: string;
  to?: string;
  customerId?: string;
  limit?: number;
}

export function useSales(filters: SaleFilters = {}) {
  return useQuery(orpc.sales.list.queryOptions({ input: filters }));
}

export function useSale(id: string | null) {
  return useQuery(
    orpc.sales.get.queryOptions({ input: { id: id ?? "" }, enabled: Boolean(id) }),
  );
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: orpc.sales.key() });
    queryClient.invalidateQueries({ queryKey: orpc.products.key() });
    queryClient.invalidateQueries({ queryKey: orpc.customers.key() });
    queryClient.invalidateQueries({ queryKey: orpc.dashboard.key() });
    queryClient.invalidateQueries({ queryKey: orpc.reports.key() });
  };
}

export function useCreateSale() {
  const invalidate = useInvalidate();
  return useMutation(orpc.sales.create.mutationOptions({ onSuccess: invalidate }));
}

export function useDeleteSale() {
  const invalidate = useInvalidate();
  return useMutation(orpc.sales.remove.mutationOptions({ onSuccess: invalidate }));
}
