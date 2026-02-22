# 🚀 Guide de Déploiement Vercel — Racines+ MVP

## Prérequis

- Compte [Vercel](https://vercel.com) connecté à votre dépôt GitHub/GitLab
- Projet Supabase configuré et SQL exécuté
- Instance Neo4j Aura active

---

## 1. Préparer le dépôt Git

```bash
# Dans le dossier racines-mvp/
git init
git add .
git commit -m "feat: Racines+ MVP v0.1.0 — Phases 1-5 complètes"
git remote add origin https://github.com/votre-user/racines-plus.git
git push -u origin main
```

> **Important :** Le fichier `.env.local` est dans `.gitignore` et ne sera pas pushé. C'est normal.

---

## 2. Importer dans Vercel

1. Aller sur [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → Sélectionner votre dépôt
3. **Framework Preset** : Next.js (détecté automatiquement)
4. **Root Directory** : `racines-mvp`
5. Cliquer **Deploy** (on configurera les env vars à l'étape suivante)

---

## 3. Configurer les Variables d'Environnement

Dans **Vercel → Project Settings → Environment Variables**, ajouter :

| Variable | Valeur | Environnement |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ckrwulvi...supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | (disponible dans Supabase → Settings → API) | Production, Preview |
| `NEO4J_URI` | `neo4j+s://82ff40a9.databases.neo4j.io` | All |
| `NEO4J_USERNAME` | `82ff40a9` | All |
| `NEO4J_PASSWORD` | Votre password Neo4j | All |
| `NEO4J_DATABASE` | `82ff40a9` | All |

> 🔒 **Ne jamais** mettre la `SERVICE_ROLE_KEY` dans une variable `NEXT_PUBLIC_*`.

---

## 4. Réexécuter le Build

Après avoir ajouté les variables, aller dans **Vercel → Deployments → Redeploy**.

---

## 5. Configurer Supabase pour la production

Dans **Supabase → Authentication → URL Configuration** :

- **Site URL** : `https://votre-projet.vercel.app`
- **Redirect URLs** : `https://votre-projet.vercel.app/auth/callback`

---

## 6. Créer le bucket Supabase Storage

1. Aller dans **Supabase → Storage**
2. Créer un nouveau bucket : `avatars`
3. **Public** : ✅ Oui
4. **File size limit** : 5 MB

---

## 7. Exécuter le SQL v2 (si pas encore fait)

Dans **Supabase → SQL Editor**, exécuter :
```
/supabase/phase3_setup.sql
```

---

## Checklist finale

- [ ] Dépôt Git pushé
- [ ] Projet Vercel créé et connecté
- [ ] Variables d'environnement configurées
- [ ] Supabase URLs mises à jour (Auth → URL Configuration)
- [ ] Bucket `avatars` créé dans Supabase Storage
- [ ] SQL v2 exécuté dans Supabase SQL Editor
- [ ] Premier redeploy lancé après config env vars
- [ ] Tester le déploiement avec les 3 rôles (admin, cho, user)

---

## Domaine personnalisé (optionnel)

Dans **Vercel → Project → Domains**, ajouter `racinesplus.ci` ou votre domaine.
