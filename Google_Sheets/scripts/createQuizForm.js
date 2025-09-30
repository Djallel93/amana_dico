function createQuizForm(sheetId) {
    try {
        console.log('Starting quiz generation...');

        // Get data from sheets
        const dictionaryData = loadDictionaryData(sheetId);
        console.log(`Loaded ${dictionaryData.translations.length} translations`);

        // Generate random questions
        const questions = generateRandomQuestions(dictionaryData, CONFIG.QUIZ_SETTINGS.QUESTION_COUNT);
        console.log(`Generated ${questions.length} questions`);

        // Duplicate the template form instead of creating a new one
        const form = duplicateTemplateForm(CONFIG.QUIZ_SETTINGS.TEMPLATE_FORM_ID);
        console.log(`Template form duplicated: ${form.getId()}`);

        // Add questions as sections to the duplicated form
        addQuestionsAsSections(form, questions);

        // Now use Forms API to set up quiz features and answer keys
        setupQuizWithAPI(form.getId(), questions);

        form.setPublished(true);
        form.setAcceptingResponses(true);

        console.log(`Quiz form created successfully!`);
        console.log(`Form URL: ${form.getEditUrl()}`);
        console.log(`Published URL: ${form.getPublishedUrl()}`);

        return {
            editUrl: form.getEditUrl(),
            publishedUrl: form.getPublishedUrl(),
            formId: form.getId()
        };

    } catch (error) {
        console.error('Error creating quiz form:', error);
        throw error;
    }
}

/**
 * Duplicate the template form and update its title
 */
function duplicateTemplateForm(templateId) {
    try {
        // Get the template form file from Drive
        const templateFile = DriveApp.getFileById(templateId);

        // Create form title with date
        const dateString = getDateString();
        const newFormTitle = `${dateString} ${CONFIG.QUIZ_SETTINGS.FORM_TITLE}`;

        // Duplicate the template
        const duplicatedFile = templateFile.makeCopy(newFormTitle);

        // Open the duplicated form
        const form = FormApp.openById(duplicatedFile.getId());

        // Update the form description
        form.setDescription(CONFIG.QUIZ_SETTINGS.FORM_DESCRIPTION);

        // Move form to the translations_tests folder
        moveFormToFolder(duplicatedFile.getId(), 'translations_tests');

        console.log(`Template duplicated successfully with title: ${newFormTitle}`);
        return form;

    } catch (error) {
        console.error('Error duplicating template form:', error);
        throw new Error(`Failed to duplicate template form. Please check that the template exists and is accessible: ${error.message}`);
    }
}

/**
 * Add questions as individual sections to the form
 */
function addQuestionsAsSections(form, questions) {
    console.log('Adding questions as sections...');

    questions.forEach((question, index) => {
        try {
            // Add a page break to create a new section (except for the first question)
            if (index > 0) {
                form.addPageBreakItem()
                    .setTitle(`Question ${index + 1}`)
                    .setHelpText(`Question ${index + 1} sur ${questions.length}`);
            }

            // Add the question as a text item
            const item = form.addTextItem()
                .setTitle(question.questionText)
                .setRequired(true);

            // Add help text with language information
            if (question.sourceLanguage && question.targetLanguage) {
                item.setHelpText(`Traduisez de ${question.sourceLanguage} vers ${question.targetLanguage}`);
            }

            console.log(`Added question ${index + 1} in its own section: ${question.questionText}`);

        } catch (error) {
            console.error(`Error adding question ${index + 1}:`, error);
            // Continue with other questions even if one fails
        }
    });

    console.log(`Successfully added ${questions.length} questions as sections`);
}

/**
 * Load all dictionary data from the sheets using the table definitions
 * (This remains the same as your original function)
 */
