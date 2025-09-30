// ============================================
// STUDENT MANAGEMENT & EMAIL FUNCTIONALITY
// ============================================

/**
 * Create quiz form and automatically send to students
 */
function createAndSendQuizForm(spreadsheetId = null) {
    try {
        console.log('=== Creating and Sending Quiz Form ===\n');

        // Step 1: Create the quiz form
        console.log('Step 1: Creating quiz form...');
        const formResult = createQuizForm(spreadsheetId);
        console.log(`✓ Form created: ${formResult.formId}\n`);

        // Step 2: Send to students
        console.log('Step 2: Sending to students...');
        const emailResult = sendQuizToStudents(formResult.publishedUrl, formResult.formId);
        console.log(`✓ Emails sent\n`);

        // Step 3: Return summary
        const summary = {
            formId: formResult.formId,
            editUrl: formResult.editUrl,
            publishedUrl: formResult.publishedUrl,
            emailsSent: emailResult.sent,
            emailsFailed: emailResult.failed,
            emailResults: emailResult.results
        };

        console.log('=== Quiz Creation and Distribution Complete ===');
        console.log(`Form URL: ${formResult.publishedUrl}`);
        console.log(`Emails sent: ${emailResult.sent}`);
        console.log(`Emails failed: ${emailResult.failed}`);

        return summary;

    } catch (error) {
        console.error('Error in createAndSendQuizForm:', error);
        throw error;
    }
}

/**
 * Send quiz form to all students who want to be tested
 */
function sendQuizToStudents(formUrl, formId = null) {
    try {
        const students = getStudentsToTest();

        if (students.length === 0) {
            console.log('No students to notify (no students with tester=true)');
            return {
                success: true,
                message: 'No students to notify',
                sent: 0,
                failed: 0,
                results: []
            };
        }

        const dateTime = getDateTimeString();
        const results = [];
        let sentCount = 0;
        let failedCount = 0;

        console.log(`Sending quiz to ${students.length} students...`);

        students.forEach((student, index) => {
            // Add small delay between emails to avoid rate limiting
            if (index > 0) {
                Utilities.sleep(1000); // 1 second delay
            }

            const result = sendQuizEmailToStudent(student, formUrl, dateTime);
            results.push({
                student: `${student.prenom} ${student.nom}`,
                email: student.mail,
                status: result.success ? 'sent' : 'failed',
                error: result.error || null
            });

            if (result.success) {
                sentCount++;
            } else {
                failedCount++;
            }
        });

        console.log(`\n📊 Summary: ${sentCount} sent, ${failedCount} failed`);

        return {
            success: true,
            message: `Quiz sent to ${sentCount}/${students.length} students`,
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
function sendQuizEmailToStudent(student, formUrl, dateTime) {
    try {
        const studentName = student.prenom
            ? `${student.prenom} ${student.nom}`
            : student.nom;

        const emailBody = generateQuizEmailBody(studentName, formUrl, dateTime);

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

        console.log(`✓ Email sent to ${student.mail}`);
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

        // Check if student wants to be tested and has a valid email
        if (tester === true && mail && mail.trim() !== '') {
            students.push({
                id: row[ELEVE.COLUMNS.ID],
                nom: row[ELEVE.COLUMNS.NOM] || '',
                prenom: row[ELEVE.COLUMNS.PRENOM] || '',
                mail: mail.trim()
            });
        }
    });

    console.log(`Found ${students.length} students to test`);
    return students;
}

/**
 * Generate email body for quiz invitation
 */
// Main email generation function
function generateQuizEmailBody(studentName, formUrl, dateTime) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>${getEmailStyles()}</style>
</head>
<body>
    ${getEmailContent(studentName, formUrl, dateTime)}
</body>
</html>`;
}

// Separate styles for easier maintenance
function getEmailStyles() {
    return `
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header { 
            background-color: #4285f4; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
        }
        .header h1 {
            margin: 0 0 10px 0;
        }
        .content { 
            background-color: #f9f9f9; 
            padding: 30px; 
            border-radius: 0 0 8px 8px; 
        }
        .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background-color: #4285f4; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
            font-weight: bold; 
        }
        .info-box { 
            background-color: #e8f0fe; 
            border-left: 4px solid #4285f4; 
            padding: 15px; 
            margin: 20px 0; 
        }
        .info-box p {
            margin: 5px 0;
        }
        .footer { 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666; 
            text-align: center; 
        }
        .text-center {
            text-align: center;
        }
    `;
}

// Separate content structure
function getEmailContent(studentName, formUrl, dateTime) {
    const emojis = CONFIG.EMAIL_SETTINGS.EMAIL_TEMPLATE.EMOJIS;

    return `
    <div class="container">
        <div class="header">
            <h1>${emojis.star} Nouveau Test de Vocabulaire</h1>
            <p style="margin: 0;">Français ${emojis.arrow} العربية</p>
        </div>
        
        <div class="content">
            <p>Bonjour <strong>${studentName}</strong>,</p>
            
            <p>Un nouveau test de vocabulaire est disponible pour vous !</p>
            
            <div class="info-box">
                <p><strong>${emojis.calendar} Date :</strong> ${dateTime}</p>
                <p><strong>${emojis.pencil} Questions :</strong> ${CONFIG.QUIZ_SETTINGS.QUESTION_COUNT} questions</p>
                <p><strong>${emojis.timer} Durée estimée :</strong> ${CONFIG.EMAIL_SETTINGS.EMAIL_TEMPLATE.CONTENT.estimatedDuration}</p>
            </div>
            
            <p>Ce test vous permettra d'évaluer vos connaissances en vocabulaire bilingue français-arabe.</p>
            
            <div class="text-center">
                <a href="${formUrl}" class="button">${emojis.rocket} Commencer le Test</a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
                <em>Conseil : Prenez votre temps et réfléchissez bien avant de répondre. Bonne chance !</em>
            </p>
        </div>
        
        <div class="footer">
            <p>Cet email a été envoyé automatiquement. Si vous ne souhaitez plus recevoir de tests, veuillez contacter votre professeur.</p>
        </div>
    </div>`;
}
