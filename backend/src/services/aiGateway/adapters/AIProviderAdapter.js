/**
 * Base Abstract AI Provider Adapter Interface
 * All provider adapters (OpenAI, Gemini, Anthropic) must implement this interface.
 */
class AIProviderAdapter {
  constructor(config = {}) {
    this.apiKey = config.apiKey || "";
    this.baseUrl = config.baseUrl || "";
    this.defaultModel = config.defaultModel || "";
    this.timeoutMs = config.timeoutMs || 45000;
  }

  /**
   * Test API connectivity and authentication against the provider
   * @param {Object} params
   * @returns {Promise<{ success: boolean, status: string, latencyMs: number, message: string, testedModel?: string }>}
   */
  async testConnection(params = {}) {
    throw new Error("testConnection() must be implemented by adapter.");
  }

  /**
   * Generate text completion / chat
   * @param {Object} params - { prompt, systemPrompt, model, temperature, maxTokens }
   * @returns {Promise<{ text: string, model: string, inputTokens: number, outputTokens: number, totalTokens: number, finishReason?: string }>}
   */
  async generateText(params = {}) {
    throw new Error("generateText() must be implemented by adapter.");
  }

  /**
   * Generate structured JSON output matching a provided schema or prompt
   * @param {Object} params - { prompt, systemPrompt, schema, model, temperature }
   * @returns {Promise<{ data: any, rawText: string, model: string, inputTokens: number, outputTokens: number, totalTokens: number }>}
   */
  async generateStructuredOutput(params = {}) {
    throw new Error("generateStructuredOutput() must be implemented by adapter.");
  }

  /**
   * Summarize given content
   * @param {Object} params - { text, options: { length, format, includeKeyPoints, includeActionItems }, model }
   */
  async summarize(params = {}) {
    throw new Error("summarize() must be implemented by adapter.");
  }

  /**
   * Classify text into provided categories
   * @param {Object} params - { text, categories: string[], model }
   */
  async classify(params = {}) {
    throw new Error("classify() must be implemented by adapter.");
  }

  /**
   * Extract structured fields or entities from text
   * @param {Object} params - { text, fields: string[] | object, model }
   */
  async extract(params = {}) {
    throw new Error("extract() must be implemented by adapter.");
  }
}

module.exports = AIProviderAdapter;
