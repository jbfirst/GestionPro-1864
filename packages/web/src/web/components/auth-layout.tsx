import * as React from "react";
import { Link } from "wouter";
import { Boxes, Check } from "lucide-react";

const highlights = [
  "Stock à jour à chaque vente",
  "Bénéfice et dépenses en un coup d'œil",
  "Alertes de rupture de stock",
  "Accessible du téléphone comme du PC",
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar px-12 py-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-[420px] rounded-full bg-[#0e9f6e]/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 size-[380px] rounded-full bg-[#2c6fb5]/25 blur-3xl"
        />

        <Link to="/" className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Boxes className="size-5" />
          </span>
          <span className="font-display text-lg font-bold text-white">GestionPro</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-display text-[34px] leading-[1.15] font-bold text-white">
            La gestion de votre commerce, enfin simple.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-sidebar-foreground/80">
            Ventes, stock, clients, dépenses et rapports — tout au même endroit, en francs CFA.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-3 text-[14px] text-white/90">
                <span className="flex size-5 items-center justify-center rounded-full bg-sidebar-primary/90 text-sidebar-primary-foreground">
                  <Check className="size-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12.5px] text-sidebar-foreground/60">
          Conçu pour les commerçants de Lomé et d'ailleurs.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Boxes className="size-4.5" />
            </span>
            <span className="font-display text-[17px] font-bold">GestionPro</span>
          </Link>

          <h1 className="font-display text-[26px] leading-tight font-bold">{title}</h1>
          {subtitle && <p className="mt-2 text-[14.5px] text-muted-foreground">{subtitle}</p>}

          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-[13.5px] text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
