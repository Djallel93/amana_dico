/**
 * UI function to view students who will receive the test
 */
function viewStudentsToTest() {
    const ui = SpreadsheetApp.getUi();
    try {
        const students = getStudentsToTest();
        if (students.length === 0) {
            ui.alert('Aucun élève',
                'Aucun élève n\'a activé l\'option "tester".\n\n' +
                'Vérifiez la colonne "tester" dans la feuille "eleve".',
                ui.ButtonSet.OK);
            return;
        }
        let message = `📋 ${students.length} élève(s) recevront le test :\n\n`;
        students.forEach((student, index) => {
            const name = student.prenom ? `${student.prenom} ${student.nom}` : student.nom;
            message += `${index + 1}. ${name} (${student.mail})\n`;
        });
        ui.alert('Élèves à tester', message, ui.ButtonSet.OK);
    } catch (error) {
        ui.alert('❌ Erreur', `Impossible de charger la liste :\n${error.message}`, ui.ButtonSet.OK);
    }
}
/**
 * UI function to test email sending
 */
function testEmailUI() {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
        '🧪 Test d\'envoi d\'email',
        'Voulez-vous envoyer un email de test au premier élève de la liste ?',
        ui.ButtonSet.YES_NO
    );
    if (response !== ui.Button.YES) {
        return;
    }
    try {
        const result = testEmailSending();
        if (result.success) {
            ui.alert('✅ Test réussi',
                `Email de test envoyé avec succès à :\n${result.email}`,
                ui.ButtonSet.OK);
        } else {
            ui.alert('❌ Test échoué',
                `Erreur lors de l\'envoi à ${result.email} :\n${result.error}`,
                ui.ButtonSet.OK);
        }
    } catch (error) {
        ui.alert('❌ Erreur', `Erreur du test :\n${error.message}`, ui.ButtonSet.OK);
    }
}