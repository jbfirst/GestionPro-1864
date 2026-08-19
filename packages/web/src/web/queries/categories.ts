import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useCategories() {
  return useQuery(orpc.categories.list.queryOptions({ staleTime: 30_000 }));
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: orpc.categories.key() });
    queryClient.invalidateQueries({ queryKey: orpc.products.key() });
  };
}

export function useCreateCategory() {
  const invalidate = useInvalidate();
  return useMutation(orpc.categories.create.mutationOptions({ onSuccess: invalidate }));
}

export function useUpdateCategory() {
  const invalidate = useInvalidate();
  return useMutation(orpc.categories.update.mutationOptions({ onSuccess: invalidate }));
}

export function useDeleteCategory() {
  const invalidate = useInvalidate();
  return useMutation(orpc.categories.remove.mutationOptions({ onSuccess: invalidate }));
}
