import { Link } from "wouter";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  Check,
  Receipt,
  ShoppingCart,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "../components/ui/button";

const features = [
  {
    icon: ShoppingCart,
    title: "Ventes en 3 clics",
    text: "Enregistrez une vente, le stock se met à jour tout seul et le bénéfice est calculé.",
  },
  {
    icon: Boxes,
    title: "Stock maîtrisé",
    text: "Prix d'achat, prix de vente, seuil d'alerte : vous savez toujours ce qu'il vous reste.",
  },
  {
    icon: Bell,
    title: "Alertes de rupture",
    text: "Une alerte dès qu'un produit passe sous son stock minimum. Plus de mauvaise surprise.",
  },
  {
    icon: Users,
    title: "Fichier clients",
    text: "Historique d'achats et total dépensé par client, pour fidéliser les meilleurs.",
  },
  {
    icon: Receipt,
    title: "Dépenses suivies",
    text: "Loyer, transport, électricité… tout est classé pour connaître le bénéfice net.",
  },
  {
    icon: BarChart3,
    title: "Rapports clairs",
    text: "Chiffre d'affaires, marge, top produits, sur la période de votre choix.",
  },
];

const steps = [
  { title: "Créez votre compte", text: "Email et mot de passe, ou connexion Google. Gratuit." },
  { title: "Ajoutez vos produits", text: "Nom, prix d'achat, prix de vente, quantité. C'est tout." },
  { title: "Vendez et suivez", text: "Chaque vente alimente vos statistiques en temps réel." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-3 px-5 py-3.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Boxes className="size-4.5" />
          </span>
          <span className="font-display text-[17px] font-bold">GestionPro</span>
          <nav className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/login">Se connecter</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Commencer</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-32 size-[520px] rounded-full bg-accent/12 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-52 -left-40 size-[520px] rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative mx-auto grid w-full max-w-[1180px] gap-12 px-5 py-16 lg:grid-cols-[1.08fr_1fr] lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px] font-semibold text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" />
              Pensé pour les petits commerces
            </span>
            <h1 className="mt-5 font-display text-[38px] leading-[1.08] font-extrabold tracking-tight sm:text-[52px]">
              Gérez votre boutique
              <span className="block text-success">sans cahier ni casse-tête.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-muted-foreground">
              Ventes, stock, clients, dépenses et rapports réunis dans une seule application, en
              francs CFA. Sur ordinateur comme sur téléphone.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-[15px]">
                <Link to="/register">
                  Créer mon compte gratuit
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-[15px]">
                <Link to="/login">J'ai déjà un compte</Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-muted-foreground">
              {["Sans carte bancaire", "Montants en FCFA", "Application mobile incluse"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-success" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="relative">
            <div className="card-surface rotate-[-1.2deg] p-5 shadow-xl">
              <p className="text-[12.5px] font-semibold tracking-wide text-muted-foreground uppercase">
                Aujourd'hui
              </p>
              <p className="num mt-1 font-display text-[32px] leading-tight font-bold">
                182 500 FCFA
              </p>
              <p className="mt-1 text-[13px] text-success">14 ventes enregistrées</p>
              <div className="mt-5 flex h-28 items-end gap-2">
                {[38, 55, 30, 72, 48, 88, 64].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-md bg-success/25"
                    style={{ height: `${height}%` }}
                  >
                    <div
                      className="w-full rounded-t-md bg-success"
                      style={{ height: `${height / 2}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="card-surface mt-[-18px] ml-auto w-[86%] rotate-[1.4deg] p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-warning/14 text-warning">
                  <Bell className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold">Stock faible</p>
                  <p className="truncate text-[12.5px] text-muted-foreground">
                    Sucre 1kg — 3 restants (seuil 10)
                  </p>
                </div>
              </div>
            </div>

            <div className="card-surface mt-4 w-[70%] -rotate-[0.8deg] p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-success/12 text-success">
                  <Wallet className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold">Bénéfice net du mois</p>
                  <p className="num truncate text-[12.5px] text-muted-foreground">
                    +418 000 FCFA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/60">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-16">
          <h2 className="max-w-2xl font-display text-[28px] leading-tight font-bold sm:text-[34px]">
            Tout ce qu'il faut pour piloter votre commerce
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="card-surface p-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-[15.5px] font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="font-display text-[28px] leading-tight font-bold sm:text-[34px]">
              Démarrez en moins de 5 minutes
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              Pas de formation, pas d'installation. Vous créez votre compte, vous ajoutez vos
              produits et vous vendez.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[13.5px] text-muted-foreground">
              <Smartphone className="size-4 text-success" />
              Application mobile incluse pour vendre depuis le comptoir.
            </div>
          </div>
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li key={step.title} className="card-surface flex gap-4 p-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/12 font-display text-[15px] font-bold text-success">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-[15.5px] font-semibold">{step.title}</h3>
                  <p className="mt-1 text-[13.5px] text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="relative mx-auto w-full max-w-[1180px] overflow-hidden rounded-3xl bg-sidebar px-8 py-14 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 size-[380px] -translate-x-1/2 rounded-full bg-[#0e9f6e]/25 blur-3xl"
          />
          <h2 className="relative font-display text-[28px] leading-tight font-bold text-white sm:text-[34px]">
            Prêt à savoir exactement où va votre argent ?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-[15px] text-sidebar-foreground/80">
            Créez votre compte GestionPro et enregistrez votre première vente aujourd'hui.
          </p>
          <Button asChild size="lg" className="relative mt-8 h-12 px-7 text-[15px]">
            <Link to="/register">
              Commencer gratuitement
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-[13px] text-muted-foreground">
        GestionPro — Gestion simple pour petits commerces.
      </footer>
    </div>
  );
}

export default Index;
