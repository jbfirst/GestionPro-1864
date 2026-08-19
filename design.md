# GestionPro — Design

SaaS de gestion pour petits commerces (Web + Mobile). Interface **100 % française**, montants en **FCFA**
(format `450 000 FCFA`). Direction visuelle : tableau de bord financier sobre et solide — bleu nuit profond,
accent vert émeraude, surfaces claires, données lisibles au premier coup d'œil. Doit être compréhensible
par un commerçant qui n'est pas informaticien.

## Brand & Colors

- **Web & desktop**: variables CSS dans `packages/web/src/web/styles.css`.
- **Mobile**: `Colors.light` / `Colors.dark` dans `packages/mobile/constants/theme.ts` via `useColors()`.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| primary | #0B2A4A (bleu nuit) | #4C9BE8 | Boutons principaux, sidebar active |
| accent | #0E9F6E (émeraude) | #22C58B | Succès, CA, bénéfice, CTA secondaire |
| warning | #D97706 (ocre) | #F59E0B | Alertes stock faible |
| destructive | #DC2626 | #EF4444 | Suppressions, erreurs |
| background | #F6F8FB | #0A1220 | Fond de page |
| card | #FFFFFF | #111C2E | Cartes, tableaux |
| foreground | #0F1B2D | #F3F6FA | Texte principal |
| mutedForeground | #64748B | #94A3B8 | Texte secondaire, labels |
| border | #E2E8F0 | #1E2E45 | Filets, séparateurs |
| sidebar | #0B2A4A | #071426 | Barre latérale (texte clair) |

Charts (Recharts) : `--chart-1` émeraude (CA), `--chart-2` bleu (ventes), `--chart-3` ocre (dépenses).

## Typography

- **Display / titres** : Plus Jakarta Sans (600/700) — cartes de stats, titres de page.
- **Corps / tableaux** : Public Sans (400/500) — lisible à petite taille, chiffres alignés (`tabular-nums`).
- Chargées via Google Fonts dans `index.html`; variables `--font-display` / `--font-sans`.
- Montants : `font-variant-numeric: tabular-nums`, poids 600, jamais en italique.

## Layout

- **Shell app** : sidebar fixe 264px (bleu nuit, icônes lucide), header sticky avec titre de page +
  nom de l'entreprise + bascule clair/sombre + menu utilisateur. Sur mobile (<1024px) la sidebar devient
  un drawer avec overlay, déclenché par un bouton menu.
- **Pages** : `max-w-[1400px]`, padding 24px, grille de cartes stats 1/2/3/6 colonnes selon breakpoint.
- **Tableaux** : entêtes en petites capitales, lignes 56px, actions à droite, état vide illustré,
  recherche + filtres au-dessus, pagination simple si > 20 lignes.
- **Formulaires** : modales (dialog) pour créer/modifier, labels au-dessus, erreurs rouges sous le champ.

## Pages & Screens

Web (`packages/web/src/web/pages/`, routes dans `app.tsx`) :

- `/` — landing courte : promesse, fonctionnalités, CTA inscription (redirige vers `/dashboard` si connecté).
- `/login`, `/register`, `/forgot-password`, `/reset-password` — email/mot de passe + Google.
- `/onboarding` — création de l'entreprise si l'utilisateur n'en a pas.
- `/dashboard` — 6 cartes stats, alertes stock faible, dernières ventes, graphique CA 7/30 j.
- `/products` — CRUD produits, recherche, filtre catégorie, badge stock faible.
- `/categories` — CRUD catégories.
- `/sales` — enregistrement d'une vente (panier multi-lignes) + historique filtrable par date.
- `/customers` — CRUD clients + nombre d'achats et total dépensé.
- `/expenses` — CRUD dépenses + historique.
- `/reports` — CA, dépenses, bénéfice brut/net, nb ventes, filtres période, graphiques, top produits.
- `/settings` — entreprise (nom, téléphone), profil, thème, déconnexion.

Mobile (`packages/mobile/app/`) : `(auth)/sign-in`, `(tabs)/index` (tableau de bord),
`(tabs)/sale` (vente rapide), `(tabs)/products`, `(tabs)/history`, `(tabs)/settings`.

## Key User Flows

1. Inscription → nom complet, email, mot de passe, nom entreprise, téléphone → entreprise créée → `/dashboard`.
2. Vente → choisir produit(s) + quantité (+ client optionnel) → total auto → validation → stock décrémenté,
   bénéfice brut calculé, toast « Vente enregistrée avec succès ».
3. Stock faible → alerte sur le tableau de bord → clic → fiche produit pour réapprovisionner.

## Architecture & Sécurité

- **Auth** : Better Auth (email/mot de passe + Google managé). Session bearer partagée web/mobile.
- **Isolation** : chaque table métier porte `businessId`; toutes les procédures oRPC passent par le
  middleware `business` qui résout l'entreprise depuis la session — l'ID n'est jamais accepté du client.
  Impossible d'accéder aux données d'une autre entreprise en modifiant une requête.
- **API** : oRPC (`packages/web/src/api/routes/`), hooks TanStack Query dans `queries/` (un fichier par
  fonctionnalité). Validation Zod côté serveur + messages d'erreur français côté client.
- **Notifications** : `sonner` (toasts) — succès et erreurs après chaque opération; confirmation avant
  suppression.
