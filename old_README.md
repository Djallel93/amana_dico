# SUIVIE DES TIRELIRES
## Présentation
Ce projet a pour but d'automatiser la saisie des information des différentes tirelires.
## Installation en local
```shell
git clone https://github.com/Djallel93/xxxxxxxxxxx
```
Pour établir le lien avec Google App Script il faut avoir préalablement installé **clasp**
```shell
sudo apt update
sudo apt upgrade
sudo apt install npm
sudo npm install -g @google/clasp
# Google App Script Snippet
npm i -D @types/google-apps-script
```
Il faut ensuite activer le [Google Apps Script API](https://script.google.com/home/usersettings)
![Enable Apps Script API](<images/Enable Apps Script API.gif>)
Enfin, il faut s'authentifier avec votre compte Google et cloner le projet (vous aurez besoin du script_id)
![script_id](images/script_id.png)
```shell
clasp login
clasp clone \<script_ID_Google_Sheet\> --rootDir ./Google_Sheets
cd ./Google_Sheets
clasp push --watch -P .
```
## Setup Instructions :
1. Configuration unique dans ton projet
Crée un Client OAuth 2.0 dans la console Google Cloud
.
Note ton CLIENT_ID et CLIENT_SECRET.
Ajoute l’URL de redirection :
https://script.google.com/macros/d/{SCRIPT_ID}/usercallback
Active l’API Forms dans la console GCP.
Script 1 : Première authentification (login, consentement, stockage tokens)
Script 2 : Récupération d’un access token valide (automatique refresh si expiré)
Ces deux scripts utilisent la librairie OAuth2 for Apps Script (1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF).
👉 Tu dois l’ajouter dans ton projet : Éditeur Apps Script > Services > Ajouter une bibliothèque > ID ci-dessus.
## Claude AI Prompt
I have a google sheet with 7 sheets each have a table. Here is the list with theire columns
langue :
id    code    nom
chapitre :
id    nom
mot :
id    mot    langue    type    chapitre    definition
traduction :
mot_source    mot_cible
relation :
mot_source    mot_cible    type(Synonyme/Antonyme)
eleve :
id	nom	prenom	mail	reference	traduction_debutant	traduction_avance	sens_debutant	sens_avance
It's basically a bilangual dictionary french <=> Arabic (so far)
I create a google form that allows me to test my students. In the google form they're presented with x questions each one is the meaning of a word in one language or the other.
I created a google app script project to generate and send the form. So far i've achieved what i wanted but now i want to add a new feature to test students on synonyms and antonyms.
Par fois les mots peuvent avoir plusieur sens selon le context par exemple prendre peut etre traduit par
أَخَذَ dans le sens attraper
ou bien رَكِبَ dans le sens prendre un transport

je voudrais utiliser le champ definition de la feuille mot comme help text sur le formulaire pour avoir des questions plus claires. aussi j'ai rajoute deux colonnes a la feuille traduction pour faciliter le mapping
id_mot_source	mot_source	id_mot_cible	mot_cible

Modifies les fonctions et optimise le code