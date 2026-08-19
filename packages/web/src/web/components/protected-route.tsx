import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { authClient } from "../lib/auth";
import { useMe } from "../queries/account";

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Chargement…
    </div>
  );
}

/**
 * Route protégée. Redirige vers /login sans session, et vers /onboarding
 * tant que le compte n'a pas d'entreprise.
 */
export function ProtectedRoute({
  children,
  requireBusiness = true,
}: {
  children: React.ReactNode;
  requireBusiness?: boolean;
}) {
  const { data: session, isPending } = authClient.useSession();
  const me = useMe(Boolean(session));

  if (isPending) return <FullScreenLoader />;
  if (!session) return <Redirect to="/login" />;
  if (!requireBusiness) return <>{children}</>;
  if (me.isLoading) return <FullScreenLoader />;
  if (me.data && !me.data.business) return <Redirect to="/onboarding" />;

  return <>{children}</>;
}
