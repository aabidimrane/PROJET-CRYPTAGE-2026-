🔐 Système de Chiffrement & Gouvernance des Accès — Projet CIEL [IR]

Ce dépôt héberge le prototype final de la plateforme de sécurité développée pour l'entreprise CIEL. Cette solution combine un moteur de chiffrement multi-algorithme ($\text{AES-256}$, $\text{PBKDF2}$ et l'algorithme propriétaire $\text{Arcane-256}$) avec une gestion des privilèges par grades et une centralisation des secrets via KeePass (format de fichier .kdbx).

📋 Table des Matières

Présentation du Projet

Fonctionnalités Clés

Architecture de Sécurité

Algorithmes Implémentés

Installation et Lancement

Guide d'Utilisation Simplifié

🚀 Présentation du Projet

Le système interne de l'entreprise CIEL nécessite un cloisonnement fort des informations critiques (fichiers de configurations réseau, documents RH, bilans financiers, rapports de direction).

Ce projet répond à deux problématiques fondamentales :

Confidentialité et intégrité : Empêcher la lecture et l'altération de données sensibles.

Gouvernance et cloisonnement (RBAC) : Restreindre l'accès aux secrets en fonction du service d'affectation de l'utilisateur (RH, Informatique, Direction).

✨ Fonctionnalités Clés

Authentification par identifiant / mot de passe : Attribution des comptes et mots de passe par l'administrateur.

Gestion des privilèges par Grades :

👑 Administrateur (Grade ROOT) : Accès à toutes les partitions de fichiers de l'entreprise + accès exclusif au panneau d'audit de sécurité (logs en temps réel).

👤 Utilisateur Standard (Grade LEVEL-1) : Accès limité strictement au répertoire de son propre service (ex: RH ou IT). Aucun accès aux logs globaux.

Moteur Cryptographique Interactif : Chiffrement et déchiffrement de textes et de clés à l'aide de différents protocoles.

Intégration KeePass (Notice) : Fiche d'installation et d'utilisation de KeePassXC intégrée pour former les collaborateurs à la gestion de la base de données .kdbx.

🛠️ Architecture de Sécurité

Modèle de Cloisonnement (Grades)

                  [ ÉCRAN D'AUTHENTIFICATION ]
                               |
            +------------------+------------------+
            |                                     |
     [ Grade: ROOT ]                      [ Grade: LEVEL-1 ]
   (Administrateur IT)                  (Utilisateur Service)
            |                                     |
    +-------+-------+                             v
    |               |                     Accès restreint à :
    v               v                     - Dossier de service
Accès Total    Logs d'Audit               - Chiffrement local


🔒 Algorithmes Implémentés

Algorithme

Rôle

Caractéristique

AES-256

Chiffrement symétrique au repos

Standard militaire inviolable de $256\text{ bits}$ pour sceller les documents sensibles.

PBKDF2

Dérivation de clé

Transforme un mot de passe simple en clé cryptographique via un sel aléatoire et un hachage itératif.

Arcane-256

Chiffrement léger propriétaire

Conçu pour la vitesse et la légèreté des transferts réseau internes.

⚙️ Installation et Lancement

Prérequis

Node.js (version 16 ou supérieure)

npm ou yarn

Étape 1 : Cloner le dépôt

git clone [https://github.com/VOTRE_PSEUDO/ciel-security-project.git](https://github.com/VOTRE_PSEUDO/ciel-security-project.git)
cd ciel-security-project


Étape 2 : Installer les dépendances

npm install
# ou
yarn install


Étape 3 : Installer Lucide React (pour les icônes)

npm install lucide-react


Étape 4 : Lancer en local

npm run dev
# ou
yarn dev


L'application s'ouvrira localement (généralement sur http://localhost:5173).

📂 Structure des Identifiants (Maquette)

Pour tester la plateforme, utilisez les comptes provisionnés suivants :

Administrateur (ROOT) :

Identifiant : admin

Mot de passe : ciel_root_password

Service RH (LEVEL-1) :

Identifiant : rh_user

Mot de passe : rh_password_2024

Service Informatique (LEVEL-1) :

Identifiant : it_user

Mot de passe : it_password_2024

📝 Licence

Ce projet est distribué sous la licence MIT. Voir le fichier LICENSE pour plus de détails.

Projet réalisé dans le cadre du BTS CIEL [IR] (Cybersécurité, Informatique embarquée et Réseaux).
