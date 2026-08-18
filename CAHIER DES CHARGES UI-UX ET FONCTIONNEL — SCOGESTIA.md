# SCOGESTIA — CAHIER DES CHARGES UI/UX ET FONCTIONNEL
## Spécification complète destinée à Gemini / Antigravity

---

# 1. MISSION

Construire une application web SaaS professionnelle nommée **Scogestia**, destinée à la gestion complète des écoles primaires et collèges privés laïcs en Afrique francophone, avec une priorité donnée au Togo.

L'application doit permettre à une école de gérer :

- ses élèves ;
- ses classes ;
- son personnel ;
- les notes ;
- les présences ;
- les devoirs ;
- les paiements ;
- les échéances ;
- les parents ;
- les bulletins ;
- les rapports ;
- les communications ;
- les paramètres de l'établissement ;
- les abonnements à Scogestia.

L'application est **100 % web et responsive**.

Il n'existe pas de version mobile native.

L'interface doit fonctionner correctement sur :

- ordinateur ;
- tablette ;
- smartphone ;
- smartphones d'entrée de gamme avec connexion internet lente.

---

# 2. IDENTITÉ VISUELLE À RESPECTER

## Couleur principale

Utiliser **le vert émeraude** comme couleur principale de Scogestia.

La couleur doit être utilisée de manière cohérente pour :

- boutons principaux ;
- éléments actifs ;
- liens importants ;
- icônes principales ;
- graphiques ;
- indicateurs positifs ;
- éléments de marque.

Éviter les effets graphiques excessifs.

Scogestia doit donner l'impression d'un logiciel :

- sérieux ;
- institutionnel ;
- moderne ;
- fiable ;
- simple ;
- professionnel ;
- rassurant.

Ce n'est pas une application de divertissement et ce n'est pas une startup flashy.

---

# 3. PRINCIPES UX ABSOLUS

## 3.1 Aucune page vide

Aucune rubrique accessible depuis le menu ne doit afficher uniquement un titre ou une page blanche.

Chaque rubrique doit comporter :

- un titre ;
- une description courte ;
- des données ou un état explicite ;
- des boutons d'action ;
- des filtres si nécessaire ;
- des tableaux/cartes/listes selon le contexte.

Si aucune donnée n'existe encore, afficher un véritable **état vide utile**.

Exemple :

> Aucun élève n'est encore enregistré.

Puis :

**+ Ajouter le premier élève**

Ne jamais afficher simplement :

> Aucun résultat.

---

# 4. STRUCTURE GLOBALE DE L'APPLICATION

Pour l'administrateur, la navigation principale doit être organisée ainsi :

1. Tableau de bord
2. Élèves
3. Classes
4. Personnel
5. Finance
6. Académique
7. Communication
8. Rapports
9. Paramètres

En dessous, afficher éventuellement les espaces liés aux autres profils selon les permissions :

- Espace Comptable
- Espace Enseignant
- Espace Parent

Le menu doit être dynamique selon le rôle de l'utilisateur.

Un comptable ne doit pas voir les fonctions réservées à l'administrateur.

Un enseignant ne doit pas voir la gestion financière complète.

Un parent ne doit jamais voir les données des autres élèves.

---

# 5. EN-TÊTE GLOBAL

Sur desktop, l'en-tête doit contenir :

### À gauche

- bouton permettant de réduire/agrandir la sidebar ;
- titre de la page actuelle ;
- éventuellement un court sous-titre.

### À droite

- sélecteur d'école si l'utilisateur possède plusieurs établissements ;
- année scolaire active ;
- notifications ;
- avatar utilisateur ;
- nom de l'utilisateur ;
- rôle ;
- menu déroulant du profil.

Exemple :

**École La Réussite**

Lomé, Togo

**Année scolaire : 2025-2026**

Utilisateur :

**Jean Koffi**

Administrateur

---

# 6. TABLEAU DE BORD ADMINISTRATEUR

Route :

`/dashboard`

Le dashboard doit être la synthèse de toute l'activité de l'école.

## 6.1 Cartes statistiques principales

Afficher 5 cartes :

### Carte 1 — Total élèves

Exemple :

**512**

Élèves inscrits

Indicateur :

**+12 ce mois**

Bouton/lien :

**Voir les élèves**

---

### Carte 2 — Total classes

Exemple :

**18**

Classes actives

Indicateur :

**+1 ce mois**

