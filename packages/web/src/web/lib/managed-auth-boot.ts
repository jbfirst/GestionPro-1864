// Termine une connexion Google revenant par redirection avant que l'application ne monte.
// Ce module est importé avant "./__main" dans main.tsx : le top-level await se résout
// donc avant le rendu de React.
import { authClient } from "./auth";

await authClient.managedAuth.handleRedirect();
