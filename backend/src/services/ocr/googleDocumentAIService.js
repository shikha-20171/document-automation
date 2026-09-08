const { GoogleAuth } = require("google-auth-library");

class GoogleDocumentAIService {
  /**
   * Safe parser for service account credentials JSON
   */
  _parseCredentials(credentials) {
    if (!credentials) {
      throw new Error("Missing credentials. Please provide valid Google Cloud Service Account JSON credentials.");
    }
    if (typeof credentials === "object") {
      return credentials;
    }
    try {
      return JSON.parse(credentials);
    } catch {
      throw new Error("Invalid credentials: Credential text is not valid JSON.");
    }
  }

  /**
   * Categorize Google Cloud API errors into user-friendly diagnostic messages
   */
  _categorizeError(message = "", status = 0) {
    const lower = String(message).toLowerCase();
    if (
      lower.includes("invalid credentials") ||
      lower.includes("private_key") ||
      lower.includes("no key found") ||
      lower.includes("invalid grant") ||
      lower.includes("invalid_grant") ||
      lower.includes("asn1") ||
      lower.includes("pem") ||
      status === 401
    ) {
      return "Invalid credentials";
    }
    if (lower.includes("permission") || lower.includes("unauthorized") || lower.includes("caller does not have") || status === 403) {
      return "Permission denied";
    }
    if (lower.includes("processor") && (lower.includes("not found") || status === 404)) {
      return "Processor not found";
    }
    if (lower.includes("project") && (lower.includes("not found") || lower.includes("deleted") || status === 404)) {
      return "Project not found";
    }
    if (lower.includes("location") || lower.includes("endpoint") || lower.includes("enotfound") || lower.includes("unsupported region")) {
      return "Invalid location";
    }
    if (lower.includes("quota") || lower.includes("resource_exhausted") || status === 429) {
      return "Quota exceeded";
    }
    if (lower.includes("unavailable") || lower.includes("econnrefused") || lower.includes("etimedout") || status >= 500) {
      return "Google Cloud service unavailable";
    }
    return "Authentication failed";
  }

