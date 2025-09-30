// =====================
// Obtenir un access token valide
// =====================
function getOAuth2AccessToken() {
    const service = getOAuthService();
    if (!service.hasAccess()) {
        throw new Error("⚠️ Pas encore autorisé. Lance 'getAuthorizationUrl()' une fois pour autoriser.");
    }
    return service.getAccessToken();
}

// =====================
// (Optionnel) Forcer le refresh token
// =====================
function refreshAccessToken() {
    const service = getOAuthService();
    if (!service.hasAccess()) {
        throw new Error("⚠️ Pas encore autorisé. Lance 'getAuthorizationUrl()' une fois pour autoriser.");
    }
    // Trick : getAccessToken() va automatiquement rafraîchir si expiré
    const token = service.getAccessToken();
    Logger.log("🔄 Nouveau token : " + token);
    return token;
}

function clearStoredTokens() {
    const properties = PropertiesService.getScriptProperties();
    properties.deleteProperty('access_token');
    properties.deleteProperty('refresh_token');
    properties.deleteProperty('token_expiry');
    properties.deleteProperty('oauth_state');
}