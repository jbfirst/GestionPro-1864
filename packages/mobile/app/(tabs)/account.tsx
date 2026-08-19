import { ScrollView, Text, View, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/use-colors";
import { Button, Card, Loading, ScreenHeader, SectionTitle, display, sans } from "@/components/ui";
import { useMe } from "@/queries/account";
import { useDashboard } from "@/queries/dashboard";
import { authClient, clearToken } from "@/lib/auth";
import { formatMoney } from "@/lib/format";

export default function AccountScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useMe();
  const dashboard = useDashboard("all");
  const webUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;

  async function signOut() {
    try {
      await authClient.signOut();
    } catch {
      /* on nettoie le jeton local dans tous les cas */
    }
    clearToken();
    queryClient.clear();
    router.replace("/sign-in");
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <ScreenHeader title="Mon compte" subtitle="Informations et paramètres." />

        {me.isLoading ? (
          <Loading />
        ) : (
          <>
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="person" size={22} color={colors.primaryForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: display,
                      fontSize: 17,
                      fontWeight: "700",
                      color: colors.foreground,
                    }}
                  >
                    {me.data?.profile?.fullName ?? me.data?.user?.name ?? "Utilisateur"}
                  </Text>
                  <Text style={{ fontFamily: sans, fontSize: 13, color: colors.mutedForeground }}>
                    {me.data?.user?.email}
                  </Text>
                </View>
              </View>
            </Card>

            <Card>
              <SectionTitle>Commerce</SectionTitle>
              <Row label="Nom" value={me.data?.business?.name ?? "—"} />
              <Row label="Devise" value={me.data?.business?.currency ?? "FCFA"} />
              <Row label="Téléphone" value={me.data?.business?.phone ?? "—"} />
            </Card>

            <Card>
              <SectionTitle>Depuis le début</SectionTitle>
              <Row label="Chiffre d'affaires" value={formatMoney(dashboard.data?.stats.revenue)} />
              <Row label="Marge brute" value={formatMoney(dashboard.data?.stats.grossProfit)} />
              <Row label="Ventes" value={String(dashboard.data?.stats.salesCount ?? 0)} />
              <Row label="Clients" value={String(dashboard.data?.stats.customersCount ?? 0)} />
            </Card>

            {webUrl ? (
              <Button
                label="Ouvrir la version web"
                variant="outline"
                icon="open-outline"
                onPress={() => void Linking.openURL(webUrl)}
              />
            ) : null}
            <Button label="Se déconnecter" variant="danger" icon="log-out-outline" onPress={signOut} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <Text style={{ fontFamily: sans, fontSize: 13, color: colors.mutedForeground }}>{label}</Text>
      <Text
        style={{
          fontFamily: sans,
          fontSize: 14,
          fontWeight: "600",
          color: colors.foreground,
          flexShrink: 1,
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
