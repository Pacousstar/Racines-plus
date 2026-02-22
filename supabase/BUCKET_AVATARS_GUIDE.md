# 🪣 Créer le Bucket Supabase Storage `avatars`

> **Durée estimée** : 5–10 minutes  
> **Niveau sécurité** : Données privées (upload propriétaire uniquement, lecture publique pour affichage)

---

## Étape 1 — Créer le bucket

1. Ouvrir [supabase.com](https://supabase.com) → votre projet
2. Menu gauche → **Storage**
3. Cliquer **"New bucket"**
4. Remplir :
   - **Name** : `avatars`  
   - **Public bucket** : ✅ **Oui** (les images d'avatar doivent être accessibles pour affichage)
   - **File size limit** : `5 MB`
   - **Allowed MIME types** : `image/jpeg, image/png, image/webp`
5. Cliquer **"Save"**

---

## Étape 2 — Configurer les politiques RLS du Storage

Dans **Storage → Policies**, cliquer **"New policy"** pour le bucket `avatars`.

> ⚠️ Créer ces 4 politiques UNE PAR UNE via **"For full customization"**

### Politique 1 — Lecture publique (affichage des avatars)
```sql
-- Nom : "Public Avatar Read"
-- Opération : SELECT

CREATE POLICY "Public Avatar Read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### Politique 2 — Upload par le propriétaire uniquement
```sql
-- Nom : "Owner Avatar Upload"
-- Opération : INSERT

CREATE POLICY "Owner Avatar Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```
> L'image doit être uploadée dans le chemin `avatars/{user_id}.{ext}` — ce qui est déjà le cas dans le code.

### Politique 3 — Mise à jour par le propriétaire
```sql
-- Nom : "Owner Avatar Update"
-- Opération : UPDATE

CREATE POLICY "Owner Avatar Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Politique 4 — Suppression par le propriétaire
```sql
-- Nom : "Owner Avatar Delete"
-- Opération : DELETE

CREATE POLICY "Owner Avatar Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Étape 3 — Appliquer via SQL Editor (méthode rapide)

Si vous préférez, exécutez ce bloc unique dans **Supabase → SQL Editor** :

```sql
-- RLS Storage bucket avatars — Racines+
-- À exécuter APRÈS avoir créé le bucket "avatars" manuellement dans Storage UI

-- 1. Lecture publique (affichage avatars)
CREATE POLICY "Public Avatar Read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- 2. Upload uniquement par le propriétaire (chemin = avatars/{uid}.ext)
CREATE POLICY "Owner Avatar Upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Mise à jour uniquement par le propriétaire
CREATE POLICY "Owner Avatar Update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Suppression uniquement par le propriétaire
CREATE POLICY "Owner Avatar Delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Étape 4 — Vérification

1. **Storage → Buckets** → `avatars` doit apparaître avec le cadenas 🔒 "Public"
2. **Storage → Policies** → 4 politiques sur `avatars`
3. **Test** : Aller sur `/dashboard` → cliquer sur la photo de profil → uploader une image JPEG

---

## Comment fonctionne la sécurité

| Action | Qui peut ? |
|---|---|
| Voir une photo d'avatar | **Tout le monde** (publique) |
| Uploader son avatar | Uniquement **l'utilisateur lui-même** (`auth.uid()` = `{uid}` dans le chemin) |
| Modifier son avatar | Uniquement le **propriétaire** |
| Supprimer son avatar | Uniquement le **propriétaire** |
| Accéder aux avatars d'autres | ❌ **Impossible** (chemin imposé par le code) |

> 🔒 **Principe de sécurité** : le chemin du fichier est `avatars/{user_id}.{ext}`. La politique vérifie que `auth.uid()` correspond au premier segment du chemin. Personne ne peut uploader sous l'ID d'un autre utilisateur.
