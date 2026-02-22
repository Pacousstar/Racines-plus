# Bonnes pratiques externes — Références pour Racines+

> Synthèse de ce qui se fait de mieux pour ce type de plateforme : qualité, sécurité, UI/UX, RGPD. À appliquer tout au long du développement.

---

## Sécurité et RGPD

### Cadre juridique

- **Article 32 RGPD** : mesures techniques et organisationnelles proportionnées au risque pour les données personnelles.
- **Guide CNIL 2024** (sécurité des données personnelles) :
  - **Utilisateurs** : périmètre des accès, formation, authentification forte, gestion des droits.
  - **Moyens** : sécurisation des postes, mobiles, réseaux, serveurs, sites web.
  - **Données** : sécurisation des échanges, encadrement des sous-traitants.
  - **Incidents** : journalisation des opérations, sauvegardes, plan de continuité, gestion des incidents.
- **Obligations** : analyse de risques, PIA (Privacy Impact Assessment) si traitement à risque, **registre des traitements**.

### Application pour Racines+

- Données généalogiques = **données personnelles** (noms, dates, lieux, liens familiaux).
- Mettre en place : auth robuste, contrôle d’accès (qui voit/édite quoi), HTTPS, pas de secrets en clair dans le code.
- Documenter : qui traite quoi, pour quoi, combien de temps (registre), et prévoir une politique de confidentialité lisible.

---

## Qualité des données (validation, sources)

### Références plateformes (FamilySearch, MyHeritage, Geneanet)

- **Citation des sources** pour chaque fait : évite la propagation d’erreurs, permet la vérification, respect des auteurs.
- **Types d’erreurs courantes** : transcription, homonymes, archives incomplètes, traditions orales modifiées, adoptions non documentées — à anticiper dans les règles de cohérence.
- **Outils automatiques** : ex. Geneanet Consistency Checker (âges impossibles, incohérences de dates) — à intégrer dans Racines+.

### Application pour Racines+

- Workflow **contribution → source → niveau de fiabilité → modération** (voir `04-FONCTIONNALITES-ET-VALIDATION.md`).
- Règles de cohérence automatiques (âge à la naissance des enfants, âge au mariage, etc.) + suggestions de rapprochement (IA optionnelle), avec **validation humaine** finale.

---

## UI/UX et visualisation (arbres généalogiques)

### Références 2024

- **Visualisation contextuelle** : longévité, taille de fratrie, ordre de naissance, identification des doublons dans l’arbre (approche type CFT / bonnes pratiques recherche).
- **Interactivité** : zoom, pan, navigation dans les grandes arbres ; vues partielles pour 10 000+ profils (ex. MyHeritage).
- **Accessibilité** : mode contraste élevé, mode sombre, mise en page adaptable (1 ou 2 colonnes), texte lisible (ex. noir sur fond clair).
- **Fan chart / vues multiples** : ex. FamilySearch (fan chart, portrait view) pour faciliter la lecture des lignées.

### Application pour Racines+

- **Pyramide** : sommet = ancêtres, base = descendants ; interactivité et filtres (lieu, période).
- **Grands arbres** : chargement progressif, découpage par sous-arbres ou par niveau.
- **Accessibilité** : respect des contrastes, options thème sombre / contraste élevé dès le MVP si possible.

---

## Interopérabilité (GEDCOM)

- **GEDCOM 7.0** (FamilySearch, gedcom.io) : standard d’échange et de conservation pour la généalogie.
- Évolutions 7.x : GedZip (médias), EXID (identifiants externes), dates enrichies, notes en HTML.
- **Application pour Racines+** : import/export au format GEDCOM 7 pour permettre échanges et archivage long terme.

---

## Récapitulatif des priorités techniques

| Domaine       | Priorité | Action Racines+ |
|---------------|----------|------------------|
| RGPD / CNIL   | Haute    | Registre, PIA si besoin, auth, accès, logs |
| Validation    | Haute    | Sources, fiabilité, modération, cohérence auto |
| UI/UX / arbre | Haute    | Pyramide interactive, accessibilité, grands arbres |
| GEDCOM        | Moyenne  | Export (et import) GEDCOM 7 |
| IA            | Optionnelle | Suggestions, cohérence ; décision humaine finale |

---

*Références : CNIL 2024, FamilySearch, MyHeritage, Geneanet, gedcom.io, bonnes pratiques visualisation généalogique 2024.*
