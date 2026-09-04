const prisma = require("../config/prismaClient");
const { encryptApiKey, decryptApiKey, maskApiKey } = require("../utils/aiEncryption");
const GeminiAdapter = require("./aiGateway/adapters/GeminiAdapter");
const OpenAIAdapter = require("./aiGateway/adapters/OpenAIAdapter");
const AnthropicAdapter = require("./aiGateway/adapters/AnthropicAdapter");
const AuditLogService = require("./auditLogService");

// Initial 3 Providers only
const INITIAL_AI_PROVIDERS = [
  {
    providerName: "Google Gemini",
    providerCode: "gemini",
    description: "Multimodal AI models with high speed, code execution, and large context windows.",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    apiVersion: "v1beta",
    priority: 1,
    isDefault: true,
    supportsChat: true,
    supportsVision: true,
    supportsOCR: false,
    supportsStreaming: true,
    models: [
      {
        modelName: "Gemini 3.5 Flash",
        modelCode: "gemini-3.5-flash",
        contextWindow: 1048576,
        maxOutputTokens: 8192,
        inputCostPer1K: 0.0001,
        outputCostPer1K: 0.0004,
        supportsVision: true,
        supportsFunctionCalling: true,
        isDefault: true,
        status: "ACTIVE",
      },
      {
        modelName: "Gemini 3.7 Flash",
        modelCode: "gemini-3.7-flash",
        contextWindow: 1048576,
        maxOutputTokens: 8192,
        inputCostPer1K: 0.00015,
        outputCostPer1K: 0.0006,
        supportsVision: true,
        supportsFunctionCalling: true,
        isDefault: false,
        status: "ACTIVE",
      },
      {
        modelName: "Gemini 2.5 Pro",
        modelCode: "gemini-2.5-pro",
        contextWindow: 2097152,
        maxOutputTokens: 8192,
        inputCostPer1K: 0.00125,
        outputCostPer1K: 0.005,
        supportsVision: true,
        supportsFunctionCalling: true,
        isDefault: false,
        status: "ACTIVE",
      },
    ],
  },
  {
    providerName: "OpenAI",
    providerCode: "openai",
    description: "General-purpose GPT models with advanced instruction following and tool usage.",
    baseUrl: "https://api.openai.com/v1",
    apiVersion: "v1",
    priority: 2,
    isDefault: false,
    supportsChat: true,
    supportsVision: true,
    supportsOCR: false,
    supportsStreaming: true,
    models: [
      {
        modelName: "GPT-4o Mini",
        modelCode: "gpt-4o-mini",
        contextWindow: 128000,
        maxOutputTokens: 16384,
        inputCostPer1K: 0.00015,
        outputCostPer1K: 0.0006,
        supportsVision: true,
        supportsFunctionCalling: true,
        isDefault: true,
        status: "ACTIVE",
      },
      {
        modelName: "GPT-4o",
        modelCode: "gpt-4o",
        contextWindow: 128000,
        maxOutputTokens: 4096,
        inputCostPer1K: 0.0025,
        outputCostPer1K: 0.01,
        supportsVision: true,
        supportsFunctionCalling: true,
        isDefault: false,
        status: "ACTIVE",
      },
    ],
  },
  {
    providerName: "Anthropic Claude",
    providerCode: "anthropic",
    description: "State-of-the-art models for complex reasoning, long-form synthesis, and coding.",
    baseUrl: "https://api.anthropic.com/v1",
    apiVersion: "2023-06-01",
    priority: 3,
    isDefault: false,
    supportsChat: true,
    supportsVision: true,
    supportsOCR: false,
    supportsStreaming: true,
    models: [
      {
        modelName: "Claude 3.5 Sonnet",
        modelCode: "claude-3-5-sonnet-20241022",
        contextWindow: 200000,
        maxOutputTokens: 8192,
        inputCostPer1K: 0.003,
        outputCostPer1K: 0.015,
        supportsVision: true,
        supportsFunctionCalling: true,
        isDefault: true,
        status: "ACTIVE",
      },
      {
        modelName: "Claude 3.7 Sonnet",
        modelCode: "claude-3-7-sonnet",
        contextWindow: 200000,
        maxOutputTokens: 8192,
        inputCostPer1K: 0.003,
        outputCostPer1K: 0.015,
        supportsVision: true,
        supportsFunctionCalling: true,
        isDefault: false,
        status: "ACTIVE",
      },
    ],
  },
];

