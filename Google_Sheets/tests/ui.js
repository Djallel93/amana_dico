/**
 * UI function to view students who will receive the test
 */
function viewStudentsToTest() {
    const ui = SpreadsheetApp.getUi();

    try {
        const studentsByCategory = getStudentsByTestCategory();

        const totalTranslation = studentsByCategory.translation.all.length;
        const totalRelation = studentsByCategory.relation.all.length;

        if (totalTranslation === 0 && totalRelation === 0) {
            ui.alert('Aucun élève à tester',
                'Aucun élève n\'a activé les options de test dans la feuille élèves.',
                ui.ButtonSet.OK);
            return;
        }

        let message = `📊 Résumé des tests à envoyer\n\n`;

        // Translation tests
        if (totalTranslation > 0) {
            message += `📖 TESTS DE TRADUCTION (${totalTranslation} élève(s))\n`;

            if (studentsByCategory.translation.advanced.length > 0) {
                message += `  🌟 Niveau Avancé (${studentsByCategory.translation.advanced.length}) :\n`;
                studentsByCategory.translation.advanced.forEach(s => {
                    message += `     • ${s.prenom} ${s.nom} (${s.mail})\n`;
                });
            }

            if (studentsByCategory.translation.debutant.length > 0) {
                message += `  📘 Niveau Débutant (${studentsByCategory.translation.debutant.length}) :\n`;
                studentsByCategory.translation.debutant.forEach(s => {
                    message += `     • ${s.prenom} ${s.nom} (${s.mail})\n`;
                });
            }
            message += '\n';
        }

        // Relation tests
        if (totalRelation > 0) {
            message += `🔗 TESTS DE SENS - Synonymes/Antonymes (${totalRelation} élève(s))\n`;

            if (studentsByCategory.relation.advanced.length > 0) {
                message += `  🌟 Niveau Avancé (${studentsByCategory.relation.advanced.length}) :\n`;
                studentsByCategory.relation.advanced.forEach(s => {
                    message += `     • ${s.prenom} ${s.nom} (${s.mail})\n`;
                });
            }

            if (studentsByCategory.relation.debutant.length > 0) {
                message += `  📘 Niveau Débutant (${studentsByCategory.relation.debutant.length}) :\n`;
                studentsByCategory.relation.debutant.forEach(s => {
                    message += `     • ${s.prenom} ${s.nom} (${s.mail})\n`;
                });
            }
        }

        ui.alert('Élèves à tester', message, ui.ButtonSet.OK);
    } catch (error) {
        ui.alert('❌ Erreur', `Erreur lors de la récupération des élèves :\n${error.message}`, ui.ButtonSet.OK);
    }
}

/**
 * Test email sending
 */
function testEmailUI() {
    const ui = SpreadsheetApp.getUi();

    const response = ui.prompt(
        'Test Email',
        'Entrez l\'adresse email pour le test :',
        ui.ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() !== ui.Button.OK) {
        return;
    }

    const email = response.getResponseText().trim();
    if (!email) {
        ui.alert('Erreur', 'Aucune adresse email fournie.', ui.ButtonSet.OK);
        return;
    }

    try {
        const testStudent = {
            nom: 'Test',
            prenom: 'Utilisateur',
            mail: email
        };

        const testUrl = 'https://forms.google.com/test';
        const dateTime = getDateTimeString();

        const result = sendQuizEmailToStudent(
            testStudent,
            testUrl,
            dateTime,
            false,
            CONFIG.QUIZ_TYPES.TRANSLATION
        );

        if (result.success) {
            ui.alert('✅ Succès', `Email de test envoyé à ${email}`, ui.ButtonSet.OK);
        } else {
            ui.alert('❌ Erreur', `Échec de l'envoi : ${result.error}`, ui.ButtonSet.OK);
        }
    } catch (error) {
        ui.alert('❌ Erreur', `Erreur lors de l'envoi du test :\n${error.message}`, ui.ButtonSet.OK);
    }
}