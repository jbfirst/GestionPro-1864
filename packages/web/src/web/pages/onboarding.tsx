import * as React from "react";
import { useLocation } from "wouter";
import { Boxes, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Field, Input } from "../components/ui/field";
import { Loading } from "../components/ui/data-state";
import { authClient } from "../lib/auth";
import { errorMessage } from "../lib/format";
import { useMe, useSetupBusiness } from "../queries/account";

function Onboarding() {
  const [, navigate] = useLocation();
  const me = useMe();
  const setup = useSetupBusiness();

  const [businessName, setBusinessName] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [errors, setErrors] = React.useState<{ businessName?: string; fullName?: string }>({});
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!me.data || ready) return;
    if (me.data.business) {
      navigate("/dashboard");
      return;
    }
    setFullName(me.data.user.name ?? "");
    setReady(true);
  }, [me.data, navigate, ready]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (businessName.trim().length < 2) next.businessName = "Indiquez le nom de votre commerce.";
    if (fullName.trim().length < 2) next.fullName = "Indiquez votre nom complet.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setup.mutate(
      {
        businessName: businessName.trim(),
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Votre commerce est prêt.");
          navigate("/dashboard");
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  if (me.isLoading || !ready) return <Loading />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-[460px]">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Boxes className="size-5" />
          </span>
          <span className="font-display text-[18px] font-bold">GestionPro</span>
        </div>

        <h1 className="font-display text-[26px] leading-tight font-bold">
          Configurons votre commerce
        </h1>
        <p className="mt-2 text-[14.5px] text-muted-foreground">
          Dernière étape avant d'accéder à votre tableau de bord. Vous pourrez tout modifier plus
          tard dans les paramètres.
        </p>

        <form onSubmit={submit} className="card-surface mt-7 space-y-4 p-5" noValidate>
          <Field label="Nom du commerce" error={errors.businessName} required>
            <Input
              placeholder="Ex. Boutique Awa"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
            />
          </Field>
          <Field label="Votre nom complet" error={errors.fullName} required>
            <Input
              placeholder="Ex. Awa Koffi"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </Field>
          <Field label="Téléphone" hint="Facultatif — affiché sur vos rapports.">
            <Input
              placeholder="Ex. +228 90 00 00 00"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>

          <Button type="submit" disabled={setup.isPending} className="h-11 w-full text-[15px]">
            {setup.isPending && <Loader2 className="size-4 animate-spin" />}
            Créer mon espace
          </Button>
        </form>

        <button
          type="button"
          onClick={async () => {
            await authClient.signOut();
            window.location.href = "/login";
          }}
          className="mt-5 flex w-full items-center justify-center gap-2 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-3.5" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default Onboarding;
