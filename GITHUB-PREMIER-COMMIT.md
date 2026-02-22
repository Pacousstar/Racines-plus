# Premier commit Racines+ sur GitHub

## Étape 1 — Créer le dépôt sur GitHub (à remplir)

Va sur **https://github.com/new** (ou **Repositories** → **New**).

### Champs à remplir

| Champ | Valeur recommandée | Note |
|-------|--------------------|------|
| **Repository name** | `Racines-plus` ou `racines-plus` | Pas d’espace ni de `+` dans l’URL GitHub ; tirets recommandés. |
| **Description** | `Arbre généalogique numérique à grande échelle — quartier → village → région → diaspora. Racines+, l'Histoire continue avec toi.` | Optionnel mais utile. |
| **Visibility** | **Public** ou **Private** | Public = visible par tous ; Private = toi et collaborateurs. |
| **Initialize this repository with:** | | |
| ☐ Add a README file | **Décocher** | On a déjà un README dans le projet. |
| ☐ Add .gitignore | **Décocher** | On a déjà un .gitignore. |
| ☐ Choose a license | **Choisir si tu veux** (ex. MIT, AGPL) ou laisser **None** pour l’instant. | À décider selon usage (open source ou non). |

Puis cliquer sur **Create repository**.

---

## Étape 2 — Premier commit en local

Ouvre un terminal dans le dossier du projet (`c:\Racines+`) et exécute :

```bash
# Initialiser Git (si pas déjà fait)
git init

# Tout ajouter (respecte .gitignore)
git add .

# Premier commit
git commit -m "Premier commit Racines+ — doc, branding, validation, IA, bonnes pratiques"
```

---

## Étape 3 — Lier au dépôt GitHub et pousser

Sur la page du dépôt créé, GitHub affiche l’URL (HTTPS ou SSH). Utilise-la dans :

```bash
# Remplacer par ton identifiant GitHub et le nom du repo choisi
git remote add origin https://github.com/TON-USERNAME/Racines-plus.git

# Branche principale (souvent main)
git branch -M main

# Premier push
git push -u origin main
```

Si GitHub demande une authentification : mot de passe **personnel** (Personal Access Token) pour HTTPS, ou clé SSH si tu utilises SSH.

---

## Récapitulatif des éléments à remplir sur GitHub

- **Repository name** : `Racines-plus` (ou autre sans espace ni `+`)
- **Description** : (optionnel) phrase sur l’arbre généalogique numérique et le slogan
- **Visibility** : Public ou Private
- **Ne pas** cocher « Add a README » ni « Add .gitignore » (déjà dans le projet)
- **License** : None ou MIT/AGPL selon ton choix

Ensuite : `git init` → `git add .` → `git commit` → `git remote add origin` → `git push -u origin main`.
