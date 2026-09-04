const AIProviderAdapter = require("./AIProviderAdapter");

class AnthropicAdapter extends AIProviderAdapter {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || "https://api.anthropic.com/v1";
    this.defaultModel = config.defaultModel || "claude-3-5-sonnet-20241022";
    this.anthropicVersion = config.apiVersion || "2023-06-01";
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
          "x-api-key": this.apiKey,
          "anthropic-version": this.anthropicVersion,
          ...(options.headers || {}),
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error(`Anthropic request timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }

  async testConnection(params = {}) {
    const start = Date.now();
    const model = params.model || this.defaultModel;
    try {
      // Send a minimal ping request to Anthropic API
      const res = await this._fetchWithTimeout(`${this.baseUrl}/messages`, {
        method: "POST",
        body: JSON.stringify({
          model,
          max_tokens: 5,
          messages: [{ role: "user", content: "ping" }],
        }),
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.error?.message || `HTTP ${res.status} ${res.statusText}`;
        return {
          success: false,
          status: "failed",
          latencyMs,
          message: `Anthropic authentication failed: ${msg}`,
        };
      }

      return {
        success: true,
        status: "connected",
        provider: "anthropic",
        latencyMs,
        testedModel: model,
        message: `Successfully connected to Anthropic Claude (${latencyMs}ms)`,
        testedAt: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        status: "failed",
        latencyMs: Date.now() - start,
        message: `Anthropic connection failed: ${err.message}`,
      };
    }
  }

  async generateText({ prompt, systemPrompt, model, temperature = 0.3, maxTokens = 2048 }) {
    const targetModel = model || this.defaultModel;
    const body = {
      model: targetModel,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: "user", content: prompt }],
    };

    if (systemPrompt) {
      body.system = systemPrompt;
    }

    const res = await this._fetchWithTimeout(`${this.baseUrl}/messages`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Anthropic Error: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const textBlock = data.content?.find((c) => c.type === "text");
    const text = textBlock?.text || "";
    const usage = data.usage || {};

    const inTokens = usage.input_tokens || Math.ceil((prompt.length + (systemPrompt || "").length) / 4);
    const outTokens = usage.output_tokens || Math.ceil(text.length / 4);

    return {
      text,
      model: targetModel,
      inputTokens: inTokens,
      outputTokens: outTokens,
      totalTokens: inTokens + outTokens,
      finishReason: data.stop_reason || "end_turn",
    };
  }

  async generateStructuredOutput({ prompt, systemPrompt, schema, model, temperature = 0.2 }) {
    const targetModel = model || this.defaultModel;
    const sys = `${systemPrompt || "You are an enterprise AI data extractor."}\nOutput ONLY valid parseable JSON. Do not include markdown code block tags or extra conversational text.`;

    const body = {
      model: targetModel,
      max_tokens: 2048,
      temperature,
      system: sys,
      messages: [{ role: "user", content: prompt }],
    };

    const res = await this._fetchWithTimeout(`${this.baseUrl}/messages`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Anthropic Error: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const rawText = data.content?.find((c) => c.type === "text")?.text || "{}";
    const usage = data.usage || {};

    let parsedData = {};
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      parsedData = match ? JSON.parse(match[0]) : { raw: rawText };
    }

    const inTokens = usage.input_tokens || 100;
    const outTokens = usage.output_tokens || 100;

    return {
      data: parsedData,
      rawText,
      model: targetModel,
      inputTokens: inTokens,
      outputTokens: outTokens,
      totalTokens: inTokens + outTokens,
    };
  }

  async summarize({ text, options = {}, model }) {
    const length = options.length || "medium";
    const prompt = `Summarize the following document concisely (${length} length):\nKey Points: ${options.includeKeyPoints !== false}\nAction Items: ${options.includeActionItems !== false}\n\nDocument:\n${text}`;
    const systemPrompt = "You are Claude, an executive analyst summarizing high-stakes enterprise documents.";
    return this.generateText({ prompt, systemPrompt, model });
  }

  async classify({ text, categories = [], model }) {
    const prompt = `Classify this text into: ${JSON.stringify(categories)}.\nReturn JSON: {"category": "...", "confidence": 0.95, "reasoning": "..."}\n\nText:\n${text}`;
    return this.generateStructuredOutput({ prompt, model });
  }

  async extract({ text, fields = [], model }) {
    const prompt = `Extract: ${JSON.stringify(fields)} from this text.\nReturn JSON map.\n\nText:\n${text}`;
    return this.generateStructuredOutput({ prompt, model });
  }
}

module.exports = AnthropicAdapter;