Action :

**Voir les classes**

---

### Carte 3 — Personnel

Exemple :

**28**

Membres du personnel

Action :

**Gérer le personnel**

---

### Carte 4 — Taux de recouvrement

Exemple :

**82 %**

Montant encaissé / montant attendu.

Afficher une petite progression.

Action :

**Voir les finances**

---

### Carte 5 — Absences aujourd'hui

Exemple :

**32**

Absences enregistrées.

Action :

**Voir les présences**

---

# 7. DASHBOARD — RECOUVREMENT DES PAIEMENTS

Afficher un graphique simple :

Titre :

**Recouvrement des paiements**

Sélecteur :

- Cette année
- Cette période
- Mois

Afficher :

- montant attendu ;
- montant encaissé.

Exemple :

Janvier : 2 400 000 FCFA attendu / 2 100 000 FCFA encaissé.

Février : etc.

Sous le graphique :

**Total attendu : 28 500 000 FCFA**

**Total encaissé : 23 370 000 FCFA**

**Taux de recouvrement : 82 %**

---

# 8. DASHBOARD — ÉCHÉANCES IMPAYÉES

Afficher une table :

Colonnes :

- Élève
- Classe
- Montant dû
- Date d'échéance
- Statut
- Action

Exemple :

AGBODAN Komi | 6ème A | 75 000 FCFA | 15/05/2025 | En retard

Statuts :

- Payé = vert
- En attente = gris
- Partiel = orange
- En retard = rouge

Action :

**Voir**

ou

**Relancer**

---

# 9. DASHBOARD — PRÉSENCE DU JOUR

Afficher un graphique circulaire.

Catégories :

- Présents
- Absents
- Retards

Exemple :

Présents : 476

Absents : 32

Retards : 54

Afficher également :

**Total élèves : 562**

Bouton :

**Voir les présences**

---

# 10. DASHBOARD — RÉPARTITION DES ÉLÈVES

Afficher un graphique par classe.

Exemple :

6ème : 120

5ème : 140

4ème : 130

3ème : 172

Permettre de cliquer sur une classe pour accéder directement à sa fiche.

---

# 11. DASHBOARD — ACTIVITÉS RÉCENTES

Afficher une timeline.

Exemples :

- Paiement reçu de AGBOGAN Komi
- Note saisie pour la classe 6ème A
- Absence enregistrée pour 6 élèves
- Devoir publié en français
- Nouvelle échéance générée

Chaque activité affiche :

- icône ;
- description ;
- utilisateur responsable ;
- date/heure.

Bouton :

**Voir toute l'activité**

---

# 12. DASHBOARD — ACTIONS RAPIDES

Créer une zone :

**Actions rapides**

Boutons :

1. Ajouter un élève
2. Créer une classe
3. Générer une échéance
4. Enregistrer un paiement
5. Publier un devoir
6. Voir tous les raccourcis

Ces boutons doivent réellement rediriger vers les fonctionnalités correspondantes.

---

# 13. MENU ÉLÈVES

Route :

`/eleves`

La page doit afficher la liste complète des élèves.

## En haut

Titre :

**Élèves**

Sous-titre :

**Gérez les élèves inscrits dans votre établissement.**

Bouton principal :

**+ Ajouter un élève**

## Barre de recherche

Placeholder :

**Rechercher par nom, prénom ou matricule...**

## Filtres

- Classe
- Sexe
- Statut
- Année scolaire

## Tableau

Colonnes :

- Photo/avatar
- Matricule
- Nom et prénom
- Classe
- Sexe
- Parent/tuteur
- Téléphone parent
- Statut
- Actions

Actions :

- Voir
- Modifier
- Transférer
- Désactiver

---

# 14. FICHE ÉLÈVE

Route :

`/eleves/[id]`

Afficher en haut :

- photo/avatar ;
- nom complet ;
- matricule ;
- classe ;
- statut ;
- année scolaire.

Exemple :

**AGBODAN Komi**

Matricule : SCG-2025-00124

Classe : 6ème A

Statut : Actif

---

## Onglet Informations

Afficher :

### Informations personnelles

- Nom
- Prénom
- Date de naissance
- Lieu de naissance
- Sexe
- Nationalité
- Adresse

### Informations scolaires

- Matricule
- Classe
- Date d'inscription
- Année scolaire
- Statut

### Parent / tuteur

