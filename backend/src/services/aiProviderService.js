const prisma = require("../config/prismaClient");
const { encryptApiKey, decryptApiKey, maskApiKey } = require("../utils/aiEncryption");
const OpenAIAdapter = require("./aiGateway/adapters/OpenAIAdapter");
const GeminiAdapter = require("./aiGateway/adapters/GeminiAdapter");
const AnthropicAdapter = require("./aiGateway/adapters/AnthropicAdapter");

function safeProvider(p, stats = {}) {
  const cleanModels = (p.models || []).map((m) => ({
    id: m.id,
    modelName: m.modelName,
    modelCode: m.modelCode,
    description: m.description,
    contextWindow: m.contextWindow ? Number(m.contextWindow) : null,
    maxOutputTokens: m.maxOutputTokens ? Number(m.maxOutputTokens) : null,
    inputCostPer1K: m.inputCostPer1K ? Number(m.inputCostPer1K) : 0,
    outputCostPer1K: m.outputCostPer1K ? Number(m.outputCostPer1K) : 0,
    isDefault: Boolean(m.isDefault),
    status: m.status || "ACTIVE",
  }));

  const providerHealth = stats[p.providerCode]?.healthScore ?? (p.connectionStatus === "CONNECTED" ? 100 : 0);
  const enabledPlans = stats[p.providerCode]?.plansCount ?? (p.status === "ACTIVE" ? 4 : 0);

  return {
    id: p.id,
    providerName: p.providerName,
    providerCode: p.providerCode,
    description: p.description,
    baseUrl: p.baseUrl,
    apiVersion: p.apiVersion,
    apiKeyMasked: maskApiKey(p.apiKeyEncrypted),
    hasCredentials: Boolean(p.apiKeyEncrypted),
    region: p.region,
    status: p.status,
    connectionStatus: p.connectionStatus,
    priority: p.priority,
    isDefault: p.isDefault,
    supportsChat: p.supportsChat,
    supportsVision: p.supportsVision,
    supportsOCR: p.supportsOCR,
    supportsStreaming: p.supportsStreaming,
    healthScore: providerHealth,
    lastConnectedAt: p.lastConnectedAt,
    lastHealthCheckAt: p.lastHealthCheckAt || new Date(),
    modelsCount: p._count?.models ?? cleanModels.length,
    models: cleanModels,
    enabledPlansCount: enabledPlans,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

const DEFAULT_PROVIDERS = [
  {
    providerName: "Google Gemini",
    providerCode: "gemini",
    description: "Primary multimodal enterprise AI models with ultra-large context windows.",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    apiVersion: "v1beta",
    priority: 1,
    isDefault: true,
    supportsChat: true,
    supportsVision: true,
    supportsOCR: true,
    supportsStreaming: true,
    models: [
      { modelName: "Gemini 2.5 Flash (Primary Default)", modelCode: "gemini-2.5-flash", contextWindow: 1000000, maxOutputTokens: 8192, inputCostPer1K: 0.01, outputCostPer1K: 0.04, isDefault: true },
      { modelName: "Gemini 2.5 Pro (Advanced Reasoning)", modelCode: "gemini-2.5-pro", contextWindow: 2000000, maxOutputTokens: 8192, inputCostPer1K: 0.15, outputCostPer1K: 0.60, isDefault: false },
      { modelName: "Gemini 2.5 Flash-Lite (Lightweight Extraction)", modelCode: "gemini-2.5-flash-lite", contextWindow: 1000000, maxOutputTokens: 4096, inputCostPer1K: 0.005, outputCostPer1K: 0.02, isDefault: false },
    ],
  },
  {
    providerName: "OpenAI",
    providerCode: "openai",
    description: "Secondary fallback provider for structured extraction, general generation, and summarization.",
    baseUrl: "https://api.openai.com/v1",
    apiVersion: "v1",
    priority: 2,
    isDefault: false,
    supportsChat: true,
    supportsVision: true,
    supportsOCR: true,
    supportsStreaming: true,
    models: [
      { modelName: "GPT-4o Mini (Production Fallback)", modelCode: "gpt-4o-mini", contextWindow: 128000, maxOutputTokens: 4096, inputCostPer1K: 0.015, outputCostPer1K: 0.06, isDefault: true },
      { modelName: "GPT-4o (Flagship)", modelCode: "gpt-4o", contextWindow: 128000, maxOutputTokens: 4096, inputCostPer1K: 0.20, outputCostPer1K: 0.80, isDefault: false },
    ],
  },
  {
    providerName: "Anthropic",
    providerCode: "anthropic",
    description: "Optional advanced reasoning provider for complex contract review and deep legal interpretation.",
    baseUrl: "https://api.anthropic.com/v1",
    apiVersion: "2023-06-01",
    priority: 3,
    isDefault: false,
    supportsChat: true,
    supportsVision: true,
    supportsOCR: false,
    supportsStreaming: true,
    models: [
      { modelName: "Claude 3.5 Sonnet", modelCode: "claude-3-5-sonnet-20241022", contextWindow: 200000, maxOutputTokens: 8192, inputCostPer1K: 0.25, outputCostPer1K: 1.20, isDefault: true },
    ],
  },
];

let _aiProviderSeeded = false;

const aiProviderService = {
  async ensureSeeded() {
    if (_aiProviderSeeded) return;
    try {
      for (const def of DEFAULT_PROVIDERS) {
        const existing = await prisma.aIProvider.findUnique({
          where: { providerCode: def.providerCode },
        });

        const envGeminiKey = process.env.GEMINI_API_KEY;
        const isGemini = def.providerCode === "gemini";

        if (!existing) {
          const created = await prisma.aIProvider.create({
            data: {
              providerName: def.providerName,
              providerCode: def.providerCode,
              description: def.description,
              baseUrl: def.baseUrl,
              apiVersion: def.apiVersion,
              priority: def.priority,
              isDefault: def.isDefault,
              supportsChat: def.supportsChat,
              supportsVision: def.supportsVision,
              supportsOCR: def.supportsOCR,
              supportsStreaming: def.supportsStreaming,
              status: isGemini && envGeminiKey ? "ACTIVE" : "INACTIVE",
              connectionStatus: isGemini && envGeminiKey ? "CONNECTED" : "DISCONNECTED",
              apiKeyEncrypted: isGemini && envGeminiKey ? encryptApiKey(envGeminiKey) : null,
              lastConnectedAt: isGemini && envGeminiKey ? new Date() : null,
            },
          });

          for (const m of def.models) {
            await prisma.aIModel.create({
              data: {
                providerId: created.id,
                modelName: m.modelName,
                modelCode: m.modelCode,
                contextWindow: m.contextWindow,
                maxOutputTokens: m.maxOutputTokens,
                inputCostPer1K: m.inputCostPer1K,
                outputCostPer1K: m.outputCostPer1K,
                isDefault: m.isDefault,
                status: "ACTIVE",
              },
            }).catch(() => null);
          }
        } else if (isGemini && envGeminiKey && (!existing.apiKeyEncrypted || existing.connectionStatus !== "CONNECTED")) {
          await prisma.aIProvider.update({
            where: { id: existing.id },
            data: {
              apiKeyEncrypted: encryptApiKey(envGeminiKey),
              status: "ACTIVE",
              connectionStatus: "CONNECTED",
              lastConnectedAt: new Date(),
            },
          });
        }
      }
      _aiProviderSeeded = true;
    } catch (err) {
      console.warn("[aiProviderService] Seed notice:", err.message);
    }
  },

  async getLiveStats() {
    try {
      const logs = await prisma.aILog.findMany({
        select: { providerId: true, requestStatus: true },
        take: 200,
        orderBy: { createdAt: "desc" },
      });

      const stats = {};
      logs.forEach((l) => {
        const pid = (l.providerId || "gemini").toLowerCase();
        if (!stats[pid]) stats[pid] = { total: 0, success: 0 };
        stats[pid].total++;
        if (l.requestStatus === "SUCCESS") stats[pid].success++;
      });

      const result = {};
      Object.keys(stats).forEach((pid) => {
        const s = stats[pid];
        result[pid] = {
          healthScore: s.total > 0 ? Math.round((s.success / s.total) * 100) : 100,
          plansCount: 4,
        };
      });

      return result;
    } catch {
      return {};
    }
  },

  async getAll() {
    await this.ensureSeeded();
    const [providers, stats] = await Promise.all([
      prisma.aIProvider.findMany({
        include: {
          models: true,
          _count: { select: { models: true } },
        },
        orderBy: { priority: "asc" },
      }),
      this.getLiveStats(),
    ]);

    return providers.map((p) => safeProvider(p, stats));
  },

  async getById(id) {
    const p = await prisma.aIProvider.findFirst({
      where: {
        OR: [{ id }, { providerCode: id }],
      },
      include: {
        models: true,
        _count: { select: { models: true } },
      },
    });
    if (!p) return null;
    return safeProvider(p);
  },

  async create(data) {
    const {
      name,
      providerName,
      type,
      providerCode,
      description,
      baseUrl,
      apiVersion,
      api_key,
      apiKey,
      status,
      priority,
      supportsChat,
      supportsVision,
      supportsOCR,
      supportsStreaming,
      models = [],
    } = data;

    const code = (providerCode || type || name || "custom").toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const rawKey = apiKey || api_key;

    const existing = await prisma.aIProvider.findFirst({
      where: { providerCode: code },
    });

    const createData = {
      providerName: providerName || name || code.toUpperCase(),
      providerCode: code,
      description: description || `Dynamic AI model provider for ${code}.`,
      baseUrl: baseUrl || (code.includes("groq") ? "https://api.groq.com/openai/v1" : code.includes("deepseek") ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1"),
      apiVersion: apiVersion || "v1",
      apiKeyEncrypted: rawKey ? encryptApiKey(rawKey.trim()) : null,
      status: status || "ACTIVE",
      connectionStatus: rawKey ? "CONNECTED" : "DISCONNECTED",
      priority: Number(priority) || 10,
      supportsChat: supportsChat !== false,
      supportsVision: Boolean(supportsVision),
      supportsOCR: Boolean(supportsOCR),
      supportsStreaming: supportsStreaming !== false,
    };

    let provider;
    if (existing) {
      provider = await prisma.aIProvider.update({
        where: { id: existing.id },
        data: createData,
        include: { models: true, _count: { select: { models: true } } },
      });
    } else {
      provider = await prisma.aIProvider.create({
        data: createData,
        include: { models: true, _count: { select: { models: true } } },
      });
    }

    // If models specified, register them
    if (Array.isArray(models) && models.length > 0) {
      for (const m of models) {
        const mCode = m.modelCode || m.code || m.name;
        await prisma.aIModel.upsert({
          where: { providerId_modelCode: { providerId: provider.id, modelCode: mCode } },
          update: { modelName: m.modelName || mCode, status: "ACTIVE" },
          create: {
            providerId: provider.id,
            modelName: m.modelName || mCode,
            modelCode: mCode,
            isDefault: Boolean(m.isDefault),
            status: "ACTIVE",
          },
        }).catch(() => null);
      }
    } else {
      // Default model auto-registration
      const defaultModelCode = code.includes("groq") ? "llama-3.3-70b-versatile" : code.includes("deepseek") ? "deepseek-chat" : `${code}-default`;
      await prisma.aIModel.upsert({
        where: { providerId_modelCode: { providerId: provider.id, modelCode: defaultModelCode } },
        update: { status: "ACTIVE" },
        create: {
          providerId: provider.id,
          modelName: `${provider.providerName} Default Model`,
          modelCode: defaultModelCode,
          isDefault: true,
          status: "ACTIVE",
        },
      }).catch(() => null);
    }

    return this.getById(provider.id);
  },

  async update(id, data) {
    const p = await prisma.aIProvider.findFirst({
      where: { OR: [{ id }, { providerCode: id }] },
    });
    if (!p) throw new Error("Provider not found");

    const updateData = {};
    if (data.providerName || data.name) updateData.providerName = data.providerName || data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.baseUrl) updateData.baseUrl = data.baseUrl;
    if (data.apiVersion) updateData.apiVersion = data.apiVersion;
    if (data.status) updateData.status = data.status;
    if (data.apiKey || data.api_key) {
      updateData.apiKeyEncrypted = encryptApiKey((data.apiKey || data.api_key).trim());
      updateData.connectionStatus = "CONNECTED";
    }

    const updated = await prisma.aIProvider.update({
      where: { id: p.id },
      data: updateData,
      include: { models: true, _count: { select: { models: true } } },
    });

    return safeProvider(updated);
  },

  async delete(id) {
    const p = await prisma.aIProvider.findFirst({
      where: { OR: [{ id }, { providerCode: id }] },
    });
    if (!p) throw new Error("Provider not found");

    await prisma.aIProvider.delete({
      where: { id: p.id },
    });

    return { success: true, message: "Provider deleted successfully." };
  },

  async configure(id, { apiKey, defaultModel, baseUrl, apiVersion, status }) {
    const p = await prisma.aIProvider.findFirst({
      where: { OR: [{ id }, { providerCode: id }] },
    });
    if (!p) throw new Error("Provider not found");

    const updateData = {};
    if (apiKey && apiKey.trim() !== "") {
      updateData.apiKeyEncrypted = encryptApiKey(apiKey.trim());
      updateData.status = "ACTIVE";
      updateData.connectionStatus = "CONNECTED";
    }
    if (baseUrl) updateData.baseUrl = baseUrl.trim();
    if (apiVersion) updateData.apiVersion = apiVersion.trim();
    if (status) updateData.status = status;

    const updated = await prisma.aIProvider.update({
      where: { id: p.id },
      data: updateData,
      include: { models: true, _count: { select: { models: true } } },
    });

    if (defaultModel) {
      await prisma.aIModel.updateMany({
        where: { providerId: p.id },
        data: { isDefault: false },
      });
      await prisma.aIModel.updateMany({
        where: { providerId: p.id, modelCode: defaultModel },
        data: { isDefault: true },
      });
    }

    return safeProvider(updated);
  },

  async activate(id) {
    const p = await prisma.aIProvider.findFirst({
      where: { OR: [{ id }, { providerCode: id }] },
    });
    if (!p) throw new Error("Provider not found");
    if (!p.apiKeyEncrypted) {
      throw new Error("Cannot activate provider without configured API credentials. Please configure an API key first.");
    }

    const updated = await prisma.aIProvider.update({
      where: { id: p.id },
      data: { status: "ACTIVE" },
      include: { models: true, _count: { select: { models: true } } },
    });
    return safeProvider(updated);
  },

  async deactivate(id) {
    const p = await prisma.aIProvider.findFirst({
      where: { OR: [{ id }, { providerCode: id }] },
    });
    if (!p) throw new Error("Provider not found");

    const updated = await prisma.aIProvider.update({
      where: { id: p.id },
      data: { status: "INACTIVE" },
      include: { models: true, _count: { select: { models: true } } },
    });
    return safeProvider(updated);
  },

  async testConnection(id) {
    const p = await prisma.aIProvider.findFirst({
      where: { OR: [{ id }, { providerCode: id }] },
    });
    if (!p) return { success: false, status: "failed", message: "Provider not found" };

    const decryptedKey = decryptApiKey(p.apiKeyEncrypted);
    if (!decryptedKey) {
      return {
        success: false,
        status: "failed",
        message: "No API key configured. Please configure credentials first.",
      };
    }

    const config = {
      apiKey: decryptedKey,
      baseUrl: p.baseUrl,
      apiVersion: p.apiVersion,
      timeoutMs: 30000,
    };

    let adapter;
    const code = p.providerCode.toLowerCase();
    if (code.includes("gemini") || code.includes("google")) {
      adapter = new GeminiAdapter(config);
    } else if (code.includes("anthropic") || code.includes("claude")) {
      adapter = new AnthropicAdapter(config);
    } else {
      adapter = new OpenAIAdapter(config);
    }

    const testRes = await adapter.testConnection();

    // Update connection status in DB
    await prisma.aIProvider.update({
      where: { id: p.id },
      data: {
        connectionStatus: testRes.success ? "CONNECTED" : "DISCONNECTED",
        lastConnectedAt: testRes.success ? new Date() : p.lastConnectedAt,
        lastHealthCheckAt: new Date(),
        healthScore: testRes.success ? 100.0 : 0.0,
      },
    }).catch(() => null);

    return testRes;
  },
};

module.exports = aiProviderService;
