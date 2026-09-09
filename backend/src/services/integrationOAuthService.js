const crypto = require("crypto");
const prisma = require("../config/prismaClient");
const {
  encrypt,
  decrypt,
  generateStateToken,
  hashString,
} = require("./integrationEncryptionService");
const IntegrationProviderService = require("./integrationProviderService");

class IntegrationOAuthService {
  /**
   * Generates authorization URL and persists state record with 15-minute TTL
   */
  static async initiateOAuth({ organisationId, providerKeyOrId, redirectUriOverride }) {
    if (!organisationId) {
      throw new Error("Organisation ID is required for OAuth initiation.");
    }

    const providerData = await IntegrationProviderService.getDecryptedCredentials(providerKeyOrId);
    if (!providerData || !providerData.credentials) {
      throw new Error(`Integration provider '${providerKeyOrId}' is not configured by Super Admin.`);
    }

    const { provider, credentialId, credentials } = providerData;

    // Strict Subscription Entitlement Check
    const EntitlementService = require("./entitlementService");
    const PROVIDER_FEATURE_MAP = {
      google_workspace: "integrations.google",
      microsoft_365: "integrations.microsoft",
      microsoft_teams: "integrations.teams",
      slack: "integrations.slack",
      whatsapp_business: "integrations.whatsapp",
      brevo: "integrations.smtp",
    };
    const featureFlag = PROVIDER_FEATURE_MAP[provider.providerKey];
    if (featureFlag) {
      const allowed = await EntitlementService.checkFeatureAccess(Number(organisationId), featureFlag);
      if (!allowed) {
        throw new Error(`The '${provider.providerName}' integration is not included in your organisation's current subscription plan. Please contact your administrator to upgrade.`);
      }
    }

    const clientId = credentials.clientId;
    if (!clientId) {
      throw new Error(`Client ID missing in platform credentials for '${provider.providerName}'.`);
    }

    // Determine redirect URI
    let redirectUri =
      redirectUriOverride ||
      credentials.redirectUri ||
      `http://localhost:5001/api/integrations/${provider.providerKey.replace(/_/g, "-")}/callback`;

    // Generate secure state token and hash
    const stateToken = generateStateToken();
    const stateHash = hashString(stateToken);

    // Optional PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    const codeVerifierEncrypted = encrypt(codeVerifier);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

    await prisma.oAuthState.create({
      data: {
        organisationId: Number(organisationId),
        providerId: provider.id,
        stateHash,
        codeVerifierEncrypted,
        redirectUri,
        expiresAt,
      },
    });

    // Construct Authorization URL based on provider
    let authUrl = "";
    const scopes = Array.isArray(provider.requiredScopes)
      ? provider.requiredScopes.join(" ")
      : "";

    switch (provider.providerKey) {
      case "google_workspace": {
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: scopes || "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email",
          access_type: "offline",
          prompt: "consent",
          state: stateToken,
        });
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        break;
      }
      case "microsoft_365":
      case "microsoft_teams": {
        const tenant = credentials.tenantId || "common";
        const params = new URLSearchParams({
          client_id: clientId,
          response_type: "code",
          redirect_uri: redirectUri,
          response_mode: "query",
          scope: scopes || "Files.ReadWrite.All User.Read offline_access",
          state: stateToken,
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
        });
        authUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
        break;
      }
      case "slack": {
        const params = new URLSearchParams({
          client_id: clientId,
          scope: scopes || "chat:write,channels:read,incoming-webhook,users:read",
          redirect_uri: redirectUri,
          state: stateToken,
        });
        authUrl = `https://slack.com/oauth/v2/authorize?${params.toString()}`;
        break;
      }
      default:
        throw new Error(`OAuth 2.0 is not supported for provider '${provider.providerKey}'.`);
    }

    return {
      authUrl,
      stateToken,
      expiresAt,
      providerKey: provider.providerKey,
      providerName: provider.providerName,
    };
  }

  /**
   * Validates OAuth callback, exchanges authorization code, encrypts tokens,
   * and links OrganisationIntegration
   */
  static async handleCallback({ stateToken, code, error: oauthError, organisationIdFromUser, userId }) {
    if (oauthError) {
      throw new Error(`OAuth provider returned error: ${oauthError}`);
    }

    if (!stateToken || !code) {
      throw new Error("Missing required state or code parameter from OAuth callback.");
    }

    const stateHash = hashString(stateToken);
    const stateRecord = await prisma.oAuthState.findUnique({
      where: { stateHash },
      include: { provider: true },
    });

    if (!stateRecord) {
      throw new Error("Invalid or expired OAuth state parameter (CSRF protection failed).");
    }

    if (stateRecord.consumedAt) {
      throw new Error("OAuth state has already been consumed.");
    }

    if (new Date() > new Date(stateRecord.expiresAt)) {
      throw new Error("OAuth authorization session has expired. Please initiate connection again.");
    }

    // Multi-tenant check: ensure token belongs to requesting user's organisation if authenticated
    const targetOrgId = stateRecord.organisationId;
    if (organisationIdFromUser && Number(organisationIdFromUser) !== targetOrgId) {
      throw new Error("Unauthorized tenant access: state does not belong to your organisation.");
    }

    // Mark state as consumed immediately
    await prisma.oAuthState.update({
      where: { id: stateRecord.id },
      data: { consumedAt: new Date() },
    });

    const provider = stateRecord.provider;
    const providerData = await IntegrationProviderService.getDecryptedCredentials(provider.id);
    if (!providerData || !providerData.credentials) {
      throw new Error(`Provider '${provider.providerName}' is missing platform credentials.`);
    }

    const { credentials } = providerData;
    const clientId = credentials.clientId;
    const clientSecret = credentials.clientSecret;
    const redirectUri = stateRecord.redirectUri;
    const codeVerifier = stateRecord.codeVerifierEncrypted
      ? decrypt(stateRecord.codeVerifierEncrypted)
      : null;

    // Exchange code for tokens (Provider-specific token exchange)
    let tokenData = null;
    let accountIdentifier = null;
    let accountEmail = null;
    let externalAccountId = null;

    try {
      if (provider.providerKey === "google_workspace") {
        const body = new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        });

        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });
        tokenData = await res.json();
        if (!res.ok || tokenData.error) {
          throw new Error(tokenData.error_description || tokenData.error || "Token exchange failed");
        }

        // Fetch user profile from Google to get account info
        try {
          const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const profile = await profileRes.json();
          accountEmail = profile.email;
          accountIdentifier = profile.name || profile.email;
          externalAccountId = profile.id;
        } catch (e) {
          accountIdentifier = "Google Workspace User";
        }
      } else if (provider.providerKey === "microsoft_365" || provider.providerKey === "microsoft_teams") {
        const tenant = credentials.tenantId || "common";
        const body = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
        });

        const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });
        tokenData = await res.json();
        if (!res.ok || tokenData.error) {
          throw new Error(tokenData.error_description || tokenData.error || "Microsoft token exchange failed");
        }

        // Fetch Microsoft Graph user info
        try {
          const graphRes = await fetch("https://graph.microsoft.com/v1.0/me", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const me = await graphRes.json();
          accountEmail = me.mail || me.userPrincipalName;
          accountIdentifier = me.displayName || accountEmail;
          externalAccountId = me.id;
        } catch (e) {
          accountIdentifier = "Microsoft 365 User";
        }
      } else if (provider.providerKey === "slack") {
        const body = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        });

        const res = await fetch("https://slack.com/api/oauth.v2.access", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });
        tokenData = await res.json();
        if (!tokenData.ok) {
          throw new Error(tokenData.error || "Slack OAuth exchange failed");
        }

        accountIdentifier = tokenData.team?.name || "Slack Workspace";
        accountEmail = tokenData.authed_user?.id ? `slack:${tokenData.authed_user.id}` : null;
        externalAccountId = tokenData.team?.id;
      } else {
        throw new Error(`Unsupported OAuth provider: ${provider.providerKey}`);
      }
    } catch (exchangeError) {
      // Record failure log
      await prisma.integrationLog.create({
        data: {
          organisationId: targetOrgId,
          providerId: provider.id,
          provider: provider.providerKey.toUpperCase(),
          action: "OAUTH_CALLBACK",
          status: "FAILED",
          errorMessage: exchangeError.message,
        },
      });
      throw exchangeError;
    }

    // Encrypt access & refresh tokens with AES-256-GCM
    const accessTokenEncrypted = tokenData.access_token ? encrypt(tokenData.access_token) : null;
    const refreshTokenEncrypted = tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null;
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    // Scopes from token response or provider defaults
    const scopes = tokenData.scope ? tokenData.scope.split(/[\s,]+/) : provider.requiredScopes;

    // Upsert tenant's OrganisationIntegration record
    const existingIntegration = await prisma.organisationIntegration.findFirst({
      where: {
        organisationId: targetOrgId,
        OR: [{ providerId: provider.id }, { providerKey: provider.providerKey }],
      },
    });

    let savedRecord = null;
    if (existingIntegration) {
      savedRecord = await prisma.organisationIntegration.update({
        where: { id: existingIntegration.id },
        data: {
          providerId: provider.id,
          providerKey: provider.providerKey,
          credentialId: providerData.credentialId,
          status: "CONNECTED",
          connectionStatus: "CONNECTED",
          accountName: accountIdentifier,
          accountEmail,
          accountIdentifier,
          externalAccountId,
          accessTokenEncrypted,
          refreshTokenEncrypted: refreshTokenEncrypted || existingIntegration.refreshTokenEncrypted,
          expiresAt,
          tokenExpiresAt: expiresAt,
          scopes,
          metadata: {
            ...existingIntegration.metadata,
            team: tokenData.team || undefined,
            connectedAt: new Date().toISOString(),
          },
          connectedById: userId ? Number(userId) : existingIntegration.connectedById,
          connectedAt: new Date(),
          lastUsedAt: new Date(),
          lastError: null,
        },
      });
    } else {
      savedRecord = await prisma.organisationIntegration.create({
        data: {
          organisationId: targetOrgId,
          providerId: provider.id,
          providerKey: provider.providerKey,
          credentialId: providerData.credentialId,
          status: "CONNECTED",
          connectionStatus: "CONNECTED",
          accountName: accountIdentifier,
          accountEmail,
          accountIdentifier,
          externalAccountId,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          expiresAt,
          tokenExpiresAt: expiresAt,
          scopes,
          metadata: {
            team: tokenData.team || undefined,
            connectedAt: new Date().toISOString(),
          },
          connectedById: userId ? Number(userId) : null,
          connectedAt: new Date(),
          lastUsedAt: new Date(),
        },
      });
    }

    // Create successful audit log
    await prisma.integrationLog.create({
      data: {
        organisationId: targetOrgId,
        providerId: provider.id,
        integrationId: savedRecord.id,
        provider: provider.providerKey.toUpperCase(),
        action: "OAUTH_CALLBACK",
        status: "SUCCESS",
        externalId: externalAccountId,
      },
    });

    return {
      success: true,
      integrationId: savedRecord.id,
      organisationId: targetOrgId,
      providerKey: provider.providerKey,
      providerName: provider.providerName,
      accountIdentifier,
      accountEmail,
      status: "CONNECTED",
    };
  }
}

module.exports = IntegrationOAuthService;
