import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { Button, Card, Field, ScreenHeader, sans } from "@/components/ui";
import { useSetupBusiness } from "@/queries/account";
import { errorMessage } from "@/lib/format";

export default function SetupScreen() {
  const colors = useColors();
  const router = useRouter();
  const setup = useSetupBusiness();
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  function submit() {
    setError("");
    if (businessName.trim().length < 2) {
      setError("Entrez le nom de votre commerce.");
      return;
    }
    setup.mutate(
      {
        businessName: businessName.trim(),
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
      },
      {
        onSuccess: () => router.replace("/"),
        onError: (err) => setError(errorMessage(err)),
      },
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 18 }}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            title="Votre commerce"
            subtitle="Dernière étape avant d'utiliser GestionPro."
          />
          <Card style={{ gap: 14 }}>
            <Field
              label="Nom du commerce"
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Ex. Boutique Awa"
            />
            <Field
              label="Votre nom (optionnel)"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ex. Awa Koffi"
              autoCapitalize="words"
            />
            <Field
              label="Téléphone (optionnel)"
              value={phone}
              onChangeText={setPhone}
              placeholder="+228 90 00 00 00"
              keyboardType="phone-pad"
            />
            {error ? (
              <Text style={{ fontFamily: sans, fontSize: 13, color: colors.destructive }}>
                {error}
              </Text>
            ) : null}
            <Button label="Créer mon espace" onPress={submit} loading={setup.isPending} />
          </Card>
          <View>
            <Text style={{ fontFamily: sans, fontSize: 12, color: colors.mutedForeground }}>
              Six catégories de produits sont créées automatiquement. Vous pourrez tout modifier
              ensuite.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
