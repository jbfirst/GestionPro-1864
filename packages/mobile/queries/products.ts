import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/api";

export function useProducts(search?: string) {
  return useQuery({
    ...orpc.products.list.queryOptions({ input: search ? { search } : {} }),
    retry: false,
  });
}

export function useLowStock() {
  return useQuery({ ...orpc.products.lowStock.queryOptions(), retry: false });
}

export function useRestock() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.products.restock.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.products.key() });
        queryClient.invalidateQueries({ queryKey: orpc.dashboard.key() });
      },
    }),
  );
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.products.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.products.key() });
        queryClient.invalidateQueries({ queryKey: orpc.dashboard.key() });
      },
    }),
  );
}
