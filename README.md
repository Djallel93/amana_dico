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
id	nom	prenom	mail	chip    tester  niveau_avance
It's basically a bilangual dictionary french <=> Arabic (so far)
I create a google form that allows me to test my students. In the google form they're presented with x questions each one is the meaning of a word in one language or the other.
I created a google app script project to generate and send the form. So far i've achieved what i wanted but now the problem is that the validation of the question in google forms (The 'Answer key' option not 'Response validation') is case sensitive and i need the validation to automate th process fully and release grades immediatly after they are done.
for example for the word طويل all the fiollowinig are correct
Long
LONG
long
modify the buildGradingRequests() to include the word in lower case, upper case and proper case
Also for more advanced students i want to have the option to also check harakat in words in arabic
currently all words in the table mot don't have harakat i want to add them and if the student is advanced he hase to write them correctly in the form answer otherwise they are ignored