// Initial 11 AI Capabilities
const INITIAL_AI_CAPABILITIES = [
  {
    name: "Document Generation",
    code: "document_generation",
    description: "Generate structured contracts, NDAs, HR letters, invoices, and standard corporate policies.",
    defaultModel: "gemini-3.5-flash",
    fallbackModel: "gpt-4o-mini",
    maxTokens: 4096,
    temperature: 0.3,
    systemPrompt: "You are an enterprise document drafting AI. Generate formal, highly accurate documents adhering to professional standards.",
    status: "ACTIVE",
  },
  {
    name: "Document Summarization",
    code: "document_summarization",
    description: "Extract executive summaries, critical takeaways, risk alerts, and action points from lengthy documents.",
    defaultModel: "gemini-3.5-flash",
    fallbackModel: "gpt-4o-mini",
    maxTokens: 2048,
    temperature: 0.2,
    systemPrompt: "You are an executive document summarizer. Highlight key points, timelines, financial figures, and action items clearly.",
    status: "ACTIVE",
  },
  {
    name: "Data Extraction",
    code: "data_extraction",
    description: "Parse unstructured text into strict, valid JSON entities, schema-based key-value pairs, and tabular structures.",
    defaultModel: "gemini-3.5-flash",
    fallbackModel: "gpt-4o-mini",
    maxTokens: 4096,
    temperature: 0.1,
    systemPrompt: "You are a data extraction engine. Return strictly valid JSON containing all specified entity fields.",
    status: "ACTIVE",
  },
  {
    name: "Classification",
    code: "classification",
    description: "Categorize documents by domain, confidentiality tier, department, urgency, and compliance requirement.",
    defaultModel: "gemini-3.5-flash",
    fallbackModel: "gpt-4o-mini",
    maxTokens: 1024,
    temperature: 0.1,
    systemPrompt: "You are an enterprise document classifier. Output classification categories with confidence scores in JSON.",
    status: "ACTIVE",
  },
  {
    name: "Translation",
    code: "translation",
    description: "Accurate enterprise multi-language translation preserving formatting, legal nuances, and formal business tone.",
    defaultModel: "gemini-3.5-flash",
    fallbackModel: "gpt-4o-mini",
    maxTokens: 4096,
    temperature: 0.2,
    systemPrompt: "You are a professional legal & corporate translator. Maintain exact terminology and contextual accuracy.",
    status: "ACTIVE",
  },
  {
    name: "Rewrite",
    code: "rewrite",
    description: "Refactor drafting tone, enhance clarity, eliminate ambiguity, and standardize corporate language.",
    defaultModel: "gemini-3.5-flash",
    fallbackModel: "gpt-4o-mini",
    maxTokens: 2048,
    temperature: 0.4,
    systemPrompt: "You are an expert corporate communications editor. Rewrite the text for maximum executive impact and conciseness.",
    status: "ACTIVE",
  },
  {
    name: "Proofreading",
    code: "proofreading",
    description: "Detect grammar, punctuation, syntactic contradictions, and formatting discrepancies across documents.",
    defaultModel: "gemini-3.5-flash",
    fallbackModel: "gpt-4o-mini",
    maxTokens: 2048,
    temperature: 0.1,
    systemPrompt: "You are a meticulous enterprise proofreader. Identify grammatical issues and provide corrected versions.",
    status: "ACTIVE",
  },
  {
    name: "Question Answering",
    code: "question_answering",
    description: "Contextual semantic Q&A and knowledge retrieval directly grounded in uploaded documents and policies.",
    defaultModel: "gemini-3.5-flash",
    fallbackModel: "gpt-4o-mini",
    maxTokens: 2048,
    temperature: 0.2,
    systemPrompt: "You are a document intelligence assistant. Answer questions strictly based on the provided document facts.",
    status: "ACTIVE",
  },
  {
    name: "Document Comparison",
    code: "document_comparison",
    description: "Compare two document versions side-by-side, identifying additions, deletions, and legal risk shifts.",
    defaultModel: "gemini-3.5-flash",
    fallbackModel: "claude-3-5-sonnet-20241022",
    maxTokens: 4096,
    temperature: 0.2,
    systemPrompt: "You are a redline comparison specialist. Highlight substantive clause changes, risk implications, and modifications.",
    status: "ACTIVE",
  },
  {
    name: "Content Generation",
    code: "content_generation",
    description: "Draft announcements, release notes, email correspondence, executive memos, and presentations.",
    defaultModel: "gemini-3.5-flash",
    fallbackModel: "gpt-4o-mini",
    maxTokens: 4096,
    temperature: 0.5,
    systemPrompt: "You are a corporate content creator. Produce engaging, professional, and well-structured business communications.",
    status: "ACTIVE",
  },
  {
    name: "Custom AI Task",
    code: "custom_ai_task",
    description: "User-defined custom prompt templates with custom parameters, models, and output structures.",
    defaultModel: "gemini-3.5-flash",
    fallbackModel: "gpt-4o-mini",
    maxTokens: 4096,
    temperature: 0.3,
    systemPrompt: "Execute the custom enterprise AI task precisely as defined in the user instructions.",
    status: "ACTIVE",
  },
];

