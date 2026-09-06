# Règles de Workflow pour SCOGESTIA

Les règles suivantes doivent être systématiquement appliquées à chaque tâche de développement :

1. **Parité Web / Android** :
   - Le projet intègre une application Web et une application Android (via Capacitor).
   - Toute modification apportée au Web doit être prise en compte pour l'application Android. Les deux plateformes ne doivent présenter aucune différence (interface, fonctionnalités).
   - Toujours veiller à ce que l'application soit 100% **responsive** pour garantir une expérience optimale sur mobile (Android) et sur ordinateur (Web).

2. **Sauvegarde et Déploiement** :
   - À la fin de CHAQUE tâche ou session de travail accomplie, vous devez **obligatoirement** exécuter les commandes Git pour sauvegarder et envoyer les modifications sur le dépôt distant.
   - Commandes à utiliser (via `run_command` en PowerShell) :
     ```powershell
     git add .
     git commit -m "feat/fix: description des modifications"
     git push
     ```
