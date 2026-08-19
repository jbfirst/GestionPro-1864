import * as React from "react";
import { BarChart3, Receipt, TrendingUp, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "../components/app-shell";
import { Panel } from "../components/panel";
import { PeriodSelect } from "../components/period-select";
import { StatCard } from "../components/stat-card";
import { EmptyState, ErrorState, Loading } from "../components/ui/data-state";
import { formatDayLabel, formatMoney, formatMoneyShort, formatNumber } from "../lib/format";
import type { Period } from "../queries/dashboard";
import { useReport } from "../queries/reports";

const pieColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function MoneyTooltip({
  active,
  payload,
  label,
  formatLabel,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
  formatLabel?: (value: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-[12.5px] shadow-lg">
      {label !== undefined && (
        <p className="font-semibold">{formatLabel ? formatLabel(String(label)) : String(label)}</p>
      )}
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="num mt-0.5">
          {entry.name} : {formatMoney(entry.value)}
        </p>
      ))}
    </div>
  );
}

function Reports() {
  const [period, setPeriod] = React.useState<Period>("30d");
  const query = useReport(period);
  const data = query.data;

  return (
    <AppShell
      title="Rapports"
      subtitle="Analysez vos performances sur la période de votre choix"
      actions={
        <div className="hidden sm:block">
          <PeriodSelect value={period} onChange={setPeriod} />
        </div>
      }
    >
      <div className="mb-4 sm:hidden">
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {query.isError ? (
        <ErrorState message="Impossible de charger les rapports." onRetry={() => query.refetch()} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Chiffre d'affaires"
              value={formatMoney(data?.totals.revenue)}
              hint={`${formatNumber(data?.totals.salesCount)} vente(s)`}
              icon={<TrendingUp className="size-5" />}
              loading={query.isLoading}
            />
            <StatCard
              label="Bénéfice brut"
              value={formatMoney(data?.totals.grossProfit)}
              hint="Ventes moins coût d'achat"
              icon={<Wallet className="size-5" />}
              tone="success"
              loading={query.isLoading}
            />
            <StatCard
              label="Dépenses"
              value={formatMoney(data?.totals.expenses)}
              hint="Charges de la période"
              icon={<Receipt className="size-5" />}
              tone="warning"
              loading={query.isLoading}
            />
            <StatCard
              label="Bénéfice net"
              value={formatMoney(data?.totals.netProfit)}
              hint={`Panier moyen ${formatMoney(data?.totals.averageBasket)}`}
              icon={<BarChart3 className="size-5" />}
              tone="info"
              loading={query.isLoading}
            />
          </div>

          <Panel
            title="Ventes et dépenses par jour"
            description={data?.label}
            bodyClassName="px-2 py-4 sm:px-4"
          >
            {query.isLoading ? (
              <Loading />
            ) : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.series ?? []}>
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
                    <Tooltip
                      cursor={{ fill: "var(--muted)" }}
                      content={<MoneyTooltip formatLabel={formatDayLabel} />}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="revenue" name="CA" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Bénéfice" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Dépenses" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Produits les plus vendus">
              {query.isLoading ? (
                <Loading />
              ) : data && data.topProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13.5px]">
                    <thead>
                      <tr className="table-head">
                        <th className="px-4 py-3 text-left">Produit</th>
                        <th className="px-4 py-3 text-right">Qté</th>
                        <th className="px-4 py-3 text-right">CA</th>
                        <th className="px-4 py-3 text-right">Bénéfice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.topProducts.map((product) => (
                        <tr key={product.name} className="hover:bg-muted/40">
                          <td className="px-4 py-3 font-medium">{product.name}</td>
                          <td className="num px-4 py-3 text-right">
                            {formatNumber(product.quantity)}
                          </td>
                          <td className="num px-4 py-3 text-right">{formatMoney(product.revenue)}</td>
                          <td className="num px-4 py-3 text-right text-success">
                            {formatMoney(product.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={<BarChart3 className="size-5" />}
                  title="Aucune vente sur la période"
                  description="Changez de période ou enregistrez des ventes."
                />
              )}
            </Panel>

            <Panel title="Répartition des dépenses" bodyClassName="p-4">
              {query.isLoading ? (
                <Loading />
              ) : data && data.expensesByCategory.length > 0 ? (
                <div className="h-[290px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.expensesByCategory}
                        dataKey="amount"
                        nameKey="category"
                        innerRadius={62}
                        outerRadius={100}
                        paddingAngle={2}
                      >
                        {data.expensesByCategory.map((entry, index) => (
                          <Cell key={entry.category} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<MoneyTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={<Receipt className="size-5" />}
                  title="Aucune dépense sur la période"
                  description="Vos charges apparaîtront ici une fois enregistrées."
                />
              )}
            </Panel>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default Reports;
