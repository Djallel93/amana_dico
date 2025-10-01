// ============================================
// DATA ACCESS LAYER - Single source of truth
// ============================================
/**
 * Load all dictionary data efficiently in one pass
 */
function loadAllDictionaryData(spreadsheetId = null) {
    const { LANGUE, CHAPITRE, MOT, TRADUCTION } = CONFIG.SHEET_DEF;
    // Fetch all sheets in parallel
    const languesData = getSheetData(LANGUE.SHEET_NAME, spreadsheetId);
    const chapitresData = getSheetData(CHAPITRE.SHEET_NAME, spreadsheetId);
    const motsData = getSheetData(MOT.SHEET_NAME, spreadsheetId);
    const traductionsData = getSheetData(TRADUCTION.SHEET_NAME, spreadsheetId);
    // Build language map
    const langues = {};
    languesData.forEach(row => {
        const id = row[LANGUE.COLUMNS.ID];
        const code = row[LANGUE.COLUMNS.CODE];
        const nom = row[LANGUE.COLUMNS.NOM];
        if (id && code && nom) {
            langues[id] = { id, code, nom };
        }
    });
    // Build chapter map
    const chapitres = {};
    chapitresData.forEach(row => {
        const id = row[CHAPITRE.COLUMNS.ID];
        const nom = row[CHAPITRE.COLUMNS.NOM];
        if (id && nom) {
            chapitres[id] = { id, nom };
        }
    });
    // Build words map
    const mots = {};
    motsData.forEach(row => {
        const mot = row[MOT.COLUMNS.MOT];
        if (!mot) return;
        mots[mot] = {
            id: row[MOT.COLUMNS.ID],
            mot: mot,
            langue: row[MOT.COLUMNS.LANGUE],
            type: row[MOT.COLUMNS.TYPE] || '',
            chapitre: row[MOT.COLUMNS.CHAPITRE] || '',
            definition: row[MOT.COLUMNS.DEFINITION] || ''
        };
    });
    // Build translations with full word context
    const translations = [];
    traductionsData.forEach(row => {
        const motSource = row[TRADUCTION.COLUMNS.MOT_SOURCE];
        const motCible = row[TRADUCTION.COLUMNS.MOT_CIBLE];
        if (motSource && motCible && mots[motSource] && mots[motCible]) {
            translations.push({
                source: mots[motSource],
                target: mots[motCible],
                sourceWord: motSource,
                targetWord: motCible
            });
        }
    });
    console.log(`Loaded: ${Object.keys(langues).length} languages, ${Object.keys(chapitres).length} chapters, ${Object.keys(mots).length} words, ${translations.length} translations`);
    return {
        langues: Object.values(langues),
        chapitres: Object.values(chapitres),
        mots: Object.values(mots),
        translations
    };
}
/**
 * Get data formatted for UI (backward compatibility)
 */
function getDataForUI() {
    const data = loadAllDictionaryData();
    return {
        languages: data.langues,
        chapters: data.chapitres,
        words: data.mots,
        translations: data.translations.map(t => ({
            mot_source: t.sourceWord,
            mot_cible: t.targetWord
        }))
    };
}
// Legacy function wrappers for backward compatibility
function getLanguages() {
    return loadAllDictionaryData().langues;
}
function getChapters() {
    return loadAllDictionaryData().chapitres;
}
function getWords() {
    return loadAllDictionaryData().mots;
}
function getTranslations() {
    return loadAllDictionaryData().translations.map(t => ({
        mot_source: t.sourceWord,
        mot_cible: t.targetWord
    }));
}