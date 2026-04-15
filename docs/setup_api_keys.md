# 🔑 Guide de configuration des clés API (Intelligence Artificielle)

Ce guide t'explique comment récupérer les clés API (Mots de passe secrets) pour faire fonctionner l'Intelligence Artificielle de Racines+ dans la vraie vie.

Une fois ces clés obtenues, tu n'auras qu'à les copier-coller dans ton fichier `.env.local` à la racine de ton projet :
```env
OPENAI_API_KEY="sk-Ta_Cle_Secrete_Ici..."
DEEPSEEK_API_KEY="sk-Ta_Cle_Secrete_Ici..."
```

---

## 🎧 Étape 1 : Obtenir la clé OPENAI (Pour le mode Dictaphone / Whisper)

OpenAI Whisper est le moteur qui va écouter la voix et la transformer en texte parfait.

1. **Création du compte :** Va sur [https://platform.openai.com/](https://platform.openai.com/) et clique sur "Sign Up" (ou connecte-toi si tu as déjà un compte ChatGPT).
2. **Ajouter un moyen de paiement :** OpenAI nécessite d'ajouter une carte bancaire pour fonctionner. Va dans le menu de gauche :  `Settings` -> `Billing` -> `Add payment details`. Mets un petit montant, par exemple 5$ ou 10$ (Rappel : 1h de voix coûte moins de 0.50$ ! Tu as de la marge).
3. **Créer la clé :** Toujours dans le menu de gauche, clique sur `API Keys` (l'icône en forme de cadenas).
4. **Générer :** Clique sur le bouton vert **"Create new secret key"**. Donne-lui un nom clair comme "Racines Plus Dictaphone".
5. **Copier :** Une fenêtre s'affiche avec la clé secrète (elle commence souvent par `sk-proj-...`). **Copie-la immédiatement**, car elle ne sera plus jamais affichée en entier !
6. **Coller :** Colle cette clé dans ton fichier `.env.local` à la place de la variable `OPENAI_API_KEY`.

---

## 🧠 Étape 2 : Obtenir la clé DEEPSEEK (Pour l'analyse des liens familiaux)

DeepSeek est le "cerveau" qui va lire l'histoire transcrite, reconstituer l'arbre généalogique et vérifier s'il y a des incohérences.

1. **Création du compte :** Rends-toi sur la plateforme développeur de DeepSeek : [https://platform.deepseek.com/](https://platform.deepseek.com/) et inscris-toi.
2. **Recharger le compte (Top-Up) :** Comme OpenAI, il faut ajouter un peu d'argent. Dans le menu, cherche la section `Billing` ou `Top Up`. Tu peux recharger un petit montant symbolique (ex: 5$). DeepSeek est l'IA la moins chère du marché, ces 5$ te dureront très longtemps.
3. **Créer la clé :** Dans le menu de gauche, clique sur `API Keys`.
4. **Générer :** Clique sur **"Create API Key"**. Donne-lui un nom comme "Analyse Heritage Racines".
5. **Copier :** Copie la clé générée (elle commence aussi généralement par `sk-...`).
6. **Coller :** Colle-la dans ton fichier `.env.local` à la place de la variable `DEEPSEEK_API_KEY`.

---

## 🎯 Étape 3 : Redémarrer le serveur
Une fois tes clés insérées dans le fichier `.env.local`, il faudra couper le terminal (Ctrl+C) et relancer ton application :
```bash
npm run dev
```

Magie ! Ton code est déjà prêt. Dès que le serveur redémarre, il détectera les clés et enverra la voix à Whisper, et le texte à DeepSeek !
