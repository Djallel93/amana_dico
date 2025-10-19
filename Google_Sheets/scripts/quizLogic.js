/**
 * Generate random translation quiz questions with definitions as help text
 */
function generateTranslationQuizQuestions(dictionaryData, questionCount = CONFIG.QUIZ_SETTINGS.QUESTION_COUNT, isAdvancedStudent = false) {
    const { translations } = dictionaryData;
    if (!translations || translations.length === 0) {
        throw new Error('No translations available for quiz generation');
    }

    const shuffled = shuffleArray(translations);
    const maxQuestions = Math.min(questionCount, shuffled.length);
    const selectedTranslations = shuffled.slice(0, maxQuestions);

    const questions = selectedTranslations.map((translation, index) => {
        if (!translation.source || !translation.target ||
            !translation.sourceWord || !translation.targetWord) {
            console.warn(`Skipping invalid translation at index ${index}`);
            return null;
        }

        const direction = Math.random() < 0.5 ? 'source-to-target' : 'target-to-source';

        if (direction === 'source-to-target') {
            const allTranslations = getAllTranslationsForWord(translation.sourceWord, dictionaryData);
            const allTranslationWords = allTranslations.map(t => t.mot);

            // Build help text with definition if available
            let helpText = "";
            if (translation.source.definition) {
                helpText += `\n\n💡 Contexte: ${translation.source.definition}`;
            }

            return {
                questionText: `✍️ Traduisez en ${translation.target.langue}: "${translation.sourceWord}"`,
                correctAnswer: translation.targetWord,
                correctAnswers: allTranslationWords.length > 0 ? allTranslationWords : [translation.targetWord],
                sourceWord: translation.sourceWord,
                targetWord: translation.targetWord,
                direction: 'source-to-target',
                sourceLanguage: translation.source.langue,
                targetLanguage: translation.target.langue,
                sourceDefinition: translation.source.definition,
                targetDefinition: translation.target.definition,
                helpText: helpText,
                isAdvancedStudent: isAdvancedStudent,
                quizType: CONFIG.QUIZ_TYPES.TRANSLATION,
                questionType: 'text'
            };
        } else {
            const allTranslations = getAllTranslationsForWord(translation.targetWord, dictionaryData);
            const allTranslationWords = allTranslations.map(t => t.mot);

            // Build help text with definition if available
            let helpText = `Traduisez en ${translation.source.langue}: "${translation.targetWord}"`;
            if (translation.target.definition) {
                helpText += `\n\nContexte: ${translation.target.definition}`;
            }

            return {
                questionText: `✍️ Traduisez en ${translation.source.langue}: "${translation.targetWord}"`,
                correctAnswer: translation.sourceWord,
                correctAnswers: allTranslationWords.length > 0 ? allTranslationWords : [translation.sourceWord],
                sourceWord: translation.targetWord,
                targetWord: translation.sourceWord,
                direction: 'target-to-source',
                sourceLanguage: translation.target.langue,
                targetLanguage: translation.source.langue,
                sourceDefinition: translation.target.definition,
                targetDefinition: translation.source.definition,
                helpText: helpText,
                isAdvancedStudent: isAdvancedStudent,
                quizType: CONFIG.QUIZ_TYPES.TRANSLATION,
                questionType: 'text'
            };
        }
    }).filter(q => q !== null);

    return questions;
}

/**
 * Generate random relation (synonym/antonym) quiz questions with definitions
 */
