import * as React from "react";
import { Link } from "wouter";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "../components/auth-layout";
import { Button } from "../components/ui/button";
import { Field, Input } from "../components/ui/field";
import { authClient } from "../lib/auth";

function ForgotPassword() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string>();
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Adresse email invalide.");
      return;
    }
    setError(undefined);
    setLoading(true);
    const { error: apiError } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (apiError) {
      toast.error(apiError.message ?? "L'envoi a échoué. Veuillez réessayer.");
      return;
    }
    setSent(true);
  };

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Nous vous envoyons un lien pour choisir un nouveau mot de passe."
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {sent ? (
        <div className="card-surface flex gap-3 p-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/12 text-success">
            <MailCheck className="size-4.5" />
          </span>
          <div>
            <p className="text-[14.5px] font-semibold">Vérifiez votre boîte mail</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
              Si un compte existe pour {email.trim()}, un lien de réinitialisation vient d'y être
              envoyé. Pensez à regarder dans les spams.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Adresse email" error={error} required>
            <Input
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Button type="submit" disabled={loading} className="h-11 w-full text-[15px]">
            {loading && <Loader2 className="size-4 animate-spin" />}
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPassword;
