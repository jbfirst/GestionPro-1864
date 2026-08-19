import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

/** Session + entreprise courante. */
export function useMe(enabled = true) {
  return useQuery(orpc.account.me.queryOptions({ enabled, retry: false, staleTime: 30_000 }));
}

export function useSetupBusiness() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.account.setupBusiness.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(),
    }),
  );
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.account.updateBusiness.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.account.key() }),
    }),
  );
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.account.updateProfile.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.account.key() }),
    }),
  );
}
