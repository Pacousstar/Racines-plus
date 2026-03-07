# 🌳 Racines+ : Walkthrough & Suivi d'Évolution

> [!IMPORTANT]
> **RÈGLE STRICTE POUR TOUTES LES IA INTERVENANT SUR CE PROJET :**
> - **UN SEUL ET UNIQUE FICHIER WALKTHROUGH** : N'écrasez pas et ne créez pas de nouveaux fichiers. Ajoutez vos progrès à la suite chronologiquement.
> - **EMPLACEMENT DU WALKTHROUGH** : Le walkthrough doit obligatoirement être enregistré et maintenu synchronisé dans le dossier principal du projet : `c:\Users\GSN-EXPERTISES\Projets\Racines+\racines-mvp\docs\walkthrough.md`.
> - **TOUT EN FRANÇAIS** : Toutes les réflexions, commentaires, notes et documents générés par l'IA doivent être **exclusivement en français** pour en faciliter la compréhension par l'utilisateur.
> - **DATES OBLIGATOIRES** : Chaque nouvelle phase de développement doit être obligatoirement marquée par sa date de réalisation.
> - **COMMIT APRÈS BUILD RÉUSSI** : Après le succès du build de production (`npm run build`), passez directement et automatiquement au commit et push.

---

> [!TIP]
> - **Phase 6 (Archives & Médias)** : ✅ Achevée avec succès.
> - **Phase 14 (Registre & Maintenance)** : ✅ Terminée ce matin.

---

## 📅 Historique des Sessions (Février - Mars 2026)

### ✨ Phase 4 : Arbre, Seeding et Export
> [!NOTE]
> Cette phase s'est concentrée sur la fiabilisation des données, le peuplement de la base, et l'exportation PDF de l'arbre.

1. **📄 Pagination & UX**
   - Mise en place de la pagination client-side (20 éléments/page) sur tous les backoffices (Admin, CHO, CHOa).
2. **🧪 Seeding (Génération de Familles)**
   - Exécution de `scripts/seedFamilles.mjs` pour injecter 45 utilisateurs (Familles Gbéya et Bonyé) avec historiques complexes (décès, diaspora, victimes 2010).
3. **🖼️ Export d'Arbre (Standard & Premium)**
   - **Standard** : PNG de l'arbre (Parents/Enfants/User).
   - **Premium** : PDF A3 HD encadrable remontant à l'ancêtre fondateur avec drapeaux et statuts (design parchemin royal) via `jsPDF` et `html2canvas`.

### 🌍 Phase 5 : Carte Mondiale et Diaspora
> [!NOTE]
> Intégration de la dimension géographique de la famille avec Leaflet et OpenStreetMap.

1. **🗺️ Vraie Carte Mondiale (Leaflet)**
   - Intégration sans clé API via OpenStreetMap.
   - Marker d'Origine (🏡 Toa-Zéo) aux coordonnées absolues.
2. **📍 Géolocalisation Précise par Ville**
   - Implémentation d'un dictionnaire local `CITY_COORDS` ultra-rapide et gratuit pour éclater géographiquement les membres (ex: séparation de Paris et Lyon, Abidjan et Yamoussoukro) au lieu de les empiler sur le centre du pays.
3. **📸 Interactivité et Avatars**
   - Refonte des popups Leaflet : au clic sur un "Pin", affichage élégant des **avatars (photos miniatures)** superposés des membres résidant dans la ville.

---

## 🚀 Phase 6 (En Cours) : 📂 Module "Archives & Médias"

> [!IMPORTANT]
> **Objectif** : Transformer l'arbre en un véritable espace de sauvegarde du patrimoine familial (actes officiels, photos d'époque, vidéos).

### Actions Prévues :
- **Configuration Storage** : Mise en place des buckets Supabase (`archives`, `media`) sécurisés.
- **Ajout de Documents (Preuves)** : Possibilité pour les utilisateurs et CHO d'uploader des actes de naissance, actes de mariage et reconnaissances parentales.
- **Galerie Médias Famille** : Création d'une interface élégante pour partager des photos/vidéos intergénérationnelles (mariages, souvenirs).
- **Optimisation SEO & Perf** : Lazy-loading des images, compression à l'upload pour garder la plateforme ultra-rapide.

---
*Ce document est la source de vérité absolue de l'évolution de Racines+.*

