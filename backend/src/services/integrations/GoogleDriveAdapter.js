const axios = require("axios");

/**
 * Real Google Drive API Adapter
 * Uses official Google OAuth2 and REST APIs (Drive v3)
 */
class GoogleDriveAdapter {
  constructor(config = {}) {
    this.clientId = config.clientId || process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.GOOGLE_CLIENT_SECRET;
    this.redirectUri = config.redirectUri || process.env.GOOGLE_REDIRECT_URI || "http://localhost:5001/api/integrations/google_drive/callback";
    this.scopes = [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];
  }

  /**
   * Check if credentials are configured in environment
   */
  isConfigured() {
    return Boolean(this.clientId && this.clientSecret);
  }

  /**
   * Generate Google OAuth 2.0 Consent URL
   */
  getAuthUrl(state = "") {
    if (!this.isConfigured()) {
      throw new Error("Google Drive integration is not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: this.scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for Access & Refresh tokens
   */
  async exchangeCode(code) {
    if (!this.isConfigured()) {
      throw new Error("Google Drive credentials not configured.");
    }

    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: "authorization_code",
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );

    const data = response.data;
    const accountInfo = await this.getAccountInfo(data.access_token);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresIn: data.expires_in,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      tokenType: data.token_type,
      scope: data.scope,
      accountEmail: accountInfo?.email || "Google Drive User",
      accountName: accountInfo?.name || "Google Workspace",
      accountPicture: accountInfo?.picture || null,
    };
  }

  /**
   * Refresh expired access token
   */
  async refreshToken(refreshToken) {
    if (!this.isConfigured() || !refreshToken) {
      throw new Error("Cannot refresh Google Drive token: credentials or refresh token missing.");
    }

    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
      expiresAt: new Date(Date.now() + (response.data.expires_in || 3600) * 1000),
    };
  }

  /**
   * Fetch authenticated user's profile info
   */
  async getAccountInfo(accessToken) {
    try {
      const response = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 8000,
      });
      return response.data;
    } catch (err) {
      return null;
    }
  }

  /**
   * Test Connection: Ping Google Drive API
   */
  async testConnection(accessToken) {
    const startTime = Date.now();
    try {
      const response = await axios.get("https://www.googleapis.com/drive/v3/about?fields=user,storageQuota", {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10000,
      });

      const user = response.data?.user || {};
      const storageQuota = response.data?.storageQuota || {};

      return {
        success: true,
        status: "CONNECTED",
        latencyMs: Date.now() - startTime,
        accountName: user.displayName || "Google Drive Connected",
        accountEmail: user.emailAddress || "Google User",
        permissionRole: user.permissionId || "Authorized",
        storageUsage: storageQuota.usage ? `${Math.round(storageQuota.usage / (1024 * 1024))} MB` : "Available",
      };
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.message;
      return {
        success: false,
        status: "CONNECTION_FAILED",
        latencyMs: Date.now() - startTime,
        error: errorMsg,
      };
    }
  }

  /**
   * List Files / Folders
   */
  async listFiles(accessToken, { folderId = "root", pageSize = 20, query = "" } = {}) {
    let q = `trashed = false`;
    if (folderId && folderId !== "all") {
      q += ` and '${folderId}' in parents`;
    }
    if (query) {
      q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
    }

    const response = await axios.get("https://www.googleapis.com/drive/v3/files", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        q,
        pageSize: Math.min(pageSize, 50),
        fields: "nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink)",
      },
      timeout: 10000,
    });

    return {
      files: (response.data.files || []).map((f) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        isFolder: f.mimeType === "application/vnd.google-apps.folder",
        size: f.size ? `${(f.size / 1024).toFixed(1)} KB` : "-",
        modifiedTime: f.modifiedTime,
        webViewLink: f.webViewLink,
        iconLink: f.iconLink,
      })),
      nextPageToken: response.data.nextPageToken || null,
    };
  }

  /**
   * Create a new folder
   */
  async createFolder(accessToken, { name, parentFolderId = "root" }) {
    if (!name) throw new Error("Folder name is required.");

    const response = await axios.post(
      "https://www.googleapis.com/drive/v3/files",
      {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: parentFolderId && parentFolderId !== "root" ? [parentFolderId] : undefined,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    return {
      id: response.data.id,
      name: response.data.name,
      mimeType: response.data.mimeType,
    };
  }

  /**
   * Upload Document / File buffer
   */
  async uploadDocument(accessToken, { fileName, buffer, mimeType = "application/pdf", parentFolderId = "root" }) {
    if (!fileName || !buffer) throw new Error("Filename and file buffer are required for Google Drive upload.");

    const boundary = "-------DocuCoreUploadBoundary" + Math.random().toString(36).substring(2);
    const metadata = {
      name: fileName,
      mimeType,
      parents: parentFolderId && parentFolderId !== "root" ? [parentFolderId] : undefined,
    };

    const fileBuf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer, "utf8");

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
      ),
      fileBuf,
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const response = await axios.post(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink",
      multipartRequestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        timeout: 20000,
      }
    );

    return {
      fileId: response.data.id,
      fileName: response.data.name,
      mimeType: response.data.mimeType,
      size: response.data.size,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Get File metadata
   */
  async getFile(accessToken, fileId) {
    const response = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,webViewLink,createdTime,modifiedTime`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10000,
      }
    );
    return response.data;
  }

  /**
   * Download File buffer from Google Drive for IDP/OCR Ingestion
   */
  async downloadFile(accessToken, fileId) {
    const response = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: "arraybuffer",
        timeout: 30000,
      }
    );
    return Buffer.from(response.data);
  }
}

module.exports = GoogleDriveAdapter;