class SuperAdminAiService {
  /**
   * Auto-seed initial 3 AI Providers and 11 AI Capabilities
   */
  static async ensureAiSeeded() {
    try {
      const geminiEnvKey = process.env.GEMINI_API_KEY;
      const openAiEnvKey = process.env.OPENAI_API_KEY;
      const anthropicEnvKey = process.env.ANTHROPIC_API_KEY;

      for (const p of INITIAL_AI_PROVIDERS) {
        let dbProvider = await prisma.aIProvider.findUnique({
          where: { providerCode: p.providerCode },
          include: { models: true },
        });

        let apiKeyEncrypted = null;
        let isConnected = false;

        if (p.providerCode === "gemini" && geminiEnvKey) {
          apiKeyEncrypted = encryptApiKey(geminiEnvKey);
          isConnected = true;
        } else if (p.providerCode === "openai" && openAiEnvKey) {
          apiKeyEncrypted = encryptApiKey(openAiEnvKey);
          isConnected = true;
        } else if (p.providerCode === "anthropic" && anthropicEnvKey) {
          apiKeyEncrypted = encryptApiKey(anthropicEnvKey);
          isConnected = true;
        }

        if (!dbProvider) {
          dbProvider = await prisma.aIProvider.create({
            data: {
              providerName: p.providerName,
              providerCode: p.providerCode,
              description: p.description,
              baseUrl: p.baseUrl,
              apiVersion: p.apiVersion,
              priority: p.priority,
              isDefault: p.isDefault,
              status: "ACTIVE",
              connectionStatus: isConnected ? "CONNECTED" : "DISCONNECTED",
              supportsChat: p.supportsChat,
              supportsVision: p.supportsVision,
              supportsOCR: false,
              supportsStreaming: p.supportsStreaming,
              apiKeyEncrypted,
              lastConnectedAt: isConnected ? new Date() : null,
            },
          });

          // Seed default models
          for (const m of p.models) {
            await prisma.aIModel.create({
              data: {
                providerId: dbProvider.id,
                modelName: m.modelName,
                modelCode: m.modelCode,
                contextWindow: m.contextWindow,
                maxOutputTokens: m.maxOutputTokens,
                inputCostPer1K: m.inputCostPer1K,
                outputCostPer1K: m.outputCostPer1K,
                supportsVision: m.supportsVision,
                supportsFunctionCalling: m.supportsFunctionCalling,
                isDefault: m.isDefault,
                status: m.status,
              },
            }).catch(() => null);
          }

          // Initialize service health
          await prisma.aIServiceHealth.create({
            data: {
              providerId: dbProvider.id,
              uptimePercent: isConnected ? 99.9 : 0.0,
              averageLatencyMs: isConnected ? 280 : null,
              errorRate: 0.0,
              requestsToday: 0,
              failedRequests: 0,
              successRate: 100.0,
              status: isConnected ? "OPERATIONAL" : "MAINTENANCE",
              lastCheckedAt: new Date(),
            },
          }).catch(() => null);
        } else if (p.providerCode === "gemini" && geminiEnvKey && !dbProvider.apiKeyEncrypted) {
          // If Gemini exists but didn't have key encrypted yet, update with env key
          await prisma.aIProvider.update({
            where: { id: dbProvider.id },
            data: {
              apiKeyEncrypted: encryptApiKey(geminiEnvKey),
              connectionStatus: "CONNECTED",
              status: "ACTIVE",
              lastConnectedAt: new Date(),
            },
          });
        }
      }

      // Seed Capabilities
      for (const cap of INITIAL_AI_CAPABILITIES) {
        const existing = await prisma.aICapability.findUnique({
          where: { code: cap.code },
        });
        if (!existing) {
          await prisma.aICapability.create({
            data: cap,
          }).catch(() => null);
        }
      }
    } catch (err) {
      console.warn("[SuperAdminAiService] Seed notice:", err.message);
    }
  }

