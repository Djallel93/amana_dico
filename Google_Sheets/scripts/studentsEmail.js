/**
 * Create quiz forms and automatically send to students
 * Creates separate forms for regular and advanced students
 */
function createAndSendQuizForm(spreadsheetId = null) {
    try {
        console.log('=== Creating and Sending Quiz Forms ===\n');
        const students = getStudentsToTest(spreadsheetId);
        if (students.length === 0) {
            console.log('No students to test');
            return {
                success: true,
                message: 'No students to test',
                emailsSent: 0,
                emailsFailed: 0
            };
        }
        // Separate students by level
        const regularStudents = students.filter(s => !s.isAdvanced);
        const advancedStudents = students.filter(s => s.isAdvanced);
        let allResults = [];
        let totalSent = 0;
        let totalFailed = 0;
        // Create and send form for regular students
        if (regularStudents.length > 0) {
            console.log(`\n--- Regular Students (${regularStudents.length}) ---`);
            const regularResult = createAndSendFormForStudentLevel(
                false, // not advanced
                regularStudents,
                spreadsheetId
            );
            allResults = allResults.concat(regularResult.results);
            totalSent += regularResult.sent;
            totalFailed += regularResult.failed;
        }
        // Create and send form for advanced students
        if (advancedStudents.length > 0) {
            console.log(`\n--- Advanced Students (${advancedStudents.length}) ---`);
            const advancedResult = createAndSendFormForStudentLevel(
                true, // advanced
                advancedStudents,
                spreadsheetId
            );
            allResults = allResults.concat(advancedResult.results);
            totalSent += advancedResult.sent;
            totalFailed += advancedResult.failed;
        }
        console.log('\n=== Quiz Creation and Distribution Complete ===');
        console.log(`Total emails sent: ${totalSent}`);
        console.log(`Total emails failed: ${totalFailed}`);
        return {
            success: true,
            emailsSent: totalSent,
            emailsFailed: totalFailed,
            results: allResults
        };
    } catch (error) {
        console.error('Error in createAndSendQuizForm:', error);
        throw error;
    }
}
/**
 * Create form and send to students of a specific level
 */
function createAndSendFormForStudentLevel(isAdvanced, students, spreadsheetId) {
    try {
        // Step 1: Create the quiz form for this level
        console.log(`Creating ${isAdvanced ? 'ADVANCED' : 'REGULAR'} quiz form...`);
        const formResult = createQuizForm(spreadsheetId, isAdvanced);
        console.log(`✓ Form created: ${formResult.formId}`);
        // Step 2: Send to students
        console.log(`Sending to ${students.length} students...`);
        const emailResult = sendQuizToStudentsList(
            students,
            formResult.publishedUrl,
            isAdvanced
        );
        console.log(`✓ Emails: ${emailResult.sent} sent, ${emailResult.failed} failed`);
        return emailResult;
    } catch (error) {
        console.error('Error in createAndSendFormForStudentLevel:', error);
        throw error;
    }
}
/**
 * Send quiz form to a specific list of students
 */
function sendQuizToStudentsList(students, formUrl, isAdvanced) {
    try {
        if (students.length === 0) {
            return {
                success: true,
                sent: 0,
                failed: 0,
                results: []
            };
        }
        const dateTime = getDateTimeString();
        const results = [];
        let sentCount = 0;
        let failedCount = 0;
        students.forEach((student, index) => {
            // Add small delay between emails to avoid rate limiting
            if (index > 0) {
                Utilities.sleep(1000); // 1 second delay
            }
            const result = sendQuizEmailToStudent(student, formUrl, dateTime, isAdvanced);
            results.push({
                student: `${student.prenom} ${student.nom}`,
                email: student.mail,
                level: isAdvanced ? 'advanced' : 'regular',
                status: result.success ? 'sent' : 'failed',
                error: result.error || null
            });
            if (result.success) {
                sentCount++;
            } else {
                failedCount++;
            }
        });
        return {
            success: true,
            sent: sentCount,
            failed: failedCount,
            results: results
        };
    } catch (error) {
        console.error('Error sending quiz to students:', error);
        throw error;
    }
}
/**
 * Send quiz email to a single student
 */
function sendQuizEmailToStudent(student, formUrl, dateTime, isAdvanced = false) {
    try {
        const studentName = student.prenom
            ? `${student.prenom} ${student.nom}`
            : student.nom;
        const emailBody = generateQuizEmailBody(studentName, formUrl, dateTime, isAdvanced);
        const emailOptions = {
            htmlBody: emailBody,
            name: CONFIG.EMAIL_SETTINGS.SENDER_NAME,
            charset: 'UTF-8'
        };
        if (CONFIG.EMAIL_SETTINGS.REPLY_TO) {
            emailOptions.replyTo = CONFIG.EMAIL_SETTINGS.REPLY_TO;
        }
        GmailApp.sendEmail(
            student.mail,
            CONFIG.EMAIL_SETTINGS.SUBJECT,
            `Nouveau test disponible : ${formUrl}`, // Plain text fallback
            emailOptions
        );
        console.log(`✓ Email sent to ${student.mail} (${isAdvanced ? 'advanced' : 'regular'})`);
        return { success: true, email: student.mail };
    } catch (error) {
        console.error(`✗ Failed to send email to ${student.mail}:`, error);
        return { success: false, email: student.mail, error: error.message };
    }
}
/**
 * Get list of students who want to be tested
 */
