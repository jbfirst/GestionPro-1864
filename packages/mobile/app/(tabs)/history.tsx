import { useState } from "react";
import { RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { Card, EmptyState, Loading, ScreenHeader, display, sans } from "@/components/ui";
import { useSales } from "@/queries/sales";
import { formatDateTime, formatMoney } from "@/lib/format";

export default function HistoryScreen() {
  const colors = useColors();
  const [search, setSearch] = useState("");
  const sales = useSales(search.trim() || undefined);

  const total = (sales.data ?? []).reduce((sum, s) => sum + Number(s.total ?? 0), 0);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={sales.isFetching}
            onRefresh={() => sales.refetch()}
            tintColor={colors.accent}
          />
        }
      >
        <ScreenHeader
          title="Historique des ventes"
          subtitle={`${sales.data?.length ?? 0} vente(s) · ${formatMoney(total)}`}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 46,
          }}
        >
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Référence, client ou produit"
            placeholderTextColor={colors.mutedForeground}
            style={{ flex: 1, color: colors.foreground, fontSize: 15 }}
          />
        </View>

        {sales.isLoading ? (
          <Loading />
        ) : sales.data?.length ? (
          sales.data.map((sale) => (
            <Card key={sale.id}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={{
                      fontFamily: display,
                      fontSize: 15,
                      fontWeight: "700",
                      color: colors.foreground,
                    }}
                  >
                    {sale.reference}
                  </Text>
                  <Text
                    style={{ fontFamily: sans, fontSize: 13, color: colors.mutedForeground }}
                    numberOfLines={2}
                  >
                    {sale.summary ?? "—"}
                  </Text>
                  <Text style={{ fontFamily: sans, fontSize: 12, color: colors.mutedForeground }}>
                    {formatDateTime(sale.soldAt)}
                    {sale.customerName ? ` · ${sale.customerName}` : ""}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 3 }}>
                  <Text
                    style={{
                      fontFamily: display,
                      fontSize: 16,
                      fontWeight: "800",
                      color: colors.foreground,
                    }}
                  >
                    {formatMoney(sale.total)}
                  </Text>
                  <Text style={{ fontFamily: sans, fontSize: 12, color: colors.success }}>
                    marge {formatMoney(sale.profit)}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            icon="receipt-outline"
            title="Aucune vente"
            description="Vos ventes apparaîtront ici dès le premier enregistrement."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
