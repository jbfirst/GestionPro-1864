/**
 * Groupement de milliers fait à la main : certains moteurs mobiles n'ont pas
 * l'ICU complet et ignorent la locale « fr-FR ».
 */
function group(value: number, maximumFractionDigits = 0) {
  const rounded = maximumFractionDigits === 0 ? Math.round(value) : value;
  const negative = rounded < 0;
  const [int, dec] = Math.abs(rounded).toFixed(maximumFractionDigits).split(".");
  const withSpaces = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const decimals = dec ? `,${dec.replace(/0+$/, "")}` : "";
  return `${negative ? "-" : ""}${withSpaces}${decimals.length > 1 ? decimals : ""}`;
}

const numberFormatter = { format: (value: number) => group(value, 0) };
const decimalFormatter = { format: (value: number) => group(value, 2) };

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

const MONTHS_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDate(value: Date | string | number | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return `${pad(date.getDate())} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateTime(value: Date | string | number | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return `${formatDate(date)}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** « 2026-08-13 » → « 13 août » (axes de graphique) */
export function formatDayLabel(day: string) {
  const [, m, d] = day.split("-").map(Number);
  return `${pad(d)} ${MONTHS_SHORT[m - 1]}`;
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
