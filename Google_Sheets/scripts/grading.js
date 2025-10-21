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
 * Remove Arabic harakat (diacritics) from text
 */
function removeHarakat(text) {
    if (!text) return text;
    const harakatPattern = /[\u064B-\u065F\u0670]/g;
    return text.replace(harakatPattern, '');
}

/**
 * Check if text contains reflexive verb pattern like "verb (se)" or "verb (s')"
 */
function hasReflexivePronoun(text) {
    if (!text) return null;
    const reflexivePattern = /^(.+?)\s*\((se|s')\)$/i;
    const match = text.trim().match(reflexivePattern);

    if (match) {
        return {
            verb: match[1].trim(),
            pronoun: match[2].toLowerCase()
        };
    }
    return null;
}

/**
 * Generate reflexive verb variations
 */
function generateReflexiveVariations(verb, pronoun) {
    const variations = [];
    const normalizedPronoun = pronoun.toLowerCase();
    const combined = `${normalizedPronoun} ${verb}`;

    variations.push(combined);
    variations.push(combined.toLowerCase());
    variations.push(combined.toUpperCase());

    const properCase = normalizedPronoun.charAt(0).toUpperCase() +
        normalizedPronoun.slice(1) + ' ' +
        verb.toLowerCase();
    variations.push(properCase);

    const properCaseAlt = normalizedPronoun.charAt(0).toUpperCase() +
        normalizedPronoun.slice(1) + ' ' +
        verb.charAt(0).toUpperCase() + verb.slice(1).toLowerCase();
    variations.push(properCaseAlt);

    return variations;
}

/**
 * Generate case variations for a text answer
 */
function generateCaseVariations(text) {
    if (!text) return [];

    const variations = [];
    const trimmed = text.trim();

    const reflexiveInfo = hasReflexivePronoun(trimmed);
    if (reflexiveInfo) {
        return generateReflexiveVariations(reflexiveInfo.verb, reflexiveInfo.pronoun);
    }

    variations.push(trimmed);

    const lower = trimmed.toLowerCase();
    if (lower !== trimmed) {
        variations.push(lower);
    }

    const upper = trimmed.toUpperCase();
    if (upper !== trimmed) {
        variations.push(upper);
    }

    const proper = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    if (proper !== trimmed && proper !== lower && proper !== upper) {
        variations.push(proper);
    }

    return variations;
}

/**
 * Check if text contains Arabic characters
 */
function isArabicText(text) {
    if (!text) return false;
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
    return arabicPattern.test(text);
}

/**
 * Generate all valid answer variations for a question
 */
function generateAnswerVariations(correctAnswers, isAdvancedStudent = false, quizType = CONFIG.QUIZ_TYPES.TRANSLATION) {
    const variations = new Set();

    // correctAnswers is now an array
    const answersArray = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];

    if (quizType === CONFIG.QUIZ_TYPES.RELATION) {
        answersArray.forEach(answer => {
            const caseVariations = generateCaseVariations(answer);
            caseVariations.forEach(variation => variations.add(variation));
        });
    } else {
        answersArray.forEach(answer => {
            const isArabic = isArabicText(answer);

            if (isArabic) {
                if (isAdvancedStudent) {
                    variations.add(answer.trim());
                } else {
                    const withoutHarakat = removeHarakat(answer);
                    variations.add(withoutHarakat.trim());
                    variations.add(answer.trim());
                }
            } else {
                const caseVariations = generateCaseVariations(answer);
                caseVariations.forEach(variation => variations.add(variation));
            }
        });
    }

    const result = Array.from(variations).filter(v => v.length > 0);
    // console.log(`Answer variations for [${answersArray.join(', ')}]:`, result);
    return result;
}

/**
 * Build grading requests for batch update
 */
function buildGradingRequests(formItems, questions) {
    const requests = [];
    let questionIndex = 0;

    formItems.forEach((item, itemIndex) => {
        // Skip if not a question item or out of questions
        if (questionIndex >= questions.length) {
            return;
        }

        const question = questions[questionIndex];

        // Handle text questions
        if (item.questionItem?.question?.textQuestion) {
            const isAdvancedStudent = question.isAdvancedStudent || false;
            const quizType = question.quizType || CONFIG.QUIZ_TYPES.TRANSLATION;

            const answerVariations = generateAnswerVariations(
                question.correctAnswers,
                isAdvancedStudent,
                quizType
            );

            // console.log(`Q${questionIndex + 1}: "${question.questionText}" → Valid answers:`, answerVariations);

            const answersArray = answerVariations.map(answer => ({ value: answer }));

            requests.push({
                updateItem: {
                    item: {
                        itemId: item.itemId,
                        questionItem: {
                            question: {
                                grading: {
                                    pointValue: 1,
                                    correctAnswers: {
                                        answers: answersArray
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
        }
        // Handle choice questions (radio)
        else if (item.questionItem?.question?.choiceQuestion) {
            const correctAnswer = question.correctAnswer;

            console.log(`Q${questionIndex + 1}: "${question.questionText}" → Correct choice: ${correctAnswer}`);

            // Find the correct choice option
            const choices = item.questionItem.question.choiceQuestion.options || [];
            let correctChoice = null;

            for (let i = 0; i < choices.length; i++) {
                if (choices[i].value === correctAnswer) {
                    correctChoice = choices[i];
                    break;
                }
            }

            if (correctChoice) {
                requests.push({
                    updateItem: {
                        item: {
                            itemId: item.itemId,
                            questionItem: {
                                question: {
                                    grading: {
                                        pointValue: 1,
                                        correctAnswers: {
                                            answers: [{ value: correctChoice.value }]
                                        }
                                    }
                                }
                            }
                        },
                        location: { index: itemIndex },
                        updateMask: 'questionItem.question.grading'
                    }
                });
            } else {
                console.warn(`Could not find correct choice for question: ${question.questionText}`);
            }

            questionIndex++;
        }
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