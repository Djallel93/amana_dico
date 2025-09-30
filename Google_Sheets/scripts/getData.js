function getLanguages() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    let languesSheet = sheet.getSheetByName("langue");

    if (!languesSheet) {
        return [];
    }

    const data = languesSheet.getDataRange().getValues();
    const languages = [];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] && row[1] && row[2]) {
            languages.push({
                id: row[0],
                code: row[1],
                nom: row[2]
            });
        }
    }

    return languages;
}

function getChapters() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    let chaptersSheet = sheet.getSheetByName("chapitre");

    if (!chaptersSheet) {
        return [];
    }

    const data = chaptersSheet.getDataRange().getValues();
    const chapters = [];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] && row[1]) {
            chapters.push({
                id: row[0],
                nom: row[1]
            });
        }
    }

    return chapters;
}

function getWords() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    let wordsSheet = sheet.getSheetByName("mot");

    if (!wordsSheet) {
        return [];
    }

    const data = wordsSheet.getDataRange().getValues();
    const words = [];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] && row[1] && row[2]) {
            words.push({
                id: row[0],
                mot: row[1],
                langue: row[2],
                type: row[3] || '',
                chapitre: row[4] || ''
            });
        }
    }

    return words;
}

function getTranslations() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    let translationsSheet = sheet.getSheetByName("traduction");

    if (!translationsSheet) {
        return [];
    }

    const data = translationsSheet.getDataRange().getValues();
    const translations = [];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] && row[1]) {
            translations.push({
                mot_source: row[0],
                mot_cible: row[1]
            });
        }
    }

    return translations;
}

function getRelations() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    let relationsSheet = sheet.getSheetByName("relation");

    if (!relationsSheet) {
        return [];
    }

    const data = relationsSheet.getDataRange().getValues();
    const relations = [];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] && row[1] && row[2]) {
            relations.push({
                mot_source: row[0],
                mot_cible: row[1],
                type: row[2]
            });
        }
    }

    return relations;
}