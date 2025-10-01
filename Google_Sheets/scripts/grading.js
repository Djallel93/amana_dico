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
    // Arabic harakat Unicode ranges
    const harakatPattern = /[\u064B-\u065F\u0670]/g;
    return text.replace(harakatPattern, '');
}
/**
 * Check if text contains reflexive verb pattern like "verb (se)" or "verb (s')"
 */
function hasReflexivePronoun(text) {
    if (!text) return null;
    // Match patterns like "lever (se)" or "habiller (s')"
    const reflexivePattern = /^(.+?)\s*\((se|s')\)$/i;
    const match = text.trim().match(reflexivePattern);
    if (match) {
        return {
            verb: match[1].trim(),
            pronoun: match[2].toLowerCase() // "se" or "s'"
        };
    }
    return null;
}
/**
 * Generate reflexive verb variations
 * For "lever (se)" generates: "se lever", "SE LEVER", "Se lever", "Se Lever"
 */
function generateReflexiveVariations(verb, pronoun) {
    const variations = [];
    // Normalize pronoun (handle both "se" and "s'")
    const normalizedPronoun = pronoun.toLowerCase();
    // Generate: pronoun + space + verb
    const combined = `${normalizedPronoun} ${verb}`;
    // Generate case variations of the combined form
    variations.push(combined); // Original case
    variations.push(combined.toLowerCase()); // all lowercase
    variations.push(combined.toUpperCase()); // ALL UPPERCASE
    // Proper case: "Se lever" or "S' habiller"
    const properCase = normalizedPronoun.charAt(0).toUpperCase() +
        normalizedPronoun.slice(1) + ' ' +
        verb.toLowerCase();
    variations.push(properCase);
    // Alternative proper case: "Se Lever"
    const properCaseAlt = normalizedPronoun.charAt(0).toUpperCase() +
        normalizedPronoun.slice(1) + ' ' +
        verb.charAt(0).toUpperCase() + verb.slice(1).toLowerCase();
    variations.push(properCaseAlt);
    return variations;
}
/**
 * Generate case variations for a text answer
 * Returns array of variations: lowercase, UPPERCASE, Proper Case
 */
function generateCaseVariations(text) {
    if (!text) return [];
    const variations = [];
    const trimmed = text.trim();
    // Check if this is a reflexive verb pattern
    const reflexiveInfo = hasReflexivePronoun(trimmed);
    if (reflexiveInfo) {
        // Generate reflexive verb variations
        const reflexiveVars = generateReflexiveVariations(reflexiveInfo.verb, reflexiveInfo.pronoun);
        return reflexiveVars;
    }
    // Standard case variations for non-reflexive words
    // Add original
    variations.push(trimmed);
    // Add lowercase
    const lower = trimmed.toLowerCase();
    if (lower !== trimmed) {
        variations.push(lower);
    }
    // Add uppercase
    const upper = trimmed.toUpperCase();
    if (upper !== trimmed) {
        variations.push(upper);
    }
    // Add proper case (first letter uppercase, rest lowercase)
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
function generateAnswerVariations(correctAnswer, isAdvancedStudent = false) {
    const variations = new Set();
    // Check if answer is in Arabic
    const isArabic = isArabicText(correctAnswer);
    if (isArabic) {
        // For Arabic answers
        if (isAdvancedStudent) {
            // Advanced students: harakat must be correct
            // Add only exact match with harakat
            variations.add(correctAnswer.trim());
        } else {
            // Regular students: ignore harakat
            // Add version without harakat
            const withoutHarakat = removeHarakat(correctAnswer);
            variations.add(withoutHarakat.trim());
            // Also add original in case it has harakat
            variations.add(correctAnswer.trim());
        }
    } else {
        // For non-Arabic answers (French, etc.)
        // Generate case variations
        const caseVariations = generateCaseVariations(correctAnswer);
        caseVariations.forEach(variation => variations.add(variation));
    }
    // Remove empty strings
    const result = Array.from(variations).filter(v => v.length > 0);
    console.log(`Answer variations for "${correctAnswer}":`, result);
    return result;
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
        // Determine if student is advanced (this info should be passed in questions)
        const isAdvancedStudent = question.isAdvancedStudent || false;
        // Generate all valid answer variations
        const answerVariations = generateAnswerVariations(
            question.correctAnswer,
            isAdvancedStudent
        );
        console.log(`Q${questionIndex + 1}: "${question.questionText}" → Valid answers:`, answerVariations);
        // Build answers array for Forms API
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