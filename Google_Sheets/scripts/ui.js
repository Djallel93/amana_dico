// ============================================
// UI MANAGEMENT
// ============================================

/**
 * Create custom menu on spreadsheet open
 */
function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu("🌟 Tester mes connaissances")
        .addItem("Démarrer le Quiz", "startQuizUI")
        .addItem("Générer un formulaire", "generateQuizForm")
        .addToUi();
}

/**
 * Start the interactive quiz UI
 */
function startQuizUI() {
    const htmlTemplate = HtmlService.createTemplateFromFile("scripts/html/dialog");
    const data = getDataForUI();

    // Pass data to template
    htmlTemplate.chapters = data.chapters;
    htmlTemplate.words = data.words;
    htmlTemplate.translations = data.translations;
    htmlTemplate.languages = data.languages;

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

        // Create sheet if doesn't exist
        if (!resultsSheet) {
            resultsSheet = sheet.insertSheet("resultats_quiz");
            resultsSheet.getRange(1, 1, 1, 5).setValues([
                ["date", "chapitres", "score", "total_questions", "pourcentage"]
            ]);
        }

        // Add result row
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