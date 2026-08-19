import * as React from "react";
import { Loader2, LogOut, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "../components/app-shell";
import { Panel } from "../components/panel";
import { Button } from "../components/ui/button";
import { Field, Input } from "../components/ui/field";
import { Loading } from "../components/ui/data-state";
import { useTheme } from "../hooks/use-theme";
import { authClient } from "../lib/auth";
import { errorMessage } from "../lib/format";
import { useMe, useUpdateBusiness, useUpdateProfile } from "../queries/account";

function Settings() {
  const me = useMe();
  const updateBusiness = useUpdateBusiness();
  const updateProfile = useUpdateProfile();
  const { theme, toggle } = useTheme();

  const [businessName, setBusinessName] = React.useState("");
  const [businessPhone, setBusinessPhone] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [profilePhone, setProfilePhone] = React.useState("");
  const [errors, setErrors] = React.useState<{ businessName?: string; fullName?: string }>({});
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    if (!me.data || hydrated) return;
    setBusinessName(me.data.business?.name ?? "");
    setBusinessPhone(me.data.business?.phone ?? "");
    setFullName(me.data.profile?.fullName ?? me.data.user.name ?? "");
    setProfilePhone(me.data.profile?.phone ?? "");
    setHydrated(true);
  }, [me.data, hydrated]);

  const submitBusiness = (event: React.FormEvent) => {
    event.preventDefault();
    if (businessName.trim().length < 2) {
      setErrors((prev) => ({ ...prev, businessName: "Le nom du commerce est trop court." }));
      return;
    }
    setErrors((prev) => ({ ...prev, businessName: undefined }));
    updateBusiness.mutate(
      { name: businessName.trim(), phone: businessPhone.trim() || undefined },
      {
        onSuccess: () => toast.success("Informations du commerce mises à jour."),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  const submitProfile = (event: React.FormEvent) => {
    event.preventDefault();
    if (fullName.trim().length < 2) {
      setErrors((prev) => ({ ...prev, fullName: "Votre nom est trop court." }));
      return;
    }
    setErrors((prev) => ({ ...prev, fullName: undefined }));
    updateProfile.mutate(
      { fullName: fullName.trim(), phone: profilePhone.trim() || undefined },
      {
        onSuccess: () => toast.success("Profil mis à jour."),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  const signOut = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };

  return (
    <AppShell title="Paramètres" subtitle="Votre commerce, votre profil et l'affichage">
      {me.isLoading ? (
        <Loading />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Mon commerce" description="Nom affiché dans l'application et les rapports">
            <form onSubmit={submitBusiness} className="space-y-4 p-4 sm:p-5" noValidate>
              <Field label="Nom du commerce" error={errors.businessName} required>
                <Input
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                />
              </Field>
              <Field label="Téléphone du commerce">
                <Input
                  placeholder="+228 90 00 00 00"
                  value={businessPhone}
                  onChange={(event) => setBusinessPhone(event.target.value)}
                />
              </Field>
              <Button type="submit" disabled={updateBusiness.isPending}>
                {updateBusiness.isPending && <Loader2 className="size-4 animate-spin" />}
                Enregistrer
              </Button>
            </form>
          </Panel>

          <Panel title="Mon profil" description="Vos informations personnelles">
            <form onSubmit={submitProfile} className="space-y-4 p-4 sm:p-5" noValidate>
              <Field label="Nom complet" error={errors.fullName} required>
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </Field>
              <Field label="Téléphone">
                <Input
                  placeholder="+228 90 00 00 00"
                  value={profilePhone}
                  onChange={(event) => setProfilePhone(event.target.value)}
                />
              </Field>
              <Field label="Adresse email" hint="L'email de connexion ne peut pas être modifié.">
                <Input value={me.data?.user.email ?? ""} disabled />
              </Field>
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
                Enregistrer
              </Button>
            </form>
          </Panel>

          <Panel title="Affichage" description="Thème de l'interface">
            <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
              <div>
                <p className="text-[14px] font-medium">
                  Mode {theme === "dark" ? "sombre" : "clair"}
                </p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Le choix est conservé sur cet appareil.
                </p>
              </div>
              <Button variant="outline" onClick={toggle}>
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                Basculer
              </Button>
            </div>
          </Panel>

          <Panel title="Session" description="Déconnexion de cet appareil">
            <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
              <div>
                <p className="text-[14px] font-medium">{me.data?.user.email}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Vos données restent enregistrées.
                </p>
              </div>
              <Button variant="destructive" onClick={signOut}>
                <LogOut className="size-4" />
                Se déconnecter
              </Button>
            </div>
          </Panel>
        </div>
      )}
    </AppShell>
  );
}

export default Settings;
