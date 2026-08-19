import { z } from "zod";

export const periodSchema = z.enum([
  "today",
  "7d",
  "30d",
  "this_month",
  "last_month",
  "all",
]);

export type Period = z.infer<typeof periodSchema>;

export const periodLabels: Record<Period, string> = {
  today: "Aujourd'hui",
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  this_month: "Ce mois",
  last_month: "Mois précédent",
  all: "Tout",
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Bornes [from, to] d'une période (heure locale du serveur, Lomé = UTC+0). */
export function periodRange(period: Period, now = new Date()) {
  const today = startOfDay(now);
  const end = new Date(today);
  end.setDate(end.getDate() + 1);

  switch (period) {
    case "today":
      return { from: today, to: end };
    case "7d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from, to: end };
    }
    case "30d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from, to: end };
    }
    case "this_month": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from, to: end };
    }
    case "last_month": {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from, to };
    }
    case "all":
      return { from: new Date(0), to: end };
  }
}

/** Liste des jours (YYYY-MM-DD) entre deux bornes, bornes incluses. */
export function dayKeys(from: Date, to: Date) {
  const keys: string[] = [];
  const cursor = startOfDay(from);
  const last = new Date(to.getTime() - 1);
  while (cursor <= last) {
    keys.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

export function dayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
