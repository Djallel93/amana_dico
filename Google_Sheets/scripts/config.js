// ============================================
// CENTRALIZED CONFIGURATION
// ============================================

const CONFIG = {
    QUIZ_SETTINGS: {
        QUESTION_COUNT: 10,
        MAX_QUESTIONS: 10,
        WRONG_OPTIONS_COUNT: 3,
        FORM_TITLE: 'Test de Vocabulaire - Français ↔ العربية',
        FORM_DESCRIPTION: 'Traduisez les mots suivants dans la langue demandée.',
        TEMPLATE_FORM_ID: '1dYBp2PWdWRdjU2Gdff2GM0F65SWxLHyaf52cv4WT2RU',
        RESULTS_FOLDER_NAME: 'translations_tests'
    },

    OAUTH_CONFIG: {
        REDIRECT_URI: 'https://script.google.com/macros/d/1GB6MEbLZt5M-paXKmGo6jYxrsdi39PgpJHGLAUEcKGTyTND3bii0soab/usercallback',
        SCOPES: 'https://www.googleapis.com/auth/forms https://www.googleapis.com/auth/drive',
        FORMS_API_BASE_URL: 'https://forms.googleapis.com/v1'
    },

    SHEET_DEF: {
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
 * Escape quotes for HTML attributes
 */
function escapeQuotes(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}