function getStudentsToTest(spreadsheetId = null) {
    const { ELEVE } = CONFIG.SHEET_DEF;
    const elevesData = getSheetData(ELEVE.SHEET_NAME, spreadsheetId);
    const students = [];
    elevesData.forEach(row => {
        const tester = row[ELEVE.COLUMNS.TESTER];
        const mail = row[ELEVE.COLUMNS.MAIL];
        const niveauAvance = row[ELEVE.COLUMNS.NIVEAU_AVANCE];
        // Check if student wants to be tested and has a valid email
        if (tester === true && mail && mail.trim() !== '') {
            students.push({
                id: row[ELEVE.COLUMNS.ID],
                nom: row[ELEVE.COLUMNS.NOM] || '',
                prenom: row[ELEVE.COLUMNS.PRENOM] || '',
                mail: mail.trim(),
                isAdvanced: niveauAvance === true
            });
        }
    });
    console.log(`Found ${students.length} students to test`);
    console.log(`  - Regular: ${students.filter(s => !s.isAdvanced).length}`);
    console.log(`  - Advanced: ${students.filter(s => s.isAdvanced).length}`);
    return students;
}
/**
 * Generate email body for quiz invitation
 */
function generateQuizEmailBody(studentName, formUrl, dateTime, isAdvanced = false) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>${getEmailStyles()}</style>
</head>
<body>
    ${getEmailContent(studentName, formUrl, dateTime, isAdvanced)}
</body>
</html>`;
}
/**
 * Separate styles for easier maintenance
 */
function getEmailStyles() {
    const colors = CONFIG.EMAIL_SETTINGS.EMAIL_TEMPLATE.COLORS;
    return `
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: ${colors.text};
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: ${colors.primary};
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0 0 10px 0;
        }
        .content {
            background-color: ${colors.background};
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: ${colors.primary};
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .info-box {
            background-color: ${colors.infoBox};
            border-left: 4px solid ${colors.primary};
            padding: 15px;
            margin: 20px 0;
        }
        .info-box p {
            margin: 5px 0;
        }
        .advanced-notice {
            background-color: ${colors.background};
            border-left: 4px solid ${colors.advancedNotice};
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: ${colors.textLight};
            text-align: center;
        }
        .text-center {
            text-align: center;
        }
    `;
}
/**
 * Separate content structure
 */
function getEmailContent(studentName, formUrl, dateTime, isAdvanced) {
    const emojis = CONFIG.EMAIL_SETTINGS.EMAIL_TEMPLATE.EMOJIS;
    const colors = CONFIG.EMAIL_SETTINGS.EMAIL_TEMPLATE.COLORS;
    const levelBadge = isAdvanced ? emojis.brain + ' Niveau Avancé' : '';
    return `
    <div class="container">
        <div class="header">
            <h1>${emojis.star} Nouveau Test de Vocabulaire${levelBadge}</h1>
            <p style="margin: 0;">Français ${emojis.arrow} العربية</p>
        </div>
        <div class="content">
            <p>Bonjour <strong>${studentName}</strong>,</p>
            <p>Un nouveau test de vocabulaire est disponible pour vous !</p>
            ${isAdvanced ? `
            <div class="advanced-notice">
                <p><strong>${emojis.warn} Test Niveau Avancé</strong></p>
                <p>Ce test nécessite l'écriture correcte des harakat (التشكيل) pour les mots arabes.</p>
            </div>
            ` : ''}
            <div class="info-box">
                <p><strong>${emojis.calendar} Date :</strong> ${dateTime}</p>
                <p><strong>${emojis.pencil} Questions :</strong> ${CONFIG.QUIZ_SETTINGS.QUESTION_COUNT} questions</p>
                <p><strong>${emojis.timer} Durée estimée :</strong> ${CONFIG.EMAIL_SETTINGS.EMAIL_TEMPLATE.CONTENT.estimatedDuration}</p>
            </div>
            <p>Ce test vous permettra d'évaluer vos connaissances en vocabulaire bilingue français-arabe.</p>
            <div class="text-center">
                <a href="${formUrl}" class="button">${emojis.rocket} Commencer le Test</a>
            </div>
            <p style="font-size: 14px; color: ${colors.textLight};">
                <em>Conseil : Prenez votre temps et réfléchissez bien avant de répondre. Bonne chance !</em>
            </p>
        </div>
        <div class="footer">
            <p>Cet email a été envoyé automatiquement. Si vous ne souhaitez plus recevoir de tests, veuillez contacter votre professeur.</p>
        </div>
    </div>`;
}