- Nom
- Téléphone
- Email
- Relation avec l'enfant

Actions :

**Modifier**

---

# 15. ONGLET NOTES

Afficher :

- trimestre ;
- matière ;
- évaluation ;
- note ;
- coefficient ;
- moyenne.

Exemple :

Mathématiques

Composition 1 : 15/20

Interrogation : 17/20

Composition 2 : 14/20

Moyenne : 15,3/20

Afficher la moyenne générale.

---

# 16. ONGLET PRÉSENCES

Afficher :

- période ;
- nombre de jours présents ;
- absences ;
- retards ;
- justificatifs.

Exemple :

Présences : 86

Absences : 3

Retards : 5

Permettre de consulter le détail par date.

---

# 17. ONGLET PAIEMENTS

Afficher :

- frais ;
- montant attendu ;
- montant payé ;
- reste à payer ;
- échéance ;
- statut.

Exemple :

Scolarité annuelle

Attendu : 300 000 FCFA

Payé : 200 000 FCFA

Reste : 100 000 FCFA

Statut : Partiel

Actions :

**Voir le détail**

**Relancer**

---

# 18. AJOUTER UN ÉLÈVE

Route :

`/eleves/nouveau`

Formulaire organisé en sections.

## Identité

- Nom
- Prénom
- Sexe
- Date de naissance
- Lieu de naissance

## Scolarité

- Classe
- Année scolaire
- Date d'inscription
- Matricule automatique

## Parent

- Nom du parent
- Téléphone
- Email
- Relation

## Adresse

- Ville
- Quartier
- Adresse

Boutons :

**Enregistrer**

**Enregistrer et ajouter un autre**

**Annuler**

Après création, proposer :

**Activer le compte parent**

---

# 19. MENU CLASSES

Route :

`/classes`

Afficher les classes sous forme de cartes ou tableau.

Chaque classe affiche :

- nom ;
- niveau ;
- enseignant principal ;
- nombre d'élèves ;
- capacité ;
- année scolaire ;
- statut.

Exemple :

**6ème A**

35 élèves

Professeur principal :

M. ADJOVI

Boutons :

**Voir la classe**

**Modifier**

---

# 20. FICHE CLASSE

Afficher des onglets :

- Vue générale
- Élèves
- Notes
- Présences
- Devoirs
- Paiements

## Vue générale

Afficher :

- effectif ;
- enseignant principal ;
- moyenne générale ;
- taux de présence ;
- paiements collectés.

---

# 21. AJOUTER UNE CLASSE

Formulaire :

- Nom de la classe
- Niveau
- Section
- Salle
- Capacité
- Enseignant principal
- Année scolaire

Bouton :

**Créer la classe**

---

# 22. MENU PERSONNEL

Route :

`/personnel`

Afficher :

- nom ;
- fonction ;
- téléphone ;
- email ;
- statut ;
- date d'ajout.

Filtres :

- Enseignant
- Comptable
- Administrateur

Bouton :

**+ Inviter un membre**

---

# 23. INVITER UN MEMBRE DU PERSONNEL

Formulaire :

- Nom
- Prénom
- Email
- Téléphone
- Fonction
- Classes assignées
- Permissions

Fonctions :

- Administrateur
- Comptable
- Enseignant

Bouton :

**Envoyer l'invitation**

---

# 24. MENU FINANCE

Le menu Finance doit être un menu extensible.

Sous-menu :

1. Tableau de bord
2. Échéances
3. Paiements
4. Impayés
5. Frais scolaires
6. Rapports financiers

---

# 25. FINANCE — TABLEAU DE BORD

Afficher :

- total attendu ;
- total encaissé ;
- reste à recouvrer ;
- taux de recouvrement ;
- paiements du jour ;
- impayés ;
- échéances à venir.

Graphiques :

- encaissement mensuel ;
- évolution des impayés.

---

# 26. FINANCE — ÉCHÉANCES

Afficher toutes les échéances.

Colonnes :

- Élève
- Classe
- Type de frais
- Montant
- Date d'échéance
- Montant payé
- Reste
- Statut

Filtres :

- classe ;
- période ;
- statut ;
- type de frais.

Actions :

**Voir**

**Modifier**

**Relancer**

---

# 27. GÉNÉRER DES ÉCHÉANCES

Permettre :

### Création individuelle

Choisir :

- élève ;
- type de frais ;
- montant ;
- date d'échéance.

