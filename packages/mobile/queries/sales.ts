import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/api";

export function useSales(search?: string) {
  return useQuery({
    ...orpc.sales.list.queryOptions({ input: search ? { search, limit: 100 } : { limit: 100 } }),
    retry: false,
  });
}

export function useCustomerOptions() {
  return useQuery({ ...orpc.customers.options.queryOptions(), retry: false });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.sales.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.sales.key() });
        queryClient.invalidateQueries({ queryKey: orpc.products.key() });
        queryClient.invalidateQueries({ queryKey: orpc.dashboard.key() });
      },
    }),
  );
}
