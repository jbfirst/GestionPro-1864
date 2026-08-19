# GestionPro — Documentation technique

SaaS de gestion pour petits commerces : produits, stock, ventes, clients, dépenses, rapports.
Interface **entièrement en français**, toutes les valeurs monétaires en **FCFA** (`450 000 FCFA`).

---

## 1. Stack réellement utilisée

Le cahier des charges demandait Supabase + PostgreSQL. Le projet tourne sur la stack managée
de la plateforme, qui remplace ces briques :

| Besoin | Cahier des charges | Implémentation |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite + Tailwind | ✅ identique (React 19, Vite 7, Tailwind 4) |
| Graphiques | Recharts | ✅ Recharts |
| Base de données | PostgreSQL (Supabase) | SQLite/Turso via **Drizzle ORM** |
| API | Supabase client direct | serveur **Hono + oRPC** typé de bout en bout |
| Authentification | Supabase Auth | **Better Auth** (email/mot de passe + Google) |
| Isolation | Politiques RLS | **Isolation serveur** (voir §5) — équivalent fonctionnel |
| Notifications | — | Sonner (toasts) |

Bonus par rapport au cahier des charges : une **application mobile** (Expo / React Native)
qui consomme la même API.

---

## 2. Structure du projet

```
packages/
  web/
    src/api/                     Serveur (Hono + oRPC)
      auth.ts                    Better Auth (email/mot de passe, Google, base /api/auth)
      database/schema.ts         Tables métier (Drizzle)
      database/auth-schema.ts    Tables d'authentification (générées)
      middleware/auth.ts         withUser / authed / business  ← isolation par entreprise
      lib/period.ts              Périodes de filtrage (aujourd'hui, 7j, 30j, mois…)
      routes/                    account, categories, products, customers, sales,
                                 expenses, dashboard, reports
      index.ts                   Composition du routeur + montage /api/auth/*
    src/web/                     Frontend
      pages/                     landing, login, register, forgot/reset-password,
                                 onboarding, dashboard, products, categories, sales,
                                 customers, expenses, reports, settings
      components/                app-shell (sidebar responsive), ui/ (button, field,
                                 modal, confirm, badge, data-state), stat-card, panel…
      queries/                   Hooks de données, un fichier par fonctionnalité
      hooks/use-theme.tsx        Mode clair / sombre (persisté sur l'appareil)
      lib/                       auth.ts, api.ts, format.ts (FCFA, dates, erreurs FR)
  mobile/                        Application Expo (Accueil, Vente, Stock, Ventes, Compte)
```

---

## 3. Structure de la base de données

Types : `text` = identifiants et chaînes, `real` = montants et quantités,
`integer (timestamp_ms)` = dates. Toutes les clés primaires sont des UUID.

### businesses
| Colonne | Type | Notes |
| --- | --- | --- |
| id | text | PK |
| name | text | non nul |
| phone | text | facultatif |
| currency | text | défaut `FCFA` |
| owner_id | text | → `user.id`, cascade |
| created_at | timestamp | |

### profiles
| Colonne | Type | Notes |
| --- | --- | --- |
| id | text | PK |
| user_id | text | → `user.id`, **unique**, cascade |
| business_id | text | → `businesses.id`, cascade, indexé |
| full_name | text | non nul |
| phone | text | facultatif |
| role | text | `owner` \| `staff`, défaut `owner` |
| created_at | timestamp | |

### categories
`id`, `business_id` (→ businesses, cascade, indexé), `name`, `created_at`.

### products
| Colonne | Type | Notes |
| --- | --- | --- |
| id | text | PK |
| business_id | text | → businesses, cascade, indexé |
| category_id | text | → categories, `set null` |
| name / description | text | description facultative |
| purchase_price | real | prix d'achat |
| sale_price | real | prix de vente |
| stock | real | quantité en stock |
| min_stock | real | seuil d'alerte |
| created_at | timestamp | |

### customers
`id`, `business_id` (indexé), `name`, `phone`, `email`, `address`, `created_at`.
Le nombre d'achats et le total dépensé sont calculés à la volée depuis `sales`.

### sales
| Colonne | Type | Notes |
| --- | --- | --- |
| id | text | PK |
| business_id | text | → businesses, cascade, indexé |
| customer_id | text | → customers, `set null` (vente possible sans client) |
| reference | text | `V-00001`, `V-00002`… |
| total | real | somme des lignes |
| profit | real | bénéfice brut de la vente |
| note | text | facultatif |
| sold_at | timestamp | indexé (filtres par date) |
| created_at | timestamp | |

### sale_items
| Colonne | Type | Notes |
| --- | --- | --- |
| id | text | PK |
| business_id | text | → businesses, cascade, indexé |
| sale_id | text | → sales, cascade, indexé |
| product_id | text | → products, `set null` |
| product_name | text | copie figée du nom au moment de la vente |
| quantity | real | |
| unit_price | real | prix de vente unitaire appliqué |
| unit_cost | real | prix d'achat unitaire au moment de la vente |
| total | real | `unit_price × quantity` |
| profit | real | `(unit_price − unit_cost) × quantity` |

### expenses
`id`, `business_id` (indexé), `description`, `category` (défaut `Autres`),
`amount` (real), `spent_at` (indexé), `created_at`.

