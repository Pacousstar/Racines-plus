# AUDIT COMPLET — RACINES+ MVP

**Date :** 25 Mai 2026  
**Version :** 0.1.0  
**Pilote :** Toa-Zéo, Côte d'Ivoire  
**Auteur :** Audit technique

---

## SOMMAIRE

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack Technique](#2-stack-technique)
3. [Architecture du Projet](#3-architecture-du-projet)
4. [Base de Données Supabase](#4-base-de-données-supabase)
5. [Neo4j — Graphe Généalogique](#5-neo4j--graphe-généalogique)
6. [API Routes](#6-api-routes)
7. [Pages & Composants](#7-pages--composants)
8. [Sécurité](#8-sécurité)
9. [État du Projet — Lint & Build](#9-état-du-projet--lint--build)
10. [Points de Blocage & Risques](#10-points-de-blocage--risques)
11. [Recommandations pour la Scalabilité](#11-recommandations-pour-la-scalabilité)

---

## 1. VUE D'ENSEMBLE

Racines+ est une plateforme de généalogie interactive et souveraine destinée à la diaspora africaine. Le MVP est actuellement en phase pilote avec le village de **Toa-Zéo** (Région du Guémon, Côte d'Ivoire).

### Objectif

```
Préserver, valider et transmettre l'histoire des lignées Africaines
sur 50 ans via une forteresse numérique souveraine.
```

### Workflow de validation des profils

```
Inscription → statut: pending_choa
    ↓
CHOa (Chef de Quartier) pré-valide → statut: pending
    ↓
CHO (Chef de Village) valide/rejette → statut: confirmed / rejected
    ↓
Si confirmé → accès complet (arbre, documents, certificat, annuaire)
```

### Chiffres clés (projet)
- ~50 fichiers source TypeScript/TSX
- ~29 composants React
- ~24 endpoints API
- ~23 migrations SQL
- ~1 base Neo4j (graphe)
- 0 test automatisé
- 0 erreur de build TypeScript (compilation ok)
- **64 erreurs lint, 49 warnings**

---

## 2. STACK TECHNIQUE

| Couche | Technologie | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **UI** | React | 19.2.3 |
| **Langage** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | v4 |
| **Auth** | Supabase Auth (email/password) | @supabase/ssr 0.8.0 |
| **DB Principale** | Supabase (PostgreSQL) | via @supabase/supabase-js 2.97.0 |
| **Graphe** | Neo4j AuraDB | via neo4j-driver 6.0.1 |
| **Storage** | Supabase Storage (avatars, archives, media) | — |
| **Cartographie** | Leaflet + react-leaflet | 1.9.4 / 5.0.0 |
| **IA** | DeepSeek API + Whisper (fallbacks mock) | — |
| **Email** | Resend API | — |
| **PDF** | html2canvas + jsPDF | 1.4.1 / 4.2.0 |
| **Icônes** | Lucide React | 0.575.0 |
| **Notifications** | react-hot-toast | 2.6.0 |
| **Déploiement** | Vercel (région cdg1) | — |
| **PWA** | Manifest + beforeinstallprompt | — |

---

## 3. ARCHITECTURE DU PROJET

```
racines-mvp/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Landing page
│   │   ├── layout.tsx                # Root layout (SEO, Toaster)
│   │   ├── globals.css               # Tailwind v4
│   │   ├── middleware.ts             # Auth + RBAC
│   │   ├── admin/                    # Dashboard Admin (10 onglets)
│   │   ├── cho/                      # Dashboard CHO (Chef Village)
│   │   ├── choa/                     # Dashboard CHOa (Chef Quartier)
│   │   ├── dashboard/                # Dashboard User
│   │   ├── annuaire/                 # Annuaire membres
│   │   ├── evenements/               # Calendrier
│   │   ├── onboarding/               # Inscription 8 étapes
│   │   ├── login/                    # Connexion
│   │   ├── auth/confirm/             # Confirmation email
│   │   ├── cgu/                      # CGU
│   │   ├── charte/                   # Charte confidentialité
│   │   ├── politique-confidentialite/ # RGPD
│   │   └── api/                      # 24 endpoints API
│   ├── components/                   # 29 composants React
│   ├── hooks/                        # useRoleRedirect
│   └── lib/                          # supabase.ts, neo4j.ts, countries.ts
├── supabase/                         # 23 fichiers SQL migrations
├── docs/                             # Documentation
├── public/                           # Assets statiques
└── scripts/                          # Scripts de diagnostic et seed
```

---

## 4. BASE DE DONNÉES SUPABASE

### Tables actives

| Table | Rôle | Lignes estimées | RLS |
|---|---|---|---|
| `profiles` | Profils utilisateurs (centrale, ~50 colonnes) | ~100 | ✅ Oui |
| `villages` | Villages (Toa-Zéo + autres) | ~5 | ✅ Lecture publique |
| `quartiers` | Quartiers par village | ~10 | ✅ Lecture publique |
| `ancestres` | Ancêtres (legacy, déconnectée de Neo4j) | ~20 | ✅ Lecture publique |
| `admin_permissions` | Permissions des admins assistants | ~5 | ✅ Oui |
| `activity_logs` | Journal d'audit | ~500 | ✅ Oui |
| `validations` | Ancien système de validation | ~0 | ✅ Oui |
| `validation_comments` | Commentaires de validation | ~50 | ✅ Oui |
| `notifications` | Notifications utilisateurs | ~100 | ✅ Oui |
| `internal_messages` | Messagerie interne | ~50 | ✅ Oui |
| `memorial_victims` | Mémorial crise 2010 | ~30 | ✅ Oui |
| `link_validations` | Fiabilité des liens Neo4j | ~0 | ✅ Oui |
| `village_heritage` | Patrimoine village (slogan, coutumes) | ~1 | ✅ Oui |
| `invitations` | Invitations par email | ~10 | ✅ Oui |
| `documents` | Documents uploadés | ~0 | ✅ Oui |

### Colonnes `profiles` (table la plus critique)

~50 colonnes dont : `id`, `email`, `first_name`, `last_name`, `gender`, `birth_date`, `role`, `status`, `village_origin`, `quartier_nom`, `quartiers_assignes[]`, `avatar_url`, `phone_1/2`, `whatsapp_1/2`, `residence_city/country`, `niveau_etudes`, `diplomes`, `emploi`, `fonction`, `retraite`, `nombre_enfants`, `details_enfants JSONB`, `adresse_residence`, `is_ambassadeur`, `export_authorized/requested`, `certificate_requested/issued/issued_at`, `choa_approvals[]`, `poste`, `rejection_motif/observations`, `ancestral_root_id`, `metadata JSONB`, `created_at`, `updated_at`, `is_founder`.

### Politiques RLS critiques

```sql
-- Accès total à son propre profil
CREATE POLICY "profil_acces_soi_meme" 
ON public.profiles FOR ALL 
USING (auth.uid() = id);

-- Accès lecture pour management (Admin, CHO, CHOa)
CREATE POLICY "profil_acces_management" 
ON public.profiles FOR SELECT 
USING (public.is_admin_or_management(auth.uid()));
```

### Fonctions SECURITY DEFINER

- `public.is_admin_or_management(user_id UUID)` → BOOLEAN
- `public.check_admin_access(user_id UUID)` → BOOLEAN
- `public.check_choa_access(target_profile_id UUID)` → BOOLEAN
- Trigger `log_activity()` sur INSERT/UPDATE/DELETE profiles

---

## 5. NEO4J — GRAPHE GÉNÉALOGIQUE

### Driver (singleton)

```typescript
// src/lib/neo4j.ts
const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(...))
export async function getSession() { return driver.session() }
```

### Nœuds créés à l'inscription

- `Person { id, firstName, lastName, village, isFounder }` → utilisateur
- `Person { id, firstName, lastName, birthYear, status, isVictim }` → parent
- Relations : `FATHER_OF`, `MOTHER_OF`

### Endpoints Neo4j

| Endpoint | Action |
|---|---|
| `GET /api/tree` | Sous-graphe (depth 2, limit 200) |
| `POST /api/ancestors` | Ajout ancêtre/parent/conjoint + link_validations |
| `POST /api/merge-nodes` | Fusion nœuds doublons |
| `POST /api/genealogy/position` | Heuristique position (dates, quartier, phonétique, fondateur) |

---

## 6. API ROUTES

### Endpoints d'authentification & profil

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/api/register` | POST | Public | Inscription complète (Auth + profil + avatar + Neo4j + email) |
| `/api/me` | GET | Auth | Profil complet (service_role bypass RLS) |
| `/api/check-invites` | POST | Public | Vérifie si emails sont déjà inscrits |
| `/api/send-invitation` | POST | CHO+ | Email invitation via Resend |

### Endpoints généalogiques

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/api/tree` | GET | Auth | Arbre Neo4j |
| `/api/ancestors` | POST | User+ | Ajout ancêtre Neo4j |
| `/api/merge-nodes` | POST | CHO/Admin | Fusion doublons Neo4j |
| `/api/genealogy/position` | POST | Auth | Heuristique position |

### Endpoints admin

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/api/admin/profiles` | GET | Admin | Tous les profils |
| `/api/admin/create-assistant` | POST | Admin | Création assistant admin |
| `/api/admin/delete-user` | POST | Admin | Suppression utilisateur |
| `/api/admin/reset-pending-choa` | POST | Admin | Reset statuts |
| `/api/admin/victims` | GET | Admin | Victimes (Neo4j + Supabase) |

### Endpoints CHO/CHOa

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/api/cho/profiles` | GET | CHO | Profils du village |
| `/api/choa/profiles` | GET | CHOa+ | Profils du quartier |
| `/api/choa/activity` | GET | CHOa+ | Activité récente |

### Endpoints IA (tous avec fallbacks mock)

| Endpoint | Méthode | Description |
|---|---|---|
| `/api/ai/analyze-heritage` | POST | Analyse récit oral (DeepSeek) |
| `/api/ai/transcribe` | POST | Transcription audio (Whisper) |
| `/api/ai/ocr` | POST | OCR document (DeepSeek Vision) |
| `/api/ai/storytelling` | POST | Narration Griot (DeepSeek) |

---

## 7. PAGES & COMPOSANTS

### Pages

| Route | Rôle | Description |
|---|---|---|
| `/` | Public | Landing page (Hero, Concept, Diaspora, Certification, Pyramide) |
| `/login` | Public | Connexion + mot de passe oublié |
| `/onboarding` | Public | Inscription 8 étapes (multistep) |
| `/dashboard` | User | Dashboard principal (arbre, migrations, docs, médias) |
| `/admin` | Admin | 10 onglets : Overview, Comptes, Villages, Validations, Audit... |
| `/cho` | CHO | Dashboard Chef de Village (validations, statistiques, messagerie) |
| `/choa` | CHOa | Dashboard Chef de Quartier (pré-validations, activité) |
| `/annuaire` | Confirmé+ | Annuaire des membres avec filtres |
| `/evenements` | Auth | Calendrier des événements |

### Composants principaux (29 total)

| Composant | Lignes | Description |
|---|---|---|
| `UserDashboardContent.tsx` | ~1000+ | Dashboard user central (arbre, migrations, docs, médias) |
| `PersonalLineageTree.tsx` | ~400 | Arbre Neo4j visuel (nœuds circulaires, 3 thèmes) |
| `PyramidTree.tsx` | ~300 | Arbre pyramidal par générations |
| `FamilyBook.tsx` | ~500 | Livre de famille A4 export PDF |
| `AppLayout.tsx` | ~95 | Layout sidebar + topbar |
| `Sidebar.tsx` | ~232 | Navigation latérale par rôle |
| `InternalMessaging.tsx` | ~300 | Messagerie inter-rôles |
| `MigrationMap.tsx` | ~200 | Carte Leaflet migrations |
| `AdminDashboard` (page.tsx) | ~1500+ | Dashboard admin complet |

---

## 8. SÉCURITÉ

### Points forts
- ✅ **Row Level Security (RLS)** sur toutes les tables
- ✅ **Fonctions SECURITY DEFINER** pour éviter la récursion RLS
- ✅ **Service Role Key** côté serveur (bypass RLS contrôlé)
- ✅ **Middleware RBAC** : protection par rôle (admin/cho/choa/user)
- ✅ **Headers sécurité** : HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- ✅ **E-mail confirmé** obligatoire avant accès complet
- ✅ **Pas de source maps** en production
- ✅ **Powered-By header** supprimé

### Points faibles
- ⚠️ **2 middlewares présents** : `src/middleware.ts` (actif) + `src/lib/supabase/middleware.ts` (obsolète, non utilisé, devrait être supprimé)
- ⚠️ **Super Admin hardcodé** : `isSuperAdmin` basé sur le nom "pacous" ou email "pacous2000@gmail.com"
- ⚠️ **Fallbacks IA mock** : les endpoints IA renvoient des données simulées si les clés API ne sont pas configurées
- ⚠️ **Aucune rate limiting** sur les endpoints API
- ⚠️ **Aucune validation CSRF** côté client
- ⚠️ **Neo4j credentials** en clair dans `.env.local`

---

## 9. ÉTAT DU PROJET — LINT & BUILD

### Résultat `npm run lint`

```
✖ 64 errors, 49 warnings

Répartition des erreurs :
├── @typescript-eslint/no-explicit-any  → 12 erreurs
├── react/no-unescaped-entities        → ~30 erreurs (apostrophes dans JSX)
├── react-hooks/refs                   → 2 erreurs (src/app/page.tsx:319)
├── react/jsx-no-undef                 → 1 erreur (UserDashboardContent:311)
├── @typescript-eslint/no-require-imports → 3 erreurs (make_transparent.js)
└── @next/next/no-img-element          → 12 warnings
```

### Fichiers les plus problématiques

| Fichier | Erreurs | Warnings |
|---|---|---|
| `src/app/admin/page.tsx` | 6 | 10 |
| `src/app/charte/page.tsx` | 22 | 0 |
| `src/app/cho/page.tsx` | 4 | 3 |
| `src/app/choa/page.tsx` | 0 | 14 |
| `src/components/UserDashboardContent.tsx` | 1 | 4 |
| `src/components/PersonalLineageTree.tsx` | 5 | 3 |

### Problèmes bloquants identifiés

1. **`src/app/page.tsx:319`** — `react-hooks/refs`: accès à `conceptRef.current` pendant le render (footer), doit être dans un event handler
2. **`src/components/UserDashboardContent.tsx:311`** — `TreeSpecimens` n'est pas importé
3. **`src/app/charte/page.tsx`** — 22 erreurs d'apostrophes non échappées

---

## 10. POINTS DE BLOCAGE & RISQUES

### Blocants (priorité haute)

| # | Problème | Impact | Sévérité |
|---|---|---|---|
| 1 | **Aucun test automatisé** (unit, intégration, E2E) | Risque de régression à chaque modif | 🔴 Critique |
| 2 | **64 erreurs lint**, dont 2 refs invalides (React 19) | Comportement potentiellement cassé | 🟠 Élevé |
| 3 | **`TreeSpecimens` non importé** dans UserDashboardContent | Crash à l'exécution de l'onglet arbre | 🟠 Élevé |
| 4 | **IA en fallback mock** (DeepSeek, Whisper) | Fonctionnalités IA non fonctionnelles en prod | 🟠 Élevé |

### Risques techniques

| # | Problème | Impact | Sévérité |
|---|---|---|---|
| 5 | **Pas de monitoring / logging centralisé** | Impossible de diagnostiquer les erreurs en prod | 🟠 Élevé |
| 6 | **Pas de CI/CD** (seulement déploiement Vercel manuel) | Risque de déploiement cassé | 🟠 Élevé |
| 7 | **2 middlewares** dont 1 obsolète | Confusion, maintenance | 🟡 Moyen |
| 8 | **50 colonnes dans `profiles`** (dénormalisation excessive) | Complexité, performances | 🟡 Moyen |
| 9 | **Aucune pagination API** pour la plupart des endpoints | Risque RAM/CPU avec +1000 utilisateurs | 🟡 Moyen |
| 10 | **Neo4j driver singleton non géré** (pas de pool, pas de reconnexion) | Crash si Neo4j down | 🟡 Moyen |
| 11 | **Hardcodage Super Admin** basé sur email/nom | Risque sécurité, non scalable | 🟡 Moyen |
| 12 | **Seed test avec mot de passe partagé** `Racines2026!` | Risque sécurité | 🟡 Moyen |
| 13 | **Pas de documentation API** (Swagger/OpenAPI) | Difficile pour nouveaux contributeurs | 🟢 Faible |
| 14 | **Fichier binaire** `supabase/request_export_col.sql` | Impossible à versionner | 🟢 Faible |

---

## 11. RECOMMANDATIONS POUR LA SCALABILITÉ

### Phase 1 — Assainissement (urgent)

1. **Corriger les 64 erreurs lint**
   - Remplacer les `any` par des types concrets
   - Échapper les apostrophes dans le JSX (`&apos;`)
   - Corriger l'accès aux refs dans `page.tsx` (footer)
   - Importer `TreeSpecimens` dans `UserDashboardContent`

2. **Nettoyer le code mort**
   - Supprimer `src/lib/supabase/middleware.ts` (obsolète)
   - Supprimer le fichier binaire `supabase/request_export_col.sql`
   - Supprimer les variables non utilisées dans les composants

3. **Tests automatisés**
   - Mettre en place Vitest ou Jest pour les tests unitaires
   - Playwright pour les tests E2E (au moins le flow d'inscription)
   - Configurer un hook pre-commit (husky + lint-staged)

### Phase 2 — Infrastructure & Monitoring

4. **CI/CD**
   - Configurer GitHub Actions : lint → build → test → deploy
   - Branches : `main` (prod), `develop` (staging)

5. **Monitoring**
   - Ajouter Sentry ou Highlight pour le monitoring d'erreurs
   - Logs structurés côté serveur (pino, winston)
   - Dashboard Vercel Analytics

6. **Rate Limiting**
   - Implémenter rate limiting sur les endpoints critiques (`/api/register`, `/api/ai/*`)

### Phase 3 — Architecture & Scalabilité

7. **Base de données**
   - Revoir le schéma `profiles` : normaliser les colonnes en tables satellites
   - Ajouter des index sur les colonnes fréquemment filtrées (`role`, `status`, `village_origin`)
   - Mettre en place la pagination sur TOUS les endpoints API
   - Activer Supabase Realtime uniquement sur les tables qui en ont besoin

8. **Neo4j**
   - Implémenter un connection pool robuste avec retry
   - Ajouter un healthcheck
   - Indexer les nœuds sur `id`, `firstName`, `lastName`, `village`

9. **Cache**
   - Implémenter un cache Redis (Upstash) pour :
     - Les résultats de l'arbre généalogique (fréquents)
     - Les stats admin
     - Les sessions (complément Supabase Auth)

10. **API**
    - Versionner l'API (`/api/v1/...`)
    - Ajouter une documentation OpenAPI/Swagger
    - Standardiser les réponses (format `{ success, data, error }`)

### Phase 4 — Fonctionnalités & Scale

11. **Multi-villages**
    - Rendre le système agnostique du village Toa-Zéo
    - Interface d'administration multi-village
    - Dashboard par région/département

12. **Performance**
    - Implémenter le SSR/ISR pour les pages publiques
    - Lazy loading des composants lourds (Leaflet, html2canvas)
    - Optimiser les images Next.js (remotePatterns déjà configuré)

13. **Sécurité renforcée**
    - Remplacer le hardcodage Super Admin par un flag `is_super_admin` en base
    - Ajouter 2FA pour les rôles admin/cho
    - Audit de sécurité externe

14. **IA en production**
    - Intégrer DeepSeek et Whisher sans fallback mock
    - File d'attente (Queue) pour les traitements IA longs
    - Cache des résultats IA

### Phase 5 — Scale horizontal

15. **Déploiement multi-régions** pour réduire la latence (actuellement cdg1 uniquement)
16. **Base de données read replicas** pour les requêtes de lecture lourdes (annuaire, arbres)
17. **Edge Functions** Supabase pour les traitements légers près des utilisateurs
18. **Indexation full-text** sur les profils pour la recherche dans l'annuaire

---

## RÉSUMÉ EXÉCUTIF

```
État général :       🟡 MVP fonctionnel mais fragile
Qualité du code :    60% (64 erreurs lint, 49 warnings)
Couverture de tests : 0%
Sécurité :           75% (RLS ok, middlewares ok, hardcodage à corriger)
Scalabilité :        40% (pas de cache, pas de pagination, pas de CI/CD)
Performance :        50% (pas d'optimisation, pas de lazy loading)
Documentation :      40% (API non documentée, architecture dispersée)
```

**Actions immédiates :** corriger les erreurs lint bloquantes (refs, imports manquants) et supprimer le code mort.  
**Action prioritaire (scalabilité) :** implémenter la pagination API et normaliser le schéma `profiles`.
