// ============================================
// QUIZ GRADING WITH FORMS API
// ============================================

/**
 * Setup quiz grading using Forms API
 */
function setupQuizGrading(formId, questions) {
    try {
        console.log('Setting up quiz grading...');

        const accessToken = getOAuth2AccessToken();
        const formStructure = getFormStructure(formId, accessToken);
        const requests = buildGradingRequests(formStructure.items, questions);

        if (requests.length === 0) {
            console.warn('No grading requests to process');
            return;
        }

        executeBatchUpdate(formId, requests, accessToken);
        console.log(`Grading configured for ${requests.length} questions`);

    } catch (error) {
        console.error('Error setting up quiz grading:', error);
        throw error;
    }
}

/**
 * Get form structure from API
 */
function getFormStructure(formId, accessToken) {
    const url = `${CONFIG.OAUTH_CONFIG.FORMS_API_BASE_URL}/forms/${formId}`;
    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) {
        throw new Error(`Forms API error: ${response.getContentText()}`);
    }

    return JSON.parse(response.getContentText());
}

/**
 * Build grading requests for batch update
 */
function buildGradingRequests(formItems, questions) {
    const requests = [];
    let questionIndex = 0;

    formItems.forEach((item, itemIndex) => {
        // Only process text questions
        if (!item.questionItem?.question?.textQuestion || questionIndex >= questions.length) {
            return;
        }

        const question = questions[questionIndex];
        console.log(`Q${questionIndex + 1}: "${question.questionText}" → "${question.correctAnswer}"`);

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
                            },
                            textQuestion: {
                                paragraph: false
                            }
                        }
                    }
                },
                location: { index: itemIndex },
                updateMask: 'questionItem.question.grading,questionItem.question.textQuestion'
            }
        });

        questionIndex++;
    });

    return requests;
}

/**
 * Execute batch update on form
 */
function executeBatchUpdate(formId, requests, accessToken) {
    const url = `${CONFIG.OAUTH_CONFIG.FORMS_API_BASE_URL}/forms/${formId}:batchUpdate`;
    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        payload: JSON.stringify({ requests }),
        muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) {
        throw new Error(`Batch update failed: ${response.getContentText()}`);
    }
}