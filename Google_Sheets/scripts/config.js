const CONFIG = {
    QUIZ_SETTINGS: {
        TRANSLATION_FORM_TITLE: 'Test de Vocabulaire - Français ↔ العربية',
        RELATION_FORM_TITLE: 'Test de Compréhension - Synonymes et Antonymes',
        TRANSLATION_DESCRIPTION: 'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ \n\n Traduisez les mots suivants dans la langue demandée',
        RELATION_DESCRIPTION: 'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ \n\n Identifiez le type de relation entre les mots',
        SUBFOLDER_STRUCTURE: {
            TRANSLATION_DEBUTANT: 'traduction/debutant',
            TRANSLATION_AVANCE: 'traduction/avance',
            SENS_DEBUTANT: 'compréhension/debutant',
            SENS_AVANCE: 'compréhension/avance'
        }
    },

    EMAIL_SETTINGS: {
        TRANSLATION_SUBJECT: 'Nouveau Test de Vocabulaire',
        RELATION_SUBJECT: 'Nouveau Test de Compréhension (Synonymes/Antonymes)',
        SENDER_NAME: 'BOUAKKAZ Djalle Eddine Mohamed',
        REPLY_TO: 'bouakaz.djallel@gmail.com',
        EMAIL_TEMPLATE: {
            EMOJIS: {
                star: '&#127775;',
                calendar: '&#128197;',
                pencil: '&#128221;',
                timer: '&#9201;',
                rocket: '&#128640;',
                arrow: '&#8596;',
                warn: '&#9888;&#65039;',
                brain: '&#129504;',
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
        // REDIRECT_URI_DEV: 'https://script.google.com/macros/d/1GB6MEbLZt5M-paXKmGo6jYxrsdi39PgpJHGLAUEcKGTyTND3bii0soab/usercallback',
        REDIRECT_URI: 'https://script.google.com/macros/d/1VNZlcJjSiAuefq78vteip8f4JTH6nTRiv9B5fsB6Ts78T6hy1WYUsUR_/usercallback',
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
                REFERENCE: 4,
                TRADUCTION_DEBUTANT: 5,
                TRADUCTION_AVANCE: 6,
                SENS_DEBUTANT: 7,
                SENS_AVANCE: 8
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
                DATE_COUR: 1,
                MOT: 2,
                LANGUE: 3,
                TYPE: 4,
                CHAPITRE: 5,
                DEFINITION: 6,
                MOT_FULL: 7
            }
        },
        TRADUCTION: {
            SHEET_NAME: "traduction",
            COLUMNS: {
                ID_MOT_SOURCE: 0,
                MOT_SOURCE: 1,
                ID_MOT_CIBLE: 2,
                MOT_CIBLE: 3
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
    },

    QUIZ_TYPES: {
        TRANSLATION: 'translation',
        RELATION: 'relation'
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
        const spreadsheet = SpreadsheetApp.openById(getSheetId());

        const sheet = spreadsheet.getSheetByName(sheetName);
        if (!sheet) {
            throw new Error(`Sheet "${sheetName}" not found`);
        }

        const data = sheet.getDataRange().getValues();
        return data.slice(1);
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

/**
 * Get template form ID from script properties
 */
function getTemplateFormId() {
    const templateId = PropertiesService.getScriptProperties().getProperty("TEMPLATE_FORM_ID");
    if (!templateId) {
        throw new Error('TEMPLATE_FORM_ID not found in Script Properties. Please set it in Project Settings.');
    }
    return templateId;
}

function getSheetId() {
    const templateId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
    if (!templateId) {
        throw new Error('SHEET_ID not found in Script Properties. Please set it in Project Settings.');
    }
    return templateId;
}

/**
 * Get template destination folder path from script properties
 */
function getTemplateFolderDestination() {
    const destination = PropertiesService.getScriptProperties().getProperty("TEMPLATE_FORM_DESTINATION");
    if (!destination) {
        throw new Error('TEMPLATE_FORM_DESTINATION not found in Script Properties. Please set it in Project Settings.');
    }
    return destination;
}

/**
 * Get question count from script properties with default fallback
 */
function getQuestionCount() {
    const questionCount = PropertiesService.getScriptProperties().getProperty("QUESTION_COUNT");
    if (!questionCount) {
        console.log('QUESTION_COUNT not found in Script Properties, using default: 5');
        return 5; // Default value
    }
    const count = parseInt(questionCount);
    if (isNaN(count) || count <= 0) {
        console.warn(`Invalid QUESTION_COUNT value: "${questionCount}", using default: 5`);
        return 5;
    }
    return count;
}