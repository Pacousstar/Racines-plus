# Rôle de l'IA dans Racines+

> Ce que l'IA doit faire **concrètement** dans la plateforme, et recommandation technique (DeepSeek ou alternative). Document de référence pour le développement.

---

## 1. Rôle de l'IA : à quoi elle sert

L'IA dans Racines+ **ne remplace pas** l'humain : elle **assiste** la saisie, la validation et la recherche. Toute décision qui modifie l'arbre (création de lien, validation, fusion) reste **humaine et tracée**.

---

## 2. Missions concrètes de l'IA

### 2.1 Aide à la saisie et à l'extraction

| Tâche | Concrètement | Bénéfice |
|-------|--------------|----------|
| **Transcription d'actes** | À partir d'une photo ou d'un scan d'acte d'état civil (naissance, décès, mariage), l'IA propose une transcription texte (OCR + lecture) avec repérage des noms, dates, lieux. | Gain de temps ; l'utilisateur vérifie et corrige avant de créer les personnes/événements. |
| **Extraction structurée** | À partir du texte (acte, témoignage tapé), l'IA propose des champs structurés : nom, prénom(s), date, lieu, type d'événement, liens (père, mère, conjoint). | Pré-remplissage des formulaires ; l'utilisateur valide et complète. |
| **Suggestions de lieux** | Quand l'utilisateur tape un lieu (village, région), l'IA suggère des correspondances dans la hiérarchie Racines+ (quartier → village → ville → région → pays) ou propose de créer un nouveau lieu. | Cohérence des lieux, moins de doublons. |

### 2.2 Qualité et cohérence des données

| Tâche | Concrètement | Bénéfice |
|-------|--------------|----------|
| **Détection d'incohérences** | Règles automatiques (comme Geneanet) : mère qui accouche après 50 ans, enfant né après le décès d'un parent, mariage à un âge impossible, dates incohérentes entre frères/sœurs, etc. | Signaler à l'utilisateur ou au modérateur pour correction ou ajout de source. |
| **Détection de doublons probables** | Comparer deux fiches personne : noms proches (orthographe, prénoms), même lieu, période proche. Proposer « Ces deux fiches pourraient être la même personne » avec un score ou des indices. | Éviter la multiplication des doublons ; l'humain décide de fusionner ou non. |
| **Rapprochement de noms** | Gérer les variantes (surnoms, orthographes, translittérations) pour la recherche et le matching : ex. « Kouassi » / « Kwasi », « Marie » / « Mariam ». | Meilleure recherche et meilleures suggestions de doublons. |

### 2.3 Aide à la recherche et à l'exploration