  /**
   * AI Overview Dashboard Metrics & Dynamic Charts
   */
  static async getOverviewMetrics() {
    await this.ensureAiSeeded();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalLogs,
      successfulLogs,
      failedLogs,
      todayLogs,
      activeJobs,
      recentLogs,
      providers,
      models,
    ] = await Promise.all([
      prisma.aILog.count(),
      prisma.aILog.count({ where: { requestStatus: "SUCCESS" } }),
      prisma.aILog.count({ where: { requestStatus: { in: ["FAILED", "TIMEOUT"] } } }),
      prisma.aILog.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.aIJobQueue.count({ where: { status: { in: ["QUEUED", "RUNNING"] } } }),
      prisma.aILog.findMany({
        where: { createdAt: { gte: last7Days } },
        select: {
          id: true,
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
          latencyMs: true,
          estimatedCost: true,
          requestStatus: true,
          createdAt: true,
          provider: { select: { providerName: true, providerCode: true } },
          model: { select: { modelName: true, modelCode: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.aIProvider.findMany({
        select: { id: true, providerName: true, providerCode: true, status: true, connectionStatus: true },
      }),
      prisma.aIModel.findMany({
        select: { id: true, modelName: true, modelCode: true, provider: { select: { providerName: true } } },
      }),
    ]);

    let totalTokens = 0;
    let totalCost = 0;
    let totalLatency = 0;
    const providerCountMap = {};
    const modelCountMap = {};
    const dailyRequestsMap = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyRequestsMap[key] = { date: key, requests: 0, tokens: 0, cost: 0, failed: 0 };
    }

    recentLogs.forEach((log) => {
      totalTokens += log.totalTokens || 0;
      totalCost += Number(log.estimatedCost || 0);
      totalLatency += log.latencyMs || 0;

      const pName = log.provider?.providerName || "Other";
      providerCountMap[pName] = (providerCountMap[pName] || 0) + 1;

      const mName = log.model?.modelName || "Other";
      modelCountMap[mName] = (modelCountMap[mName] || 0) + 1;

      const dayKey = new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dailyRequestsMap[dayKey]) {
        dailyRequestsMap[dayKey].requests += 1;
        dailyRequestsMap[dayKey].tokens += log.totalTokens || 0;
        dailyRequestsMap[dayKey].cost += Number(log.estimatedCost || 0);
        if (log.requestStatus !== "SUCCESS") {
          dailyRequestsMap[dayKey].failed += 1;
        }
      }
    });

    const totalRequests = Math.max(totalLogs, 0);
    const avgLatencyMs = recentLogs.length > 0 ? Math.round(totalLatency / recentLogs.length) : 320;
    const successRate = totalRequests > 0 ? ((successfulLogs / totalRequests) * 100).toFixed(1) : "100.0";
    const failureRate = totalRequests > 0 ? ((failedLogs / totalRequests) * 100).toFixed(1) : "0.0";

    const requestsOverTime = Object.values(dailyRequestsMap);
    const requestsByProvider = Object.keys(providerCountMap).map((k) => ({
      name: k,
      value: providerCountMap[k],
    }));
    const requestsByModel = Object.keys(modelCountMap).map((k) => ({
      name: k,
      value: modelCountMap[k],
    }));

    return {
      totalAiRequests: totalRequests,
      successfulRequests: successfulLogs,
      failedRequests: failedLogs,
      requestsToday: todayLogs,
      activeAiJobs: activeJobs,
      averageProcessingTimeMs: avgLatencyMs,
      totalTokenUsage: totalTokens,
      aiCostUsd: Number(totalCost.toFixed(4)),
      successRate: Number(successRate),
      failureRate: Number(failureRate),
      charts: {
        requestsOverTime,
        requestsByProvider: requestsByProvider.length > 0 ? requestsByProvider : [{ name: "Google Gemini", value: 1 }],
        requestsByModel: requestsByModel.length > 0 ? requestsByModel : [{ name: "Gemini 3.5 Flash", value: 1 }],
        tokenUsageOverTime: requestsOverTime.map((d) => ({ date: d.date, tokens: d.tokens })),
        costOverTime: requestsOverTime.map((d) => ({ date: d.date, cost: Number(d.cost.toFixed(4)) })),
        failureRateOverTime: requestsOverTime.map((d) => ({
          date: d.date,
          failureRate: d.requests > 0 ? Number(((d.failed / d.requests) * 100).toFixed(1)) : 0,
        })),
      },
    };
  }

  /**
   * Providers management
   */
  static async getProviders() {
    await this.ensureAiSeeded();

    const providers = await prisma.aIProvider.findMany({
      orderBy: [{ priority: "asc" }, { providerName: "asc" }],
      include: {
        models: {
          orderBy: [{ isDefault: "desc" }, { modelName: "asc" }],
        },
        serviceHealth: true,
      },
    });

    return providers.map((p) => {
      let decryptedKey = p.apiKeyEncrypted ? decryptApiKey(p.apiKeyEncrypted) : "";
      return {
        id: p.id,
        providerName: p.providerName,
        providerCode: p.providerCode,
        description: p.description,
        baseUrl: p.baseUrl,
        apiVersion: p.apiVersion,
        apiKeyMasked: maskApiKey(decryptedKey),
        hasApiKey: Boolean(decryptedKey),
        status: p.status,
        connectionStatus: p.connectionStatus,
        priority: p.priority,
        isDefault: p.isDefault,
        supportsChat: p.supportsChat,
        supportsVision: p.supportsVision,
        supportsOCR: false,
        supportsStreaming: p.supportsStreaming,
        healthScore: p.healthScore,
        lastConnectedAt: p.lastConnectedAt,
        models: p.models.map((m) => ({
          id: m.id,
          providerId: m.providerId,
          modelName: m.modelName,
          modelCode: m.modelCode,
          contextWindow: m.contextWindow,
          inputCostPer1K: m.inputCostPer1K ? Number(m.inputCostPer1K) : 0,
          outputCostPer1K: m.outputCostPer1K ? Number(m.outputCostPer1K) : 0,
          maxOutputTokens: m.maxOutputTokens,
          supportsVision: m.supportsVision,
          supportsFunctionCalling: m.supportsFunctionCalling,
          status: m.status,
          isDefault: m.isDefault,
        })),
      };
    });
  }

  static async createProvider(data) {
    const encryptedKey = data.apiKey ? encryptApiKey(data.apiKey) : null;
    const provider = await prisma.aIProvider.create({
      data: {
        providerName: data.providerName,
        providerCode: data.providerCode.toLowerCase().replace(/\s+/g, "_"),
        description: data.description || null,
        baseUrl: data.baseUrl || null,
        apiVersion: data.apiVersion || "v1",
        apiKeyEncrypted: encryptedKey,
        status: data.status || "ACTIVE",
        connectionStatus: data.apiKey ? "CONNECTED" : "DISCONNECTED",
        priority: data.priority ? Number(data.priority) : 1,
        isDefault: Boolean(data.isDefault),
        supportsChat: data.supportsChat ?? true,
        supportsVision: Boolean(data.supportsVision),
        supportsOCR: false,
        supportsStreaming: data.supportsStreaming ?? true,
      },
    });

    await prisma.aIServiceHealth.create({
      data: {
        providerId: provider.id,
        uptimePercent: 99.9,
        averageLatencyMs: 250,
        errorRate: 0.0,
        status: "OPERATIONAL",
        lastCheckedAt: new Date(),
      },
    }).catch(() => null);

    AuditLogService.log({
      actorName: "Super Admin",
      actorRole: "SUPER_ADMIN",
      module: "PLATFORM",
      action: "AI_PROVIDER_CREATED",
      resourceType: "AI_PROVIDER",
      resourceId: provider.id,
      resourceName: provider.providerName,
      severity: "INFO",
      status: "SUCCESS",
      afterData: {
        providerName: provider.providerName,
        providerCode: provider.providerCode,
        status: provider.status,
        priority: provider.priority,
      },
    });

    return provider;
  }

  static async updateProvider(id, data) {
    const existing = await prisma.aIProvider.findUnique({ where: { id: String(id) } });
    const updateData = {};
    if (data.providerName !== undefined) updateData.providerName = data.providerName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.baseUrl !== undefined) updateData.baseUrl = data.baseUrl;
    if (data.apiVersion !== undefined) updateData.apiVersion = data.apiVersion;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = Number(data.priority);
    if (data.isDefault !== undefined) updateData.isDefault = Boolean(data.isDefault);
    if (data.supportsChat !== undefined) updateData.supportsChat = Boolean(data.supportsChat);
    if (data.supportsVision !== undefined) updateData.supportsVision = Boolean(data.supportsVision);
    if (data.supportsStreaming !== undefined) updateData.supportsStreaming = Boolean(data.supportsStreaming);

    if (data.apiKey && data.apiKey.trim().length > 0 && !data.apiKey.includes("••")) {
      updateData.apiKeyEncrypted = encryptApiKey(data.apiKey);
      updateData.connectionStatus = "CONNECTED";
      updateData.lastConnectedAt = new Date();
    }

    const updated = await prisma.aIProvider.update({
      where: { id: String(id) },
      data: updateData,
    });

    AuditLogService.log({
      actorName: "Super Admin",
      actorRole: "SUPER_ADMIN",
      module: "PLATFORM",
      action: "AI_PROVIDER_UPDATED",
      resourceType: "AI_PROVIDER",
      resourceId: String(id),
      resourceName: updated.providerName,
      severity: "INFO",
      status: "SUCCESS",
      beforeData: existing ? { providerName: existing.providerName, status: existing.status, isDefault: existing.isDefault } : null,
      afterData: { providerName: updated.providerName, status: updated.status, isDefault: updated.isDefault },
    });

    return updated;
  }

  static async toggleProvider(id, { enabled, status }) {
    const targetStatus = status || (enabled ? "ACTIVE" : "INACTIVE");
    const updated = await prisma.aIProvider.update({
      where: { id: String(id) },
      data: { status: targetStatus },
    });

    AuditLogService.log({
      actorName: "Super Admin",
      actorRole: "SUPER_ADMIN",
      module: "PLATFORM",
      action: targetStatus === "ACTIVE" ? "AI_PROVIDER_ENABLED" : "AI_PROVIDER_DISABLED",
      resourceType: "AI_PROVIDER",
      resourceId: String(id),
      resourceName: updated.providerName,
      severity: "INFO",
      status: "SUCCESS",
      afterData: { status: targetStatus },
    });

    return updated;
  }

  static async testProviderConnection(id) {
    const provider = await prisma.aIProvider.findUnique({
      where: { id: String(id) },
      include: { models: true },
    });

    if (!provider) {
      throw new Error("Provider not found");
    }

    let apiKey = provider.apiKeyEncrypted ? decryptApiKey(provider.apiKeyEncrypted) : null;
    if (!apiKey) {
      if (provider.providerCode === "gemini" && process.env.GEMINI_API_KEY) {
        apiKey = process.env.GEMINI_API_KEY;
      } else if (provider.providerCode === "openai" && process.env.OPENAI_API_KEY) {
        apiKey = process.env.OPENAI_API_KEY;
      } else if (provider.providerCode === "anthropic" && process.env.ANTHROPIC_API_KEY) {
        apiKey = process.env.ANTHROPIC_API_KEY;
      }
    }

    if (!apiKey) {
      return {
        success: false,
        status: "FAILED",
        message: `API Key is missing for ${provider.providerName}. Please add an API key.`,
        latencyMs: 0,
      };
    }

    const config = {
      apiKey,
      baseUrl: provider.baseUrl,
      apiVersion: provider.apiVersion,
      defaultModel: provider.models?.[0]?.modelCode,
    };

    let testResult;
    try {
      if (provider.providerCode === "gemini") {
        const adapter = new GeminiAdapter(config);
        testResult = await adapter.testConnection();
      } else if (provider.providerCode === "anthropic") {
        const adapter = new AnthropicAdapter(config);
        testResult = await adapter.testConnection();
      } else {
        const adapter = new OpenAIAdapter(config);
        testResult = await adapter.testConnection();
      }

      await prisma.aIProvider.update({
        where: { id: provider.id },
        data: {
          connectionStatus: testResult.success ? "CONNECTED" : "FAILED",
          lastConnectedAt: testResult.success ? new Date() : undefined,
          lastHealthCheckAt: new Date(),
        },
      });

      return testResult;
    } catch (err) {
      await prisma.aIProvider.update({
        where: { id: provider.id },
        data: {
          connectionStatus: "FAILED",
          lastHealthCheckAt: new Date(),
        },
      });

      return {
        success: false,
        status: "FAILED",
        message: err.message,
        latencyMs: 0,
      };
    }
  }

  static async deleteProvider(id) {
    return await prisma.aIProvider.delete({
      where: { id: String(id) },
    });
  }

  /**
   * Models management
   */
  static async getModels(providerId = null) {
    const where = {};
    if (providerId) where.providerId = String(providerId);

    const models = await prisma.aIModel.findMany({
      where,
      orderBy: [{ provider: { priority: "asc" } }, { isDefault: "desc" }, { modelName: "asc" }],
      include: {
        provider: {
          select: { id: true, providerName: true, providerCode: true },
        },
      },
    });

    return models.map((m) => ({
      id: m.id,
      providerId: m.providerId,
      providerName: m.provider.providerName,
      providerCode: m.provider.providerCode,
      modelName: m.modelName,
      modelCode: m.modelCode,
      contextWindow: m.contextWindow || 128000,
      inputCostPer1K: m.inputCostPer1K ? Number(m.inputCostPer1K) : 0,
      outputCostPer1K: m.outputCostPer1K ? Number(m.outputCostPer1K) : 0,
      maxOutputTokens: m.maxOutputTokens || 4096,
      supportsVision: m.supportsVision,
      supportsFunctionCalling: m.supportsFunctionCalling,
      status: m.status,
      isDefault: m.isDefault,
    }));
  }

  static async createModel(data) {
    if (data.isDefault) {
      await prisma.aIModel.updateMany({
        where: { providerId: String(data.providerId) },
        data: { isDefault: false },
      });
    }

    return await prisma.aIModel.create({
      data: {
        providerId: String(data.providerId),
        modelName: data.modelName,
        modelCode: data.modelCode.trim(),
        contextWindow: data.contextWindow ? Number(data.contextWindow) : 128000,
        inputCostPer1K: data.inputCostPer1K !== undefined ? Number(data.inputCostPer1K) : null,
        outputCostPer1K: data.outputCostPer1K !== undefined ? Number(data.outputCostPer1K) : null,
        maxOutputTokens: data.maxOutputTokens ? Number(data.maxOutputTokens) : 4096,
        supportsVision: Boolean(data.supportsVision),
        supportsFunctionCalling: Boolean(data.supportsFunctionCalling),
        status: data.status || "ACTIVE",
        isDefault: Boolean(data.isDefault),
      },
      include: { provider: true },
    });
  }

  static async updateModel(id, data) {
    if (data.isDefault && data.providerId) {
      await prisma.aIModel.updateMany({
        where: { providerId: String(data.providerId) },
        data: { isDefault: false },
      });
    }

    const updateData = {};
    if (data.modelName !== undefined) updateData.modelName = data.modelName;
    if (data.modelCode !== undefined) updateData.modelCode = data.modelCode;
    if (data.contextWindow !== undefined) updateData.contextWindow = Number(data.contextWindow);
    if (data.inputCostPer1K !== undefined) updateData.inputCostPer1K = Number(data.inputCostPer1K);
    if (data.outputCostPer1K !== undefined) updateData.outputCostPer1K = Number(data.outputCostPer1K);
    if (data.maxOutputTokens !== undefined) updateData.maxOutputTokens = Number(data.maxOutputTokens);
    if (data.supportsVision !== undefined) updateData.supportsVision = Boolean(data.supportsVision);
    if (data.supportsFunctionCalling !== undefined) updateData.supportsFunctionCalling = Boolean(data.supportsFunctionCalling);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isDefault !== undefined) updateData.isDefault = Boolean(data.isDefault);

    return await prisma.aIModel.update({
      where: { id: String(id) },
      data: updateData,
      include: { provider: true },
    });
  }

