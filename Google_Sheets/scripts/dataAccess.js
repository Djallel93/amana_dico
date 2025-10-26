let _cachedDictionaryData = null;
let _cacheSpreadsheetId = null;

/**
 * Convertir une date en format comparable (YYYY-MM-DD)
 */
function formatDateForComparison(date) {
    if (!date) return null;

    let dateObj;

    // Si c'est une chaîne, parser la date
    if (typeof date === 'string') {
        dateObj = new Date(date);
    } else if (date instanceof Date) {
        dateObj = date;
    } else {
        return null;
    }

    // Vérifier si la date est valide
    if (isNaN(dateObj.getTime())) {
        return null;
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Obtenir la date d'aujourd'hui au format comparable
 */
function getTodayFormatted() {
    return formatDateForComparison(new Date());
}

/**
 * Calculer le dimanche de la semaine en cours
 * Si aujourd'hui est dimanche, retourne aujourd'hui
 * Sinon, retourne le dimanche précédent
 */
function getSundayOfCurrentWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi

    // Si on est dimanche (0), on prend aujourd'hui
    // Sinon, on recule au dimanche précédent
    const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;

    const sunday = new Date(today);
    sunday.setDate(today.getDate() - daysToSubtract);

    return formatDateForComparison(sunday);
}

/**
 * Load all dictionary data efficiently with caching and optional date filtering
 * @param {string} spreadsheetId - Optional spreadsheet ID
 * @param {boolean} forceReload - Force reload from sheets
 * @param {boolean} skipDateFilter - Skip date filtering (for interactive quiz)
 * Filters words to exclude those from current week's Sunday (unless skipDateFilter = true)
 */
function loadAllDictionaryData(spreadsheetId = null, forceReload = false, skipDateFilter = false) {
    const currentSheetId = getSheetId();

    // Return cached data if available and same spreadsheet (only if not skipping filter)
    if (!forceReload && !skipDateFilter && _cachedDictionaryData && _cacheSpreadsheetId === currentSheetId) {
        console.log('Using cached dictionary data');
        return _cachedDictionaryData;
    }

    const { LANGUE, CHAPITRE, MOT, TRADUCTION, RELATION } = CONFIG.SHEET_DEF;
    const today = getTodayFormatted();
    const sundayOfWeek = getSundayOfCurrentWeek();

    console.log(`Loading dictionary data - Today: ${today}, Sunday of current week: ${sundayOfWeek}`);

    if (skipDateFilter) {
        console.log(`⚠️ Date filter DISABLED - Loading ALL words for interactive quiz`);
    } else {
        console.log(`Filtering: only words with date_cour < ${sundayOfWeek} (strictly before current week's Sunday)`);
    }

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
    // FILTER: only include words where date_cour < sunday of current week (unless skipDateFilter)
    const motsById = {};
    const motsByWord = {};
    let wordsIncluded = 0;
    let wordsExcluded = 0;
    let wordsNoDate = 0;

    motsData.forEach(row => {
        const id = row[MOT.COLUMNS.ID];
        const mot = row[MOT.COLUMNS.MOT];
        const dateCour = row[MOT.COLUMNS.DATE_COUR];

        if (!id || !mot) return;

        // Apply date filter only if not skipped
        if (!skipDateFilter && dateCour && dateCour.toString().trim() !== '') {
            const formattedDateCour = formatDateForComparison(dateCour);

            if (!formattedDateCour) {
                console.warn(`  ⚠️ Invalid date for mot "${mot}": ${dateCour}`);
                return;
            }

            // STRICT: date_cour must be < sunday (not equal)
            if (formattedDateCour >= sundayOfWeek) {
                wordsExcluded++;
                return; // Exclude this word
            }

            wordsIncluded++;
        } else {
            // Words without date are included (legacy words) OR filter is skipped
            wordsNoDate++;
        }

        const motObj = {
            id: id,
            mot: mot.trim(),
            langue: row[MOT.COLUMNS.LANGUE],
            type: row[MOT.COLUMNS.TYPE] || '',
            chapitre: row[MOT.COLUMNS.CHAPITRE] || '',
            definition: row[MOT.COLUMNS.DEFINITION] || '',
            date_cour: dateCour || ''
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

    const totalWords = Object.keys(motsById).length;

    if (skipDateFilter) {
        console.log(`📊 Words loaded: ${totalWords} total (date filter DISABLED)`);
    } else {
        console.log(`📊 Words loaded: ${totalWords} total (${wordsIncluded} with past dates + ${wordsNoDate} without date, ${wordsExcluded} excluded from current week)`);
    }

    console.log(`Loaded: ${Object.keys(langues).length} languages, ${Object.keys(chapitres).length} chapters, ${translations.length} translations, ${relations.length} relations`);

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

    // Cache the result only if date filter was applied
    if (!skipDateFilter) {
        _cachedDictionaryData = result;
        _cacheSpreadsheetId = currentSheetId;
    }

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
 * skipDateFilter = true for interactive quiz
 */
function getDataForUI(skipDateFilter = false) {
    const data = loadAllDictionaryData(null, false, skipDateFilter);
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