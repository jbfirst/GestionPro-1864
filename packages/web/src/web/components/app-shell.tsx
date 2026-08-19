import * as React from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Receipt,
  Settings,
  ShoppingCart,
  Sun,
  Tags,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../hooks/use-theme";
import { authClient } from "../lib/auth";
import { useMe } from "../queries/account";

const navigation = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/sales", label: "Ventes", icon: ShoppingCart },
  { href: "/products", label: "Produits", icon: Boxes },
  { href: "/categories", label: "Catégories", icon: Tags },
  { href: "/customers", label: "Clients", icon: Users },
  { href: "/expenses", label: "Dépenses", icon: Receipt },
  { href: "/reports", label: "Rapports", icon: BarChart3 },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

function initials(name: string | null | undefined) {
  if (!name) return "GP";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const me = useMe();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Boxes className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[15px] leading-tight font-bold text-white">GestionPro</p>
          <p className="truncate text-[12px] text-sidebar-foreground/70">
            {me.data?.business?.name ?? "Mon commerce"}
          </p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {navigation.map((item) => {
          const active = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-white",
              )}
            >
              <item.icon className="size-4.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[12px] font-bold text-white">
            {initials(me.data?.profile?.fullName ?? me.data?.user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">
              {me.data?.profile?.fullName ?? me.data?.user.name ?? "—"}
            </p>
            <p className="truncate text-[11.5px] text-sidebar-foreground/70">
              {me.data?.user.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const { theme, toggle } = useTheme();
  const me = useMe();

  const signOut = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[#04121f]/60"
          />
          <div className="absolute inset-y-0 left-0 w-[264px] animate-in slide-in-from-left duration-200">
            <SidebarContent onNavigate={() => setOpen(false)} />
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
              className="absolute top-4 -right-11 rounded-lg bg-card p-2 text-foreground shadow-lg"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
            <button
              type="button"
              aria-label="Ouvrir le menu"
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-foreground transition hover:bg-muted lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-[19px] leading-tight font-bold sm:text-[22px]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{subtitle}</p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <button
                type="button"
                onClick={toggle}
                aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
                className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <button
                type="button"
                onClick={signOut}
                aria-label="Se déconnecter"
                title="Se déconnecter"
                className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6 sm:py-7">
          <div className="mx-auto w-full max-w-[1240px]">{children}</div>
        </main>

        <footer className="px-4 pb-8 text-center text-[12px] text-muted-foreground sm:px-6">
          GestionPro — {me.data?.business?.name ?? "Gestion simple pour petits commerces"}
        </footer>
      </div>
    </div>
  );
}