  static async deleteModel(id) {
    return await prisma.aIModel.delete({
      where: { id: String(id) },
    });
  }

  /**
   * Capabilities management
   */
  static async getCapabilities() {
    await this.ensureAiSeeded();
    return await prisma.aICapability.findMany({
      orderBy: { name: "asc" },
    });
  }

  static async createCapability(data) {
    return await prisma.aICapability.create({
      data: {
        name: data.name,
        code: data.code.toLowerCase().replace(/\s+/g, "_"),
        description: data.description || null,
        defaultModel: data.defaultModel || "gemini-3.5-flash",
        fallbackModel: data.fallbackModel || "gpt-4o-mini",
        maxTokens: data.maxTokens ? Number(data.maxTokens) : 4096,
        temperature: data.temperature !== undefined ? Number(data.temperature) : 0.3,
        systemPrompt: data.systemPrompt || null,
        status: data.status || "ACTIVE",
      },
    });
  }

  static async updateCapability(id, data) {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.defaultModel !== undefined) updateData.defaultModel = data.defaultModel;
    if (data.fallbackModel !== undefined) updateData.fallbackModel = data.fallbackModel;
    if (data.maxTokens !== undefined) updateData.maxTokens = Number(data.maxTokens);
    if (data.temperature !== undefined) updateData.temperature = Number(data.temperature);
    if (data.systemPrompt !== undefined) updateData.systemPrompt = data.systemPrompt;
    if (data.status !== undefined) updateData.status = data.status;

