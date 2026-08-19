import * as React from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  Boxes,
  Plus,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "../components/app-shell";
import { Panel } from "../components/panel";
import { PeriodSelect } from "../components/period-select";
import { StatCard } from "../components/stat-card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { EmptyState, ErrorState, Loading } from "../components/ui/data-state";
import { formatDayLabel, formatMoney, formatMoneyShort, formatNumber } from "../lib/format";
import { useDashboard, type Period } from "../queries/dashboard";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-[12.5px] shadow-lg">
      <p className="font-semibold">{formatDayLabel(String(label))}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="num mt-0.5">
          {entry.name} : {formatMoney(entry.value)}
        </p>
      ))}
    </div>
  );
}

function Dashboard() {
  const [period, setPeriod] = React.useState<Period>("30d");
  const query = useDashboard(period);
  const data = query.data;

  return (
    <AppShell
      title="Tableau de bord"
      subtitle="Vue d'ensemble de votre activité"
      actions={
        <>
          <div className="hidden sm:block">
            <PeriodSelect value={period} onChange={setPeriod} />
          </div>
          <Button asChild size="sm" className="h-9">
            <Link to="/sales">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nouvelle vente</span>
            </Link>
          </Button>
        </>
      }
    >
      <div className="mb-4 sm:hidden">
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {query.isError ? (
        <ErrorState
          message="Impossible de charger le tableau de bord."
          onRetry={() => query.refetch()}
        />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Chiffre d'affaires"
              value={formatMoney(data?.stats.revenue)}
              hint={`${formatNumber(data?.stats.salesCount)} vente(s) sur la période`}
              icon={<TrendingUp className="size-5" />}
              tone="primary"
              loading={query.isLoading}
            />
            <StatCard
              label="Bénéfice net"
              value={formatMoney(data?.stats.netProfit)}
              hint={`Marge brute ${formatMoney(data?.stats.grossProfit)}`}
              icon={<Wallet className="size-5" />}
              tone="success"
              loading={query.isLoading}
            />
            <StatCard
              label="Dépenses"
              value={formatMoney(data?.stats.expensesTotal)}
              hint={`Valeur du stock ${formatMoney(data?.stats.stockValue)}`}
              icon={<Boxes className="size-5" />}
              tone="warning"
              loading={query.isLoading}
            />
            <StatCard
              label="Aujourd'hui"
              value={formatMoney(data?.stats.todayRevenue)}
              hint={`${formatNumber(data?.stats.todaySalesCount)} vente(s) aujourd'hui`}
              icon={<ShoppingCart className="size-5" />}
              tone="info"
              loading={query.isLoading}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <Panel
              title="Évolution des ventes"
              description="Chiffre d'affaires et bénéfice brut par jour"
              bodyClassName="px-2 py-4 sm:px-4"
            >
              {query.isLoading ? (
                <Loading />
              ) : (
                <div className="h-[290px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.series ?? []}>
                      <defs>
                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tickFormatter={formatDayLabel}
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={24}
                      />
                      <YAxis
                        tickFormatter={formatMoneyShort}
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                        width={52}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="CA"
                        stroke="var(--chart-2)"
                        strokeWidth={2}
                        fill="url(#revenueFill)"
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        name="Bénéfice"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        fill="url(#profitFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            <Panel
              title="Alertes de stock"
              description="Produits sous le seuil minimum"
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/products">Voir tout</Link>
                </Button>
              }
            >
              {query.isLoading ? (
                <Loading />
              ) : data && data.lowStock.length > 0 ? (
                <ul className="divide-y divide-border">
                  {data.lowStock.map((product) => (
                    <li key={product.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/14 text-warning">
                        <AlertTriangle className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium">{product.name}</p>
                        <p className="num text-[12.5px] text-muted-foreground">
                          Seuil : {formatNumber(product.minStock)}
                        </p>
                      </div>
                      <Badge tone={product.stock <= 0 ? "danger" : "warning"}>
                        {formatNumber(product.stock)} en stock
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<Boxes className="size-5" />}
                  title="Aucune alerte"
                  description="Tous vos produits sont au-dessus de leur seuil minimum."
                />
              )}
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <Panel
              title="Dernières ventes"
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/sales">Voir tout</Link>
                </Button>
              }
            >
              {query.isLoading ? (
                <Loading />
              ) : data && data.recentSales.length > 0 ? (
                <ul className="divide-y divide-border">
                  {data.recentSales.map((sale) => (
                    <li key={sale.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-success/12 text-success">
                        <ShoppingCart className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium">
                          {sale.summary ?? sale.reference}
                        </p>
                        <p className="truncate text-[12.5px] text-muted-foreground">
                          {sale.reference} · {sale.customerName ?? "Client de passage"} ·{" "}
                          {formatNumber(sale.quantity)} article(s)
                        </p>
                      </div>
                      <span className="num shrink-0 text-[13.5px] font-semibold">
                        {formatMoney(sale.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<ShoppingCart className="size-5" />}
                  title="Aucune vente pour l'instant"
                  description="Enregistrez votre première vente pour voir vos statistiques."
                  action={
                    <Button asChild>
                      <Link to="/sales">
                        <Plus className="size-4" />
                        Nouvelle vente
                      </Link>
                    </Button>
                  }
                />
              )}
            </Panel>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <StatCard
                label="Produits"
                value={formatNumber(data?.stats.productsCount)}
                hint="Références au catalogue"
                icon={<Boxes className="size-5" />}
                tone="info"
                loading={query.isLoading}
              />
              <StatCard
                label="Clients"
                value={formatNumber(data?.stats.customersCount)}
                hint="Fiches enregistrées"
                icon={<Users className="size-5" />}
                tone="primary"
                loading={query.isLoading}
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default Dashboard;