### Relations

```
user ──1:1── profiles ──n:1── businesses ──1:n── categories ──1:n── products
                                   │                                    │
                                   ├──1:n── customers ──1:n── sales ────┤
                                   │                            │       │
                                   ├──1:n── expenses            └──1:n── sale_items
```

Chaque table métier porte `business_id` : aucune donnée n'existe hors d'une entreprise.
`sale_items` porte aussi `business_id` (dénormalisé) pour que les rapports puissent filtrer
sans jointure et pour éviter toute fuite entre entreprises.

### Règles métier appliquées côté serveur
- Enregistrement d'une vente : transaction unique qui crée `sales` + `sale_items`,
  **décrémente le stock** de chaque produit et calcule le bénéfice brut.
- Vente refusée si le stock disponible est insuffisant (message en français).
- Annulation d'une vente : le stock est **remis** dans le catalogue.
- Suppression d'une catégorie : les produits liés passent à « sans catégorie »
  (aucune suppression en cascade des produits).

---

## 4. Sécurité et isolation (équivalent RLS)

Il n'y a pas d'accès direct à la base depuis le navigateur : le frontend ne parle qu'à l'API.
L'isolation est appliquée au seul endroit qui compte, le serveur.

- `packages/web/src/api/middleware/auth.ts` expose trois procédures :
  - `withUser` — session facultative,
  - `authed` — rejette les appels sans session (`Session expirée. Reconnectez-vous.`),
  - `business` — résout `businessId` **depuis la session uniquement**, via `profiles.user_id`.
- Aucun `businessId` fourni par le client n'est jamais utilisé, dans aucune route.
- Toute lecture, écriture, modification et suppression filtre sur
  `business_id = context.businessId`. Modifier un identifiant dans l'URL ou dans la requête
  renvoie « introuvable » : les données d'une autre entreprise sont inatteignables.
- Aucun secret n'est exposé au frontend : seules les variables préfixées `VITE_` sont
  envoyées au navigateur (identifiant d'application et émetteur d'authentification, tous
  deux publics par nature).
- Les mots de passe sont hachés par Better Auth ; les sessions web utilisent des cookies
  `httpOnly`, l'application mobile un jeton Bearer stocké dans le coffre sécurisé
  (`expo-secure-store`).

---

## 5. Variables d'environnement

Elles vivent dans le fichier `.env` **à la racine** du projet (gitignoré) et sont
provisionnées automatiquement par la plateforme. `.env.template` en liste les clés.

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | URL de la base (Turso/SQLite) |
| `DATABASE_AUTH_TOKEN` | Jeton d'accès à la base |
| `BETTER_AUTH_SECRET` | Signature des sessions et des jetons |
| `WEBSITE_URL` | URL publique du site (liens d'e-mail, redirections OAuth) |
| `APPLICATION_ID` | Identifiant de l'application côté plateforme |
| `VITE_APPLICATION_ID` | Idem, exposé au client (public) |
| `VITE_RUNABLE_AUTH_ISSUER` | Émetteur de la connexion Google managée (public) |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Stockage de fichiers (non utilisé en V1) |
| `AI_GATEWAY_BASE_URL`, `AI_GATEWAY_API_KEY` | Passerelle IA (non utilisée en V1) |
| `NODE_ENV`, `PORT` | Environnement et port du serveur (défaut `4200`) |

Aucune clé Google à fournir : la connexion Google passe par l'authentification managée.

---

## 6. Lancer le projet en local

```bash
bun install                 # dépendances
bun run db:push             # créer / mettre à jour les tables
bun run dev                 # web      → http://localhost:4200
bun run dev:mobile          # mobile   → http://localhost:4300 (ou Expo Go via QR code)
```

Contrôles qualité :

```bash
bun run lint                # conventions + oxlint
bun run typecheck           # TypeScript (3 paquets)
bun run build               # build de production
```

Mise en production : la publication du site et le domaine personnalisé se font depuis
l'interface de la plateforme. Pour l'APK/AAB/IPA, utiliser le bouton de publication du
tableau de bord de l'aperçu mobile (ne jamais lancer un build natif dans le bac à sable).

---

## 7. Premier démarrage (parcours de test)

1. `/register` — nom complet, email, mot de passe (ou « Continuer avec Google »).
2. `/onboarding` — nom du commerce et téléphone. Six catégories sont créées d'office :
   Alimentation, Boissons, Hygiène, Électronique, Vêtements, Autres.
3. `/products` — ajouter un produit (prix d'achat, prix de vente, stock, seuil d'alerte).
4. `/sales` → « Nouvelle vente » — le stock se décrémente et le bénéfice s'affiche.
5. `/dashboard` et `/reports` — chiffre d'affaires, bénéfice brut et net, dépenses,
   nombre de ventes, de produits et de clients, alertes de stock, graphiques.

Le compte démarre **vide** : aucune donnée de démonstration n'est injectée, conformément au
choix fait au lancement du projet. Les données saisies sont donc toujours de vraies données.

---

## 8. Hors périmètre V1

Aucun système de paiement ni d'abonnement, conformément au cahier des charges.
Le rôle `staff` existe en base mais l'invitation d'employés n'est pas exposée dans l'interface.
