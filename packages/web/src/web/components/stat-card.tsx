import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "info";

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/14 text-warning",
  info: "bg-chart-2/12 text-chart-2",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "primary",
  loading,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone?: Tone;
  loading?: boolean;
}) {
  return (
    <div className="card-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12.5px] font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          {loading ? (
            <div className="mt-3 h-7 w-28 animate-pulse rounded bg-muted" />
          ) : (
            <p className="num mt-2 font-display text-[22px] leading-tight font-bold sm:text-[25px]">
              {value}
            </p>
          )}
          {hint && !loading && (
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">{hint}</p>
          )}
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            toneStyles[tone],
          )}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}