    return await prisma.aICapability.update({
      where: { id: String(id) },
      data: updateData,
    });
  }

  static async toggleCapability(id, { enabled, status }) {
    const targetStatus = status || (enabled ? "ACTIVE" : "INACTIVE");
    return await prisma.aICapability.update({
      where: { id: String(id) },
      data: { status: targetStatus },
    });
  }

  static async deleteCapability(id) {
    return await prisma.aICapability.delete({
      where: { id: String(id) },
    });
  }

  /**
   * AI Jobs Queue
   */
  static async getJobs({ status, organisationId, limit = 50, skip = 0 } = {}) {
    const where = {};
    if (status) where.status = status;
    if (organisationId) where.organisationId = String(organisationId);

    const [jobs, total] = await Promise.all([
      prisma.aIJobQueue.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Number(limit),
        skip: Number(skip),
        include: {
          provider: { select: { providerName: true, providerCode: true } },
          model: { select: { modelName: true, modelCode: true } },
        },
      }),
      prisma.aIJobQueue.count({ where }),
    ]);

    return { jobs, total };
  }

  static async retryJob(id) {
    const job = await prisma.aIJobQueue.findUnique({
      where: { id: String(id) },
    });
    if (!job) throw new Error("Job not found");

    return await prisma.aIJobQueue.update({
      where: { id: String(id) },
      data: {
        status: "QUEUED",
        retryCount: job.retryCount + 1,
        errorMessage: null,
      },
      include: {
        provider: true,
        model: true,
      },
    });
  }

  static async cancelJob(id) {
    return await prisma.aIJobQueue.update({
      where: { id: String(id) },
      data: { status: "CANCELLED" },
    });
  }

  /**
   * AI Usage & Costs Tracking
   */
  static async getUsageAndCosts({ period = "monthly" } = {}) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [logs, costRecords] = await Promise.all([
      prisma.aILog.findMany({
        where: { createdAt: { gte: startOfMonth } },
        include: {
          provider: { select: { providerName: true } },
          model: { select: { modelName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.aICostUsage.findMany({
        orderBy: { billingDate: "desc" },
        take: 50,
        include: {
          provider: true,
          model: true,
        },
      }),
    ]);

    let totalRequests = logs.length;
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;
    let totalCost = 0;

    const providerUsage = {};
    const modelUsage = {};
    const orgUsage = {};
    const userUsage = {};

    logs.forEach((log) => {
      inputTokens += log.promptTokens || 0;
      outputTokens += log.completionTokens || 0;
      totalTokens += log.totalTokens || 0;
      totalCost += Number(log.estimatedCost || 0);

      const p = log.provider?.providerName || "Gemini";
      providerUsage[p] = (providerUsage[p] || 0) + (log.totalTokens || 0);

      const m = log.model?.modelName || "Gemini 3.5 Flash";
      modelUsage[m] = (modelUsage[m] || 0) + (log.totalTokens || 0);

      const org = `Org #${log.organisationId || 1}`;
      orgUsage[org] = (orgUsage[org] || 0) + 1;

      const user = log.userId ? `User #${log.userId}` : "System / Agent";
      userUsage[user] = (userUsage[user] || 0) + 1;
    });

    const costByProvider = Object.keys(providerUsage).map((k) => ({
      name: k,
      tokens: providerUsage[k],
      costUsd: Number(((providerUsage[k] * 0.0000004) || 0).toFixed(4)),
    }));

    const costByModel = Object.keys(modelUsage).map((k) => ({
      name: k,
      tokens: modelUsage[k],
      costUsd: Number(((modelUsage[k] * 0.0000004) || 0).toFixed(4)),
    }));

    return {
      usage: {
        aiRequests: totalRequests,
        inputTokens,
        outputTokens,
        totalTokens,
        providerUsage,
        modelUsage,
        organisationUsage: orgUsage,
        userUsage,
      },
      costs: {
        totalAiCost: Number(totalCost.toFixed(4)),
        dailyAiCost: Number((totalCost / Math.max(now.getDate(), 1)).toFixed(4)),
        monthlyAiCost: Number(totalCost.toFixed(4)),
        costPerRequest: totalRequests > 0 ? Number((totalCost / totalRequests).toFixed(6)) : 0.00005,
        costByProvider,
        costByModel,
        records: costRecords,
      },
    };
  }

  /**
   * AI Logs (strictly sanitized - no secrets)
   */
  static async getLogs({ limit = 50, skip = 0, status, providerId } = {}) {
    const where = {};
    if (status) where.requestStatus = status;
    if (providerId) where.providerId = String(providerId);

    const [logs, total] = await Promise.all([
      prisma.aILog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Number(limit),
        skip: Number(skip),
        include: {
          provider: { select: { providerName: true, providerCode: true } },
          model: { select: { modelName: true, modelCode: true } },
        },
      }),
      prisma.aILog.count({ where }),
    ]);

    const sanitized = logs.map((l) => ({
      id: l.id,
      timestamp: l.createdAt,
      requestId: l.logCode || `REQ-${l.id.slice(0, 8)}`,
      organisation: `Org #${l.organisationId || 1}`,
      user: l.userId ? `User #${l.userId}` : "System Agent",
      provider: l.provider?.providerName || "Google Gemini",
      model: l.model?.modelName || "Gemini 3.5 Flash",
      capability: l.promptType || "Document Intelligence",
      status: l.requestStatus,
      latency: `${l.latencyMs || 250}ms`,
      tokenUsage: l.totalTokens || 120,
      cost: Number(l.estimatedCost || 0.0001),
      error: l.errorMessage,
    }));

    return { logs: sanitized, total };
  }

  /**
   * AI Infrastructure Health
   */
  static async getHealth() {
    await this.ensureAiSeeded();

    const providers = await prisma.aIProvider.findMany({
      include: {
        models: true,
        serviceHealth: true,
      },
      orderBy: { priority: "asc" },
    });

    const queueCount = await prisma.aIJobQueue.count({
      where: { status: { in: ["QUEUED", "RUNNING"] } },
    });

    return {
      aiQueueStatus: queueCount > 5 ? "CONGESTED" : queueCount > 0 ? "PROCESSING" : "IDLE",
      activeQueueJobs: queueCount,
      providers: providers.map((p) => {
        const isHealthy = p.connectionStatus === "CONNECTED" && p.status === "ACTIVE";
        return {
          id: p.id,
          providerName: p.providerName,
          providerCode: p.providerCode,
          status: p.status,
          connectionStatus: p.connectionStatus,
          apiAvailability: isHealthy ? "99.9%" : "0.0%",
          responseTime: `${p.serviceHealth?.averageLatencyMs || 280}ms`,
          errorRate: `${p.serviceHealth?.errorRate || 0.0}%`,
          rateLimitStatus: "HEALTHY",
          overallHealth: isHealthy ? "Healthy" : p.status === "ACTIVE" ? "Warning" : "Inactive",
          lastCheckedAt: p.lastHealthCheckAt || p.serviceHealth?.lastCheckedAt || new Date(),
          models: p.models.map((m) => ({
            modelName: m.modelName,
            modelCode: m.modelCode,
            status: m.status,
            health: m.status === "ACTIVE" ? "Healthy" : "Inactive",
          })),
        };
      }),
    };
  }

  static async testAllHealth() {
    const providers = await prisma.aIProvider.findMany();
    const results = [];

    for (const p of providers) {
      const res = await this.testProviderConnection(p.id);
      results.push({
        providerId: p.id,
        providerName: p.providerName,
        ...res,
      });
    }

    return results;
  }
}

module.exports = SuperAdminAiService;
