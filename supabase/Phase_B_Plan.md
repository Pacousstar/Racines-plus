# Phase B : Fluidité (Commentaires & Notifications)

Cette phase vise à améliorer la communication entre les Chefs de Village (CHO) et leurs Adjoints (CHOa) lors du processus de validation des profils.

## Changements Proposés

### Base de Données (Supabase)

#### [NEW] [Add_Comments_System.sql](file:///c:/Users/GSN-EXPERTISES/Projets/Racines+/racines-mvp/supabase/Add_Comments_System.sql)
- Création de la table `validation_comments` pour stocker les échanges sur un profil.
- Création d'une table `notifications` simple pour alerter les utilisateurs.
- Activation du RLS et des politiques d'accès.

### Application (Next.js)

#### [MODIFY] [CHO Dashboard](file:///c:/Users/GSN-EXPERTISES/Projets/Racines+/racines-mvp/src/app/cho/page.tsx)
- Ajout d'un système de messagerie/commentaires dans la modale de validation.
- Affichage des notifications reçues.

#### [MODIFY] [CHOa Dashboard](file:///c:/Users/GSN-EXPERTISES/Projets/Racines+/racines-mvp/src/app/choa/page.tsx)
- Ajout de la possibilité de répondre aux commentaires du CHO.
- Système de notifications local.

## Plan de Vérification

### Tests Automatisés
- Vérification des politiques RLS pour s'assurer que seuls les membres de l'équipe du village peuvent lire/écrire les commentaires d'un profil du village.

### Vérification Manuelle
- Créer un commentaire en tant que CHOa sur un profil.
- Vérifier que le CHO voit le commentaire.
- Répondre en tant que CHO et vérifier la notification.
