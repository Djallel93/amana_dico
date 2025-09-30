
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