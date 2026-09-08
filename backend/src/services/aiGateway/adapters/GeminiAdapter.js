const AIProviderAdapter = require("./AIProviderAdapter");

const GEMINI_MODELS_POOL = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
];

class GeminiAdapter extends AIProviderAdapter {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || "https://generativelanguage.googleapis.com/v1beta";
    this.defaultModel = config.defaultModel || process.env.GEMINI_MODEL || "gemini-3.6-flash";
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
  }

  _normalizeModel(modelName) {
    if (!modelName) return "gemini-3.6-flash";
    const clean = modelName.replace(/^models\//, "").trim();
    if (clean === "default" || clean === "gemini-2.5-flash" || clean === "gemini-flash-lite-latest") {
      return "gemini-3.6-flash";
    }
    return clean;
  }

  _cleanBase64(data) {
    if (!data) return "";
    return data.replace(/^data:[^;]+;base64,/, "").trim();
  }

  _detectMimeType(data, fallback = "image/jpeg") {
    if (typeof data === "string" && data.startsWith("data:")) {
      const match = data.match(/^data:([^;]+);base64,/);
      if (match) return match[1];
    }
    return fallback;
  }

  async _fetchSingle(url, options = {}, timeoutMs = 35000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  _categorizeError(message = "", status = 0) {
    const lower = String(message).toLowerCase();
    if (
      lower.includes("api key not valid") ||
      lower.includes("api_key_invalid") ||
      lower.includes("invalid api key") ||
      lower.includes("unregistered callers") ||
      status === 401
    ) {
      return "Invalid API key";
    }
    if (lower.includes("permission") || lower.includes("unauthorized") || status === 403) {
      return "Authentication failed";
    }
    if (lower.includes("not found") || lower.includes("unsupported") || lower.includes("is not found for api version") || status === 404) {
      return "Model unavailable";
    }
    if (lower.includes("quota") || lower.includes("resource_exhausted") || lower.includes("rate limit") || status === 429) {
      return "Rate limit exceeded";
    }
    if (lower.includes("econnrefused") || lower.includes("etimedout") || lower.includes("enotfound") || lower.includes("unavailable") || status >= 500) {
      return "Provider unavailable";
    }
    if (lower.includes("invalid") || lower.includes("bad request") || status === 400) {
      return "Invalid configuration";
    }
    return "Provider unavailable";
  }

  async testConnection(params = {}) {
    const start = Date.now();
    const model = this._normalizeModel(params.model || this.defaultModel || "gemini-3.6-flash");

    if (!this.apiKey) {
      return {
        success: false,
        status: "failed",
        provider: "Google Gemini",
        modelTested: model,
        responseTimeMs: 0,
        testedAt: new Date().toISOString(),
        errorCategory: "Invalid API key",
        message: "Missing API Key. Please configure a valid API key.",
      };
    }

    const pingBody = {
      contents: [{ parts: [{ text: "ping" }] }],
      generationConfig: { maxOutputTokens: 5 },
    };

    try {
      const cleanBase = (this.baseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
      const res = await this._fetchSingle(
        `${cleanBase}/models/${model}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
        {
          method: "POST",
          body: JSON.stringify(pingBody),
        },
        12000
      );

      const latencyMs = Date.now() - start;

      if (res.ok) {
        return {
          success: true,
          status: "connected",
          provider: "Google Gemini",
          modelTested: model,
          responseTimeMs: latencyMs,
          testedAt: new Date().toISOString(),
          message: "Connection successful",
        };
      }

      const errData = await res.json().catch(() => ({}));
      const rawMsg = errData.error?.message || `HTTP ${res.status}`;
      const safeCategory = this._categorizeError(rawMsg, res.status);

      return {
        success: false,
        status: "failed",
        provider: "Google Gemini",
        modelTested: model,
        responseTimeMs: latencyMs,
        testedAt: new Date().toISOString(),
        errorCategory: safeCategory,
        message: `${safeCategory}: ${rawMsg.replace(/key=[^&\s]+/gi, "key=REDACTED")}`,
      };
    } catch (err) {
      const latencyMs = Date.now() - start;
      const safeCategory = this._categorizeError(err.message);
      return {
        success: false,
        status: "failed",
        provider: "Google Gemini",
        modelTested: model,
        responseTimeMs: latencyMs,
        testedAt: new Date().toISOString(),
        errorCategory: safeCategory,
        message: `${safeCategory}: ${err.message.replace(/key=[^&\s]+/gi, "key=REDACTED")}`,
      };
    }
  }

  async fetchAvailableModels() {
    if (!this.apiKey) {
      throw new Error("Missing API Key. Please configure an API key first.");
    }
    const cleanBase = (this.baseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
    const res = await this._fetchSingle(`${cleanBase}/models?key=${encodeURIComponent(this.apiKey)}`, { method: "GET" }, 15000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const rawMsg = err.error?.message || `HTTP ${res.status}`;
      throw new Error(this._categorizeError(rawMsg, res.status) + ": " + rawMsg);
    }
    const data = await res.json();
    const models = (data.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => {
        const code = m.name.replace(/^models\//, "");
        return {
          modelCode: code,
          modelName: m.displayName || code,
          description: m.description || null,
          contextWindow: m.inputTokenLimit || 1048576,
          maxOutputTokens: m.outputTokenLimit || 8192,
          supportsVision: true,
          status: "ACTIVE",
        };
      });
    return models;
  }

  async generateText({ prompt, systemPrompt, imageBase64, mimeType, model, temperature = 0.3, maxTokens = 4096 }) {
    const primaryModel = this._normalizeModel(model || this.defaultModel);
    const candidateList = [primaryModel, ...GEMINI_MODELS_POOL.filter((m) => m !== primaryModel)];

    const contents = [];
    if (systemPrompt) {
      contents.push({
        role: "user",
        parts: [{ text: `System Instruction:\n${systemPrompt}\n\nUser Request Follows Below:` }],
      });
      contents.push({
        role: "model",
        parts: [{ text: "Understood. I will fulfill the request strictly according to your specifications." }],
      });
    }

    const safePrompt = (typeof prompt === "string" && prompt.trim()) ? prompt : "Process request.";
    const userParts = [{ text: safePrompt }];

    if (imageBase64) {
      const cleanData = this._cleanBase64(imageBase64);
      const detectedType = this._detectMimeType(imageBase64, mimeType || "image/jpeg");
      if (cleanData) {
        userParts.push({
          inlineData: {
            mimeType: detectedType,
            data: cleanData,
          },
        });
      }
    }

    contents.push({
      role: "user",
      parts: userParts,
    });

    const body = {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    let lastError = null;

    for (const targetModel of candidateList) {
      try {
        const res = await this._fetchSingle(
          `${this.baseUrl}/models/${targetModel}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
          {
            method: "POST",
            body: JSON.stringify(body),
          },
          35000
        );

        if (res.ok) {
          const data = await res.json();
          const candidate = data.candidates?.[0];
          const text = candidate?.content?.parts?.map((p) => p.text).filter(Boolean).join("\n") || "";
          const usage = data.usageMetadata || {};

          const inTokens = usage.promptTokenCount || Math.ceil((prompt.length + (systemPrompt || "").length) / 4);
          const outTokens = usage.candidatesTokenCount || Math.ceil(text.length / 4);

          return {
            text,
            model: targetModel,
            inputTokens: inTokens,
            outputTokens: outTokens,
            totalTokens: usage.totalTokenCount || inTokens + outTokens,
            finishReason: candidate?.finishReason || "STOP",
          };
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = errData.error?.message || `HTTP ${res.status}`;
          console.warn(`[GeminiAdapter] Model ${targetModel} returned ${res.status} (${lastError}). Failing over to next model...`);
        }
      } catch (err) {
        lastError = err.message;
        console.warn(`[GeminiAdapter] Model ${targetModel} error: ${err.message}. Failing over...`);
      }
    }

    throw new Error(`Google Gemini Error: ${lastError || "All models failed"}`);
  }

  async generateStructuredOutput({ prompt, systemPrompt, imageBase64, mimeType, schema, model, temperature = 0.2 }) {
    const primaryModel = this._normalizeModel(model || this.defaultModel);
    const candidateList = [primaryModel, ...GEMINI_MODELS_POOL.filter((m) => m !== primaryModel)];

    const fullPrompt = `${systemPrompt || "You are an enterprise AI structured data parser."}
IMPORTANT: Output strictly valid, well-formed JSON only. Do not add markdown code formatting (\`\`\`json).

${prompt}`;

    const safeFullPrompt = (typeof fullPrompt === "string" && fullPrompt.trim()) ? fullPrompt : "Return JSON response.";
    const userParts = [{ text: safeFullPrompt }];

    if (imageBase64) {
      const cleanData = this._cleanBase64(imageBase64);
      const detectedType = this._detectMimeType(imageBase64, mimeType || "image/jpeg");
      if (cleanData) {
        userParts.push({
          inlineData: {
            mimeType: detectedType,
            data: cleanData,
          },
        });
      }
    }

    const body = {
      contents: [{ role: "user", parts: userParts }],
      generationConfig: {
        temperature,
        responseMimeType: "application/json",
      },
    };

    let lastError = null;

    for (const targetModel of candidateList) {
      try {
        const res = await this._fetchSingle(
          `${this.baseUrl}/models/${targetModel}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
          {
            method: "POST",
            body: JSON.stringify(body),
          },
          35000
        );

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join("\n") || "{}";
          const usage = data.usageMetadata || {};

          let parsedData = {};
          try {
            parsedData = JSON.parse(rawText);
          } catch {
            const jsonMatch = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (jsonMatch) {
              try {
                parsedData = JSON.parse(jsonMatch[0]);
              } catch {
                parsedData = { raw: rawText };
              }
            } else {
              parsedData = { raw: rawText };
            }
          }

          const inTokens = usage.promptTokenCount || 120;
          const outTokens = usage.candidatesTokenCount || 100;

          return {
            data: parsedData,
            rawText,
            model: targetModel,
            inputTokens: inTokens,
            outputTokens: outTokens,
            totalTokens: usage.totalTokenCount || inTokens + outTokens,
          };
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = errData.error?.message || `HTTP ${res.status}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    throw new Error(`Google Gemini Error: ${lastError || "All models failed"}`);
  }

  async summarize({ text, options = {}, model }) {
    const length = options.length || "Medium";
    const prompt = `Provide an accurate executive summary of the following document:\nTarget Length: ${length}\nHighlight key points: ${options.includeKeyPoints !== false}\nAction items: ${options.includeActionItems !== false}\n\nDocument:\n${text}`;
    const systemPrompt = "You are a senior enterprise intelligence analyst.";
    return this.generateText({ prompt, systemPrompt, model });
  }

  async classify({ text, categories = [], model }) {
    const prompt = `Classify the document into one of the categories: ${JSON.stringify(categories)}.\nReturn JSON: {"documentType": "...", "category": "...", "confidence": 0.95, "keywords": ["..."]}\n\nDocument Content:\n${text}`;
    return this.generateStructuredOutput({ prompt, model });
  }

  async extract({ text, fields = [], model }) {
    const prompt = `Extract all relevant entity fields ${fields.length > 0 ? `(${JSON.stringify(fields)})` : ""} from this document.\nReturn a clean JSON key-value object.\n\nDocument Text:\n${text}`;
    return this.generateStructuredOutput({ prompt, model });
  }
}

module.exports = GeminiAdapter;
