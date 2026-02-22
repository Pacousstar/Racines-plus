# Gros topo de la conversation — Racines+

> Synthèse des échanges (fichier Racines+.txt) et **ce qu’on retient pour avancer** avec la cheffe de projet. Ce document sert de référence pour s’approprier le projet et son fonctionnement.

---

## 1. Ce que la conversation a couvert

Les échanges ont porté sur **plusieurs blocs** :

### Identité et branding

- Choix du **nom Racines+** et du **slogan** : « l’Histoire continue avec toi ».
- **Logo** : arbre stylisé (racines visibles, branches en réseau, tronc en « + »), couleurs (vert profond, terre cuite, doré), typo moderne et chaleureuse, équilibre tradition / innovation.
- **Positionnement** : plateforme patrimoniale + tech culturelle.

### Technique et produit

- **Architecture technique** complète (web, API, base de données).
- **Base de données** détaillée (personnes, liens, événements, lieux).
- **Liens familiaux intelligents**, **IA** (DeepSeek évoqué pour analyse/suggestions).
- **Visualisation pyramidale** (très importante) : sommet = origines, branches = lignées.
- **Validation des données** : contribution libre + validation collaborative, sources, niveaux de fiabilité (confirmé, probable, en cours), charte éthique, workflow et rôle de l’IA.
- **MVP** technique concret, maquette fonctionnelle, prototype UI écran par écran.
- **Export** de l’arbre (GEDCOM, etc.).

### Économie et financement

- **Business model** détaillé : abonnements, certification, produits dérivés, partenariats, subventions.
- **Roadmap** de développement réaliste.
- **Pitch investisseurs**, **pitch deck** (FR, FCFA + EUR, premium, émotionnel).
- **Dossier financement** prêt à envoyer.
- **Stratégie levée de fonds**, **liste de structures** pour demandes de financement.
- **Business plan** financier (Excel), **simulation coûts équipe**.

### Pilote et déploiement

- **Test pilote** : village **Toa-Zeo**, commune Duékoué, région du Guémon (Côte d’Ivoire).
- **Expansion** : village → région → pays → **diaspora** (Afrique, Europe, Amérique, Asie, etc.).
- **Stratégie marketing terrain**, **stratégie communication mondiale / diaspora**.
- **Dossier subventions** culture/patrimoine, **structuration juridique** internationale.

### Équipe et gouvernance

- **Rôles** : CEO, CTO, COO, CFO (définitions).
- **Rôle de M. Dihi T. Denis** : à l’origine de l’idée, maîtrise de la généalogie de Toa-Zeo, Master RH, implication Guémon — proposition de **Directeur patrimoine / généalogie et territoires**.
- **Organisation équipe dirigeante** : rôle, fonction, priorités de chacun.
- **Organigramme** visuel, **fiches de poste** détaillées, **plan de recrutement** 24 mois, **simulation coûts équipe**, **gouvernance investisseurs**, **stratégie leadership fondateur**.

### Livrables demandés (récurrents)

- Maquette fonctionnelle, prototype UI interactif, prototype visuel écran par écran.
- Architecture technique validation, workflow validation utilisateur, système IA validation.
- Plan technique détaillé, **plan technique de dev semaine par semaine**.
- Logo Racines+ (avec slogan).

---

## 2. Ce qu’on retient pour avancer (cheffe de projet)

### Vision partagée

- **Racines+** = arbre généalogique numérique **à grande échelle**, collaboratif, **pyramidal**, multi-échelle (quartier → village → région → pays → diaspora).
- Les gens **s’inscrivent**, **renseignent** leurs infos, **recherchent** leurs origines et leur appartenance ; l’arbre **grandit en continu** (naissances, nouveaux membres).
- **Export** de l’arbre (ou de branches) pour partage et archivage.
- **Pilote Toa-Zeo** = première preuve de concept et cas d’usage pour financement et expansion.

### Principes non négociables

1. **Qualité des données** : validation collaborative, sources obligatoires, niveaux de fiabilité.
2. **Sécurité et RGPD** : conformité, pas de secrets en clair, contrôle d’accès, traçabilité (voir doc Architecture technique).
3. **UI/UX et accessibilité** : pyramide lisible, interactivité, mode contraste élevé / sombre, grands arbres (chargement progressif).
4. **Interopérabilité** : standard **GEDCOM 7** pour import/export.
5. **Équipe** : rôle clair pour M. Dihi (patrimoine/généalogie), organigramme et fiches de poste pour scaler.

### Priorités de travail (ordre proposé)

1. **Produit web** : spécification fonctionnelle (personnes, liens, lieux, événements, sources, validation), puis schéma de données et API.
2. **Sécurité et RGPD** : registre des traitements, PIA si besoin, durcissement (auth, accès, logs, sauvegardes).
3. **UI** : maquettes / prototype (écrans clés : inscription, saisie, arbre pyramidal, recherche, export).
4. **Pilote Toa-Zeo** : méthodologie de saisie et validation avec M. Dihi et relais, objectifs de succès.
5. **Financement** : pitch deck et dossier financement à jour, liste cibles (subventions, investisseurs).

### Fichiers créés à partir de la conversation

| Fichier | Contenu principal |
|---------|-------------------|
| `01-VISION-ET-BRANDING.md` | Nom, slogan, logo, charte, vision produit |
| `02-ARCHITECTURE-TECHNIQUE.md` | Stack web, sécurité, RGPD, GEDCOM, base de données |
| `03-MODELE-ECONOMIQUE-ET-FINANCEMENT.md` | Business model, pitch, dossier financement, levée de fonds |
| `04-FONCTIONNALITES-ET-VALIDATION.md` | Validation, sources, fiabilité, charte éthique, pyramide, IA |
| `05-EQUIPE-ET-GOUVERNANCE.md` | Rôles, M. Dihi, organigramme, fiches de poste, gouvernance |
| `06-PILOTE-ET-EXPANSION.md` | Toa-Zeo, expansion, marketing terrain, diaspora, subventions |

Tout est **à la racine du dossier Racines+** ; on travaille en **version web** en premier.

---

## 3. Appropriation du projet (cheffe de projet)

- **Objectif** : rendre Racines+ **fonctionnel de A à Z** (inscription, saisie, recherche, visualisation pyramidale, validation, export), en s’appuyant sur les docs ci-dessus et les **bonnes pratiques** (sécurité CNIL 2024, GEDCOM 7, UI/UX et accessibilité des plateformes généalogiques 2024).
- **Référence** : ce topo + les 6 fichiers thématiques dans `docs/` ; le fichier `Racines+.txt` reste la trace brute des échanges.
- **Suite** : détailler le **plan de développement par phases** (MVP → pilote → expansion) et commencer l’implémentation technique dans le dossier **Racines+** à la racine.

---

*Document rédigé par la cheffe de projet Racines+ — à faire évoluer au fil des décisions.*