### Création par classe

Choisir :

- classe ;
- type de frais ;
- montant ;
- date d'échéance.

Afficher un aperçu avant confirmation.

Bouton :

**Générer les échéances**

---

# 28. FINANCE — PAIEMENTS

Afficher tous les paiements.

Colonnes :

- Date
- Élève
- Classe
- Montant
- Moyen de paiement
- Référence
- Enregistré par
- Statut

Moyens :

- Espèces
- T-Money
- Flooz
- Wave
- Orange Money
- MTN MoMo
- Autre

---

# 29. DÉTAIL D'UN PAIEMENT

Afficher :

- élève ;
- montant ;
- date ;
- moyen ;
- référence ;
- échéance concernée ;
- utilisateur ayant enregistré le paiement.

Afficher un reçu.

Boutons :

**Télécharger le reçu**

**Imprimer**

**Relancer le parent**

---

# 30. IMPAYÉS

Créer une page dédiée aux élèves ayant des montants en retard.

Afficher :

- nom ;
- classe ;
- téléphone parent ;
- montant ;
- nombre de jours de retard ;
- statut.

Actions :

**Relancer**

**Voir le dossier**

La relance doit pouvoir être préparée par :

- SMS ;
- notification ;
- email ;
- WhatsApp si une intégration future est disponible.

---

# 31. MENU ACADÉMIQUE

Sous-menu :

1. Notes
2. Présences
3. Devoirs
4. Bulletins
5. Matières
6. Emplois du temps

---

# 32. ACADÉMIQUE — NOTES

Permettre à l'administrateur de consulter les notes de toutes les classes.

Filtres :

- classe ;
- matière ;
- trimestre ;
- enseignant.

Afficher :

- élève ;
- évaluation ;
- note ;
- coefficient ;
- moyenne.

---

# 33. ACADÉMIQUE — PRÉSENCES

Afficher :

- date ;
- classe ;
- enseignant ;
- présents ;
- absents ;
- retards.

Permettre de sélectionner une classe et une date pour consulter la feuille complète.

---

# 34. ACADÉMIQUE — DEVOIRS

Afficher les devoirs publiés.

Colonnes :

- titre ;
- matière ;
- classe ;
- enseignant ;
- date de publication ;
- date limite ;
- statut.

Actions :

**Voir**

**Modifier**

**Supprimer**

---

# 35. ACADÉMIQUE — BULLETINS

Afficher les bulletins par :

- année scolaire ;
- trimestre ;
- classe.

Actions :

**Prévisualiser**

**Générer**

**Télécharger PDF**

**Publier aux parents**

---

# 36. ACADÉMIQUE — MATIÈRES

Afficher les matières :

- Français
- Mathématiques
- Anglais
- Sciences
- Histoire-Géographie
- Éducation civique
- EPS
- etc.

Pour chaque matière :

- nom ;
- niveau ;
- coefficient ;
- enseignant associé.

---

# 37. MENU COMMUNICATION

Sous-menu :

1. Messages
2. Notifications
3. Annonces
4. Historique des communications

## Messages

Permettre à l'école d'envoyer un message :

- à tous les parents ;
- à une classe ;
- à un groupe ;
- à un parent précis.

Champs :

- destinataire ;
- objet ;
- message ;
- pièce jointe.

Bouton :

**Envoyer**

---

# 38. ANNONCES

Créer des annonces visibles dans l'espace parent.

Exemple :

**Réunion de parents d'élèves**

Date : samedi 20 septembre

Lieu : salle polyvalente

Bouton :

**Publier l'annonce**

---

# 39. MENU RAPPORTS

Sous-menu :

1. Rapport élèves
2. Rapport financier
3. Rapport présence
4. Rapport notes
5. Rapport personnel
6. Rapport global

Chaque rapport doit permettre :

- filtrage ;
- prévisualisation ;
- export PDF ;
- export Excel/CSV lorsque pertinent.

---

# 40. RAPPORT GLOBAL

Créer une synthèse de l'école.

Afficher :

- nombre d'élèves ;
- nombre de classes ;
- personnel ;
- taux de présence ;
- moyenne générale ;
- taux de recouvrement ;
- impayés ;
- évolution mensuelle.

Bouton :

**Générer le rapport**

---

# 41. MENU PARAMÈTRES

Sous-menu :