## 9. 📂 Connexion du Module Archives & Médias terminée (Phase 6)
- Création du script SQL (`scripts/phase6_documents.sql` et `phase6_storage_policies.sql`) avec RLS strictes sur la table et le Storage (limites de taille, vérification des types MIME).
- Les composants `DocumentManager` et `MediaGallery` sont complètement connectés à Supabase Storage (`archives` et `media`).
- Implémentation de la génération de "Signed URLs" (liens temporaires de 60s) pour garantir la sécurité absolue des fichiers du coffre privé.
- Upload exclusif par l'auteur et filtrage automatique grâce au RLS.
- Intégration validée dans le Dashboard Utilisateur via un nouveau système d'onglets.
- Optimisation SEO globale (Titres dynamiques, mots-clés, images OpenGraph et metadataBase pour un référencement propre).
- Nouveau build de production passé avec succès (Exit Code 0).

> Le module "Archives et Médias" est désormais pleinement opérationnel et hautement sécurisé sur le Cloud.

## 10. 📖 Module Annuaire Intelligent (Phase 7 - Option B)
- **Base de Données Enrichie** : Création d'un script SQL massif générant 45 profils complets (Gbéya et Bonyé) avec métiers, diplômes et localisations réalistes pour des tests en conditions réelles.
- **Moteur de Recherche Hybride** : Implémentation de la page `/annuaire` combinant recherche textuelle transversale (Nom, Profession, Ville) et "Pilules" de filtrage instantané (Diaspora, Local, Quartier).
- **Interface MemberCard** : Création de la carte de profil (`MemberCard.tsx`) avec un design signalétique (Badges "Diaspora", "Décès") et intégration d'un bouton de contact direct WhatsApp.
- **Sécurisation des Données** : La page restreint fermement son accès. Seuls les Membres Confirmés, les CHO et l'Admin peuvent consulter l'annuaire familial.
- **Intégration Dashboard** : Ajout du portail "L'Annuaire Intelligent" sur l'espace privé de l'utilisateur.
- **Performance** : Build Next.js validé (Exit 0) avec optimisation statique de la page.

## 11. 🛠️ Phase 8 : Fiabilisation Arbre, Carte Mondiale & Audit Trail (03 Mars 2026)
> [!NOTE]
> Cette session s'est concentrée sur la résolution des bugs critiques liés à l'affichage des généalogies, à la géolocalisation et à la persistance des actions de modération.

