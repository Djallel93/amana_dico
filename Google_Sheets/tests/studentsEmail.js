/**
 * Test email sending with a single student (for testing)
 */
function testEmailSending() {
    const students = getStudentsToTest();
    if (students.length === 0) {
        console.log('No students found for testing');
        return;
    }
    const testStudent = students[0];
    const testUrl = 'https://forms.google.com/test-form-url';
    const dateTime = getDateTimeString();
    console.log(`Testing email to: ${testStudent.mail}`);
    const result = sendQuizEmailToStudent(testStudent, testUrl, dateTime);
    console.log('Test result:', result);
    return result;
}