1. Informations de l'école
2. Année scolaire
3. Classes
4. Utilisateurs et permissions
5. Notifications
6. Paiements
7. Personnalisation
8. Abonnement
9. Sécurité

---

# 42. PARAMÈTRES — ÉCOLE

Afficher :

- logo ;
- nom de l'école ;
- adresse ;
- ville ;
- téléphone ;
- email ;
- site web ;
- devise ;
- informations administratives.

Bouton :

**Enregistrer les modifications**

---

# 43. PARAMÈTRES — ANNÉE SCOLAIRE

Afficher :

**Année scolaire active : 2025-2026**

Permettre :

- créer une nouvelle année ;
- définir la date de début ;
- définir la date de fin ;
- archiver l'ancienne année ;
- passer à une nouvelle année.

Attention : les données historiques ne doivent jamais être supprimées automatiquement.

---

# 44. PARAMÈTRES — UTILISATEURS ET PERMISSIONS

Afficher tous les comptes utilisateurs.

Pour chaque utilisateur :

- nom ;
- email ;
- rôle ;
- statut ;
- dernière connexion.

Permissions par rôle.

Ne jamais permettre à un enseignant de consulter librement les données financières de toute l'école.

---

# 45. PARAMÈTRES — ABONNEMENT

Afficher :

- formule actuelle ;
- nombre d'élèves autorisés ;
- nombre d'élèves utilisés ;
- prix ;
- prochaine date de facturation ;
- historique des factures.

Exemple :

**Formule Croissance**

45000 FCFA / mois

Élèves utilisés : 386 / 500

Boutons :

**Changer de formule**

**Voir les factures**

---

# 46. ESPACE ENSEIGNANT

L'enseignant possède une interface simplifiée.

Menu :

1. Tableau de bord
2. Mes classes
3. Notes
4. Présences
5. Devoirs

---

# 47. DASHBOARD ENSEIGNANT

Afficher :

**Bonjour M. Adjovi**

Puis :

- classes assignées ;
- nombre d'élèves ;
- devoirs à corriger ;
- prochaines évaluations ;
- dernières présences.

Carte par classe :

**6ème A**

35 élèves

Bouton :

**Ouvrir la classe**

---

# 48. SAISIE DES NOTES

Créer une grille optimisée pour une saisie rapide.

Colonnes :

- Élève
- Évaluation 1
- Évaluation 2
- Composition
- Moyenne

Chaque cellule doit être directement modifiable.

Après saisie :

Afficher un indicateur :

**Enregistrement...**

Puis :

**Enregistré**

En cas de problème réseau :

**Modification non synchronisée**

La donnée ne doit pas être silencieusement perdue.

---

# 49. FEUILLE DE PRÉSENCE

Afficher la liste des élèves.

Pour chaque élève :

**Présent**

**Absent**

**Retard**

Utiliser de gros boutons facilement cliquables sur tablette et smartphone.

Afficher :

**32 présents**

**2 absents**

**1 retard**

Bouton :

**Enregistrer la présence**

---

# 50. DEVOIRS ENSEIGNANT

Formulaire :

- titre ;
- matière ;
- classe ;
- description ;
- date de publication ;
- date limite ;
- pièce jointe.

Bouton :

**Publier le devoir**

En dessous :

**Devoirs publiés**

---

# 51. ESPACE COMPTABLE

Menu :

1. Tableau de bord
2. Échéances
3. Paiements
4. Impayés
5. Rapports

Le comptable doit avoir une vision financière immédiate.

Le dashboard comptable doit afficher :

- montant attendu ;
- montant encaissé ;
- reste ;
- taux de recouvrement ;
- paiements aujourd'hui ;
- impayés urgents.

---

# 52. ESPACE PARENT

L'espace parent est **mobile-first strict**.

Largeur de référence :

390 px.

Navigation basse :

1. Accueil
2. Notes
3. Présence
4. Devoirs
5. Plus

---

# 53. DASHBOARD PARENT

Afficher en priorité :

### Sélecteur d'enfant

Exemple :

**Komi AGBODAN**

6ème A

Si le parent possède plusieurs enfants, permettre de changer d'enfant.

### Paiement

Afficher immédiatement :

**Échéance scolaire**

75 000 FCFA

Échéance : 15 septembre

Statut :

**En retard**

Bouton très visible :

**Payer maintenant**

### Présence

Présent aujourd'hui.

### Dernières notes

