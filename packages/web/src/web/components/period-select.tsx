import { Select } from "./ui/field";
import type { Period } from "../queries/dashboard";

export const periodOptions: { value: Period; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "this_month", label: "Ce mois" },
  { value: "last_month", label: "Mois précédent" },
  { value: "all", label: "Tout" },
];

export function PeriodSelect({
  value,
  onChange,
}: {
  value: Period;
  onChange: (period: Period) => void;
}) {
  return (
    <Select
      value={value}
      onChange={(event) => onChange(event.target.value as Period)}
      aria-label="Période"
      className="h-9 w-auto min-w-[170px] text-[13.5px]"
    >
      {periodOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