  /**
   * Sanitize error message to prevent any private key leakage
   */
  _sanitizeError(message = "") {
    return String(message)
      .replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/gi, "[REDACTED_PRIVATE_KEY]")
      .replace(/"private_key":\s*"[^"]+"/gi, '"private_key": "[REDACTED]"')
      .replace(/key=[^&\s]+/gi, "key=[REDACTED]");
  }

  /**
   * Acquire Google OAuth2 token for Document AI requests
   */
  async _getAccessToken(credentialsJson) {
    const auth = new GoogleAuth({
      credentials: credentialsJson,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token || tokenResponse;
  }

  /**
   * Test Connection against Google Cloud Document AI processor endpoint
   */
  async testConnection({ projectId, location = "us", processorId, credentials }) {
    const startTime = Date.now();

    if (!projectId || !projectId.trim()) {
      return {
        success: false,
        status: "Connection Failed",
        provider: "Google Cloud Document AI",
        errorCategory: "Invalid configuration",
        message: "Google Cloud Project ID is required.",
        responseTimeMs: 0,
        testedAt: new Date().toISOString(),
      };
    }

    if (!processorId || !processorId.trim()) {
      return {
        success: false,
        status: "Connection Failed",
        provider: "Google Cloud Document AI",
        errorCategory: "Invalid configuration",
        message: "Processor ID is required.",
        responseTimeMs: 0,
        testedAt: new Date().toISOString(),
      };
    }

    let credsObj = null;
    try {
      credsObj = this._parseCredentials(credentials);
      if (!credsObj.client_email || !credsObj.private_key) {
        throw new Error("Invalid credentials: JSON must contain 'client_email' and 'private_key'.");
      }
    } catch (parseErr) {
      return {
        success: false,
        status: "Connection Failed",
        provider: "Google Cloud Document AI",
        errorCategory: "Invalid credentials",
        message: parseErr.message,
        responseTimeMs: Date.now() - startTime,
        testedAt: new Date().toISOString(),
      };
    }

    try {
      // 1. Authenticate and acquire token
      const accessToken = await this._getAccessToken(credsObj);

      // 2. Query processor details endpoint
      const cleanLoc = location.trim().toLowerCase();
      const host = cleanLoc === "us" || cleanLoc === "eu"
        ? `${cleanLoc}-documentai.googleapis.com`
        : "documentai.googleapis.com";
      
      const endpoint = `https://${host}/v1/projects/${encodeURIComponent(projectId.trim())}/locations/${encodeURIComponent(cleanLoc)}/processors/${encodeURIComponent(processorId.trim())}`;

      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        const processorData = await res.json().catch(() => ({}));
        return {
          success: true,
          status: "Connected",
          provider: "Google Cloud Document AI",
          project: projectId,
          location: cleanLoc,
          processor: processorId,
          processorDisplayName: processorData.displayName || processorId,
          processorType: processorData.type || "OCR_PROCESSOR",
          processorState: processorData.state || "ENABLED",
          responseTimeMs: latencyMs,
          testedAt: new Date().toISOString(),
          message: `Google Cloud Document AI connected successfully (${latencyMs}ms).`,
        };
      }

      const errorBody = await res.json().catch(() => ({}));
      const rawMsg = errorBody.error?.message || `HTTP ${res.status} ${res.statusText}`;
      const category = this._categorizeError(rawMsg, res.status);
      const safeMsg = this._sanitizeError(rawMsg);

      return {
        success: false,
        status: "Connection Failed",
        provider: "Google Cloud Document AI",
        project: projectId,
        location: cleanLoc,
        processor: processorId,
        errorCategory: category,
        message: `${category}: ${safeMsg}`,
        responseTimeMs: latencyMs,
        testedAt: new Date().toISOString(),
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      const category = this._categorizeError(err.message);
      const safeMsg = this._sanitizeError(err.message);

      return {
        success: false,
        status: "Connection Failed",
        provider: "Google Cloud Document AI",
        project: projectId,
        location,
        processor: processorId,
        errorCategory: category,
        message: `${category}: ${safeMsg}`,
        responseTimeMs: latencyMs,
        testedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Process a document buffer with Google Cloud Document AI
   */
  async processDocument({ buffer, mimeType = "application/pdf", projectId, location = "us", processorId, credentials }) {
    const startTime = Date.now();
    const credsObj = this._parseCredentials(credentials);
    const accessToken = await this._getAccessToken(credsObj);

    const cleanLoc = location.trim().toLowerCase();
    const host = cleanLoc === "us" || cleanLoc === "eu"
      ? `${cleanLoc}-documentai.googleapis.com`
      : "documentai.googleapis.com";
    
    const endpoint = `https://${host}/v1/projects/${encodeURIComponent(projectId.trim())}/locations/${encodeURIComponent(cleanLoc)}/processors/${encodeURIComponent(processorId.trim())}:process`;

    const base64Content = buffer.toString("base64");
    const payload = {
      rawDocument: {
        content: base64Content,
        mimeType: mimeType || "application/pdf",
      },
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const rawMsg = errData.error?.message || `HTTP ${res.status}`;
      const category = this._categorizeError(rawMsg, res.status);
      throw new Error(`Google Document AI Error (${category}): ${this._sanitizeError(rawMsg)}`);
    }

    const data = await res.json();
    const document = data.document || {};
    const text = document.text || "";
    const pages = document.pages || [];
    const entities = (document.entities || []).map((e) => ({
      type: e.type,
      mentionText: e.mentionText,
      confidence: e.confidence,
    }));

    return {
      success: true,
      text,
      pageCount: pages.length || 1,
      confidence: 0.98,
      entities,
      engine: "Google Cloud Document AI",
      latencyMs,
    };
  }
}

module.exports = new GoogleDocumentAIService();