Mathématiques : 15/20

Français : 16/20

### Prochains devoirs

Mathématiques — vendredi

Français — lundi

---

# 54. PARENT — NOTES

Afficher les notes par trimestre.

Sélecteurs :

- Trimestre 1
- Trimestre 2
- Trimestre 3

Puis :

Matière

Note

Coefficient

Moyenne

Afficher la moyenne générale.

---

# 55. PARENT — PRÉSENCE

Afficher :

- présents ;
- absents ;
- retards.

Afficher également l'historique par date.

Exemple :

15 septembre — Présent

16 septembre — Présent

17 septembre — Retard

---

# 56. PARENT — DEVOIRS

Afficher les devoirs sous forme de cartes simples.

Chaque carte :

- matière ;
- titre ;
- enseignant ;
- date ;
- date limite ;
- pièce jointe.

Bouton :

**Voir le devoir**

---

# 57. PAIEMENT PARENT

Afficher :

### Récapitulatif

Scolarité

Montant :

**75 000 FCFA**

Puis :

**Choisissez votre moyen de paiement**

Options :

- T-Money
- Flooz
- Wave
- Orange Money
- MTN MoMo

Afficher le logo de chaque moyen.

Bouton :

**Confirmer et payer 75 000 FCFA**

Après paiement :

Afficher un écran de confirmation clair :

**Paiement effectué avec succès**

Référence :

**SCG-2025-004582**

Montant :

75 000 FCFA

Date :

15 septembre 2025

Bouton :

**Télécharger le reçu**

---

# 58. BULLETINS PARENT

Afficher :

**Mes bulletins**

Chaque carte :

**Trimestre 1 — 2025-2026**

Statut :

Disponible

Boutons :

**Voir**

**Télécharger PDF**

---

# 59. AUTHENTIFICATION

## Connexion

Champs :

- email ;
- mot de passe.

Options :

**Se connecter**

**Mot de passe oublié ?**

**Se connecter avec Google** si cette fonctionnalité est activée.

Lien :

**Inscrire une école**

---

# 60. INSCRIPTION ÉCOLE

Formulaire :

- nom de l'école ;
- ville ;
- nom de l'administrateur ;
- téléphone ;
- email ;
- mot de passe ;
- confirmation du mot de passe.

Après inscription :

Afficher un assistant de configuration initiale.

---

# 61. PREMIÈRE CONFIGURATION DE L'ÉCOLE

Après inscription, guider l'administrateur étape par étape :

### Étape 1

Informations de l'école.

### Étape 2

Année scolaire.

### Étape 3

Créer les classes.

### Étape 4

Ajouter les enseignants.

### Étape 5

Ajouter les élèves.

### Étape 6

Configurer les frais scolaires.

### Étape 7

Inviter les parents.

Afficher une barre de progression :

**Configuration de votre école : 4/7**

---

# 62. ACTIVATION COMPTE PARENT

Le parent reçoit un code.

Écran :

**Activez votre compte parent**

Champ :

**_ _ _ _ _ _**

Code à 6 caractères.

Puis choix :

**Téléphone**

ou

**Email**

Après validation :

Créer le mot de passe.

---

# 63. SYSTÈME DE NOTIFICATIONS

Créer un centre de notifications.

Types :

- paiement reçu ;
- échéance proche ;
- échéance en retard ;
- nouvelle note ;
- nouvelle absence ;
- nouveau devoir ;
- nouveau message ;
- bulletin disponible.

Chaque notification doit afficher :

- icône ;
- titre ;
- description ;
- date ;
- statut lu/non lu.

---

# 64. RECHERCHE GLOBALE

Ajouter une recherche globale accessible depuis l'en-tête.

L'utilisateur peut rechercher :

- élève ;
- classe ;
- personnel ;
- paiement ;
- échéance ;
- devoir.

Exemple :

Recherche :

**Komi Agbodan**

Résultats :

Élève

Paiements

Présences

Notes

---

# 65. SYSTÈME DE STATUTS

Utiliser exactement les mêmes codes visuels dans toute l'application.

### Vert

Payé

Actif

Présent

Validé

### Gris

En attente

Inactif

Non traité

### Orange

Partiel

Attention

Bientôt échéance

### Rouge

En retard

Absent

Erreur

Bloqué

Les couleurs doivent être accompagnées d'un texte.

Ne jamais utiliser uniquement la couleur pour communiquer une information.

