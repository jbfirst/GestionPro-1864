import Constants from "expo-constants";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { AppRouterClient } from "@template/web";
import { getToken } from "./auth";

const baseUrl = Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL;

const link = new RPCLink({
  url: `${baseUrl}/api/rpc`,
  headers: () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

/** Client typé direct : await client.dashboard.summary() */
export const client: AppRouterClient = createORPCClient(link);

/** Helpers TanStack Query : useQuery(orpc.dashboard.summary.queryOptions()) */
export const orpc = createTanstackQueryUtils(client);
