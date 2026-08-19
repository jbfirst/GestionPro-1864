import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { Button, Card, Field, display, sans } from "@/components/ui";
import { authClient, captureToken } from "@/lib/auth";
import { errorMessage } from "@/lib/format";

type Mode = "login" | "register";

export default function SignInScreen() {
  const colors = useColors();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function submit() {
    setError("");
    if (mode === "register" && name.trim().length < 2) {
      setError("Entrez votre nom complet.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Adresse email invalide.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await authClient.signIn.email(
              { email: email.trim(), password },
              { onSuccess: captureToken },
            )
          : await authClient.signUp.email(
              { email: email.trim(), password, name: name.trim() },
              { onSuccess: captureToken },
            );

      if (result.error) {
        setError(
          errorMessage(
            result.error,
            mode === "login"
              ? "Email ou mot de passe incorrect."
              : "Impossible de créer le compte. Cet email est peut-être déjà utilisé.",
          ),
        );
        return;
      }
      router.replace("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setError("");
    setGoogleLoading(true);
    try {
      const result = await authClient.managedAuth.signIn({ provider: "google" });
      if (result.error && result.error.code !== "AUTH_SESSION_DISMISSED") {
        setError(errorMessage(result.error, "Connexion Google impossible."));
        return;
      }
      if (!result.error) router.replace("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
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
          contentContainerStyle={{ padding: 20, gap: 18, flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: 8, alignItems: "center" }}>
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="storefront" size={26} color={colors.primaryForeground} />
            </View>
            <Text
              style={{
                fontFamily: display,
                fontSize: 26,
                fontWeight: "800",
                color: colors.foreground,
              }}
            >
              GestionPro
            </Text>
            <Text
              style={{
                fontFamily: sans,
                fontSize: 14,
                color: colors.mutedForeground,
                textAlign: "center",
              }}
            >
              {mode === "login"
                ? "Connectez-vous pour gérer votre boutique."
                : "Créez votre compte et lancez votre boutique."}
            </Text>
          </View>

          <Card style={{ gap: 14 }}>
            {mode === "register" ? (
              <Field
                label="Nom complet"
                value={name}
                onChangeText={setName}
                placeholder="Ex. Awa Koffi"
                autoCapitalize="words"
              />
            ) : null}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="vous@exemple.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Field
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              hint={mode === "register" ? "Au moins 8 caractères." : undefined}
            />

            {error ? (
              <Text style={{ fontFamily: sans, fontSize: 13, color: colors.destructive }}>
                {error}
              </Text>
            ) : null}

            <Button
              label={mode === "login" ? "Se connecter" : "Créer mon compte"}
              onPress={submit}
              loading={loading}
            />
            <Button
              label="Continuer avec Google"
              variant="outline"
              icon="logo-google"
              onPress={google}
              loading={googleLoading}
            />
          </Card>

          <Pressable
            onPress={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            style={{ alignItems: "center" }}
          >
            <Text style={{ fontFamily: sans, fontSize: 13, color: colors.accent }}>
              {mode === "login"
                ? "Pas encore de compte ? Créer un compte"
                : "Déjà un compte ? Se connecter"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
