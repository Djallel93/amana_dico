// ============================================
// QUIZ GENERATION LOGIC
// ============================================

/**
 * Generate random quiz questions from dictionary data
 */
function generateQuizQuestions(dictionaryData, questionCount = CONFIG.QUIZ_SETTINGS.QUESTION_COUNT) {
    const { translations } = dictionaryData;

    if (!translations || translations.length === 0) {
        throw new Error('No translations available for quiz generation');
    }

    // Shuffle and select translations
    const shuffled = shuffleArray(translations);
    const maxQuestions = Math.min(questionCount, shuffled.length);
    const selectedTranslations = shuffled.slice(0, maxQuestions);

    // Generate questions
    const questions = selectedTranslations.map((translation, index) => {
        // Validate translation data
        if (!translation.source || !translation.target ||
            !translation.sourceWord || !translation.targetWord) {
            console.warn(`Skipping invalid translation at index ${index}`);
            return null;
        }

        // Random direction
        const direction = Math.random() < 0.5 ? 'source-to-target' : 'target-to-source';

        if (direction === 'source-to-target') {
            return {
                questionText: `Traduisez en ${translation.target.langue}: "${translation.sourceWord}"`,
                correctAnswer: translation.targetWord,
                sourceWord: translation.sourceWord,
                targetWord: translation.targetWord,
                direction: 'source-to-target',
                sourceLanguage: translation.source.langue,
                targetLanguage: translation.target.langue
            };
        } else {
            return {
                questionText: `Traduisez en ${translation.source.langue}: "${translation.targetWord}"`,
                correctAnswer: translation.sourceWord,
                sourceWord: translation.targetWord,
                targetWord: translation.sourceWord,
                direction: 'target-to-source',
                sourceLanguage: translation.target.langue,
                targetLanguage: translation.source.langue
            };
        }
    }).filter(q => q !== null);

    return questions;
}

/**
 * Create quiz form from active spreadsheet
 */
function createQuizForm(spreadsheetId = null) {
    try {
        // Use active spreadsheet if no ID provided
        const sheetId = spreadsheetId || SpreadsheetApp.getActiveSpreadsheet().getId();

        console.log('Loading dictionary data...');
        const dictionaryData = loadAllDictionaryData(sheetId);

        console.log('Generating questions...');
        const questions = generateQuizQuestions(dictionaryData);

        if (questions.length === 0) {
            throw new Error('No valid questions could be generated');
        }

        console.log(`Generated ${questions.length} questions`);

        // Duplicate template form
        const form = duplicateTemplateForm();
        console.log(`Form duplicated: ${form.getId()}`);

        // Add questions
        addQuestionsToForm(form, questions);

        // Setup grading with API
        setupQuizGrading(form.getId(), questions);

        // Publish form
        form.setPublished(true);
        form.setAcceptingResponses(true);

        console.log('Quiz form created successfully!');

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
 * Duplicate the template form
 */
function duplicateTemplateForm() {
    const templateId = CONFIG.QUIZ_SETTINGS.TEMPLATE_FORM_ID;
    const dateString = getDateString();
    const newTitle = `${dateString} ${CONFIG.QUIZ_SETTINGS.FORM_TITLE}`;

    try {
        const templateFile = DriveApp.getFileById(templateId);
        const duplicatedFile = templateFile.makeCopy(newTitle);
        const form = FormApp.openById(duplicatedFile.getId());

        form.setDescription(CONFIG.QUIZ_SETTINGS.FORM_DESCRIPTION);

        // Move to folder
        moveToFolder(duplicatedFile.getId(), CONFIG.QUIZ_SETTINGS.RESULTS_FOLDER_NAME);

        return form;
    } catch (error) {
        throw new Error(`Failed to duplicate template: ${error.message}`);
    }
}

/**
 * Add questions to form
 */
function addQuestionsToForm(form, questions) {
    questions.forEach((question, index) => {
        // Add page break (except first question)
        if (index > 0) {
            form.addPageBreakItem()
                .setTitle(`Question ${index + 1}`)
                .setHelpText(`Question ${index + 1} sur ${questions.length}`);
        }

        // Add text question
        const item = form.addTextItem()
            .setTitle(question.questionText)
            .setRequired(true);

        if (question.sourceLanguage && question.targetLanguage) {
            item.setHelpText(`Traduisez de ${question.sourceLanguage} vers ${question.targetLanguage}`);
        }
    });

    console.log(`Added ${questions.length} questions to form`);
}

/**
 * Move file to folder (create if doesn't exist)
 */
function moveToFolder(fileId, folderName) {
    try {
        const file = DriveApp.getFileById(fileId);
        const folders = DriveApp.getFoldersByName(folderName);

        const targetFolder = folders.hasNext()
            ? folders.next()
            : DriveApp.createFolder(folderName);

        file.getParents().next().removeFile(file);
        targetFolder.addFile(file);

        console.log(`File moved to folder: ${folderName}`);
    } catch (error) {
        console.warn(`Could not move file to folder: ${error.message}`);
    }
}