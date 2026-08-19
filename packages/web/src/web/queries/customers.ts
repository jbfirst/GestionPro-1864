import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useCustomers(search?: string) {
  return useQuery(orpc.customers.list.queryOptions({ input: { search } }));
}

export function useCustomerOptions() {
  return useQuery(orpc.customers.options.queryOptions({ staleTime: 30_000 }));
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: orpc.customers.key() });
    queryClient.invalidateQueries({ queryKey: orpc.dashboard.key() });
  };
}

export function useCreateCustomer() {
  const invalidate = useInvalidate();
  return useMutation(orpc.customers.create.mutationOptions({ onSuccess: invalidate }));
}

export function useUpdateCustomer() {
  const invalidate = useInvalidate();
  return useMutation(orpc.customers.update.mutationOptions({ onSuccess: invalidate }));
}

export function useDeleteCustomer() {
  const invalidate = useInvalidate();
  return useMutation(orpc.customers.remove.mutationOptions({ onSuccess: invalidate }));
}
