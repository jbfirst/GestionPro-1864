# GestionPro — suivi

Stack managée (Bun/Vite/React/Hono/oRPC/Drizzle/Expo). FR + FCFA. Web + Mobile.

## Fait
- app_init /home/user/gestionpro
- design.md (bleu nuit + émeraude, Plus Jakarta Sans / Public Sans)
- deps: better-auth 1.6.19, @better-auth/expo, @runablehq/managed-auth, recharts, sonner
- auth.ts (email/pwd + managed Google), auth-schema généré, schema métier poussé (db:push)
- middleware/auth.ts : withUser / authed / business (businessId depuis la session only)
- lib/period.ts

## À faire
- routes: account, categories, products, customers, sales, expenses, dashboard, reports
- index.ts : compose router + monte /api/auth/*
- web: lib/auth.ts, lib/api.ts bearer, styles/fonts, layout shell, pages (landing, login, register,
  forgot/reset, onboarding, dashboard, products, categories, sales, customers, expenses, reports, settings)
- queries/ un fichier par feature ; sonner toasts ; theme clair/sombre
- mobile: lib/auth.ts, lib/api.ts, _layout (garder ErrorBoundary + analytics), sign-in, tabs
  (dashboard, vente, produits, historique, réglages), theme.ts recoloré
- bun run lint + typecheck + build, dev servers 4200 (web) / 4300 (mobile), deliver

## Vérification finale (18 août 2026)
- Web: vente enregistrée (stock 20→18), dashboard/rapports/clients/dépenses/paramètres OK, mode sombre OK, confirmation de suppression OK, modal converti en <dialog>.
- Mobile: connexion persistante, dashboard, vente rapide (stock 18→17), historique, compte OK. Formatage FCFA/dates rendu déterministe (sans dépendre d'Intl).
- lint (konsistent + oxlint) OK après `sysctl vm.overcommit_memory=1` (oxlint plantait en SIGABRT), typecheck 3/3, build 2/2.
- DOCUMENTATION.md rédigée (stack réelle vs cahier des charges, schéma des 8 tables + relations,
  isolation serveur = équivalent RLS, variables d'env, commandes de lancement, parcours de test).
- Vérifs supplémentaires: suppression de catégorie utilisée → produit conservé sans catégorie ;
  vente > stock refusée avec « Stock insuffisant pour « Riz 5 kg » : 15 en stock. »