- **Arbre Généalogique & Dashboard** :
  - **Correction du Fondateur** : Filtrage dynamique de l'ancêtre fondateur associé explicitement au village de l'utilisateur (ex: Toa-Zéo) via la table `ancestres`, éliminant les faux positifs (comme l'affichage de "Pacous STAR").
  - **Optimisation massive (Supabase & Neo4j)** : Regroupement (`batching` avec `.in()`) des requêtes Supabase pour parents/enfants et ajout d'un timeout (5s) sur Neo4j. Les arbres se chargent désormais instantanément sans boucle infinie.
  - **UI Dashboard** : Mention propre "Profil incomplet" introduite pour remplacer le nom générique vide d'un utilisateur dont le first_name est manquant.
- **Carte Mondiale (Diaspora)** :
  - **Villes de Côte d'Ivoire (CI)** : Levée du filtre restrictif bloquant la répartition géographique en CI. Abidjan, Bouaflé, Daloa etc., bénéficient d'un décalage aléatoire optimal (offset) empêchant l'empilement. Pin vert clair attribué aux villes ivoiriennes.
  - **Cartographie CartoDB Voyager** : Transition vers une tuile `Leaflet` de haute qualité affichant tous les noms mondiaux (Maroc, Egypte, Asie...) en caractères latins / français, remplaçant la langue locale d'OpenStreetMap.
  - **Refonte Layout** : Migration vers une architecture visuelle plus épurée : Carte panoramique pleine largeur en haut (`col-span-12`), avec une grille "Top Destinations" alignée nativement en dessous, incluant une légende chromatique élégante.
- **Audit Trail & Persistance (Cho/Choa/Admin)** :
  - **Système d'Audit Complet (v2)** : Centralisation traçable de tous les événements avec historisation via `v_audit_trail_admin`, `v_validations_cho` et `v_validations_quartier`.
  - Implémentation de fonctions PostgreSQL intelligentes (`record_validation`, `log_activity`) stockant durablement les actions.
  - Sécurisation absolue : RLS basés sur les rôles stricts et fin de la perte d'informations lors des reconnexions des chefs.
- **Correctifs Systèmes (Next.js)** :
  - Élimination de `middleware.ts` devenu conflictuel. 
  - Restructuration propre avec création de `proxy.ts` supportant l'App Router Turbo de Next.js.
  - Build validé avec succès sans aucune erreur de routing.

## 12. 🎨 Phase 9 : Refonte Premium Orange & Audit Trail Idempotent (06 Mars 2026)
> [!NOTE]
> Cette session a transcendé l'aspect fonctionnel pour offrir une expérience utilisateur "Wow" et sécuriser le déploiement des politiques SQL.

- **Refonte Visuelle "Wow Factor" (Orange Premium)** :
  - **Dashboard Admin** : Sublimation de la modale "Création Assistant" avec un design Glassmorphism, header orange vibrant, ombres portées douces et micro-animations.
  - **Dashboards CHO & CHOa** : Implémentation d'une identité visuelle luxueuse :
    - Fond dynamique avec **Mesh Gradients** orange/ambre.
    - Cartes de profil translucides (`backdrop-blur-xl`) avec bordures lumineuses et effets de survol interactifs.
    - Modales de commentaires et de rejet restructurées pour une clarté absolue.
    - Animations d'entrée fluides (`animate-in fade-in`) sur tous les éléments clés.
- **Fiabilisation SQL (Audit Trail)** :
  - Correction du script `audit_trail.sql` pour le rendre totalement idempotent. Ajout systématique de `DROP POLICY IF EXISTS` avant chaque création de politique RLS (notamment pour `Validators_View_Own`) afin d'éliminer les erreurs "already exists" lors des ré-exécutions.
- **Maintenance & Qualité** :
  - Réparation des structures de fichiers Next.js (`cho/page.tsx` et `choa/page.tsx`) suite aux refontes esthétiques majeures.
  - Consolidation de la documentation technique et alignement sur la charte graphique Orange.

## 13. 🧬 Phase 10 : Données Parentales Metadata & Harmonisation (07 Mars 2026)
> [!NOTE]
> Cette phase a permis d'intégrer des informations généalogiques cruciales sans modifier le schéma de la base de données, tout en assurant un build de production 100% propre.

- **Intégration des Données Parentales (JSONB Metadata)** :
  - **Backend API** : Modification de `api/register/route.ts` pour capturer et stocker les informations du père et de la mère (noms, prénoms, statuts vitaux, dates de naissance) au sein d'un seul champ `metadata` de type `jsonb`. Cette approche évite d'alourdir la structure de la table `profiles`.
  - **Dashboards (Admin/CHO/CHOa)** : Mise à jour massive des requêtes de sélection pour inclure `metadata`. Refonte des composants `ProfileCard` et des modales de détails pour extraire dynamiquement ces données de manière sécurisée (optional chaining).
- **Harmonisation Visuelle "Certifié ✅"** :
  - Unification de l'affichage du statut dans les trois backoffices. Désormais, tout utilisateur dont le statut est `confirmed` est marqué par un badge **"Certifié ✅"** vert vibrant, renforçant la confiance dans les données validées.
- **Fiabilisation & Build de Production** :
  - **Correction TypeScript** : Résolution de multiples erreurs de typage dans `cho/page.tsx` et `choa/page.tsx`, notamment sur les structures imbriquées de `validations` et les champs optionnels comme `gender` et `birth_date`.
  - **Correction d'Imports** : Ajout des icônes manquantes (ex: `Home` de Lucide) qui bloquaient le build.
  - **Validation Finale** : Succès total du build Next.js local (`npm run build`) avec un rapport vierge d'erreurs, suivi d'un déploiement automatique sur Vercel.
- **Maintenance** :
  - Suppression des scripts de test temporaires (`test_workflow.cjs`, `test_lajorbone.cjs`, etc.) pour garder un environnement de développement propre.

## 14. 🛠️ Phase 11 : Registre Global, Permissions & Maintenance (07 Mars 2026)
> [!NOTE]
> Cette session a résolu 7 points critiques de maintenance demandés par l'utilisateur pour stabiliser le backoffice Admin et renforcer la cohérence des données.

- **Registre Global Admin (Point 1, 2, 5)** :
  - **Affichage des 10 infos clés** : Mise à jour du tableau pour inclure : Photo, Nom/Prénoms, Village/Quartier, Date de naissance, Genre, Lieu de résidence, et Lignée parentale complète.
  - **Lignée Parentale** : Extraction automatique des noms du père et de la mère depuis le champ `metadata` de l'onboarding. Ajout d'un statut "Vivant/Décédé" avec code couleur (Vert/Rouge).
  - **Pagination Intelligente** : Réinitialisation automatique à la page 1 dès qu'un filtre (Recherche, Rôle, Statut, Village) est modifié, évitant les tableaux vides trompeurs.
- **Permissions Assistants (Point 4, 9)** :
  - Bridage du dashboard pour les Assistants Admin. Les onglets et fonctionnalités sont désormais masqués dynamiquement en fonction des permissions reçues (Gestion Assistants, Villages, etc.), sauf pour le Super Admin.
- **Onboarding & Sources (Point 3, 4)** :
  - Confirmation du caractère **obligatoire** des champs parentaux dans le formulaire d'onboarding actuel.
  - Fiabilisation de la sauvegarde dans le champ `metadata` (JSONB) pour garantir que les nouveaux inscrits alimentent correctement le Registre Global.
- **Diagnostic & Redirection (Point 6, 7)** :
  - **Visibilité Franck GOUSSE** : Ajout de logs de diagnostic dans le dashboard CHOa pour tracer les résultats de filtrage par village et identifier pourquoi certains profils pourraient être masqués.
  - **Redirection Pacous STAR** : Implémentation de logs de détection de rôle dans `dashboard/page.tsx` pour comprendre pourquoi la redirection vers `/choa` ne s'est pas déclenchée pour cet utilisateur spécifique.
- **Consolidation UI/UX** :
  - Harmonisation du design des cartes de profil dans CHO et CHOa pour refléter les 10 informations demandées de manière élégante et compacte.
- **Validation Finale** :
  - **Build de Production** : Succès total du build Next.js (`npm run build`) avec Exit Code 0, validant le routage et le typage TypeScript de toutes les nouvelles fonctionnalités.

## 15. 🚀 Phase 12 : Fullstack Functional, Archives & Arbre Enrichi (07 Mars 2026)
> [!NOTE]
> Cette session a permis de rendre l'application "Totalement Fonctionnelle" en résolvant les derniers blocages de navigation et en enrichissant la visualisation de l'arbre.

- **Correctifs de Visibilité & Routing** :
  - **Diagnostic Cross-User** : Identification et résolution du bug de visibilité de Franck GOUSSE via un filtrage `ilike` plus flexible sur les noms de village.
  - **Redirection de Rôle** : Renforcement du middleware de redirection dans `dashboard/page.tsx` pour garantir que les rôles CHO et CHOa (ex: Pacous STAR) atteignent instantanément leur interface dédiée.
- **Arbre Généalogique Personnel (Hybrid Logic)** :
  - **Intégration JSONB Metadata** : Modification de `PersonalLineageTree.tsx` pour extraire automatiquement la lignée parentale du champ `metadata` si les parents n'ont pas encore de compte Racines+. L'arbre n'est plus jamais vide.
- **Module Archives & Médias** :
  - Validation de l'interopérabilité des composants `DocumentManager` et `MediaGallery`.
  - Intégration de l'onglet "Archives" dans le dashboard utilisateur, permettant le téléversement d'actes officiels dans un coffre privé sécurisé.
- **Validation Build de Production** :
  - **Analyse des Chemins Critiques** : Succès total du build Next.js (`npm run build`) en 3.1 minutes. Rapport vierge d'erreurs, validant l'architecture logicielle.

---
**Statut Global : Fullstack Functional 🚀 | Build : Validé ✅**
L'application Racines+ est désormais pleinement opérationnelle pour l'ensemble des rôles.

## 16. 🛠️ Phase 13 : Pagination, Scrollbars & Complétion de Profil (07 Mars 2026)
> [!NOTE]
> Cette session a amélioré l'ergonomie globale des backoffices et mis en place un système d'incitation à la complétion des données utilisateurs.

- **Pagination & Performance** :
    - Implémentation de la pagination (20 éléments/page) dans le dashboard **CHOa** pour tous les onglets (En attente, Transmis, Validés, Rejetés).
    - Ajout de la pagination dans le dashboard **CHO** pour l'onglet "Mon Équipe".
    - Ajout de la pagination dans le dashboard **Admin** pour l'onglet "Gestion des Assistants".
- **Ergonomie & Accessibilité** :
    - Optimisation des tableaux administratifs avec des barres de défilement horizontales (`overflow-x-auto`) et des largeurs minimales pour garantir la lisibilité sur petits écrans.
- **Incitation à la Complétion de Profil** :
    - Ajout d'une **Bannière d'Alerte "Wow"** orange dans le dashboard utilisateur si des informations critiques sont manquantes (Téléphone, Genre, Naissance ou Village par défaut).
    - Intégration d'un bouton d'action directe "Compléter maintenant" ouvrant la modale d'édition.
- **Vérification & Déploiement** :
    - Succès total du build de production (`npm run build`) validé avec TypeScript.
    - Commit et Push automatique vers le dépôt principal.
