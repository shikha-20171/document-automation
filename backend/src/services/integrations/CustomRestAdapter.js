const axios = require("axios");

/**
 * Real Custom REST API Connector Adapter
 * Executes outbound HTTP requests with Authentication, Header & Body templating
 */
class CustomRestAdapter {
  /**
   * Replace template variables like {{document.id}}, {{document.name}}, {{organisation.name}}
   */
  static interpolateVariables(data, variables = {}) {
    if (!data) return data;
    if (typeof data === "string") {
      return data.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, key) => {
        const parts = key.split(".");
        let val = variables;
        for (const p of parts) {
          if (val && typeof val === "object" && p in val) {
            val = val[p];
          } else {
            return match; // Keep placeholder if key not found
          }
        }
        return val !== undefined && val !== null ? String(val) : match;
      });
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.interpolateVariables(item, variables));
    }

    if (typeof data === "object") {
      const result = {};
      for (const [k, v] of Object.entries(data)) {
        result[k] = this.interpolateVariables(v, variables);
      }
      return result;
    }

    return data;
  }

  /**
   * Execute real HTTP request
   */
  static async executeRequest({
    baseUrl = "",
    url = "",
    method = "POST",
    headers = {},
    authType = "NONE",
    authConfig = {},
    body = null,
    params = {},
    variables = {},
    timeoutMs = 10000,
  }) {
    const startTime = Date.now();

    // Construct full URL
    let targetUrl = url;
    if (baseUrl) {
      targetUrl = baseUrl.endsWith("/") || url.startsWith("/")
        ? `${baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
        : `${baseUrl}/${url}`;
    }

    targetUrl = this.interpolateVariables(targetUrl, variables);

    // Prepare Headers
    const reqHeaders = {
      "User-Agent": "DocuCore-Enterprise-Integration-Engine/1.0",
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    };

    // Apply Authentication
    if (authType === "API_KEY") {
      const headerName = authConfig.headerName || "X-API-Key";
      const keyValue = authConfig.apiKey || authConfig.token || "";
      if (keyValue) reqHeaders[headerName] = keyValue;
    } else if (authType === "BEARER_TOKEN") {
      const token = authConfig.bearerToken || authConfig.token || "";
      if (token) reqHeaders["Authorization"] = `Bearer ${token}`;
    } else if (authType === "BASIC_AUTH") {
      const username = authConfig.username || "";
      const password = authConfig.password || "";
      const basicCredentials = Buffer.from(`${username}:${password}`).toString("base64");
      reqHeaders["Authorization"] = `Basic ${basicCredentials}`;
    }

    // Interpolate headers and body
    const finalHeaders = this.interpolateVariables(reqHeaders, variables);
    const finalBody = body ? this.interpolateVariables(body, variables) : undefined;
    const finalParams = this.interpolateVariables(params, variables);

    try {
      const response = await axios({
        url: targetUrl,
        method: method.toUpperCase(),
        headers: finalHeaders,
        data: finalBody,
        params: finalParams,
        timeout: timeoutMs,
        validateStatus: () => true, // Don't throw for 4xx/5xx so we can capture status code
      });

      const latencyMs = Date.now() - startTime;
      const isSuccess = response.status >= 200 && response.status < 300;

      return {
        success: isSuccess,
        status: isSuccess ? "SUCCESS" : "FAILED",
        httpStatus: response.status,
        latencyMs,
        data: response.data,
        headers: {
          "content-type": response.headers["content-type"],
          date: response.headers["date"],
        },
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        status: "FAILED",
        httpStatus: err.response?.status || 0,
        latencyMs,
        error: err.message,
        data: err.response?.data || null,
      };
    }
  }
}

module.exports = CustomRestAdapter;
