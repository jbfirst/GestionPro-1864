import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { Badge, Card, EmptyState, Loading, SectionTitle, display, sans } from "@/components/ui";
import { useDashboard, type Period } from "@/queries/dashboard";
import { useMe } from "@/queries/account";
import { formatDateTime, formatMoney } from "@/lib/format";

const periods: { value: Period; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "this_month", label: "Ce mois" },
];

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("30d");
  const me = useMe();
  const dashboard = useDashboard(period);
  const stats = dashboard.data?.stats;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={dashboard.isFetching}
            onRefresh={() => dashboard.refetch()}
            tintColor={colors.accent}
          />
        }
      >
        <View style={{ gap: 4 }}>
          <Text style={{ fontFamily: sans, fontSize: 13, color: colors.mutedForeground }}>
            {me.data?.business?.name ?? "Votre commerce"}
          </Text>
          <Text
            style={{ fontFamily: display, fontSize: 24, fontWeight: "800", color: colors.foreground }}
          >
            Tableau de bord
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {periods.map((p) => {
            const active = p.value === period;
            return (
              <Pressable
                key={p.value}
                onPress={() => setPeriod(p.value)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: sans,
                    fontSize: 13,
                    fontWeight: "600",
                    color: active ? colors.primaryForeground : colors.mutedForeground,
                  }}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {dashboard.isLoading ? (
          <Loading />
        ) : (
          <>
            <Card style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
              <Text
                style={{ fontFamily: sans, fontSize: 13, color: "rgba(255,255,255,0.75)" }}
              >
                Chiffre d'affaires du jour
              </Text>
              <Text style={{ fontFamily: display, fontSize: 30, fontWeight: "800", color: "#FFFFFF" }}>
                {formatMoney(stats?.todayRevenue)}
              </Text>
              <Text style={{ fontFamily: sans, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                {stats?.todaySalesCount ?? 0} vente(s) enregistrée(s) aujourd'hui
              </Text>
            </Card>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Stat label="CA période" value={formatMoney(stats?.revenue)} />
              <Stat label="Marge brute" value={formatMoney(stats?.grossProfit)} />
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Stat label="Dépenses" value={formatMoney(stats?.expensesTotal)} />
              <Stat label="Bénéfice net" value={formatMoney(stats?.netProfit)} />
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Stat label="Produits" value={String(stats?.productsCount ?? 0)} />
              <Stat label="Valeur du stock" value={formatMoney(stats?.stockValue)} />
            </View>

            <Card>
              <SectionTitle
                action={
                  <Pressable onPress={() => router.push("/products")}>
                    <Text style={{ fontFamily: sans, fontSize: 13, color: colors.accent }}>
                      Voir le stock
                    </Text>
                  </Pressable>
                }
              >
                Alertes de stock
              </SectionTitle>
              {dashboard.data?.lowStock?.length ? (
                dashboard.data.lowStock.map((p) => (
                  <View
                    key={p.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 8,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <Text
                      style={{ fontFamily: sans, fontSize: 14, color: colors.foreground, flex: 1 }}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                    <Badge
                      label={`${p.stock} / ${p.minStock}`}
                      tone={p.stock === 0 ? "danger" : "warning"}
                    />
                  </View>
                ))
              ) : (
                <Text style={{ fontFamily: sans, fontSize: 13, color: colors.mutedForeground }}>
                  Aucun produit sous le seuil d'alerte.
                </Text>
              )}
            </Card>

            <Card>
              <SectionTitle
                action={
                  <Pressable onPress={() => router.push("/history")}>
                    <Text style={{ fontFamily: sans, fontSize: 13, color: colors.accent }}>
                      Tout voir
                    </Text>
                  </Pressable>
                }
              >
                Ventes récentes
              </SectionTitle>
              {dashboard.data?.recentSales?.length ? (
                dashboard.data.recentSales.map((sale) => (
                  <View
                    key={sale.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      paddingVertical: 8,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <Ionicons name="receipt-outline" size={18} color={colors.accent} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontFamily: sans, fontSize: 14, color: colors.foreground }}
                        numberOfLines={1}
                      >
                        {sale.summary ?? sale.reference}
                      </Text>
                      <Text style={{ fontFamily: sans, fontSize: 12, color: colors.mutedForeground }}>
                        {formatDateTime(sale.soldAt)}
                        {sale.customerName ? ` · ${sale.customerName}` : ""}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: sans,
                        fontSize: 14,
                        fontWeight: "700",
                        color: colors.foreground,
                      }}
                    >
                      {formatMoney(sale.total)}
                    </Text>
                  </View>
                ))
              ) : (
                <EmptyState
                  icon="receipt-outline"
                  title="Aucune vente"
                  description="Enregistrez votre première vente depuis l'onglet Vente."
                />
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 14,
        gap: 4,
      }}
    >
      <Text style={{ fontFamily: sans, fontSize: 12, color: colors.mutedForeground }}>{label}</Text>
      <Text
        style={{ fontFamily: display, fontSize: 17, fontWeight: "800", color: colors.foreground }}
      >
        {value}
      </Text>
    </View>
  );
}
