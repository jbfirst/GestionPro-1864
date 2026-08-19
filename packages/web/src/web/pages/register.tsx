import * as React from "react";
import { Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "../components/auth-layout";
import { GoogleButton } from "../components/google-button";
import { Button } from "../components/ui/button";
import { Field, Input } from "../components/ui/field";
import { authClient } from "../lib/auth";

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

function Register() {
  const [, navigate] = useLocation();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});
  const [loading, setLoading] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Indiquez votre nom complet.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Adresse email invalide.";
    if (password.length < 8) next.password = "Le mot de passe doit contenir au moins 8 caractères.";
    if (confirm !== password) next.confirm = "Les mots de passe ne correspondent pas.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      toast.error(
        error.code === "USER_ALREADY_EXISTS"
          ? "Un compte existe déjà avec cette adresse email."
          : (error.message ?? "La création du compte a échoué."),
      );
      return;
    }

    toast.success("Compte créé. Configurons votre commerce.");
    navigate("/onboarding");
  };

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Quelques secondes suffisent pour démarrer."
      footer={
        <>
          Vous avez déjà un compte ?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nom complet" error={errors.name} required>
          <Input
            autoComplete="name"
            placeholder="Ex. Awa Koffi"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>

        <Field label="Adresse email" error={errors.email} required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field label="Mot de passe" error={errors.password} hint="8 caractères minimum." required>
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
          Créer mon compte
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[12.5px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton label="S'inscrire avec Google" onError={(message) => toast.error(message)} />
    </AuthLayout>
  );
}

export default Register;
