# Fonctionnalités et validation des données — Racines+

> Pratiques des grandes plateformes (FamilySearch, MyHeritage, Geneanet) et choix pour Racines+. Bonnes pratiques UI/UX intégrées.

---

## Principe fondamental : validation des données

Sans validation, les arbres deviennent incohérents. Les plateformes sérieuses reposent sur :

- **Contribution libre** + **validation collaborative**.
- **Sources** pour chaque information (témoignage oral, archives, actes, etc.).
- **Niveaux de fiabilité** : confirmé, probable, en cours.

---

## Pratiques des grandes plateformes (références)

### Citation des sources (FamilySearch, MyHeritage, Geneanet)

- Citer une source pour chaque fait (naissance, décès, mariage, etc.).
- Permet de vérifier, éviter la propagation d'erreurs et respecter les auteurs.
- Bonne pratique : documenter au fur et à mesure de la saisie.

### Types d'erreurs courantes (MyHeritage, Geneanet)

- Erreurs de transcription (actes manuscrits).
- Homonymes et mauvaises associations.
- Archives incomplètes ou erronées.
- Traditions orales modifiées au fil du temps.
- Adoptions, non-paternité non documentées.
- Barrières linguistiques ou culturelles.

### Outils techniques (ex. Geneanet)

- **Consistency Checker** : détection automatique (âge au mariage, âge de la mère à la naissance, écarts d'âge entre conjoints, etc.).

---

## Architecture de validation proposée pour Racines+

### Workflow utilisateur

1. **Saisie** : l'utilisateur propose une personne, un lien ou un événement.
2. **Source** : il associe au moins une source (type : oral, archive, acte, autre) et une référence si possible.
3. **Niveau de fiabilité** : confirmé / probable / en cours.
4. **Modération** : selon le rôle (contributeur, modérateur, admin), validation ou rejet avec motif.
5. **Historique** : qui a proposé, qui a validé, quand ; traçabilité pour audit et confiance.

### Système de sources

- Types : témoignage oral, archive publique/privée, acte d'état civil, document religieux, autre.
- Champs : type, référence (cote, URL, description), date de consultation, transcripteur/contributeur.
- Lien : chaque fait (événement, lien familial) peut avoir une ou plusieurs sources.

### Niveaux de fiabilité

| Niveau     | Signification |
|-----------|----------------|
| Confirmé  | Source(s) solide(s), cohérent avec le reste de l'arbre |
| Probable  | Indices forts, à confirmer par une source supplémentaire |
| En cours  | En cours de vérification, à ne pas considérer comme établi |

### IA et automatisation (orientations)

- **Détection de cohérence** : âges impossibles, doublons probables, incohérences de dates (inspiration Geneanet).
- **Suggestions** : rapprochements de personnes (même nom, même lieu, période proche) — validation humaine obligatoire.
- **Choix d'IA** : DeepSeek ou autre pour analyse de texte (transcription, extraction) ou suggestions ; décision finale humaine et tracée.

---

## Charte éthique Racines+ (orientations)

- **Respect des personnes** : données sensibles (vivants, adoptions, filiations) — consentement et visibilité maîtrisée.
- **Transparence** : qui peut voir quoi, comment les données sont utilisées (voir doc Sécurité/RGPD).
- **Patrimoine et communautés** : reconnaissance des contributeurs et des communautés sources.
- **Validation honnête** : pas de falsification ; désaccord documenté plutôt que suppression arbitraire.
- **Accessibilité** : objectif d'usage par tous (langues, handicaps, bas débit si pertinent).

---

## Liens familiaux intelligents

- Gestion explicite : filiation biologique, adoption, union (mariage, pacs, union coutumière), fratrie, demi-frères/sœurs.
- Affichage et filtres selon le type de lien.
- Export GEDCOM 7 avec typage adapté.

---

## Visualisation pyramidale (priorité)

- **Forme** : sommet = ancêtres / origines ; base = descendants ; branches = lignées.
- **Interactivité** : zoom, pan, clic sur un nœud vers fiche personne, filtres par lieu et période.
- **Grands arbres** : chargement progressif et vues partielles (référence MyHeritage 10 000+ profils).
- **Contextuelle** : longévité, taille de fratrie, ordre de naissance (référence CFT / bonnes pratiques 2024).
- **Accessibilité** : mode contraste élevé, mode sombre, mise en page adaptable (1/2 colonnes).

---

## Référence détaillée : inscriptions et validation

Pour le **détail des bonnes pratiques** (ce qui se fait sur les plateformes et la meilleure façon pour Racines+) : **`docs/09-VALIDATION-INSCRIPTIONS-BONNES-PRATIQUES.md`** — inscriptions (vérification email, RGPD), workflow de validation des données, rôles, modération, sécurité.

---

## Prochaines actions (cheffe de projet)

- Rédiger la charte éthique complète et la faire valider.
- Détailler les rôles (contributeur, modérateur, admin) et les droits associés.
- Spécifier les règles de cohérence automatique (âge, dates, doublons) dans le plan technique.
