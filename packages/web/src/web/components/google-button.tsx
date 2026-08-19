import * as React from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "../lib/auth";

/** Connexion Google via le broker managé. */
export function GoogleButton({
  label = "Continuer avec Google",
  onError,
}: {
  label?: string;
  onError?: (message: string) => void;
}) {
  const [loading, setLoading] = React.useState(false);

  const signIn = async () => {
    setLoading(true);
    const result = await authClient.managedAuth.signIn({ provider: "google" });
    if (result.error && result.error.code !== "POPUP_CLOSED") {
      onError?.(result.error.message ?? "La connexion Google a échoué.");
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={loading}
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-input bg-card text-[14.5px] font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <svg className="size-4.5" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.34v3.09A11.99 11.99 0 0 0 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.34a11.99 11.99 0 0 0 0 10.76l3.93-3.09z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.34 6.62l3.93 3.09C6.22 6.86 8.87 4.75 12 4.75z"
          />
        </svg>
      )}
      {label}
    </button>
  );
}
