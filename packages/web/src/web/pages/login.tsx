import * as React from "react";
import { Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "../components/auth-layout";
import { GoogleButton } from "../components/google-button";
import { Button } from "../components/ui/button";
import { Field, Input } from "../components/ui/field";
import { authClient } from "../lib/auth";

function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Adresse email invalide.";
    if (password.length < 8) next.password = "Le mot de passe doit contenir au moins 8 caractères.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    const { error } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      toast.error(
        error.status === 401 || error.status === 403
          ? "Email ou mot de passe incorrect."
          : (error.message ?? "La connexion a échoué. Veuillez réessayer."),
      );
      return;
    }

    toast.success("Bon retour parmi nous !");
    navigate("/dashboard");
  };

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Accédez à votre tableau de bord GestionPro."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Adresse email" error={errors.email} required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field label="Mot de passe" error={errors.password} required>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-[13px] font-medium text-primary hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" disabled={loading} className="h-11 w-full text-[15px]">
          {loading && <Loader2 className="size-4 animate-spin" />}
          Se connecter
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[12.5px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton label="Se connecter avec Google" onError={(message) => toast.error(message)} />
    </AuthLayout>
  );
}

export default Login;
