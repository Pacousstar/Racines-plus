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
> **🌟 État Actuel du Projet**
> - **Build de production validé** : Exit code 0 | 19 routes | 0 erreurs.
> - **Phase 5 (Carte Mondiale)** : ✅ Achevée avec succès.
> - **Phase 6 En Cours** : 📂 Module "Archives & Médias".

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
