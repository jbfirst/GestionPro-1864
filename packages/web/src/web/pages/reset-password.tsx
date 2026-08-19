import * as React from "react";
import { Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "../components/auth-layout";
import { Button } from "../components/ui/button";
import { Field, Input } from "../components/ui/field";
import { authClient } from "../lib/auth";

function ResetPassword() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [errors, setErrors] = React.useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (password.length < 8) next.password = "Le mot de passe doit contenir au moins 8 caractères.";
    if (confirm !== password) next.confirm = "Les mots de passe ne correspondent pas.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);

    if (error) {
      toast.error(error.message ?? "Le lien est invalide ou a expiré.");
      return;
    }
    toast.success("Mot de passe mis à jour. Connectez-vous.");
    navigate("/login");
  };

  if (!token) {
    return (
      <AuthLayout
        title="Lien invalide"
        subtitle="Ce lien de réinitialisation est incomplet ou a expiré."
        footer={
          <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
            Demander un nouveau lien
          </Link>
        }
      >
        <Button asChild className="h-11 w-full text-[15px]">
          <Link to="/forgot-password">Recommencer</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe d'au moins 8 caractères."
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nouveau mot de passe" error={errors.password} required>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label="Confirmer le mot de passe" error={errors.confirm} required>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </Field>
        <Button type="submit" disabled={loading} className="h-11 w-full text-[15px]">
          {loading && <Loader2 className="size-4 animate-spin" />}
          Enregistrer le mot de passe
        </Button>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