function generateRelationQuizQuestions(dictionaryData, questionCount = CONFIG.QUIZ_SETTINGS.QUESTION_COUNT, isAdvancedStudent = false) {
    const { relations } = dictionaryData;
    if (!relations || relations.length === 0) {
        throw new Error('No relations available for quiz generation');
    }

    const shuffled = shuffleArray(relations);
    const maxQuestions = Math.min(questionCount, shuffled.length);
    const selectedRelations = shuffled.slice(0, maxQuestions);

    const questions = selectedRelations.map((relation, index) => {
        if (!relation.source || !relation.target ||
            !relation.sourceWord || !relation.targetWord || !relation.type) {
            console.warn(`Skipping invalid relation at index ${index}`);
            return null;
        }

        if (isAdvancedStudent) {
            // Advanced: Text question to find synonym/antonym
            const askForType = Math.random() < 0.5 ? 'Synonyme' : 'Antonyme';

            // Get all relations of requested type for this word
            const relationsForWord = getRelationsForWord(relation.sourceWord, askForType, dictionaryData);

            if (relationsForWord.length === 0) {
                // If no relation of requested type, use what we have
                let helpText = `Quel est ${relation.type === 'Synonyme' ? 'le synonyme' : "l'antonyme"} de "${relation.sourceWord}" ?`;
                if (relation.source.definition) {
                    helpText += `\n\nContexte: ${relation.source.definition}`;
                }

                return {
                    questionText: `Quel est ${relation.type === 'Synonyme' ? 'le synonyme' : "l'antonyme"} de "${relation.sourceWord}" ?`,
                    correctAnswer: relation.targetWord,
                    correctAnswers: [relation.targetWord],
                    sourceWord: relation.sourceWord,
                    targetWord: relation.targetWord,
                    relationType: relation.type,
                    sourceLanguage: relation.source.langue,
                    targetLanguage: relation.target.langue,
                    sourceDefinition: relation.source.definition,
                    targetDefinition: relation.target.definition,
                    helpText: helpText,
                    isAdvancedStudent: isAdvancedStudent,
                    quizType: CONFIG.QUIZ_TYPES.RELATION,
                    questionType: 'text'
                };
            }

            // Get all possible answers
            const allAnswers = relationsForWord.map(r => r.mot);

            let helpText = `Quel est ${askForType === 'Synonyme' ? 'le synonyme' : "l'antonyme"} de "${relation.sourceWord}" ?`;
            if (relation.source.definition) {
                helpText += `\n\nContexte: ${relation.source.definition}`;
            }

            return {
                questionText: `Quel est ${askForType === 'Synonyme' ? 'le synonyme' : "l'antonyme"} de "${relation.sourceWord}" ?`,
                correctAnswer: relationsForWord[0].mot,
                correctAnswers: allAnswers,
                sourceWord: relation.sourceWord,
                targetWord: relationsForWord[0].mot,
                relationType: askForType,
                sourceLanguage: relation.source.langue,
                targetLanguage: relation.target.langue,
                sourceDefinition: relation.source.definition,
                targetDefinition: relationsForWord[0].definition,
                helpText: helpText,
                isAdvancedStudent: isAdvancedStudent,
                quizType: CONFIG.QUIZ_TYPES.RELATION,
                questionType: 'text'
            };
        } else {
            // Debutant: Multiple choice question
            let helpText = `Quel est le type de relation entre "${relation.sourceWord}" et "${relation.targetWord}" ?`;
            if (relation.source.definition || relation.target.definition) {
                helpText += '\n\nContexte:';
                if (relation.source.definition) {
                    helpText += `\n• ${relation.sourceWord}: ${relation.source.definition}`;
                }
                if (relation.target.definition) {
                    helpText += `\n• ${relation.targetWord}: ${relation.target.definition}`;
                }
            }

            return {
                questionText: `Quel est le type de relation entre "${relation.sourceWord}" et "${relation.targetWord}" ?`,
                correctAnswer: relation.type,
                correctAnswers: [relation.type],
                sourceWord: relation.sourceWord,
                targetWord: relation.targetWord,
                relationType: relation.type,
                sourceLanguage: relation.source.langue,
                targetLanguage: relation.target.langue,
                sourceDefinition: relation.source.definition,
                targetDefinition: relation.target.definition,
                helpText: helpText,
                isAdvancedStudent: isAdvancedStudent,
                quizType: CONFIG.QUIZ_TYPES.RELATION,
                questionType: 'choice',
                choices: ['Synonyme', 'Antonyme']
            };
        }
    }).filter(q => q !== null);

    return questions;
}

/**
 * Create quiz form from active spreadsheet
 */
