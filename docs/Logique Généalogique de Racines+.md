Logique Généalogique de Racines+
Bienvenue dans ce document qui explique comment Racines+ gère et relie les individus au sein de la généalogie africaine.

1. La Connexion Parent-Enfant (Inscription décalée)
Comment connecter un parent qui s'inscrit après son enfant ?
C'est le "problème de l'œuf et de la poule" en généalogie collaborative. Voici comment Racines+ le gère :

L'enfant s'inscrit en premier (via onboarding) :

Il déclare le nom et prénom de son père (ex: "Koffi Diallo", Vivant ou Décédé).
Ces informations déclaratives sont stockées dans la fiche de l'enfant (dans les métadonnées ou personal_lineage).
Le système crée alors des "Noeuds Fantômes" ou "Profils Déclaratifs" dans le graphe Neo4j pour ces parents, avec un identifiant temporaire ou simplement liés à l'enfant.
Le parent s'inscrit plus tard :

Le père "Koffi Diallo" télécharge l'application et fait son Onboarding.
À ce stade, le système a deux "Koffi Diallo" :
Le vrai compte utilisateur "Koffi Diallo" (Pending puis Confirmé).
La déclaration de filiation faite par l'enfant.
La Réconciliation (Le Match) :

Manuel par l'Admin / CHO : Un module de l'Admin ou un "Assistant Généalogiste" compare les nouveaux inscrits avec les parents déclarés par les autres utilisateurs du même village. S'il correspond, le profil déclaratif est fusionné avec le compte réel.
Automatique (V2) : Neo4j va analyser les noms de famille, prénoms et villages. Si "Koffi Diallo" s'inscrit au village "Toa-Zéo", le système demande à l'enfant : "Nous avons trouvé un Koffi Diallo récemment inscrit à Toa-Zéo. Est-ce votre père ?". L'enfant valide (ou le père valide ses enfants).
Une fois validé, le "Noeud Fantôme" est remplacé par le véritable identifiant du compte père, créant la connexion réelle et vivante ([:ENFANT_DE]).
Cas des parents décédés
Si l'enfant déclare un parent "Décédé" :

Le système ne s'attend pas à ce que ce parent crée un compte (évidemment).
Le compte reste un Profil Déclaratif / Historique.
Il occupe sa place complète dans le Graphe de l'Arbre pour faire le lien avec les générations supérieures (grands-parents), mais son badge sera marqué Inactif/Décédé (Gris/Noir).
2. Structure Générale de l'Arbre
Voici comment les niveaux (générations) s'articulent dans la structure de données Neo4j :

👑 Niveau 0 : L'Ancêtre Fondateur (La Racine)
Créé par l'Administrateur dans le backoffice (Admin Dashboard > Inscrire un Ancêtre). Il est la pierre angulaire des familles d'un village. Il ne peut jamais avoir de compte utilisateur, c'est purement une figure historique certifiée.

👴 Niveau 1 & 2 : Grands-parents (Déclaratifs)
La plupart des utilisateurs vivants vont déclarer leurs parents, qui à leur tour déclareront leurs parents. Quand on remonte, ces personnes âgées ou décédées n'ont pas de smartphone pour valider. Ils existent en tant que Nœuds Souches pour relier l'utilisateur à l'Ancêtre Fondateur.

Logique : Si deux utilisateurs distincts (des cousins) déclarent le même grand-père (nommé de la même manière au même village), le Chef de Famille ou CHO fusionnera ces deux déclarations pour lier les deux cousins historiquement au même grand-père.
👨 Niveau 3 : Parents (Utilisateurs ou Déclaratifs)
Comme expliqué précédemment. Soit c'est un compte utilisateur actif vérifié par le CHO, soit une simple déclaration maintenue par l'enfant.

👤 Niveau 4 : "Nous" (L'Utilisateur Connecté Actuel)
Le profil avec tous ses champs (Onboarding : origines, contact, quartier). Point central de la vue PersonalLineageTree. Il voit 2 niveaux au-dessus, et 2 niveaux en dessous.

👶 Niveau 5 : Enfants
Gérés depuis le Dashboard Utilisateur (bouton rouge "Déclarer un enfant").

S'ils sont mineurs : ils restent des profils déclaratifs rattachés au parent. Le parent a coché l'accord RGPD pour eux.
S'ils sont majeurs : le parent peut les déclarer, mais on les encourage à s'inscrire pour devenir un vrai nœud "Utilisateur Actif".
🍼 Niveau 6 : Petits-enfants
Quand les enfants de "Nous" grandissent ou déclarent à leur tour leurs enfants.

Synthèse du Workflow de Validation
Déclaration : Onboarding de N éléments déclaratifs ("mon père s'appelle X, mon chef de famille est Y").
Inscription réelle : La personne X ou Y télécharge l'application.
Double Filtre (Village) : Le système CHOa / CHO (qui connait les membres du village) valide la personne X.
Réconciliation des arbres : La véritable puissance de Neo4j relie toutes les branches certifiées au tronc central de l'Ancêtre Fondateur. C'est l'Admin (ou CHO) qui viendra fusionner les doublons (ex: le papa déclaré par A = le compte nouvellement créé par B).