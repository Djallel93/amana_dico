const SHEET_DEF = {
  LANGUE: {
    SHEET_NAME: "langue",
    COLUMNS: {
      ID: { INDEX: 1, TYPE: "number" },
      CODE: { INDEX: 2, TYPE: "string" },
      NOM: { INDEX: 3, TYPE: "string" },
    },
  },
  CHAPITRE: {
    SHEET_NAME: "chapitre",
    COLUMNS: {
      ID: { INDEX: 1, TYPE: "number" },
      NOM: { INDEX: 2, TYPE: "string" },
    },
  },
  MOT: {
    SHEET_NAME: "mot",
    COLUMNS: {
      ID: { INDEX: 1, TYPE: "number" },
      MOT: { INDEX: 2, TYPE: "string" },
      LANGUE: { INDEX: 3, TYPE: "string" },
      TYPE: { INDEX: 4, TYPE: "string" },
      CHAPITRE: { INDEX: 5, TYPE: "number" },
      DEFINITION: { INDEX: 6, TYPE: "string" },
    },
  },
  EXEMPLE: {
    SHEET_NAME: "exemple",
    COLUMNS: {
      MOT: { INDEX: 1, TYPE: "string" },
      EXEMPLE: { INDEX: 2, TYPE: "string" }
    },
  },
  TRADUCTION: {
    SHEET_NAME: "traduction",
    COLUMNS: {
      MOT_SOURCE: { INDEX: 1, TYPE: "string" },
      MOT_CIBLE: { INDEX: 2, TYPE: "string" },
    },
  },
  RELATION: {
    SHEET_NAME: "relation",
    COLUMNS: {
      MOT_SOURCE: { INDEX: 1, TYPE: "string" },
      MOT_CIBLE: { INDEX: 2, TYPE: "string" },
      TYPE: { INDEX: 3, TYPE: "string" },
    },
  }
};

const CONFIG = {
  QUIZ_SETTINGS: {
    QUESTION_COUNT: 5,
    FORM_TITLE: 'Test de Vocabulaire - Français ↔ العربية',
    FORM_DESCRIPTION: 'Traduisez les mots suivants dans la langue demandée.',
    TEMPLATE_FORM_ID: '1dYBp2PWdWRdjU2Gdff2GM0F65SWxLHyaf52cv4WT2RU'
  },
  OAUTH_CONFIG: {
    REDIRECT_URI: 'https://script.google.com/macros/d/1GB6MEbLZt5M-paXKmGo6jYxrsdi39PgpJHGLAUEcKGTyTND3bii0soab/usercallback',
    SCOPES: 'https://www.googleapis.com/auth/forms https://www.googleapis.com/auth/drive',
    FORMS_API_BASE_URL: 'https://forms.googleapis.com/v1'
  }
};

function getSheetByName(sheetName) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName.trim());
}

function getSheetDataByName(sheetName) {
  const sheet = getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
  return sheet.getDataRange().getValues().slice(1);
}

function getSheetDataByID(sheetID, sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(sheetID);
    const sheet = spreadsheet.getSheetByName(sheetName.trim());
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found in spreadsheet ${sheetID}`);
    }
    return sheet.getDataRange().getValues().slice(1);
  } catch (error) {
    console.error(`Error accessing sheet "${sheetName}" in spreadsheet ${sheetID}:`, error);
    throw error;
  }
}

function getColumnIndex(sheetName, columnName) {
  const sheetDef = SHEET_DEF[sheetName.trim().toUpperCase()];
  if (!sheetDef) {
    throw new Error(`Sheet definition not found for: ${sheetName}`);
  }

  const column = sheetDef.COLUMNS[columnName.trim().toUpperCase()];
  if (!column) {
    throw new Error(`Column definition not found for: ${columnName} in sheet ${sheetName}`);
  }

  return column.INDEX - 1; // Convert to 0-based index
}

function getRealColumnIndex(sheetName, columnName) {
  const sheetDef = SHEET_DEF[sheetName.trim().toUpperCase()];
  if (!sheetDef) {
    throw new Error(`Sheet definition not found for: ${sheetName}`);
  }

  const column = sheetDef.COLUMNS[columnName.trim().toUpperCase()];
  if (!column) {
    throw new Error(`Column definition not found for: ${columnName} in sheet ${sheetName}`);
  }

  return column.INDEX; // 1-based index
}

function getColumnType(sheetName, columnName) {
  const sheetDef = SHEET_DEF[sheetName.trim().toUpperCase()];
  if (!sheetDef) {
    throw new Error(`Sheet definition not found for: ${sheetName}`);
  }

  const column = sheetDef.COLUMNS[columnName.trim().toUpperCase()];
  if (!column) {
    throw new Error(`Column definition not found for: ${columnName} in sheet ${sheetName}`);
  }

  return column.TYPE;
}

function getFormQuestion(namedValues, question) {
  return namedValues[question][0];
}

function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}_${month}_${day}`;
}

/**
 * Utility function to validate data before processing
 */
function validateRowData(row, sheetName, requiredColumns) {
  for (const columnName of requiredColumns) {
    const index = getColumnIndex(sheetName, columnName);
    if (!row[index] || row[index].toString().trim() === '') {
      return false;
    }
  }
  return true;
}

/**
 * Get sheet definition for a given sheet name
 */
function getSheetDefinition(sheetName) {
  return SHEET_DEF[sheetName.trim().toUpperCase()];
}