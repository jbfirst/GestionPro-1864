import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

interface ExpenseFilters {
  search?: string;
  category?: string;
  from?: string;
  to?: string;
}

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery(orpc.expenses.list.queryOptions({ input: filters }));
}

export function useExpenseCategories() {
  return useQuery(orpc.expenses.categories.queryOptions({ staleTime: 5 * 60_000 }));
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: orpc.expenses.key() });
    queryClient.invalidateQueries({ queryKey: orpc.dashboard.key() });
    queryClient.invalidateQueries({ queryKey: orpc.reports.key() });
  };
}

export function useCreateExpense() {
  const invalidate = useInvalidate();
  return useMutation(orpc.expenses.create.mutationOptions({ onSuccess: invalidate }));
}

export function useUpdateExpense() {
  const invalidate = useInvalidate();
  return useMutation(orpc.expenses.update.mutationOptions({ onSuccess: invalidate }));
}

export function useDeleteExpense() {
  const invalidate = useInvalidate();
  return useMutation(orpc.expenses.remove.mutationOptions({ onSuccess: invalidate }));
}
