/**
 * Get current stored properties and check if template exists
 */
function debugProperties() {
    const props = PropertiesService.getScriptProperties();

    console.log('=== Current Properties ===');
    const templateId = props.getProperty('TEMPLATE_FORM_ID');
    const destination = props.getProperty('TEMPLATE_FORM_DESTINATION');

    console.log(`TEMPLATE_FORM_ID: ${templateId || 'NOT SET'}`);
    console.log(`TEMPLATE_FORM_DESTINATION: ${destination || 'NOT SET'}`);

    if (templateId) {
        try {
            const file = DriveApp.getFileById(templateId);
            console.log(`✅ Template file found: ${file.getName()}`);
            console.log(`   File ID: ${file.getId()}`);
        } catch (error) {
            console.log(`❌ Template file NOT FOUND or NOT ACCESSIBLE`);
            console.log(`   Error: ${error.message}`);
        }
    }
}

/**
 * Set up properties with a specific template form
 * Usage: Go to your template form, copy the ID from the URL, then call this function
 */
function setupTemplateProperties(templateFormId, destinationPath) {
    // Verify the form exists and is accessible
    try {
        const file = DriveApp.getFileById(templateFormId);
        console.log(`✅ Template found: ${file.getName()}`);
    } catch (error) {
        console.log(`❌ Cannot access template form: ${error.message}`);
        return false;
    }

    // Store properties
    const props = PropertiesService.getScriptProperties();
    props.setProperty('TEMPLATE_FORM_ID', templateFormId);
    props.setProperty('TEMPLATE_FORM_DESTINATION', destinationPath);

    console.log('✅ Properties saved successfully!');
    console.log(`   TEMPLATE_FORM_ID: ${templateFormId}`);
    console.log(`   TEMPLATE_FORM_DESTINATION: ${destinationPath}`);

    return true;
}

/**
 * Quick setup - paste your template form URL and run this
 * Example: https://forms.google.com/d/e/1FAIpQLSdxxxxx/viewform
 * Extract the form ID from the URL between /d/e/ and /viewform
 */
function quickSetup() {
    // ⬇️ PASTE YOUR TEMPLATE FORM ID HERE ⬇️
    const templateFormId = 'YOUR_TEMPLATE_FORM_ID_HERE';
    const destinationPath = 'dictionnaire/2025/forms';

    if (templateFormId === 'YOUR_TEMPLATE_FORM_ID_HERE') {
        console.log('❌ Please replace YOUR_TEMPLATE_FORM_ID_HERE with your actual template form ID');
        console.log('');
        console.log('How to find your template form ID:');
        console.log('1. Open your template Google Form');
        console.log('2. Look at the URL: https://forms.google.com/d/e/1FAIpQLSdXXXXXXXXXXXX/viewform');
        console.log('3. Copy the long ID after /d/e/ and before /viewform');
        console.log('4. Paste it into the templateFormId variable above');
        return;
    }

    setupTemplateProperties(templateFormId, destinationPath);
}

/**
 * Clear all properties (in case you need to start fresh)
 */
function clearAllProperties() {
    const props = PropertiesService.getScriptProperties();
    props.deleteProperty('TEMPLATE_FORM_ID');
    props.deleteProperty('TEMPLATE_FORM_DESTINATION');
    console.log('✅ All properties cleared');
}

/**
 * Test if we can duplicate the template
 */
function testTemplateAccess() {
    try {
        console.log('Testing template access...');
        const templateId = getTemplateFormId();
        const file = DriveApp.getFileById(templateId);
        const copy = file.makeCopy('[TEST] ' + file.getName());
        console.log(`✅ Successfully created test copy: ${copy.getName()}`);
        console.log(`   Copy ID: ${copy.getId()}`);
        console.log(`   You can delete this test file from Google Drive`);
    } catch (error) {
        console.log(`❌ Failed to create copy: ${error.message}`);
    }
}