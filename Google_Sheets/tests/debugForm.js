function testGetFormInfo() {
    getFormInfo('11sCmmsXZZ8Ho9dhzm86MyS5Z5EKOmQnx7iVmorFREMg')
};
/**
 * Get full form info from Forms API and log it
 */
function getFormInfo(formId) {
    const url = `https://forms.googleapis.com/v1/forms/${formId}`;
    const accessToken = getOAuth2AccessToken();
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        muteHttpExceptions: true // allows logging full error if something goes wrong
    };
    try {
        const response = UrlFetchApp.fetch(url, options);
        const code = response.getResponseCode();
        const body = response.getContentText();
        if (code !== 200) {
            console.error(`❌ Failed to fetch form. Code: ${code}, Body: ${body}`);
            return;
        }
        const form = JSON.parse(body);
        // Log the full JSON (raw)
        console.log("==== Raw Form JSON ====");
        console.log(JSON.stringify(form, null, 2));
        // Log items with more detail
        if (form.items) {
            console.log("==== Form Items ====");
            form.items.forEach((item, i) => {
                console.log(`Item #${i + 1}:`);
                console.log(`- itemId: ${item.itemId}`);
                if (item.title) console.log(`- title: ${item.title}`);
                if (item.questionItem) {
                    const q = item.questionItem.question;
                    console.log(`- Question type: ${Object.keys(q)[0]}`);
                }
            });
        } else {
            console.log("⚠️ No items found in this form.");
        }
    } catch (err) {
        console.error("❌ Error fetching form info:", err);
    }
}
/**
 * Test question generation with sample data
 */
function testQuestionGeneration() {
    try {
        console.log('=== Testing Question Generation ===\n');
        const sheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
        const dictionaryData = loadAllDictionaryData(sheetId);
        console.log('Generating 5 test questions...\n');
        // Generate regular questions
        console.log('--- Regular Student Questions ---');
        const regularQuestions = generateQuizQuestions(dictionaryData, 5, false);
        regularQuestions.forEach((q, i) => {
            console.log(`\nQ${i + 1}: ${q.questionText}`);
            console.log(`   Correct answer: "${q.correctAnswer}"`);
            console.log(`   Advanced: ${q.isAdvancedStudent}`);
        });
        // Generate advanced questions
        console.log('\n--- Advanced Student Questions ---');
        const advancedQuestions = generateQuizQuestions(dictionaryData, 5, true);
        advancedQuestions.forEach((q, i) => {
            console.log(`\nQ${i + 1}: ${q.questionText}`);
            console.log(`   Correct answer: "${q.correctAnswer}"`);
            console.log(`   Advanced: ${q.isAdvancedStudent}`);
        });
        console.log('\n=== Test Complete ===');
    } catch (error) {
        console.error('Test failed:', error);
    }
}