---

# 66. ÉTATS DE CHARGEMENT

Chaque page nécessitant des données doit avoir un état de chargement.

Utiliser des skeleton loaders légers.

Éviter les écrans blancs.

---

# 67. ÉTATS D'ERREUR

En cas d'erreur réseau :

Afficher :

**Impossible de charger les données**

Bouton :

**Réessayer**

Ne jamais afficher une erreur technique incompréhensible à l'utilisateur.

---

# 68. RESPONSIVE DESIGN

## Desktop

Largeur de référence :

**1440 px**

Sidebar fixe à gauche.

## Tablette

Réduire la sidebar.

## Smartphone

Utiliser :

- menu hamburger ;
- cartes ;
- tableaux transformés en listes/cartes ;
- boutons larges ;
- navigation basse pour le parent.

---

# 69. PERFORMANCE

Scogestia doit être conçue pour des connexions internet faibles.

Éviter :

- animations lourdes ;
- vidéos automatiques ;
- images décoratives inutiles ;
- gros fichiers ;
- composants inutiles.

Utiliser :

- SVG ;
- icônes légères ;
- chargement différé ;
- pagination ;
- recherche côté serveur lorsque nécessaire.

---

# 70. RÈGLE IMPORTANTE POUR LES TABLEAUX

Sur desktop, privilégier les tableaux.

Sur mobile, transformer automatiquement les tableaux en cartes ou listes verticales.

Exemple :

Desktop :

| Élève | Classe | Montant | Statut | Action |

Mobile :

**AGBODAN Komi**

6ème A

75 000 FCFA

🔴 En retard

[Voir] [Relancer]

---

# 71. CONFIRMATIONS D'ACTIONS

Pour les opérations importantes, demander confirmation.

Exemple :

**Supprimer cet élève ?**

Cette action ne peut pas être annulée.

Boutons :

**Annuler**

**Confirmer**

Pour les opérations sensibles, préférer la désactivation à la suppression définitive.

---

# 72. PERMISSIONS

## Administrateur

Accès complet à l'école.

## Comptable

Accès :

- finance ;
- élèves pour consulter les informations nécessaires ;
- rapports financiers.

Pas d'accès à la modification pédagogique des notes.

## Enseignant

Accès :

- classes assignées ;
- élèves de ses classes ;
- notes ;
- présences ;
- devoirs.

Pas d'accès aux données financières globales.

## Parent

Accès uniquement :

- à ses enfants ;
- notes ;
- présences ;
- devoirs ;
- bulletins ;
- paiements.

Un parent ne doit jamais pouvoir consulter les informations d'un autre élève.

---

# 73. RÈGLE DE COHÉRENCE

Tous les écrans doivent utiliser les mêmes :

- boutons ;
- couleurs ;
- badges ;
- cartes ;
- champs ;
- tableaux ;
- modales ;
- menus ;
- icônes ;
- espacements ;
- typographies.

Un bouton **Ajouter** doit avoir la même apparence partout.

Un statut **En retard** doit avoir le même rendu partout.

---

# 74. ARCHITECTURE DE ROUTES RECOMMANDÉE

Créer une architecture logique similaire à :

`/login`

`/inscription`

`/activation-parent`

`/dashboard`

`/eleves`

`/eleves/nouveau`

`/eleves/[id]`

`/classes`

`/classes/[id]`

`/personnel`

`/finance`

`/finance/echeances`

`/finance/paiements`

`/finance/impayes`

`/finance/rapports`

`/academique`

`/academique/notes`

`/academique/presences`

`/academique/devoirs`

`/academique/bulletins`

`/communication`

`/rapports`

`/parametres`

`/enseignant`

`/enseignant/classes`

`/enseignant/notes`

`/enseignant/presences`

`/enseignant/devoirs`

`/parent`

`/parent/notes`

`/parent/presences`

`/parent/devoirs`

`/parent/paiements`

`/parent/bulletins`

---

# 75. IMPORTANT — NE PAS SE LIMITER À LA MAQUETTE

La maquette visuelle fournie sert de **référence UI/UX**, mais elle ne représente pas toutes les fonctionnalités.

L'application réelle doit contenir toutes les fonctionnalités décrites dans ce document.

Chaque élément visuel doit avoir une fonction réelle.

Exemple :

Si le dashboard affiche :

**Voir les élèves**

