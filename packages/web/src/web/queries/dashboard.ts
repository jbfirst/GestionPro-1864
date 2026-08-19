import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export type Period = "today" | "7d" | "30d" | "this_month" | "last_month" | "all";

export function useDashboard(period: Period = "30d") {
  return useQuery(orpc.dashboard.summary.queryOptions({ input: { period } }));
}