| Tâche | Concrètement | Bénéfice |
|-------|--------------|----------|
| **Recherche sémantique** | Comprendre une requête en langage naturel (« personnes nées à Toa-Zeo avant 1950 », « tous les mariages dans le Guémon en 1960 ») et la traduire en filtres (lieu, date, type d'événement). | Recherche plus accessible pour les non-experts. |
| **Suggestions de pistes** | À partir d'une fiche personne incomplète, suggérer des types de sources ou d'archives à consulter (état civil, registres religieux, etc.) selon le lieu et l'époque. | Guide l'utilisateur pour enrichir l'arbre. |

### 2.4 Modération et confiance (optionnel, phase ultérieure)

| Tâche | Concrètement | Bénéfice |
|-------|--------------|----------|
| **Détection de contenu inapproprié** | Signaler des textes (notes, commentaires) hors charte (insultes, spam, données sensibles exposées). | Aide les modérateurs à prioriser les vérifications. |
| **Résumé de conflits** | Quand deux contributeurs proposent des données contradictoires, résumer les écarts (dates, noms, liens) pour faciliter la décision du modérateur. | Gain de temps pour la médiation. |

---

## 3. Ce que l'IA ne fait pas

- **Ne valide pas seule** : elle ne passe pas une information en « confirmé » sans validation humaine.
- **Ne crée pas seule de liens** (parent–enfant, couple) : elle propose, l'utilisateur ou le modérateur valide.
- **Ne supprime pas** de données : au plus elle signale des incohérences ou des doublons.
- **Ne remplace pas les sources** : la qualité repose sur les sources et le workflow (sources + niveaux de fiabilité).

---

## 4. Choix technique : DeepSeek ou autre ?

### 4.1 DeepSeek : à la hauteur ?

**Oui**, DeepSeek est **à la hauteur** pour le cœur du rôle IA dans Racines+ :

- **Extraction et OCR** : prise en charge PDF, images (actes scannés), multilingue, bonne précision pour tables et texte ; API OCR dédiée (ex. DeepSeek-OCR) pour les documents.
- **Multilingue** : adapté au français et à d’autres langues (noms, lieux, actes en contexte africain, diaspora).
- **API** : format compatible OpenAI, intégration simple, **coût compétitif**, pas de plafond strict (ex. 100 req/min en standard).
- **Contexte long** : fenêtres très grandes (ex. 200k tokens), utile pour de longs documents ou lots d’actes.
- **Modèles** : DeepSeek-V3 (usage général, extraction, suggestions) et DeepSeek-R1 (raisonnement pour cas complexes si besoin).

Limites à garder en tête : pour le **matching avancé de noms** (variantes, translittérations, historique), une API spécialisée (ex. Interzoid Individual Name Matching) peut compléter DeepSeek si on veut un niveau « généalogie pro ». Ce n’est pas obligatoire en MVP. mais retiens ceci var très important pour Racines+.

### 4.2 Recommandation cheffe de projet

| Besoin | Solution recommandée | Commentaire |
|--------|----------------------|-------------|
| Transcription / extraction (actes, texte) | **DeepSeek** (API chat + OCR si besoin) | Priorité 1 ; bien adapté, coût maîtrisé. |
| Suggestions structurées (personnes, lieux, événements) | **DeepSeek** | Priorité 1. |
| Détection incohérences (âges, dates) | **Règles métier** (code) + optionnellement **DeepSeek** pour cas ambigus | Priorité 1 en règles ; IA en renfort. |
| Doublons / rapprochement de noms | **DeepSeek** pour similarité sémantique + règles (distance sur noms, lieu, dates) | Priorité 2 ; ajouter une API type **Interzoid** si besoin de matching très fin (noms internationaux, variantes). |
| Recherche en langage naturel | **DeepSeek** pour interpréter la requête → filtres | Priorité 2. |
| Modération (contenu inapproprié) | **DeepSeek** ou modèle dédié modération (selon coût / conformité) | Priorité 3. |

**En résumé** : **DeepSeek suffit comme moteur IA principal** pour Racines+ (extraction, suggestions, aide à la cohérence, recherche). On peut l’envisager en **premier** pour le MVP et l’évolution, et ajouter une API de **name matching** (ex. Interzoid) plus tard si les retours utilisateurs le justifient.

### 4.3 Alternatives à connaître

- **OpenAI (GPT-4o, etc.)** : très performant, multilingue ; coût plus élevé, dépendance à un acteur US. À considérer si besoin de niveau maximal sur le raisonnement ou si déjà en place.
- **Anthropic (Claude)** : bon en texte long et structuré ; à évaluer selon coût et contraintes (hébergement, conformité).
- **Modèles locaux / self-hosted** (Llama, Mistral, etc.) : maîtrise des données et des coûts ; à envisager si l’équipe a la capacité d’hébergement et de maintenance.
- **Interzoid Individual Name Matching API** : spécialisé similarité de noms (généalogie, déduplication) ; complément optionnel à DeepSeek.

---

## 5. Intégration dans le produit (résumé)

1. **Backend** : un module « IA » qui appelle l’API DeepSeek (et éventuellement OCR) pour transcription, extraction, suggestions.
2. **Frontend** : boutons du type « Extraire depuis un document », « Suggérer des doublons », « Vérifier les incohérences » ; affichage des propositions avec **accepter / refuser / modifier** par l’utilisateur.
3. **Traçabilité** : loguer qu’une suggestion ou une alerte vient de l’IA (sans stocker le contenu des appels si sensible), et qui a validé ou rejeté.
4. **RGPD** : si des données personnelles sont envoyées à l’API (ex. extrait d’acte), le mentionner dans la politique de confidentialité et privilégier des options contractuelles (DPA, sous-traitant) avec le fournisseur.

---

## 6. Prochaines actions (cheffe de projet)

- Valider cette liste de missions IA avec les fondateurs.
- Inscrire dans le plan technique : module IA (backend), écrans « extraction », « suggestions doublons », « alertes cohérence ».
- Décider du fournisseur pour le MVP : **DeepSeek** recommandé ; tester un premier flux (upload acte → extraction → pré-remplissage fiche) dès que l’API et le schéma de données sont en place.
