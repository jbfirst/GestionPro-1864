import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import type { Period } from "./dashboard";

export function useReport(period: Period = "30d") {
  return useQuery(orpc.reports.overview.queryOptions({ input: { period } }));
}
