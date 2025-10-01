const CONFIG = {
    QUIZ_SETTINGS: {
        QUESTION_COUNT: 5,
        FORM_TITLE: 'Test de Vocabulaire - Français ↔ العربية',
        FORM_DESCRIPTION: 'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ \n\n Traduisez les mots suivants dans la langue demandée',
        TEMPLATE_FORM_ID: '1dYBp2PWdWRdjU2Gdff2GM0F65SWxLHyaf52cv4WT2RU',
        RESULTS_FOLDER_NAME: 'translations_tests'
    },

    EMAIL_SETTINGS: {
        SUBJECT: 'Nouveau Test de Vocabulaire',
        SENDER_NAME: 'BOUAKKAZ Djalle Eddine Mohamed',
        REPLY_TO: 'bouakaz.djallel@gmail.com',
        EMAIL_TEMPLATE: {
            EMOJIS: {
                star: '&#127775;', //🌟
                calendar: '&#128197;', //📅
                pencil: '&#128221;', //✏️
                timer: '&#9201;', // ⌛
                rocket: '&#128640;', // 🚀
                arrow: '&#8596;', // ➡️
                warn: '&#9888;&#65039;', // ⚠️
                brain: '&#129504;', // 🧠
            },
            COLORS: {
                primary: '#4285f4',
                primaryHover: '#357ae8',
                background: '#f9f9f9',
                infoBox: '#e8f0fe',
                advancedNotice: '#ffc107',
                text: '#333',
                textLight: '#666'
            },
            CONTENT: {
                estimatedDuration: '5-10 minutes'
            }
        }
    },

    OAUTH_CONFIG: {
        REDIRECT_URI: 'https://script.google.com/macros/d/1GB6MEbLZt5M-paXKmGo6jYxrsdi39PgpJHGLAUEcKGTyTND3bii0soab/usercallback',
        SCOPES: 'https://www.googleapis.com/auth/forms https://www.googleapis.com/auth/drive',
        FORMS_API_BASE_URL: 'https://forms.googleapis.com/v1'
    },

    SHEET_DEF: {
        ELEVE: {
            SHEET_NAME: "eleve",
            COLUMNS: {
                ID: 0,
                NOM: 1,
                PRENOM: 2,
                MAIL: 3,
                CHIP: 4,
                TESTER: 5,
                NIVEAU_AVANCE: 6
            }
        },
        LANGUE: {
            SHEET_NAME: "langue",
            COLUMNS: {
                ID: 0,
                CODE: 1,
                NOM: 2
            }
        },
        CHAPITRE: {
            SHEET_NAME: "chapitre",
            COLUMNS: {
                ID: 0,
                NOM: 1
            }
        },
        MOT: {
            SHEET_NAME: "mot",
            COLUMNS: {
                ID: 0,
                MOT: 1,
                LANGUE: 2,
                TYPE: 3,
                CHAPITRE: 4,
                DEFINITION: 5
            }
        },
        TRADUCTION: {
            SHEET_NAME: "traduction",
            COLUMNS: {
                MOT_SOURCE: 0,
                MOT_CIBLE: 1
            }
        },
        RELATION: {
            SHEET_NAME: "relation",
            COLUMNS: {
                MOT_SOURCE: 0,
                MOT_CIBLE: 1,
                TYPE: 2
            }
        }
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get sheet data with error handling
 */
function getSheetData(sheetName, spreadsheetId = null) {
    try {
        const spreadsheet = spreadsheetId
            ? SpreadsheetApp.openById(spreadsheetId)
            : SpreadsheetApp.getActiveSpreadsheet();

        const sheet = spreadsheet.getSheetByName(sheetName);
        if (!sheet) {
            throw new Error(`Sheet "${sheetName}" not found`);
        }

        const data = sheet.getDataRange().getValues();
        return data.slice(1); // Skip header row
    } catch (error) {
        console.error(`Error accessing sheet "${sheetName}":`, error);
        return [];
    }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Get formatted date string
 */
function getDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}_${month}_${day}`;
}

/**
 * Get formatted date and time string
 */
function getDateTimeString() {
    const now = new Date();
    return now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Escape quotes for HTML attributes
 */
function escapeQuotes(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}