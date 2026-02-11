# Validation des données et inscriptions — Bonnes pratiques

> Ce qui se fait sur les plateformes (généalogie et collaboratives) et **la meilleure façon** de faire pour Racines+ : inscriptions, validation des données, modération. Référence pour le développement.

---

## Partie 1 — Inscriptions (comptes utilisateurs)

### 1.1 Ce que font les plateformes (références)

**FamilySearch (exemple)**  
- Âge minimum 13 ans (avec accord parental possible 8–12 ans).  
- Inscription par **email ou téléphone** (téléphone limité à certaines zones, sinon email).  
- **Vérification obligatoire** : code par email ou SMS pour activer le compte (code valide 20 min, renvoi possible).  
- Connexion possible via **compte tiers** (Google, Apple, Facebook, etc.) en plus identifiant/mot de passe.  
- Acceptation des conditions d’utilisation et de la politique de confidentialité.  
- Compte récupérable (email/téléphone) pour mot de passe oublié.

**Principes généraux (RGPD / bonnes pratiques 2024)**  
- **Double opt-in** (inscription puis confirmation par email) : réduit fakes, erreurs de saisie et bots ; améliore délivrabilité et conformité.  
- **Consentement** : explicite, non pré-coché, documenté (date, canal).  
- **Données minimales** à l’inscription : ce qui est nécessaire pour le service (email, mot de passe ; nom/pseudo optionnel selon le produit).  
- **Politique de confidentialité** et **conditions** visibles au moment de l’inscription.

### 1.2 Recommandation Racines+ : inscription

| Étape | À faire | Pourquoi |
|-------|--------|----------|
| **1. Formulaire** | Email obligatoire, mot de passe (règles de complexité), prénom/nom ou pseudo (au choix selon politique). Pas de champs inutiles. | Limiter fakes et bots ; RGPD (minimisation). |
| **2. Consentement** | Cases **non pré-cochées** : acceptation des CGU, acceptation de la politique de confidentialité. Lien clair vers chaque document. | Conformité RGPD ; consentement « libre, spécifique, informé et non ambigu ». |
| **3. Vérification email** | Envoi d’un **lien ou code** par email ; compte **actif seulement après clic/code**. Lien valide 24–48 h, possibilité de renvoyer l’email. | S’assurer que l’email est réel et contrôlé par l’utilisateur (sécurité + qualité). |
| **4. Option : téléphone** | En régions où SMS est fiable : proposer **email OU téléphone** pour vérification (comme FamilySearch). Sinon email seul en MVP. | Adapter au terrain (Afrique, diaspora) ; éviter exclusion. |
| **5. Connexion tierce (optionnel)** | Google, Apple (et éventuellement Facebook) pour « Se connecter avec… ». Réduit friction ; garder **inscription par email** toujours disponible. | Meilleure UX ; certains utilisateurs préfèrent ne pas créer un nouveau mot de passe. |
| **6. Compte non vérifié** | Tant que l’email n’est pas confirmé : **lecture possible** (arbres publics), **pas de contribution** (pas d’ajout/modification). Message clair : « Vérifiez votre email pour contribuer ». | Éviter abus et spam par comptes non vérifiés. |
| **7. Traçabilité** | Enregistrer : date d’inscription, date de vérification email, IP (si légalement utile), consentements donnés. | Preuve en cas de litige ; conformité RGPD. |

**Résumé** : **Inscription → email de vérification → activation du compte → contribution possible.** Double opt-in pour l’email de contact (newsletter) si tu en envoies : consentement séparé, documenté, révocable.

---

## Partie 2 — Validation des données (contributions)

### 2.1 Ce que font les plateformes

- **Contribution ouverte** : les utilisateurs proposent des personnes, des liens, des événements.  
- **Sources obligatoires ou fortement encouragées** (FamilySearch, MyHeritage, Geneanet) : chaque fait lié à une source (oral, archive, acte).  
- **Niveaux de fiabilité** : confirmé / probable / en cours (ou équivalent) pour indiquer la solidité de l’information.  
- **Vérification automatique** (ex. Geneanet) : détection d’incohérences (âges impossibles, dates incohérentes).  
- **Modération humaine** : selon la plateforme, validation par des pairs, modérateurs ou administrateurs avant passage en « confirmé » ou avant publication.

### 2.2 Recommandation Racines+ : workflow de validation des données

**Principe** : **contribution libre + validation collaborative + sources + contrôle automatique.**

