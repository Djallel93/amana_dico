/**
 * Setup quiz features using Google Forms API
 */
function setupQuizWithAPI(formId, questions) {
    try {
        console.log('⚙️ Setting up quiz features with Forms API...');

        const accessToken = getOAuth2AccessToken();

        // Récupération de la structure du formulaire
        const formStructure = getFormStructure(formId, accessToken);

        // Configuration des réponses correctes
        setupAnswerKeys(formId, formStructure.items, questions, accessToken);

        console.log('✅ Quiz setup completed successfully');
    } catch (error) {
        console.error('❌ Error setting up quiz with API:', error);
        throw error;
    }
}

/**
 * Get the current form structure from Forms API
 */
function getFormStructure(formId, accessToken) {
    const url = `${CONFIG.OAUTH_CONFIG.FORMS_API_BASE_URL}/forms/${formId}`;

    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    };

    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) {
        throw new Error(`Forms API request failed: ${response.getContentText()}`);
    }

    return JSON.parse(response.getContentText());
}

/**
 * Setup answer keys for all text questions
 */
function setupAnswerKeys(formId, formItems, questions, accessToken) {
    const requests = [];

    // Keep track of which question we're on
    let questionIndex = 0;

    // Iterate through ALL items to maintain correct indices
    formItems.forEach((item, itemIndex) => {
        // Only process text questions
        if (item.questionItem &&
            item.questionItem.question &&
            item.questionItem.question.textQuestion) {
            
            // Make sure we haven't exceeded our questions array
            if (questionIndex < questions.length) {
                const question = questions[questionIndex];

                console.log(
                    `➡️ Q${questionIndex + 1}: "${question.questionText}" → Correct = "${question.correctAnswer}"`
                );
                console.log(`Item index in form: ${itemIndex}, Item ID: ${item.itemId}`);

                requests.push({
                    updateItem: {
                        item: {
                            itemId: item.itemId,
                            questionItem: {
                                question: {
                                    grading: {
                                        pointValue: 1,
                                        correctAnswers: {
                                            answers: [{ value: question.correctAnswer }]
                                        }
                                    }
                                }
                            }
                        },
                        location: {
                            index: itemIndex  // Use the actual index in the form
                        },
                        updateMask: 'questionItem.question.grading'
                    }
                });

                questionIndex++;  // Move to next question
            }
        }
    });

    console.log(`📋 Found ${questionIndex} text questions`);
    console.log(`🎯 Expected ${questions.length} questions from dataset`);

    if (requests.length === 0) {
        console.log('⚠️ No answer key requests to process');
        return;
    }

    // Batch update
    const url = `${CONFIG.OAUTH_CONFIG.FORMS_API_BASE_URL}/forms/${formId}:batchUpdate`;

    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        payload: JSON.stringify({ requests })
    };

    const response = UrlFetchApp.fetch(url, options);

    if (response.getResponseCode() !== 200) {
        throw new Error(`❌ Failed to set answer keys: ${response.getContentText()}`);
    }

    console.log(`✅ Answer keys configured for ${requests.length} questions`);
}