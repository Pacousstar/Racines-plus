# 🌳 Racines+ — État des Lieux Stratégique (Mars 2026)

Ce document présente une vision consolidée de l'état d'avancement du projet **Racines+**. Il identifie ce qui est opérationnel, ce qui est en cours et les priorités absolues pour la Phase 3.

---

## 🏛️ MODULE A : Fondations, Utilisateurs & Validation
*Le cœur battant du système : identité, rôles et workflow de modération.*

| Composant | Statut | Détails Techniques |
| :--- | :--- | :--- |
| **Authentification** | ✅ Opérationnel | Login, Inscription, Session Supabase (`/login`) |
| **Onboarding** | ✅ Opérationnel | Capture des données profil multi-étapes (`/onboarding`) |
| **Profil Complet** | ✅ Opérationnel | Édition avancée (études, emploi, enfants) via `EditProfileModal` |
| **Workflow CHOa** | ✅ Opérationnel | Pré-validation des membres du quartier (Statut: `probable`) |
| **Workflow CHO** | ✅ Opérationnel | Validation finale et bascule patrimoniale (Statut: `confirmed`) |
| **Admin Dashboard** | ✅ Opérationnel | 10 onglets de pilotage (KPIs, Rôles, Villages, Audit, Crise 2010) |

---

## 🌳 MODULE B : Arbre, Communauté & Mémoire
*L'expérience utilisateur et la sauvegarde du patrimoine familial.*

| Composant | Statut | Détails Techniques |
| :--- | :--- | :--- |
| **Arbre Interactif** | ✅ Opérationnel | Visualisation Neo4j, zoom, filtres, ajout d'ancêtres |
| **Arbre Pyramidal** | ✅ Opérationnel | Vue structurée par générations |
| **Export Arbre** | ✅ Opérationnel | Génération de PDF Premium HD et images PNG |
| **Carte Mondiale** | ✅ Opérationnel | Géolocalisation de la diaspora via Leaflet/OpenStreetMap |
| **Archives Médias** | ✅ Opérationnel | Coffre-fort numérique (actes photos) avec Storage sécurisé |
| **Mémorial 2010** | ✅ Opérationnel | Inscription des victimes et marquage visuel dans l'arbre |
| **Annuaire** | ✅ Opérationnel | Moteur de recherche de talents et filtrage "Diaspora/Local" |
| **Messagerie** | ✅ Opérationnel | Système de communication interne entre membres et chefs |

---

## 🔬 MODULE C : Intelligence, Sécurité & Futur (En Cours)
*L'élévation technologique et la fiabilisation du système.*

### 🛡️ Sécurité & Infrastructure
| Fonctionnalité | Statut | Point de Vigilance |
| :--- | :--- | :--- |
| **RLS Supabase** | ✅ Fait | Sécurité niveau ligne sur toutes les tables sensibles |
| **Journal d'Audit** | ✅ Fait | Traçabilité complète "Qui a fait quoi" (`v_audit_trail_admin`) |
| **Middleware Serveur** | ❌ À faire | Protection des routes `/admin`, `/cho` via `middleware.ts` |
| **Vérification Email** | ❌ À faire | Double opt-in pour limiter les faux comptes |

### 🧠 Intelligence Artificielle & IA
| Fonctionnalité | Statut | Solution Recommandée |
| :--- | :--- | :--- |
| **Transcription Audio** | ❌ À faire | Intégration DeepSeek / Whisper (témoignages oraux) |
| **OCR (Actes)** | ❌ À faire | Lecture automatique d'actes de naissance scannés |
| **Détection Doublons** | ❌ À faire | Algorithme de rapprochement IA (Moteur de fusion) |

---

## 🔴 PRIORITÉS IMMÉDIATES (ALERTES CRITIQUES)

1.  **Tests Automatisés (Zéro existant)** : Nécessité vitale d'implémenter des tests E2E (Playwright) pour sécuriser le workflow critique.
2.  **Relations Neo4j** : L'arbre doit évoluer pour supporter la **famille élargie** (Polygamie, Fratrie, Oncles/Tantes).
3.  **Middleware** : Sécuriser les accès serveurs pour ne pas dépendre uniquement du client.
4.  **Bug Poste/Cache** : Résoudre le problème de colonne `poste` manquante empêchant la création d'assistants.

---
*Document de pilotage — Mis à jour le 06 mars 2026*
