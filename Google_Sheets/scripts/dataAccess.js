// ============================================
// DATA ACCESS LAYER - Optimized with caching
// ============================================

let _cachedDictionaryData = null;
let _cacheSpreadsheetId = null;

/**
 * Load all dictionary data efficiently with caching
 */
function loadAllDictionaryData(spreadsheetId = null, forceReload = false) {
    const currentSheetId = spreadsheetId || SpreadsheetApp.getActiveSpreadsheet().getId();
    
    // Return cached data if available and same spreadsheet
    if (!forceReload && _cachedDictionaryData && _cacheSpreadsheetId === currentSheetId) {
        console.log('Using cached dictionary data');
        return _cachedDictionaryData;
    }

    const { LANGUE, CHAPITRE, MOT, TRADUCTION, RELATION } = CONFIG.SHEET_DEF;

    // Load all sheets in parallel
    const languesData = getSheetData(LANGUE.SHEET_NAME, spreadsheetId);
    const chapitresData = getSheetData(CHAPITRE.SHEET_NAME, spreadsheetId);
    const motsData = getSheetData(MOT.SHEET_NAME, spreadsheetId);
    const traductionsData = getSheetData(TRADUCTION.SHEET_NAME, spreadsheetId);
    const relationsData = getSheetData(RELATION.SHEET_NAME, spreadsheetId);

    // Build language lookup
    const langues = {};
    languesData.forEach(row => {
        const id = row[LANGUE.COLUMNS.ID];
        const code = row[LANGUE.COLUMNS.CODE];
        const nom = row[LANGUE.COLUMNS.NOM];
        if (id && code && nom) {
            langues[id] = { id, code, nom };
        }
    });

    // Build chapter lookup
    const chapitres = {};
    chapitresData.forEach(row => {
        const id = row[CHAPITRE.COLUMNS.ID];
        const nom = row[CHAPITRE.COLUMNS.NOM];
        if (id && nom) {
            chapitres[id] = { id, nom };
        }
    });

    // Build word lookup with ID and word as keys
    const motsById = {};
    const motsByWord = {};
    
    motsData.forEach(row => {
        const id = row[MOT.COLUMNS.ID];
        const mot = row[MOT.COLUMNS.MOT];
        if (!id || !mot) return;
        
        const motObj = {
            id: id,
            mot: mot,
            langue: row[MOT.COLUMNS.LANGUE],
            type: row[MOT.COLUMNS.TYPE] || '',
            chapitre: row[MOT.COLUMNS.CHAPITRE] || '',
            definition: row[MOT.COLUMNS.DEFINITION] || ''
        };
        
        motsById[id] = motObj;
        motsByWord[mot] = motObj;
    });

    // Build translations with full word objects including definitions
    const translations = [];
    const translationsByWord = {}; // For quick lookup
    
    traductionsData.forEach(row => {
        const idMotSource = row[TRADUCTION.COLUMNS.ID_MOT_SOURCE];
        const motSource = row[TRADUCTION.COLUMNS.MOT_SOURCE];
        const idMotCible = row[TRADUCTION.COLUMNS.ID_MOT_CIBLE];
        const motCible = row[TRADUCTION.COLUMNS.MOT_CIBLE];
        
        // Use ID if available, fallback to word lookup
        const sourceObj = idMotSource ? motsById[idMotSource] : motsByWord[motSource];
        const targetObj = idMotCible ? motsById[idMotCible] : motsByWord[motCible];
        
        if (sourceObj && targetObj) {
            const translation = {
                source: sourceObj,
                target: targetObj,
                sourceWord: sourceObj.mot,
                targetWord: targetObj.mot
            };
            translations.push(translation);
            
            // Build bidirectional lookup
            if (!translationsByWord[sourceObj.mot]) {
                translationsByWord[sourceObj.mot] = [];
            }
            if (!translationsByWord[targetObj.mot]) {
                translationsByWord[targetObj.mot] = [];
            }
            translationsByWord[sourceObj.mot].push(targetObj);
            translationsByWord[targetObj.mot].push(sourceObj);
        }
    });

    // Build relations with full word objects
    const relations = [];
    const relationsByWord = {}; // For quick lookup by word and type
    
    relationsData.forEach(row => {
        const motSource = row[RELATION.COLUMNS.MOT_SOURCE];
        const motCible = row[RELATION.COLUMNS.MOT_CIBLE];
        const type = row[RELATION.COLUMNS.TYPE];
        
        const sourceObj = motsByWord[motSource];
        const targetObj = motsByWord[motCible];
        
        if (sourceObj && targetObj && type) {
            const relation = {
                source: sourceObj,
                target: targetObj,
                sourceWord: sourceObj.mot,
                targetWord: targetObj.mot,
                type: type
            };
            relations.push(relation);
            
            // Build lookup by source word and type
            const key = `${motSource}|${type}`;
            if (!relationsByWord[key]) {
                relationsByWord[key] = [];
            }
            relationsByWord[key].push(targetObj);
        }
    });

    console.log(`Loaded: ${Object.keys(langues).length} languages, ${Object.keys(chapitres).length} chapters, ${Object.keys(motsById).length} words, ${translations.length} translations, ${relations.length} relations`);

    const result = {
        langues: Object.values(langues),
        chapitres: Object.values(chapitres),
        mots: Object.values(motsById),
        translations,
        relations,
        // Lookups for optimization
        _lookups: {
            motsById,
            motsByWord,
            translationsByWord,
            relationsByWord
        }
    };
    
    // Cache the result
    _cachedDictionaryData = result;
    _cacheSpreadsheetId = currentSheetId;
    
    return result;
}

/**
 * Clear cache (call when data changes)
 */
function clearDictionaryCache() {
    _cachedDictionaryData = null;
    _cacheSpreadsheetId = null;
    console.log('Dictionary cache cleared');
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
        })),
        relations: data.relations.map(r => ({
            mot_source: r.sourceWord,
            mot_cible: r.targetWord,
            type: r.type
        }))
    };
}

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

function getRelations() {
    return loadAllDictionaryData().relations.map(r => ({
        mot_source: r.sourceWord,
        mot_cible: r.targetWord,
        type: r.type
    }));
}

/**
 * Get all possible translations for a given word (optimized)
 * Returns array of word objects with definitions
 */
function getAllTranslationsForWord(word, dictionaryData) {
    const lookups = dictionaryData._lookups;
    if (lookups && lookups.translationsByWord && lookups.translationsByWord[word]) {
        return lookups.translationsByWord[word];
    }
    
    // Fallback to old method if lookups not available
    const translations = [];
    dictionaryData.translations.forEach(t => {
        if (t.sourceWord === word) {
            translations.push(t.target);
        } else if (t.targetWord === word) {
            translations.push(t.source);
        }
    });
    return translations;
}

/**
 * Get all relations of a specific type for a word (optimized)
 * Returns array of word objects
 */
function getRelationsForWord(word, relationType, dictionaryData) {
    const lookups = dictionaryData._lookups;
    if (lookups && lookups.relationsByWord) {
        const key = `${word}|${relationType}`;
        return lookups.relationsByWord[key] || [];
    }
    
    // Fallback to old method
    const results = [];
    dictionaryData.relations.forEach(r => {
        if (r.sourceWord === word && r.type === relationType) {
            results.push(r.target);
        }
    });
    return results;
}