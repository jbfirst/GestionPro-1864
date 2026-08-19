const numberFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

/** 450000 → « 450 000 FCFA » */
export function formatMoney(value: number | null | undefined) {
  const amount = Number(value ?? 0);
  return `${numberFormatter.format(Math.round(amount))} FCFA`;
}

/** Version compacte pour les axes de graphique : 450 000 → 450 k */
export function formatMoneyShort(value: number | null | undefined) {
  const amount = Number(value ?? 0);
  if (Math.abs(amount) >= 1_000_000) return `${decimalFormatter.format(amount / 1_000_000)} M`;
  if (Math.abs(amount) >= 1_000) return `${numberFormatter.format(Math.round(amount / 1000))} k`;
  return numberFormatter.format(amount);
}

export function formatNumber(value: number | null | undefined) {
  return decimalFormatter.format(Number(value ?? 0));
}

export function formatDate(value: Date | string | number | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: Date | string | number | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** « 2026-08-13 » → « 13 août » (axes de graphique) */
export function formatDayLabel(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/** Date du jour au format YYYY-MM-DD (fuseau local). */
export function todayInputValue() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

export function dateInputValue(value: Date | string | number) {
  const date = new Date(value);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Message d'erreur lisible en français à partir d'une erreur API. */
export function errorMessage(error: unknown, fallback = "Une erreur est survenue. Veuillez réessayer.") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  const err = error as { message?: string; code?: string };
  if (err.message && !/^(Internal|Unexpected|Failed to fetch)/i.test(err.message)) return err.message;
  return fallback;
}
