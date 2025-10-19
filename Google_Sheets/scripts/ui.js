/**
 * Create custom menu on spreadsheet open
 */
function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu("📚 Tester mes connaissances")
        .addItem("📑 Démarrer le Quiz", "startQuizUI")
        .addSeparator()
        .addItem("📜 Générer un formulaire", "generateQuizForm")
        .addItem("📧 Créer et envoyer aux élèves", "createAndSendQuizFormUI")
        .addSeparator()
        .addSubMenu(SpreadsheetApp.getUi().createMenu("🔧 Tests & Debug")
            .addItem("📋 Voir les élèves à tester", "viewStudentsToTest")
            .addItem("🧪 Tester l'envoi d'email", "testEmailUI"))
        .addToUi();
}

/**
 * Start the interactive quiz UI
 */
function startQuizUI() {
    const htmlTemplate = HtmlService.createTemplateFromFile("scripts/html/dialog");
    const data = getDataForUI();

    htmlTemplate.chapters = data.chapters;
    htmlTemplate.words = data.words;
    htmlTemplate.translations = data.translations;
    htmlTemplate.languages = data.languages;
    htmlTemplate.relations = data.relations;

    const htmlOutput = htmlTemplate.evaluate()
        .setWidth(900)
        .setHeight(700)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, "🌟 Language Learning Quiz");
}

/**
 * Generate quiz form from active spreadsheet
 */
function generateQuizForm() {
    try {
        const activeSheet = SpreadsheetApp.getActiveSpreadsheet();
        if (!activeSheet) {
            throw new Error('No active spreadsheet found');
        }
        const sheetId = activeSheet.getId();
        return createQuizForm(sheetId);
    } catch (error) {
        console.error('Error generating quiz:', error);
        SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
        throw error;
    }
}

/**
 * Include external HTML file
 */
function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Save quiz results to spreadsheet
 */
function saveQuizResults(results) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet();
        let resultsSheet = sheet.getSheetByName("resultats_quiz");

        if (!resultsSheet) {
            resultsSheet = sheet.insertSheet("resultats_quiz");
            resultsSheet.getRange(1, 1, 1, 5).setValues([
                ["date", "chapitres", "score", "total_questions", "pourcentage"]
            ]);
        }

        const timestamp = new Date();
        const lastRow = resultsSheet.getLastRow() + 1;
        resultsSheet.getRange(lastRow, 1, 1, 5).setValues([[
            timestamp.toISOString(),
            results.chapters.join(", "),
            results.score,
            results.total,
            results.percentage + "%"
        ]]);

        return "Résultats sauvegardés avec succès!";
    } catch (error) {
        console.error('Error saving results:', error);
        throw error;
    }
}

// ============================================
// EMAIL & STUDENT MANAGEMENT UI FUNCTIONS
// ============================================

/**
 * UI function to create and send quiz form
 */
function createAndSendQuizFormUI() {
    const ui = SpreadsheetApp.getUi();

    const response = ui.alert(
        'Créer et envoyer les tests',
        'Voulez-vous créer les tests et les envoyer automatiquement aux élèves ?\n\n' +
        'Les formulaires seront créés selon les préférences des élèves :\n' +
        '• Tests de traduction (français ↔ arabe)\n' +
        '• Tests de compréhension (synonymes/antonymes)\n\n' +
        'Note: Si un élève a coché débutant ET avancé, seul le test avancé sera envoyé.',
        ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
        return;
    }

    try {
        const result = createAndSendQuizForm();
        const message = `✅ Succès !\n\n` +
            `📧 Emails envoyés : ${result.emailsSent}\n` +
            `❌ Échecs : ${result.emailsFailed}\n\n` +
            `Vérifiez les logs pour plus de détails.`;
        ui.alert('Tests créés et envoyés', message, ui.ButtonSet.OK);
    } catch (error) {
        ui.alert('❌ Erreur', `Une erreur s'est produite :\n${error.message}`, ui.ButtonSet.OK);
    }
}