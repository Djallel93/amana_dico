/**
 * Utility functions for testing
 */
function testOAuth2() {
    try {
        const token = getOAuth2AccessToken();
        console.log('✅ OAuth2 is working, token obtained');
        return true;
    } catch (error) {
        console.error('❌ OAuth2 test failed:', error.message);
        return false;
    }
}
function resetOAuth2() {
    clearStoredTokens();
    console.log('🔄 OAuth2 tokens cleared. Run startOAuth2Flow() to re-authorize.');
}