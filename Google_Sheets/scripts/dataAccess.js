let _cachedDictionaryData = null;
let _cacheSpreadsheetId = null;

/**
 * Convertir une date en format comparable (YYYY-MM-DD)
 */
function formatDateForComparison(date) {
    if (!date) return null;

    let dateObj;

    if (typeof date === 'string') {
        dateObj = new Date(date);
    } else if (date instanceof Date) {
        dateObj = date;
    } else {
        return null;
    }

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
 */
function getSundayOfCurrentWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - daysToSubtract);
    return formatDateForComparison(sunday);
}

/**
 * Load all dictionary data efficiently with caching and optional date filtering
 */
function loadAllDictionaryData(spreadsheetId = null, forceReload = false, skipDateFilter = false) {
    const currentSheetId = getSheetId();

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

    // Build chapter lookup - MAINTENANT PAR NOM ET PAR ID
    const chapitres = {};
    const chapitresByName = {}; // NOUVEAU: lookup par nom
    chapitresData.forEach(row => {
        const id = row[CHAPITRE.COLUMNS.ID];
        const nom = row[CHAPITRE.COLUMNS.NOM];
        if (id && nom) {
            chapitres[id] = { id, nom };
            chapitresByName[nom] = { id, nom }; // Index par nom aussi
        }
    });

    // Build word lookup with ID and word as keys
    const motsById = {};
    const motsByWord = {};
    let wordsIncluded = 0;
    let wordsExcluded = 0;
    let wordsNoDate = 0;

    motsData.forEach(row => {
        const id = row[MOT.COLUMNS.ID];
        const mot = row[MOT.COLUMNS.MOT];
        const dateCour = row[MOT.COLUMNS.DATE_COUR];
        const chapitreValue = row[MOT.COLUMNS.CHAPITRE]; // Peut être ID ou nom

        if (!id || !mot) return;

        // Apply date filter only if not skipped
        if (!skipDateFilter && dateCour && dateCour.toString().trim() !== '') {
            const formattedDateCour = formatDateForComparison(dateCour);

            if (!formattedDateCour) {
                console.warn(`  ⚠️ Invalid date for mot "${mot}": ${dateCour}`);
                return;
            }

            if (formattedDateCour >= sundayOfWeek) {
                wordsExcluded++;
                return;
            }

            wordsIncluded++;
        } else {
            wordsNoDate++;
        }

        // CORRECTION: Déterminer l'ID du chapitre (que ce soit un ID ou un nom)
        let chapitreId = chapitreValue;
        let chapitreNom = '';

        if (chapitreValue) {
            // Si c'est un nombre, c'est probablement un ID
            if (!isNaN(chapitreValue) && chapitres[chapitreValue]) {
                chapitreId = chapitreValue;
                chapitreNom = chapitres[chapitreValue].nom;
            }
            // Sinon, c'est un nom de chapitre
            else if (chapitresByName[chapitreValue]) {
                chapitreId = chapitresByName[chapitreValue].id;
                chapitreNom = chapitreValue;
            }
            // Fallback: traiter comme un nom si pas trouvé
            else {
                chapitreNom = chapitreValue;
                // Chercher l'ID correspondant
                const foundChapter = Object.values(chapitres).find(c => c.nom === chapitreValue);
                if (foundChapter) {
                    chapitreId = foundChapter.id;
                }
            }
        }

        const motObj = {
            id: id,
            mot: mot.trim(),
            langue: row[MOT.COLUMNS.LANGUE],
            type: row[MOT.COLUMNS.TYPE] || '',
            chapitre: chapitreId || chapitreValue || '', // ID numérique préféré
            chapitreNom: chapitreNom || chapitreValue || '', // Nom lisible
            definition: row[MOT.COLUMNS.DEFINITION] || '',
            date_cour: dateCour || ''
        };

        motsById[id] = motObj;
        motsByWord[mot] = motObj;
    });

    // Build translations with full word objects including definitions
    const translations = [];
    const translationsByWordId = {};

    traductionsData.forEach(row => {
        const idMotSource = row[TRADUCTION.COLUMNS.ID_MOT_SOURCE];
        const motSource = row[TRADUCTION.COLUMNS.MOT_SOURCE];
        const idMotCible = row[TRADUCTION.COLUMNS.ID_MOT_CIBLE];
        const motCible = row[TRADUCTION.COLUMNS.MOT_CIBLE];

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

            if (!translationsByWordId[sourceObj.id]) {
                translationsByWordId[sourceObj.id] = [];
            }
            if (!translationsByWordId[targetObj.id]) {
                translationsByWordId[targetObj.id] = [];
            }
            translationsByWordId[sourceObj.id].push(targetObj);
            translationsByWordId[targetObj.id].push(sourceObj);
        }
    });

    // Build relations with full word objects
    const relations = [];
    const relationsByWordId = {};

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

            const key = `${sourceObj.id}|${type}`;
            if (!relationsByWordId[key]) {
                relationsByWordId[key] = [];
            }
            relationsByWordId[key].push(targetObj);
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
        _lookups: {
            motsById,
            motsByWord,
            translationsByWordId,
            relationsByWordId,
            chapitresByName // NOUVEAU: ajout du lookup par nom
        }
    };

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
 * Get all possible translations for a word by its ID (optimized)
 */
function getAllTranslationsForWordId(wordId, dictionaryData) {
    const lookups = dictionaryData._lookups;

    const sourceWord = lookups.motsById[wordId];
    if (!sourceWord) {
        console.warn(`Word with ID ${wordId} not found`);
        return [];
    }

    if (lookups && lookups.translationsByWordId && lookups.translationsByWordId[wordId]) {
        return lookups.translationsByWordId[wordId];
    }

    const translations = [];
    dictionaryData.translations.forEach(t => {
        if (t.source.id === wordId) {
            translations.push(t.target);
        } else if (t.target.id === wordId) {
            translations.push(t.source);
        }
    });
    return translations;
}

/**
 * Get all relations for a word by its ID and type (optimized)
 */
function getRelationsForWordId(wordId, relationType, dictionaryData) {
    const lookups = dictionaryData._lookups;

    const sourceWord = lookups.motsById[wordId];
    if (!sourceWord) {
        console.warn(`Word with ID ${wordId} not found`);
        return [];
    }

    const key = `${wordId}|${relationType}`;

    if (lookups && lookups.relationsByWordId && lookups.relationsByWordId[key]) {
        return lookups.relationsByWordId[key];
    }

    const relations = [];
    dictionaryData.relations.forEach(r => {
        if (r.source.id === wordId && r.type === relationType) {
            relations.push(r.target);
        }
    });
    return relations;
}