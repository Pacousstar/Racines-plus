# Architecture technique — Racines+

> Bonnes pratiques : sécurité (CNIL 2024), interopérabilité (GEDCOM 7), qualité. À faire évoluer avec le développement.

---

## Choix stratégiques (version web)

- **Application web** en priorité (accessibilité, pas d'installation).
- **API** (REST ou GraphQL) pour évolutions (mobile, partenaires, export).
- **Base de données** relationnelle (personnes, liens, événements, lieux).
- **Standard GEDCOM** (FamilySearch GEDCOM 7.x) pour import/export et pérennité.

---

## Références et normes

### Sécurité et RGPD

- **Article 32 RGPD** : mesures techniques et organisationnelles proportionnées au risque.
- **Guide CNIL 2024** (sécurité des données personnelles) :
  - Utilisateurs : formation, authentification, gestion des accès.
  - Moyens : postes, mobiles, réseaux, serveurs, sites.
  - Données : sécurisation des échanges, sous-traitants.
  - Incidents : journalisation, sauvegardes, continuité, gestion des incidents.
- **Obligations** : analyse de risques, PIA si besoin, registre des traitements.

### Données généalogiques

- **GEDCOM 7.0** (gedcom.io, FamilySearch) : format d'échange et de conservation.
- Support **GedZip** pour médias, **EXID** pour identifiants externes, dates enrichies, notes (HTML).

### UI/UX et accessibilité (références 2024)

- **Visualisation** : arbre contextuel (longévité, fratries, ordre de naissance), navigation interactive, arbres de grande taille (ex. MyHeritage 10 000+ profils).
- **Accessibilité** : mode contraste élevé, mode sombre, options de mise en page (1/2 colonnes), texte lisible (noir sur fond clair ou contrastes équivalents).

---

## Principes d'architecture

1. **Séparation** : front (UI), API, base de données.
2. **Authentification** : sessions/JWT, MDP robustes, pas de secrets en clair dans le code.
3. **Contrôle d'accès** : qui peut voir/éditer quelles données (par arbre, par lieu, par rôle).
4. **Chiffrement** : HTTPS, données sensibles au repos si nécessaire.
5. **Traçabilité** : logs des actions sensibles (connexion, modification de liens, export).
6. **Sauvegardes** : régulières, testées, conformes à la politique de conservation RGPD.

---

## Base de données (orientations)

- **Personnes** : identité, dates (naissance, décès), lieux, lien compte utilisateur si applicable.
- **Liens** : parent–enfant, couple (mariage, union), type de lien.
- **Événements** : naissance, décès, mariage, migration, etc. (avec dates et lieux).
- **Lieux** : hiérarchie quartier, village, ville, département, région, pays ; tags diaspora (Afrique, Europe, Amérique, Asie, etc.).
- **Sources** : type (oral, archive, acte), référence, niveau de fiabilité (confirmé, probable, en cours).
- **Médias** : documents, photos, liés aux personnes/événements (avec consentement et politique de conservation).

---

## Stack technique (recommandation initiale)

| Couche      | Techno (exemples)     | Rôle |
|------------|------------------------|------|
| Frontend   | React (ou équivalent)  | UI, arbre interactif, recherche |
| Backend    | Node.js / Python       | API, logique métier, export |
| Base       | PostgreSQL             | Données relationnelles |
| Auth       | Sessions + JWT         | Connexion, droits |
| Export     | GEDCOM 7 + PDF/image   | Interopérabilité, partage |

---

## Prochaines actions (cheffe de projet)

- Détailler le schéma de données (tables, relations, contraintes).
- Rédiger une fiche Sécurité et RGPD (registre, PIA, durcissement).
- Choisir la stack définitive et créer le dépôt (Racines+ à la racine).
