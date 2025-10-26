/**
 * Create quiz forms and automatically send to students
 * Creates forms based on student preferences (translation and/or relation quizzes)
 * Priority: If both debutant and avance are checked, only avance form is created
 */
function createAndSendQuizForm(sheetId = null) {
    const spreadsheetId = getSheetId();
    try {
        console.log('=== Creating and Sending Quiz Forms ===\n');
        const studentsByCategory = getStudentsByTestCategory(spreadsheetId);

        const formsToCreate = determineFormsToCreate(studentsByCategory);

        if (formsToCreate.length === 0) {
            console.log('No students to test');
            return {
                success: true,
                message: 'No students to test',
                emailsSent: 0,
                emailsFailed: 0
            };
        }

        let allResults = [];
        let totalSent = 0;
        let totalFailed = 0;

        formsToCreate.forEach(formConfig => {
            console.log(`\n--- ${formConfig.label} (${formConfig.students.length} students) ---`);
            const result = createAndSendFormForStudentLevel(
                formConfig.isAdvanced,
                formConfig.quizType,
                formConfig.students,
                spreadsheetId
            );
            allResults = allResults.concat(result.results);
            totalSent += result.sent;
            totalFailed += result.failed;
        });

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
 * Determine which forms need to be created based on student preferences
 */
function determineFormsToCreate(studentsByCategory) {
    const formsToCreate = [];

    // Translation forms
    if (studentsByCategory.translation.advanced.length > 0) {
        formsToCreate.push({
            label: 'Translation - Advanced',
            isAdvanced: true,
            quizType: CONFIG.QUIZ_TYPES.TRANSLATION,
            students: studentsByCategory.translation.advanced
        });
    } else if (studentsByCategory.translation.debutant.length > 0) {
        formsToCreate.push({
            label: 'Translation - Debutant',
            isAdvanced: false,
            quizType: CONFIG.QUIZ_TYPES.TRANSLATION,
            students: studentsByCategory.translation.debutant
        });
    }

    // Relation forms
    if (studentsByCategory.relation.advanced.length > 0) {
        formsToCreate.push({
            label: 'Relation - Advanced',
            isAdvanced: true,
            quizType: CONFIG.QUIZ_TYPES.RELATION,
            students: studentsByCategory.relation.advanced
        });
    } else if (studentsByCategory.relation.debutant.length > 0) {
        formsToCreate.push({
            label: 'Relation - Debutant',
            isAdvanced: false,
            quizType: CONFIG.QUIZ_TYPES.RELATION,
            students: studentsByCategory.relation.debutant
        });
    }

    return formsToCreate;
}

/**
 * Create form and send to students of a specific level and type
 */
function createAndSendFormForStudentLevel(isAdvanced, quizType, students, spreadsheetId) {
    try {
        console.log(`Creating ${isAdvanced ? 'ADVANCED' : 'DEBUTANT'} ${quizType} quiz form...`);
        const formResult = createQuizForm(spreadsheetId, isAdvanced, quizType);
        console.log(`✓ Form created: ${formResult.formId}`);

        console.log(`Sending to ${students.length} students...`);
        const emailResult = sendQuizToStudentsList(
            students,
            formResult.publishedUrl,
            isAdvanced,
            quizType
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
function sendQuizToStudentsList(students, formUrl, isAdvanced, quizType) {
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
            if (index > 0) {
                Utilities.sleep(1000);
            }

            const result = sendQuizEmailToStudent(student, formUrl, dateTime, isAdvanced, quizType);
            results.push({
                student: `${student.prenom} ${student.nom}`,
                email: student.mail,
                level: isAdvanced ? 'advanced' : 'debutant',
                type: quizType,
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
function sendQuizEmailToStudent(student, formUrl, dateTime, isAdvanced = false, quizType = CONFIG.QUIZ_TYPES.TRANSLATION) {
    try {
        const studentName = student.prenom
            ? `${student.prenom} ${student.nom}`
            : student.nom;

        const subject = quizType === CONFIG.QUIZ_TYPES.TRANSLATION
            ? CONFIG.EMAIL_SETTINGS.TRANSLATION_SUBJECT
            : CONFIG.EMAIL_SETTINGS.RELATION_SUBJECT;

        const emailBody = generateQuizEmailBody(studentName, formUrl, dateTime, isAdvanced, quizType);

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
            subject,
            `Nouveau test disponible : ${formUrl}`,
            emailOptions
        );

        console.log(`✓ Email sent to ${student.mail} (${isAdvanced ? 'advanced' : 'debutant'} ${quizType})`);
        return { success: true, email: student.mail };
    } catch (error) {
        console.error(`✗ Failed to send email to ${student.mail}:`, error);
        return { success: false, email: student.mail, error: error.message };
    }
}

/**
 * Get students categorized by test type and level
 */
function getStudentsByTestCategory(spreadsheetId = null) {
    const { ELEVE } = CONFIG.SHEET_DEF;
    const elevesData = getSheetData(ELEVE.SHEET_NAME, spreadsheetId);

    const categorized = {
        translation: {
            debutant: [],
            advanced: [],
            all: []
        },
        relation: {
            debutant: [],
            advanced: [],
            all: []
        }
    };

    elevesData.forEach(row => {
        const mail = row[ELEVE.COLUMNS.MAIL];
        if (!mail || mail.trim() === '') return;

        const student = {
            id: row[ELEVE.COLUMNS.ID],
            nom: row[ELEVE.COLUMNS.NOM] || '',
            prenom: row[ELEVE.COLUMNS.PRENOM] || '',
            mail: mail.trim()
        };

        const traductionDebutant = row[ELEVE.COLUMNS.TRADUCTION_DEBUTANT] === true;
        const traductionAvance = row[ELEVE.COLUMNS.TRADUCTION_AVANCE] === true;
        const comprehensionDebutant = row[ELEVE.COLUMNS.SENS_DEBUTANT] === true;
        const comprehensionAvance = row[ELEVE.COLUMNS.SENS_AVANCE] === true;

        // Translation tests - priority to advanced if both checked
        if (traductionAvance) {
            categorized.translation.advanced.push(student);
            categorized.translation.all.push(student);
        } else if (traductionDebutant) {
            categorized.translation.debutant.push(student);
            categorized.translation.all.push(student);
        }

        // Relation tests - priority to advanced if both checked
        if (comprehensionAvance) {
            categorized.relation.advanced.push(student);
            categorized.relation.all.push(student);
        } else if (comprehensionDebutant) {
            categorized.relation.debutant.push(student);
            categorized.relation.all.push(student);
        }
    });

    console.log(`Students categorized:`);
    console.log(`  Translation - Debutant: ${categorized.translation.debutant.length}`);
    console.log(`  Translation - Advanced: ${categorized.translation.advanced.length}`);
    console.log(`  Relation - Debutant: ${categorized.relation.debutant.length}`);
    console.log(`  Relation - Advanced: ${categorized.relation.advanced.length}`);

    return categorized;
}

/**
 * Generate email body for quiz invitation
 */
function generateQuizEmailBody(studentName, formUrl, dateTime, isAdvanced = false, quizType = CONFIG.QUIZ_TYPES.TRANSLATION) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>${getEmailStyles()}</style>
</head>
<body>
    ${getEmailContent(studentName, formUrl, dateTime, isAdvanced, quizType)}
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
 * Generate email body content with dynamic messages
 */
function getEmailContent(studentName, formUrl, dateTime, isAdvanced, quizType) {
    const emojis = CONFIG.EMAIL_SETTINGS.EMAIL_TEMPLATE.EMOJIS;
    const colors = CONFIG.EMAIL_SETTINGS.EMAIL_TEMPLATE.COLORS;
    const questionCount = getQuestionCount();
    
    // Calculate estimated duration
    const minDuration = Math.ceil(questionCount / 2);
    const maxDuration = questionCount;
    const estimatedDuration = `${minDuration}-${maxDuration} minutes`;
    
    // Determine test type and emoji
    const isTranslation = quizType === CONFIG.QUIZ_TYPES.TRANSLATION;
    const testType = isTranslation ? 'Vocabulaire' : 'Compréhension (Synonymes/Antonymes)';
    const testEmoji = isTranslation ? emojis.star : emojis.pencil;
    
    // Level badge
    const levelBadge = isAdvanced ? `${emojis.brain} Niveau Avancé` : '';
    
    // Test descriptions
    let testDescription = '';
    let advancedDescription = '';
    
    if (isTranslation) {
        testDescription = `<p>Ce test vous permettra d'évaluer vos connaissances en vocabulaire bilingue français-arabe.</p>`;
        
        if (isAdvanced) {
            advancedDescription = `<p>Ce test nécessite l'écriture correcte des harakat (التشكيل) pour les mots arabes.</p>`;
        }
    } else {
        // Relation/Comprehension test
        if (isAdvanced) {
            testDescription = `<p>Ce test vous permettra d'évaluer votre capacité à trouver des synonymes et antonymes en respectant les harakat (التشكيل).</p>`;
            advancedDescription = `<p>Vous devrez trouver le synonyme ou l'antonyme de mots donnés, avec l'écriture correcte des harakat.</p>`;
        } else {
            testDescription = `<p>Ce test vous permettra d'évaluer votre compréhension des relations sémantiques (synonymes et antonymes).</p>`;
        }
    }
    
    // Advanced notice section
    const advancedNoticeHtml = isAdvanced ? `
        <div class="advanced-notice">
            <p><strong>${emojis.warn} Test Niveau Avancé</strong></p>
            ${advancedDescription}
        </div>
    ` : '';
    
    // Greeting message
    const greetingMessage = `Bonjour <strong>${studentName}</strong>,`;
    
    // Introduction message
    const introMessage = `Un nouveau test de ${testType.toLowerCase()} est disponible pour vous !`;
    
    // Button text
    const buttonText = `${emojis.rocket} Commencer le Test`;
    
    // Footer advice
    const footerAdvice = `<em>Conseil : Prenez votre temps et réfléchissez bien avant de répondre. Bonne chance !</em>`;
    
    // Footer disclaimer
    const footerDisclaimer = `Cet email a été envoyé automatiquement. Si vous ne souhaitez plus recevoir de tests, veuillez contacter votre professeur.`;
    
    // Build HTML
    return `
    <div class="container">
        <div class="header">
            <h1>${testEmoji} Nouveau Test de ${testType}<br>${levelBadge}</h1>
            <p style="margin: 0;">Français ${emojis.arrow} العربية</p>
        </div>
        <div class="content">
            <p>${greetingMessage}</p>
            <p>${introMessage}</p>
            ${advancedNoticeHtml}
            <div class="info-box">
                <p><strong>${emojis.calendar} Date :</strong> ${dateTime}</p>
                <p><strong>${emojis.pencil} Questions :</strong> ${questionCount} questions</p>
                <p><strong>${emojis.timer} Durée estimée :</strong> ${estimatedDuration}</p>
            </div>
            ${testDescription}
            <div class="text-center">
                <a href="${formUrl}" class="button">${buttonText}</a>
            </div>
            <p style="font-size: 14px; color: ${colors.textLight};">
                ${footerAdvice}
            </p>
        </div>
        <div class="footer">
            <p>${footerDisclaimer}</p>
        </div>
    </div>`;
}