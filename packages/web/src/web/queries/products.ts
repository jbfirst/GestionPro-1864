import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

interface ProductFilters {
  search?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery(orpc.products.list.queryOptions({ input: filters }));
}

export function useLowStockProducts() {
  return useQuery(orpc.products.lowStock.queryOptions());
}

export function useProductOptions() {
  return useQuery(orpc.products.list.queryOptions({ input: {}, staleTime: 15_000 }));
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: orpc.products.key() });
    queryClient.invalidateQueries({ queryKey: orpc.categories.key() });
    queryClient.invalidateQueries({ queryKey: orpc.dashboard.key() });
    queryClient.invalidateQueries({ queryKey: orpc.reports.key() });
  };
}

export function useCreateProduct() {
  const invalidate = useInvalidate();
  return useMutation(orpc.products.create.mutationOptions({ onSuccess: invalidate }));
}

export function useUpdateProduct() {
  const invalidate = useInvalidate();
  return useMutation(orpc.products.update.mutationOptions({ onSuccess: invalidate }));
}

export function useRestockProduct() {
  const invalidate = useInvalidate();
  return useMutation(orpc.products.restock.mutationOptions({ onSuccess: invalidate }));
}

export function useDeleteProduct() {
  const invalidate = useInvalidate();
  return useMutation(orpc.products.remove.mutationOptions({ onSuccess: invalidate }));
}