alors ce bouton doit réellement ouvrir la liste des élèves.

Si le dashboard affiche :

**Voir toutes les échéances**

alors il doit ouvrir la page correspondante.

Si une carte affiche :

**82 % de recouvrement**

la valeur doit provenir des données réelles de la base de données.

---

# 76. DONNÉES DE DÉMONSTRATION

Pour rendre l'application immédiatement compréhensible pendant le développement, créer des données de démonstration réalistes :

École :

**École La Réussite**

Ville :

**Lomé**

Pays :

**Togo**

Élèves :

500+

Classes :

6ème A, 6ème B, 5ème A, 5ème B, 4ème A, 4ème B, 3ème A, 3ème B, etc.

Montants :

Utiliser le FCFA.

Exemples de noms :

- AGBODAN Komi
- DOSSА Kossi
- LAWSON Esi
- TCHALLA Mawuli
- HOUNKPATI Nana
- ADJOVI Mensah

Les données doivent avoir l'apparence de vraies données scolaires togolaises, mais être clairement des données de démonstration.

---

# 77. OBJECTIF FINAL

L'objectif n'est pas simplement de créer plusieurs pages jolies.

L'objectif est de créer un véritable logiciel SaaS de gestion scolaire dans lequel :

Administrateur → contrôle l'établissement.

Comptable → contrôle les finances.

Enseignant → gère son activité pédagogique.

Parent → suit son enfant et paie facilement.

Chaque rôle doit voir uniquement les informations qui lui sont utiles.

Chaque bouton doit fonctionner.

Chaque menu doit mener à une vraie fonctionnalité.

Chaque tableau doit pouvoir afficher des données.

Chaque formulaire doit être connecté au système de données.

Chaque action importante doit avoir un retour visuel.

Aucune rubrique ne doit être vide ou sans utilité.

---

# 78. PRIORITÉ DE DÉVELOPPEMENT

Construire dans cet ordre :

### Phase 1 — Fondations

- authentification ;
- rôles ;
- école ;
- année scolaire ;
- utilisateurs ;
- permissions.

### Phase 2 — Administration

- dashboard ;
- élèves ;
- classes ;
- personnel.

### Phase 3 — Académique

- notes ;
- présences ;
- devoirs ;
- bulletins.

### Phase 4 — Finance

- frais ;
- échéances ;
- paiements ;
- impayés ;
- rapports.

### Phase 5 — Parent

- dashboard ;
- notes ;
- présences ;
- devoirs ;
- bulletins ;
- paiements.

### Phase 6 — Communication

- notifications ;
- messages ;
- annonces.

### Phase 7 — Finalisation

- rapports ;
- abonnement ;
- paramètres ;
- sécurité ;
- optimisation mobile ;
- optimisation réseau faible ;
- tests.

---

# 79. CONSIGNE FINALE À ANTIGRAVITY

Ne génère pas une simple démonstration statique.

Construis une application SaaS fonctionnelle, responsive et structurée autour des spécifications ci-dessus.

Utilise la maquette Scogestia fournie comme référence visuelle principale.

Respecte :

- le vert émeraude ;
- le style institutionnel ;
- la simplicité ;
- les espacements ;
- la hiérarchie visuelle ;
- les badges ;
- les cartes ;
- la sidebar ;
- les tableaux ;
- la navigation responsive.

L'interface doit être en français.

Les montants doivent être affichés en FCFA.

Le contexte doit correspondre à une école privée togolaise.

L'application doit être conçue avec une architecture propre permettant son évolution vers plusieurs écoles et plusieurs milliers d'élèves.

Prévoir une séparation stricte des données entre établissements.

Prévoir les permissions par rôle.

Prévoir les états :

- chargement ;
- succès ;
- erreur ;
- vide ;
- recherche sans résultat ;
- absence de connexion ;
- accès refusé.

Ne jamais créer une page avec uniquement un titre et du contenu fictif sans fonctionnalité.

Avant de considérer une fonctionnalité comme terminée, vérifier :

1. son interface ;
2. son comportement ;
3. ses boutons ;
4. ses validations ;
5. ses permissions ;
6. son responsive ;
7. ses états de chargement ;
8. ses états d'erreur ;
9. son état vide ;
10. son intégration avec les autres modules.

Scogestia doit donner à l'utilisateur l'impression d'utiliser un logiciel professionnel déjà commercialisable, et non un prototype généré automatiquement.