| Étape | Qui | Action |
|-------|-----|--------|
| **1. Saisie** | Utilisateur (compte vérifié) | Propose une **personne**, un **lien** (parent–enfant, couple) ou un **événement** (naissance, décès, mariage, etc.). |
| **2. Source** | Utilisateur | Associe **au moins une source** : type (témoignage oral, archive, acte d’état civil, document religieux, autre) + référence (cote, URL, description) si possible. Champ obligatoire ou fortement encouragé. |
| **3. Niveau de fiabilité** | Utilisateur (ou défaut) | Choisit **Confirmé** / **Probable** / **En cours**. Par défaut « En cours » pour toute nouvelle entrée. |
| **4. Contrôle automatique** | Système | Vérification des **règles de cohérence** : âge de la mère à la naissance, âge au mariage, décès avant naissance d’un enfant, etc. **Alertes** à l’utilisateur et/ou au modérateur ; blocage possible pour incohérences majeures. |
| **5. Modération** | Modérateur / Admin (selon rôle) | Valide ou rejette la proposition (avec **motif** en cas de rejet). Si validé : passage en « Confirmé » ou maintien « Probable » selon politique. |
| **6. Historique** | Système | Enregistrer **qui** a proposé, **qui** a validé/rejeté, **quand**, et **pourquoi** (rejet). Visible dans l’historique de la fiche pour transparence et audit. |

**Règles métier à implémenter (exemples)**  
- Mère : âge à la naissance de l’enfant entre 12 et 60 ans (seuils configurables).  
- Père : idem ou plage plus large selon politique.  
- Enfant : date de naissance après date de mariage des parents (ou signaler si avant).  
- Décès : date de décès ≥ date de naissance ; décès avant naissance d’un enfant déjà saisi → alerte.  
- Doublons probables : même nom + même lieu + période proche → suggestion de fusion (l’humain décide).

L’**IA** peut en plus : proposer des extractions (actes), suggérer des doublons, aider à la cohérence (voir `08-ROLE-IA-RACINES+.md`). La décision finale reste humaine.

### 2.3 Qui peut valider quoi (rôles)

| Rôle | Inscription | Contribution (proposer) | Modérer (valider/rejeter) | Admin (rôles, paramètres) |
|------|-------------|--------------------------|----------------------------|----------------------------|
| **Visiteur** | — | Non | Non | Non |
| **Inscrit non vérifié** | — | Non (lecture seule) | Non | Non |
| **Contributeur** | Oui (soi-même) | Oui | Non | Non |
| **Modérateur** | Oui | Oui | Oui (sur son périmètre : lieu, arbre, etc.) | Non |
| **Admin** | Oui | Oui | Oui (tout) | Oui |

Le **périmètre** des modérateurs peut être par **lieu** (village, région) ou par **arbre**, selon le choix du projet.

---

## Partie 3 — Autres points importants

### 3.1 Limitation des abus (inscriptions et contributions)

- **Rate limiting** : limiter le nombre d’inscriptions par IP ou par appareil sur une fenêtre de temps ; limiter le nombre de contributions par utilisateur par jour (avec seuils élevés pour ne pas gêner les vrais contributeurs).  
- **Compte vérifié obligatoire** pour contribuer (voir 1.2).  
- **Signalement** : tout utilisateur peut signaler une fiche ou un comportement inapproprié ; traitement par les modérateurs.  
- **Sanctions** : avertissement, suspension temporaire, blocage (selon gravité), avec traçabilité.

### 3.2 Sécurité des comptes

- **Mot de passe** : complexité minimale (longueur, caractères variés) ; pas de stockage en clair.  
- **Réinitialisation** : lien sécurisé par email (expiration 1–2 h), puis choix d’un nouveau mot de passe.  
- **Sessions** : expiration après inactivité ; déconnexion possible sur tous les appareils depuis le compte.  
- **Connexion** : journal des connexions (date, IP) consultable par l’utilisateur (optionnel mais recommandé).

### 3.3 Transparence et confiance

- **Charte** : charte de contribution et charte éthique visibles (voir `04-FONCTIONNALITES-ET-VALIDATION.md`).  
- **Indicateurs** : sur chaque fiche ou événement, afficher le **niveau de fiabilité** et, si possible, le **nombre de sources**.  
- **Historique** : qui a ajouté/modifié/validé, quand (versionning simplifié des fiches importantes).

---

## Synthèse : la meilleure façon pour Racines+

1. **Inscriptions** : email obligatoire + **vérification par email** (lien ou code) avant de pouvoir contribuer ; consentement explicite (CGU, confidentialité) ; optionnel : téléphone dans certaines zones, connexion Google/Apple.  
2. **Validation des données** : toute contribution **liée à au moins une source** et un **niveau de fiabilité** ; **contrôles automatiques** (règles de cohérence) ; **modération humaine** (valider/rejeter avec motif) ; **historique** complet (qui, quand, pourquoi).  
3. **Rôles** : contributeur (propose), modérateur (valide dans son périmètre), admin (valide + paramètres).  
4. **Sécurité et abus** : rate limiting, comptes vérifiés pour contribuer, signalement, politique de sanctions, bonnes pratiques mots de passe et sessions.

C’est ce qui se fait de mieux sur les plateformes et ce qui est recommandé pour Racines+ ; à décliner dans le plan technique (schéma de données, API, écrans) et dans les CGU / politique de confidentialité.
