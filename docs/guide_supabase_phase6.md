# 🛠️ Guide: Création Manuelle de la Base de Données (Phase 6)

Puisque vous préférez procéder à la main pour garder le contrôle total sur votre infrastructure Supabase (une excellente pratique !), voici exactement ce que vous devez créer depuis votre tableau de bord Supabase (`app.supabase.com`).

---

## Étape 1 : Création des Buckets (Dossiers de stockage)
1. Allez dans le menu **Storage** (icône de boîte/disque dur à gauche).
2. Cliquez sur le bouton vert **"New Bucket"**.
3. **Bucket 1 (Archives offcielles)** :
   - Nommez-le `archives`.
   - Laissez la case *Public bucket* **décochée** (C'est privé).
   - Cliquez sur Save.
4. **Bucket 2 (Photos/Vidéos de famille)** :
   - Nommez-le `media`.
   - Laissez *Public bucket* **décoché**.
   - Cliquez sur Save.

---

## Étape 2 : Création de la Table `documents`
1. Allez dans le menu **Table Editor** (icône de tableau croisé à gauche).
2. Cliquez sur le bouton vert **"Create a new table"**.
3. Remplissez comme suit :
   - **Name** : `documents`
   - **Enable Row Level Security (RLS)** : Laissez cette case *cochée* ✅.
   - **Enable Realtime** : Laissez décoché.
4. Dans la section **Columns**, ajoutez ces colonnes exactement comme suite (cliquez sur "Add column") :
   - `id` : Type `uuid` (Il y est déjà normalement, laissez le default sur `uuid_generate_v4()`).
   - `created_at` : Type `timestamp with time zone` (Déjà présent).
   - `user_id` : Type `uuid` (Cliquez sur le lien "Add foreign key relation" (icône maillon), sélectionnez la table `profiles` et la colonne `id`. Pour "Action on delete", choisissez `Cascade`). **Cochez Is Nullable en FO (rendre obligatoire).**
   - `title` : Type `text`.
   - `file_url` : Type `text`.
   - `file_type` : Type `text`.
   - `bucket_name` : Type `text`.
   - `is_public` : Type `boolean`, Default value = `false`.
5. Cliquez sur **Save** en bas à droite.

---

## Étape 3 : Création des Politiques de Sécurité (RLS)
*C'est la partie la plus critique pour que les utilisateurs puissent uploader leurs fichiers.*

1. Allez dans **Authentication** > **Policies** (ou cliquez sur votre table `documents` > bouton RLS en haut à droite).
2. Pour la table `documents`, cliquez sur **New Policy**.
   - Choisissez **"For full customization"**.
   - **Policy Name** : `L'utilisateur gère ses documents`
   - **Allowed operation** : `ALL`
   - **Target roles** : `authenticated`
   - **USING expression** : `auth.uid() = user_id`
   - **WITH CHECK expression** : `auth.uid() = user_id`
   - Cliquez sur Save.

*(Ceci garantit que personne ne peut lire ni modifier les actes de naissance de quelqu'un d'autre, sauf lui-même ! Les admins n'en ont de toute façon pas besoin depuis leur backoffice direct Supabase).*

**C'est tout ! Confirmez-moi quand vous aurez cliqué partout et que les tables/buckets sont prêts dans Supabase !**

oui c'est prêt et en mode privé.