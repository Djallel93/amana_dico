function testGetFormInfo() {
    getFormInfo('11sCmmsXZZ8Ho9dhzm86MyS5Z5EKOmQnx7iVmorFREMg')
};

/**
 * Get full form info from Forms API and log it
 */
function getFormInfo(formId) {
    const url = `https://forms.googleapis.com/v1/forms/${formId}`;
    const accessToken = getOAuth2AccessToken();
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        muteHttpExceptions: true // allows logging full error if something goes wrong
    };

    try {
        const response = UrlFetchApp.fetch(url, options);
        const code = response.getResponseCode();
        const body = response.getContentText();

        if (code !== 200) {
            console.error(`❌ Failed to fetch form. Code: ${code}, Body: ${body}`);
            return;
        }

        const form = JSON.parse(body);

        // Log the full JSON (raw)
        console.log("==== Raw Form JSON ====");
        console.log(JSON.stringify(form, null, 2));

        // Log items with more detail
        if (form.items) {
            console.log("==== Form Items ====");
            form.items.forEach((item, i) => {
                console.log(`Item #${i + 1}:`);
                console.log(`- itemId: ${item.itemId}`);
                if (item.title) console.log(`- title: ${item.title}`);
                if (item.questionItem) {
                    const q = item.questionItem.question;
                    console.log(`- Question type: ${Object.keys(q)[0]}`);
                }
            });
        } else {
            console.log("⚠️ No items found in this form.");
        }

    } catch (err) {
        console.error("❌ Error fetching form info:", err);
    }
}


/**
 * {
  "formId": "11sCmmsXZZ8Ho9dhzm86MyS5Z5EKOmQnx7iVmorFREMg",
  "info": {
    "description": "Traduisez les mots suivants dans la langue demandée.",
    "documentTitle": "2025_09_29_Test de Vocabulaire - Français ↔ العربية"
  },
  "settings": {
    "quizSettings": {
      "isQuiz": true
    },
    "emailCollectionType": "RESPONDER_INPUT"
  },
  "revisionId": "0000001b",
  "responderUri": "https://docs.google.com/forms/d/e/1FAIpQLSfU19Lvos1SFst5j7exr9leZSmFoU0Mmzb0SaiR2r2x5bq3nw/viewform",
  "items": [
    {
      "itemId": "38be73e6",
      "title": "Question 1: Traduisez en Arabe: \"revenir\"",
      "description": "Langue source: Francais → Langue cible: Arabe",
      "questionItem": {
        "question": {
          "questionId": "782a61ed",
          "required": true,
          "textQuestion": {}
        }
      }
    },
    {
      "itemId": "254ff176",
      "title": "Question 2: Traduisez en Francais: \"ذهب\"",
      "description": "Langue source: Arabe → Langue cible: Francais",
      "questionItem": {
        "question": {
          "questionId": "13f1a33b",
          "required": true,
          "textQuestion": {}
        }
      }
    },
    {
      "itemId": "0c6bc14a",
      "title": "Question 3: Traduisez en Arabe: \"revenir\"",
      "description": "Langue source: Francais → Langue cible: Arabe",
      "questionItem": {
        "question": {
          "questionId": "1e8e4a92",
          "required": true,
          "textQuestion": {}
        }
      }
    }
  ],
  "publishSettings": {
    "publishState": {
      "isPublished": true,
      "isAcceptingResponses": true
    }
  }
}
 */