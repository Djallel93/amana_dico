function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu("🌟 Tester mes connaissances")
        .addItem("Démarrer le Quiz", "startUI")
        .addItem("Générer un formulaire", "generateQuizFromActiveSheet")
        .addToUi();
}

function startUI() {
    let htmlTemplate = HtmlService.createTemplateFromFile("scripts/html/dialog");

    // Pass data to the HTML template
    htmlTemplate.chapters = getChapters();
    htmlTemplate.words = getWords();
    htmlTemplate.translations = getTranslations();
    htmlTemplate.languages = getLanguages();

    let htmlOutput = htmlTemplate.evaluate()
        .setWidth(900)
        .setHeight(700)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, "🌟 Language Learning Quiz");
}

function generateQuizFromActiveSheet() {
    try {
        // Get the active spreadsheet
        const activeSheet = SpreadsheetApp.getActiveSpreadsheet();
        if (!activeSheet) {
            throw new Error('No active spreadsheet found. Please open your dictionary Google Sheet first.');
        }

        const sheetId = activeSheet.getId();
        console.log(`Using active sheet: ${activeSheet.getName()} (ID: ${sheetId})`);

        // Create the quiz using the active sheet
        return createQuizForm(sheetId);

    } catch (error) {
        console.error('Error generating quiz from active sheet:', error);
        throw error;
    }
}

// Include CSS and JS files
function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}