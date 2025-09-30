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

I have a google sheet with 6 sheets each have a table. Here is the list with theire columns
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

It's basically a personal bilangual dictionary french <=> Arabic (so far)

I want to create a form that allows me to test my self.
in the form (or elswhere) i can choose one or more chapters and i'm presented with 10 questions each one is the meaning of a word in one language or the other.
I created a google app script project and here are the files i'm using.
The main problem so far is that when i click on the buttons (Lancer le quiz, Tout selectionner, Tout deselectionner) nothing happens.

Correct the UI problem and adapt my code to the current tables schema. Also feel free to suggest any modification to implement your solution.
Keep in mind that i didn't use ids in traduction and  relation tables to make it human readable. If needed i can addthem but i want to keep the whoile words for my learning

This is my google app script project
I have a google sheet with 6 sheets each have a table. Here is the list with theire columns
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
It's basically a personal bilangual dictionary french <=> Arabic (so far).
I want to create a google forms dynamically from the words in the sheets.
So far, when the form is generated i get questions like so
Question 1: Traduisez en Francais: "عاد"
Question 2: Traduisez en Francais: "رجع"

I want to validate the answer with the translated word since i get them both from my sheet.
Here is my attempt but so far it's not what i want. What i'm looking for is the equivalent of
when i'm on the form in edit mode i click on a sction (and since the form is a quiz) i have an option "Answer Key" that allows me to put correct answers, Mark all other answers as incorrect and define how many points to attribute to this question (the item.setPoints(1) is working currently)

As written in the Forms API docs,

The Forms Service on Apps Script does not plan to support:

Subscribing to form events with Cloud Pub/Sub

Setting correct answers for question types that are not multiple choice

To set correct answer to a question that is a multiple choice or list, you can use .createChoice() directly. For other types like text items, you need to use the API. You can however connect with the API through Apps script using UrlFetchApp. See

https://github.com/googleworkspace/apps-script-oauth2/tree/main/samples/NoLibrary

https://developers.google.com/forms/api/guides/apps-script-setup

https://developers.google.com/forms/api/guides/setup-grading

Rewrite my functions to edit the form through the API