function loadDictionaryData(sheetId) {
    // Load languages using table definitions
    const languesData = getSheetDataByID(sheetId, SHEET_DEF.LANGUE.SHEET_NAME);
    const langues = {};
    languesData.forEach(row => {
        const id = row[getColumnIndex('LANGUE', 'ID')];
        const code = row[getColumnIndex('LANGUE', 'CODE')];
        const nom = row[getColumnIndex('LANGUE', 'NOM')];
        if (id && code && nom) {
            langues[id] = { code, nom };
        }
    });

    // Load chapters using table definitions
    const chapitresData = getSheetDataByID(sheetId, SHEET_DEF.CHAPITRE.SHEET_NAME);
    const chapitres = {};
    chapitresData.forEach(row => {
        const id = row[getColumnIndex('CHAPITRE', 'ID')];
        const nom = row[getColumnIndex('CHAPITRE', 'NOM')];
        if (id && nom) {
            chapitres[id] = nom;
        }
    });

    // Load words using table definitions
    const motsData = getSheetDataByID(sheetId, SHEET_DEF.MOT.SHEET_NAME);
    const mots = {};
    motsData.forEach(row => {
        const id = row[getColumnIndex('MOT', 'ID')];
        const mot = row[getColumnIndex('MOT', 'MOT')];
        const langue = row[getColumnIndex('MOT', 'LANGUE')];
        const type = row[getColumnIndex('MOT', 'TYPE')];
        const chapitre = row[getColumnIndex('MOT', 'CHAPITRE')];
        const definition = row[getColumnIndex('MOT', 'DEFINITION')];

        if (id && mot && langue) {
            // Find the language name from the langues object
            let langueNom = langue; // Default to the value itself
            Object.values(langues).forEach(langueObj => {
                if (langueObj.nom === langue || langueObj.code === langue) {
                    langueNom = langueObj.nom;
                }
            });

            mots[mot] = {
                id,
                langue,
                type,
                chapitre,
                definition,
                langueNom
            };
        }
    });

    // Load translations using table definitions
    const traductionsData = getSheetDataByID(sheetId, SHEET_DEF.TRADUCTION.SHEET_NAME);
    const translations = [];

    traductionsData.forEach(row => {
        const motSource = row[getColumnIndex('TRADUCTION', 'MOT_SOURCE')];
        const motCible = row[getColumnIndex('TRADUCTION', 'MOT_CIBLE')];

        if (motSource && motCible && mots[motSource] && mots[motCible]) {
            translations.push({
                source: mots[motSource],
                target: mots[motCible],
                sourceWord: motSource,
                targetWord: motCible
            });
        }
    });

    console.log(`Loaded data: ${Object.keys(langues).length} languages, ${Object.keys(chapitres).length} chapters, ${Object.keys(mots).length} words, ${translations.length} translations`);

    return {
        langues,
        chapitres,
        mots,
        translations
    };
}

/**
 * Generate random questions for the quiz
 * (This remains the same as your original function)
 */
function generateRandomQuestions(dictionaryData, questionCount) {
    const { translations } = dictionaryData;
    const questions = [];
    const usedTranslations = new Set();

    // Debug: log the first translation to see the structure
    // if (translations.length > 0) {
    //     console.log('Sample translation structure:', JSON.stringify(translations[0], null, 2));
    // }

    // Ensure we don't try to generate more questions than available translations
    const maxQuestions = Math.min(questionCount, translations.length);
    let attempts = 0;
    const maxAttempts = translations.length * 2; // Prevent infinite loops

    while (questions.length < maxQuestions && attempts < maxAttempts) {
        attempts++;
        const randomIndex = Math.floor(Math.random() * translations.length);
        const translation = translations[randomIndex];

        // Skip if already used
        const translationKey = `${translation.sourceWord}-${translation.targetWord}`;
        if (usedTranslations.has(translationKey)) {
            continue;
        }

        // Validate translation data - now using proper word properties
        if (!translation.source || !translation.target ||
            !translation.sourceWord || !translation.targetWord ||
            !translation.source.langueNom || !translation.target.langueNom ||
            translation.sourceWord === 'undefined' || translation.targetWord === 'undefined') {
            console.warn(`Skipping invalid translation:`, translation);
            usedTranslations.add(translationKey); // Add to prevent infinite loop on bad data
            continue;
        }

        usedTranslations.add(translationKey);

        // Randomly choose direction (source to target or target to source)
        const direction = Math.random() < 0.5 ? 'source-to-target' : 'target-to-source';

        let question;
        if (direction === 'source-to-target') {
            question = {
                questionText: `Traduisez en ${translation.target.langueNom}: "${translation.sourceWord}"`,
                correctAnswer: translation.targetWord,
                sourceWord: translation.sourceWord,
                targetWord: translation.targetWord,
                direction: 'source-to-target',
                sourceLanguage: translation.source.langueNom,
                targetLanguage: translation.target.langueNom
            };
        } else {
            question = {
                questionText: `Traduisez en ${translation.source.langueNom}: "${translation.targetWord}"`,
                correctAnswer: translation.sourceWord,
                sourceWord: translation.targetWord,
                targetWord: translation.sourceWord,
                direction: 'target-to-source',
                sourceLanguage: translation.target.langueNom,
                targetLanguage: translation.source.langueNom
            };
        }

        questions.push(question);
        console.log(`Added question ${questions.length}: ${question.questionText}`);
    }

    if (questions.length === 0) {
        console.error('No valid questions could be generated. Check your data structure.');
        console.log('Available translations:', translations.length);
        if (translations.length > 0) {
            console.log('First translation example:', translations[0]);
        }
    }

    return questions;
}

/**
 * Move the form to a specific folder
 * (This remains the same as your original function)
 */
function moveFormToFolder(formId, folderName) {
    console.log("Déplacement du formulaire " + formId);
    try {
        // Get the form file
        const formFile = DriveApp.getFileById(formId);

        // Look for existing folder or create it
        const folders = DriveApp.getFoldersByName(folderName);
        let targetFolder;

        if (folders.hasNext()) {
            targetFolder = folders.next();
        } else {
            targetFolder = DriveApp.createFolder(folderName);
        }

        // Move the file to the folder
        formFile.getParents().next().removeFile(formFile);
        targetFolder.addFile(formFile);

        console.log(`Form moved to folder: ${folderName}`);
    } catch (error) {
        console.error('Error moving form to folder:', error);
        // Don't throw - this is not critical to form creation
    }
}