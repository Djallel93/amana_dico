
// =====================
// OAuth2 Service
// =====================
function getOAuthService() {
    return OAuth2.createService('GoogleForms')
        .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/v2/auth')
        .setTokenUrl('https://oauth2.googleapis.com/token')
        .setClientId(PropertiesService.getScriptProperties().getProperty("CLIENT_ID"))
        .setClientSecret(PropertiesService.getScriptProperties().getProperty("CLIENT_SECRET"))
        .setCallbackFunction('authCallback')
        .setPropertyStore(PropertiesService.getUserProperties())
        .setScope(CONFIG.OAUTH_CONFIG.SCOPES)
        .setParam('access_type', 'offline') // => pour avoir un refresh_token
        .setParam('prompt', 'consent');     // => force le refresh_token au 1er login
}

// =====================
// Étape 1 : Obtenir l’URL d’auth
// =====================
function getAuthorizationUrl() {
    const service = getOAuthService();
    Logger.log('Open this URL to authorize: %s', service.getAuthorizationUrl());
}

// =====================
// Étape 2 : Callback appelé par Google
// =====================
function authCallback(request) {
    const service = getOAuthService();
    const authorized = service.handleCallback(request);
    if (authorized) {
        return HtmlService.createHtmlOutput('✅ Authorization successful! You can close this window.');
    } else {
        return HtmlService.createHtmlOutput('❌ Authorization denied.');
    }
}
