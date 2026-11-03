# Atelier

**Outil de gestion de projet.**
en Tauri (Rust) + SQLite

Interface et code an anglais.
Me parler en français lors des sessions de travail.

## Fonctionnalités
Il s'agit d'un outil permettant d'enregistrer en base une liste de projets en cours. Se fier à la maquette ci jointe pour comprendre :

On créé des projets (bouton bleu en haut à droite (à remplacer par + New Project)), chaque projet à :
- Un nom
- Une catégorie (on peut créer des catégories à la volée avec un menu manage categories), à ajouter : pastilles de couleurs quand on créé une catégorie.
- une date de création
- un statut : draft / in progress / completed / online
- un chemin éventuel sur le disque dur du PC, quand on clique ce lien cela ouvre directement le dossier sur le PC
- Un lien éventuel vers un dépot distant : GitHub / Gitlab ou autre (prévoir des icones correspondantes)
- Un status online / offline, avec un lien cliquable pour ouvrir dans le navigateur le projet.

Pour remplir toutes ces informations, on afficheras une modale large sur l'écran.

## Design
Se fier au design de la maquette ci-joint.
Tu redessineras le logo "A" en vectoriel SVG suivant l'inspiration du modele dans la maquette. Tu utiliseras ce A comme icone pour l'application.

# Technique
Travailler en Rust tauri + SQLite.
Prévoir un petit icone engenage + dossier quelque part qui permet d'ouvrir directement le chemin vers la base sqlite.