function createQuizForm(spreadsheetId = null, isAdvancedStudent = false, quizType = CONFIG.QUIZ_TYPES.TRANSLATION) {
    try {
        const sheetId = spreadsheetId || SpreadsheetApp.getActiveSpreadsheet().getId();
        console.log(`Loading dictionary data for ${quizType} quiz...`);
        const dictionaryData = loadAllDictionaryData(sheetId);

        console.log('Generating questions...');
        let questions;
        if (quizType === CONFIG.QUIZ_TYPES.TRANSLATION) {
            questions = generateTranslationQuizQuestions(dictionaryData, CONFIG.QUIZ_SETTINGS.QUESTION_COUNT, isAdvancedStudent);
        } else {
            questions = generateRelationQuizQuestions(dictionaryData, CONFIG.QUIZ_SETTINGS.QUESTION_COUNT, isAdvancedStudent);
        }

        if (questions.length === 0) {
            throw new Error('No valid questions could be generated');
        }

        console.log(`Generated ${questions.length} ${quizType} questions (Advanced: ${isAdvancedStudent})`);

        const form = duplicateTemplateForm(quizType, isAdvancedStudent);
        console.log(`Form duplicated: ${form.getId()}`);

        let description = quizType === CONFIG.QUIZ_TYPES.TRANSLATION
            ? CONFIG.QUIZ_SETTINGS.TRANSLATION_DESCRIPTION
            : CONFIG.QUIZ_SETTINGS.RELATION_DESCRIPTION;

        if (isAdvancedStudent) {
            description += '\n\n⚠️ Niveau avancé: Les harakat doivent être respectées pour les mots arabes';
        }
        form.setDescription(description);

        addQuestionsToForm(form, questions, isAdvancedStudent, quizType);

        setupQuizGrading(form.getId(), questions);

        form.setPublished(true);
        form.setAcceptingResponses(true);

        console.log(`${quizType} quiz form created successfully!`);
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
 * Duplicate the template form and move to appropriate subfolder
 */
function duplicateTemplateForm(quizType = CONFIG.QUIZ_TYPES.TRANSLATION, isAdvancedStudent = false) {
    const templateId = CONFIG.QUIZ_SETTINGS.TEMPLATE_FORM_ID;
    const dateString = getDateString();
    const formTitle = quizType === CONFIG.QUIZ_TYPES.TRANSLATION
        ? CONFIG.QUIZ_SETTINGS.TRANSLATION_FORM_TITLE
        : CONFIG.QUIZ_SETTINGS.RELATION_FORM_TITLE;
    const newTitle = `${dateString} ${formTitle}`;

    try {
        const templateFile = DriveApp.getFileById(templateId);
        const duplicatedFile = templateFile.makeCopy(newTitle);
        const form = FormApp.openById(duplicatedFile.getId());

        let subfolderPath;
        if (quizType === CONFIG.QUIZ_TYPES.TRANSLATION) {
            subfolderPath = isAdvancedStudent
                ? CONFIG.QUIZ_SETTINGS.SUBFOLDER_STRUCTURE.TRANSLATION_AVANCE
                : CONFIG.QUIZ_SETTINGS.SUBFOLDER_STRUCTURE.TRANSLATION_DEBUTANT;
        } else {
            subfolderPath = isAdvancedStudent
                ? CONFIG.QUIZ_SETTINGS.SUBFOLDER_STRUCTURE.SENS_AVANCE
                : CONFIG.QUIZ_SETTINGS.SUBFOLDER_STRUCTURE.SENS_DEBUTANT;
        }

        moveToSubfolder(duplicatedFile.getId(), CONFIG.QUIZ_SETTINGS.RESULTS_FOLDER_NAME, subfolderPath);
        return form;
    } catch (error) {
        throw new Error(`Failed to duplicate template: ${error.message}`);
    }
}

/**
 * Add questions to form with definitions in help text
 */
function addQuestionsToForm(form, questions, isAdvancedStudent, quizType) {
    questions.forEach((question, index) => {
        form.addPageBreakItem()
            .setTitle(`Question ${index + 1}`)
            .setHelpText(`Question ${index + 1} sur ${questions.length}`);

        if (question.questionType === 'choice') {
            // Multiple choice question (for relation debutant)
            const item = form.addMultipleChoiceItem()
                .setTitle(question.questionText)
                .setRequired(true)
                .setChoiceValues(question.choices);

            // Use the helpText with context/definitions
            item.setHelpText(question.helpText || 'Choisirez entre "Synonyme" ou "Antonyme"');
        } else {
            // Text question
            const item = form.addTextItem()
                .setTitle(question.questionText)
                .setRequired(true);

            // Use the helpText that includes context/definitions
            item.setHelpText(question.helpText || `Veuillez saisir la réponse`);
        }
    });

    console.log(`Added ${questions.length} questions to form with context`);
}

/**
 * Move file to nested subfolder structure (create if doesn't exist)
 */
function moveToSubfolder(fileId, baseFolderName, subfolderPath) {
    try {
        const file = DriveApp.getFileById(fileId);

        // Get or create base folder
        let currentFolder;
        const baseFolders = DriveApp.getFoldersByName(baseFolderName);
        if (baseFolders.hasNext()) {
            currentFolder = baseFolders.next();
        } else {
            currentFolder = DriveApp.createFolder(baseFolderName);
        }

        // Navigate/create subfolder path (e.g., "traduction/debutant")
        const pathParts = subfolderPath.split('/');
        for (const folderName of pathParts) {
            const subfolders = currentFolder.getFoldersByName(folderName);
            if (subfolders.hasNext()) {
                currentFolder = subfolders.next();
            } else {
                currentFolder = currentFolder.createFolder(folderName);
            }
        }

        // Move file
        file.getParents().next().removeFile(file);
        currentFolder.addFile(file);
        console.log(`File moved to: ${baseFolderName}/${subfolderPath}`);
    } catch (error) {
        console.warn(`Could not move file to subfolder: ${error.message}`);
    }
}