import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { authClient } from "@/lib/auth";
import { useMe } from "@/queries/account";
import { useColors } from "@/hooks/use-colors";

/**
 * Redirige selon l'état de la session :
 * pas de session → /sign-in, session sans entreprise → /setup, sinon → onglets.
 */
export function AuthGate() {
  const colors = useColors();
  const router = useRouter();
  const segments = useSegments();
  const { data: session, isPending } = authClient.useSession();
  const me = useMe(!!session);

  const route = segments.join("/");
  const onSignIn = route.startsWith("sign-in");
  const onSetup = route.startsWith("setup");
  const onCallback = route.startsWith("auth");

  const hasBusiness = !!me.data?.business;
  const meReady = !!session && !me.isLoading;

  useEffect(() => {
    if (isPending || onCallback) return;

    if (!session) {
      if (!onSignIn) router.replace("/sign-in");
      return;
    }
    if (!meReady) return;

    if (!hasBusiness) {
      if (!onSetup) router.replace("/setup");
      return;
    }
    if (onSignIn || onSetup) router.replace("/");
  }, [isPending, session, meReady, hasBusiness, onSignIn, onSetup, onCallback, router]);

  if (isPending) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return <Slot />;
}
