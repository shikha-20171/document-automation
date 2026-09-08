const AIProviderAdapter = require("./AIProviderAdapter");

class OpenAIAdapter extends AIProviderAdapter {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
    this.defaultModel = config.defaultModel || "gpt-4o-mini";
  }

  async _fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          ...(options.headers || {}),
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error(`OpenAI request timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }

  _categorizeError(message = "", status = 0) {
    const lower = String(message).toLowerCase();
    if (
      lower.includes("invalid api key") ||
      lower.includes("incorrect api key") ||
      lower.includes("invalid_api_key") ||
      lower.includes("invalid authentication") ||
      status === 401
    ) {
      return "Invalid API key";
    }
    if (lower.includes("permission") || lower.includes("unauthorized") || lower.includes("organization") || status === 403) {
      return "Authentication failed";
    }
    if (lower.includes("model") && (lower.includes("not found") || lower.includes("does not exist") || lower.includes("no access") || status === 404)) {
      return "Model unavailable";
    }
    if (lower.includes("quota") || lower.includes("insufficient_quota") || lower.includes("rate limit") || status === 429) {
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
    const model = params.model || this.defaultModel || "gpt-4o-mini";

    if (!this.apiKey) {
      return {
        success: false,
        status: "failed",
        provider: "OpenAI",
        modelTested: model,
        responseTimeMs: 0,
        testedAt: new Date().toISOString(),
        errorCategory: "Invalid API key",
        message: "Missing API Key. Please configure a valid API key.",
      };
    }

    try {
      // Test lightweight connection against OpenAI models list
      const res = await this._fetchWithTimeout(`${this.baseUrl}/models`, {
        method: "GET",
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const rawMsg = errorData.error?.message || `HTTP ${res.status} ${res.statusText}`;
        const safeCategory = this._categorizeError(rawMsg, res.status);
        return {
          success: false,
          status: "failed",
          provider: "OpenAI",
          modelTested: model,
          responseTimeMs: latencyMs,
          testedAt: new Date().toISOString(),
          errorCategory: safeCategory,
          message: `${safeCategory}: ${rawMsg}`,
        };
      }

      return {
        success: true,
        status: "connected",
        provider: "OpenAI",
        modelTested: model,
        responseTimeMs: latencyMs,
        testedAt: new Date().toISOString(),
        message: "Connection successful",
      };
    } catch (err) {
      const latencyMs = Date.now() - start;
      const safeCategory = this._categorizeError(err.message);
      return {
        success: false,
        status: "failed",
        provider: "OpenAI",
        modelTested: model,
        responseTimeMs: latencyMs,
        testedAt: new Date().toISOString(),
        errorCategory: safeCategory,
        message: `${safeCategory}: ${err.message}`,
      };
    }
  }

  async fetchAvailableModels() {
    if (!this.apiKey) {
      throw new Error("Missing API Key. Please configure an API key first.");
    }
    const res = await this._fetchWithTimeout(`${this.baseUrl}/models`, { method: "GET" });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const rawMsg = errorData.error?.message || `HTTP ${res.status} ${res.statusText}`;
      throw new Error(this._categorizeError(rawMsg, res.status) + ": " + rawMsg);
    }
    const data = await res.json();
    const allowedPrefixes = ["gpt-4", "gpt-5", "o1", "o3", "chatgpt", "gpt-3.5"];
    const models = (data.data || [])
      .filter((m) => allowedPrefixes.some((p) => m.id.toLowerCase().startsWith(p)))
      .sort((a, b) => (b.created || 0) - (a.created || 0))
      .slice(0, 20)
      .map((m) => {
        const isVision = m.id.includes("vision") || m.id.includes("4o") || m.id.includes("gpt-5");
        return {
          modelCode: m.id,
          modelName: m.id.toUpperCase(),
          description: `OpenAI ${m.id} model`,
          contextWindow: m.id.includes("mini") ? 128000 : 128000,
          maxOutputTokens: 16384,
          supportsVision: isVision,
          status: "ACTIVE",
        };
      });
    return models;
  }

  async generateText({ prompt, systemPrompt, model, temperature = 0.3, maxTokens = 2048 }) {
    const targetModel = model || this.defaultModel;
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const payload = {
      model: targetModel,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    const res = await this._fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenAI Error: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const text = choice?.message?.content || "";
    const usage = data.usage || {};

    return {
      text,
      model: targetModel,
      inputTokens: usage.prompt_tokens || Math.ceil((prompt.length + (systemPrompt || "").length) / 4),
      outputTokens: usage.completion_tokens || Math.ceil(text.length / 4),
      totalTokens: usage.total_tokens || (Math.ceil((prompt.length + (systemPrompt || "").length) / 4) + Math.ceil(text.length / 4)),
      finishReason: choice?.finish_reason || "stop",
    };
  }

  async generateStructuredOutput({ prompt, systemPrompt, schema, model, temperature = 0.2 }) {
    const targetModel = model || this.defaultModel;
    const sys = `${systemPrompt || "You are an enterprise AI data extractor."}\nReturn valid JSON only. Do not wrap in markdown quotes if possible, output raw parseable JSON.`;

    const messages = [
      { role: "system", content: sys },
      { role: "user", content: prompt },
    ];

    const payload = {
      model: targetModel,
      messages,
      temperature,
      response_format: { type: "json_object" },
    };

    const res = await this._fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenAI Error: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const rawText = data.choices?.[0]?.message?.content || "{}";
    const usage = data.usage || {};

    let parsedData = {};
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      parsedData = match ? JSON.parse(match[0]) : { raw: rawText };
    }

    return {
      data: parsedData,
      rawText,
      model: targetModel,
      inputTokens: usage.prompt_tokens || 100,
      outputTokens: usage.completion_tokens || 100,
      totalTokens: usage.total_tokens || 200,
    };
  }

  async summarize({ text, options = {}, model }) {
    const length = options.length || "medium";
    const prompt = `Please provide a comprehensive summary of the following document/text.\nLength requested: ${length}.\nInclude key points: ${options.includeKeyPoints !== false}.\nInclude action items: ${options.includeActionItems !== false}.\n\nDocument Content:\n${text}`;
    const systemPrompt = "You are an expert executive document summarizer for enterprise SaaS. Produce clear, professional, structured summaries with key takeaways and action points.";

    const result = await this.generateText({ prompt, systemPrompt, model });
    return result;
  }

  async classify({ text, categories = [], model }) {
    const prompt = `Classify the following text into one of the available categories: ${JSON.stringify(categories)}.\nReturn JSON format: {"category": "...", "confidence": 0.95, "reasoning": "..."}\n\nText:\n${text}`;
    return this.generateStructuredOutput({ prompt, model });
  }

  async extract({ text, fields = [], model }) {
    const prompt = `Extract the following fields from the text: ${JSON.stringify(fields)}.\nReturn JSON object with the extracted keys and values.\n\nText:\n${text}`;
    return this.generateStructuredOutput({ prompt, model });
  }
}

module.exports = OpenAIAdapter;
