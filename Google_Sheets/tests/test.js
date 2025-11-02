
/**
 * Utility function to analyze your dictionary data
 * Now uses the active sheet
 */
function analyzeDictionaryData() {
    try {
        const activeSheet = SpreadsheetApp.getActiveSpreadsheet();
        if (!activeSheet) {
            throw new Error('No active spreadsheet found. Please open your dictionary Google Sheet first.');
        }
        const data = loadDictionaryData(activeSheet.getId());
        console.log('=== DICTIONARY ANALYSIS ===');
        console.log(`Total languages: ${Object.keys(data.langues).length}`);
        console.log(`Total chapters: ${Object.keys(data.chapitres).length}`);
        console.log(`Total words: ${Object.keys(data.mots).length}`);
        console.log(`Total translations: ${data.translations.length}`);
        // Language breakdown
        const languageCount = {};
        Object.values(data.mots).forEach(mot => {
            const langName = mot.langueNom;
            languageCount[langName] = (languageCount[langName] || 0) + 1;
        });
        console.log('\n=== WORDS BY LANGUAGE ===');
        Object.entries(languageCount).forEach(([lang, count]) => {
            console.log(`${lang}: ${count} words`);
        });
        // Chapter breakdown
        const chapterCount = {};
        Object.values(data.mots).forEach(mot => {
            const chapterName = data.chapitres[mot.chapitre] || 'Unknown';
            chapterCount[chapterName] = (chapterCount[chapterName] || 0) + 1;
        });
        console.log('\n=== WORDS BY CHAPTER ===');
        Object.entries(chapterCount).forEach(([chapter, count]) => {
            console.log(`${chapter}: ${count} words`);
        });
    } catch (error) {
        console.error('Error analyzing data:', error);
    }
}
/**
 * Test function - creates a sample quiz with detailed logging
 * Now uses the active sheet
 */
function testQuizGeneration() {
    try {
        console.log('=== TESTING QUIZ GENERATION ===');
        const result = generateQuizFromActiveSheet();
        console.log('Test completed successfully!');
        console.log('Form URLs:', result);
    } catch (error) {
        console.error('Test failed:', error);
    }
}
/**
 * Test reflexive verb variations
 */
function testReflexiveVerbs() {
    console.log('=== Testing Reflexive Verb Variations ===\n');
    const testVerbs = [
        'lever (se)',
        'assoire (se)',
        'prendre (se)',
        'habiller (s\')'
    ];
    testVerbs.forEach(verb => {
        console.log(`\nTesting: "${verb}"`);
        const variations = generateAnswerVariations(verb, false);
        console.log('Accepted answers:');
        variations.forEach((v, i) => {
            console.log(`  ${i + 1}. "${v}"`);
        });
    });
    console.log('\n=== Test Complete ===');
}
/**
 * Test function to verify answer variations
 * Run this to see what variations will be accepted
 */
function testAnswerVariations() {
    console.log('=== Testing Answer Variations ===\n');
    // Test cases
    const testCases = [
        { text: 'lever (se)', desc: 'French reflexive verb with se' },
        { text: 'habiller (s\')', desc: 'French reflexive verb with s\'' },
        { text: 'Long', desc: 'Simple French word' },
        { text: 'طويل', desc: 'Arabic word without harakat' },
        { text: 'طَوِيل', desc: 'Arabic word with harakat' },
        { text: 'assoire (se)', desc: 'Another reflexive verb' }
    ];
    testCases.forEach(testCase => {
        console.log(`\n--- ${testCase.desc} ---`);
        console.log(`Original: "${testCase.text}"`);
        // Test for regular students
        console.log('\nRegular student variations:');
        const regularVars = generateAnswerVariations(testCase.text, false);
        regularVars.forEach((v, i) => console.log(`  ${i + 1}. "${v}"`));
        // Test for advanced students (if Arabic)
        if (isArabicText(testCase.text)) {
            console.log('\nAdvanced student variations:');
            const advancedVars = generateAnswerVariations(testCase.text, true);
            advancedVars.forEach((v, i) => console.log(`  ${i + 1}. "${v}"`));
        }
    });
    console.log('\n=== Test Complete ===');
}

function tmpTest() {
    const test = generateCaseVariations("asseoir (s’)");
    console.log(test);
}