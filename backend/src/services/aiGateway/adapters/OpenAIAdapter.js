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

  async testConnection(params = {}) {
    const start = Date.now();
    const model = params.model || this.defaultModel;
    try {
      // Direct models listing endpoint or mini ping
      const res = await this._fetchWithTimeout(`${this.baseUrl}/models`, {
        method: "GET",
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.error?.message || `HTTP ${res.status} ${res.statusText}`;
        return {
          success: false,
          status: "failed",
          latencyMs,
          message: `OpenAI authentication failed: ${msg}`,
        };
      }

      return {
        success: true,
        status: "connected",
        provider: "openai",
        latencyMs,
        testedModel: model,
        message: `Successfully connected to OpenAI (${latencyMs}ms)`,
        testedAt: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        status: "failed",
        latencyMs: Date.now() - start,
        message: `OpenAI connection failed: ${err.message}`,
      };
    }
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
