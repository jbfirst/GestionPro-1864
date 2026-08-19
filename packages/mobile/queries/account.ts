import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/api";

export function useMe(enabled = true) {
  return useQuery({ ...orpc.account.me.queryOptions(), enabled, retry: false });
}

export function useSetupBusiness() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.account.setupBusiness.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.account.key() }),
    }),
  );
}
