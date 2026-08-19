import { createAuthClient } from "better-auth/react";
import { managedAuthExpoClient } from "@runablehq/managed-auth/native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";
const TOKEN_KEY = "bearer_token";

// Identité gérée par la plateforme : ne jamais modifier `expo.extra` ni `expo.scheme`.
const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiUrl?: string;
  applicationId?: string;
  runableAuthIssuer?: string;
};

const baseURL = extra.apiUrl ?? process.env.EXPO_PUBLIC_API_URL;

export function getToken(): string {
  try {
    return SecureStore.getItem(TOKEN_KEY) ?? "";
  } catch {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  }
}

export function setToken(token: string) {
  try {
    SecureStore.setItem(TOKEN_KEY, token);
  } catch {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken() {
  setToken("");
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* natif : SecureStore vidé ci-dessus */
  }
}

export const authClient = createAuthClient({
  baseURL,
  basePath: "/api/auth",
  plugins: [
    managedAuthExpoClient({
      applicationId: extra.applicationId ?? "",
      issuer: extra.runableAuthIssuer ?? "",
      storage: { getToken, setToken, clearToken },
    }),
  ],
  fetchOptions: {
    ...(isWeb ? { credentials: "omit" as const } : {}),
    auth: {
      type: "Bearer",
      token: () => getToken(),
    },
    headers: isWeb ? {} : { "expo-origin": "mobile://" },
  },
});

/** À appeler dans onSuccess de signIn/signUp pour capturer le jeton bearer. */
export function captureToken(ctx: { response: Response }) {
  const token = ctx.response.headers.get("set-auth-token");
  if (token) setToken(token);
}
