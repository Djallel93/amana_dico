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
            .addItem("🧪 Tester l'envoi d'email", "testEmailUI")
            .addSeparator()
            .addItem("🧪 Tester les variations de réponses", "testAnswerVariationsUI")
            .addItem("🔄 Tester les verbes réflexifs", "testReflexiveVerbsUI")
            .addItem("📝 Tester la génération de questions", "testQuestionGenerationUI"))
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
// ============================================
// EMAIL & STUDENT MANAGEMENT UI FUNCTIONS
// ============================================
/**
 * UI function to create and send quiz form
 */
function createAndSendQuizFormUI() {
    const ui = SpreadsheetApp.getUi();
    // Confirm action
    const response = ui.alert(
        'Créer et envoyer le test',
        'Voulez-vous créer un nouveau test et l\'envoyer automatiquement à tous les élèves ?\n\n' +
        '(Des formulaires séparés seront créés pour les élèves réguliers et avancés)',
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
        ui.alert('Test créé et envoyé', message, ui.ButtonSet.OK);
    } catch (error) {
        ui.alert('❌ Erreur', `Une erreur s'est produite :\n${error.message}`, ui.ButtonSet.OK);
    }
}
/**
 * View students who will receive tests
 */
function viewStudentsToTest() {
    const ui = SpreadsheetApp.getUi();
    try {
        const students = getStudentsToTest();
        if (students.length === 0) {
            ui.alert('Aucun élève à tester',
                'Aucun élève n\'a activé l\'option "tester" dans la feuille élèves.',
                ui.ButtonSet.OK);
            return;
        }
        const regularStudents = students.filter(s => !s.isAdvanced);
        const advancedStudents = students.filter(s => s.isAdvanced);
        let message = `📊 Total : ${students.length} élève(s)\n\n`;
        if (regularStudents.length > 0) {
            message += `📘 Élèves Réguliers (${regularStudents.length}) :\n`;
            regularStudents.forEach(s => {
                message += `  • ${s.prenom} ${s.nom} (${s.mail})\n`;
            });
            message += '\n';
        }
        if (advancedStudents.length > 0) {
            message += `🌟 Élèves Avancés (${advancedStudents.length}) :\n`;
            advancedStudents.forEach(s => {
                message += `  • ${s.prenom} ${s.nom} (${s.mail})\n`;
            });
        }
        ui.alert('Élèves à tester', message, ui.ButtonSet.OK);
    } catch (error) {
        ui.alert('❌ Erreur', `Erreur lors de la récupération des élèves :\n${error.message}`, ui.ButtonSet.OK);
    }
}
/**
 * Test email sending (placeholder)
 */
function testEmailUI() {
    const ui = SpreadsheetApp.getUi();
    ui.alert('Test Email',
        'Cette fonction permet de tester l\'envoi d\'un email.\n\n' +
        'Implémentez la logique d\'envoi de test selon vos besoins.',
        ui.ButtonSet.OK);
}
// ============================================
// TESTING & DEBUG UI FUNCTIONS
// ============================================
/**
 * UI wrapper for testing answer variations
 */
function testAnswerVariationsUI() {
    const ui = SpreadsheetApp.getUi();
    try {
        testAnswerVariations();
        ui.alert('✅ Test terminé',
            'Les résultats sont affichés dans les logs.\n\n' +
            'Allez dans Extensions > Apps Script > Executions pour voir les logs.',
            ui.ButtonSet.OK);
    } catch (error) {
        ui.alert('❌ Erreur', `Erreur lors du test :\n${error.message}`, ui.ButtonSet.OK);
    }
}
/**
 * UI wrapper for testing reflexive verbs
 */
function testReflexiveVerbsUI() {
    const ui = SpreadsheetApp.getUi();
    try {
        testReflexiveVerbs();
        ui.alert('✅ Test terminé',
            'Les variations des verbes réflexifs sont affichées dans les logs.\n\n' +
            'Allez dans Extensions > Apps Script > Executions pour voir les logs.',
            ui.ButtonSet.OK);
    } catch (error) {
        ui.alert('❌ Erreur', `Erreur lors du test :\n${error.message}`, ui.ButtonSet.OK);
    }
}
/**
 * UI wrapper for testing question generation
 */
function testQuestionGenerationUI() {
    const ui = SpreadsheetApp.getUi();
    try {
        testQuestionGeneration();
        ui.alert('✅ Test terminé',
            'Les questions générées sont affichées dans les logs.\n\n' +
            'Allez dans Extensions > Apps Script > Executions pour voir les logs.',
            ui.ButtonSet.OK);
    } catch (error) {
        ui.alert('❌ Erreur', `Erreur lors du test :\n${error.message}`, ui.ButtonSet.OK);
    }
}