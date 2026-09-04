const prisma = require("../config/prismaClient");
const AIGateway = require("./aiGateway/AIGateway");

// In-memory conversation store for conversational threads with tenant & user isolation
const conversationStore = new Map();

const getAuthContext = (req) => {
  const orgId = req.user?.organisation_id || req.user?.organization_id || req.user?.organisationId || 1;
  const userId = req.user?.id || req.user?.userId || "user-1";
  const userRole = req.user?.role || "EMPLOYEE";
  const userName = req.user?.name || req.user?.email || "User";
  const userEmail = req.user?.email || "";
  const department = req.user?.department || req.user?.department_name || "General";
  const team = req.user?.team || req.user?.team_name || "General Team";

  return {
    organisationId: Number(orgId) || 1,
    userId: String(userId),
    userRole,
    userName,
    userEmail,
    department,
    team,
  };
};

const aiChatService = {
  /**
   * Get all available AI models permitted for the caller's organization
   */
  async getAvailableModels(req) {
    const { organisationId } = getAuthContext(req);
    const entitlements = await AIGateway.getOrganisationEntitlements(organisationId);

    // Filter only configured & allowed providers
    const activeProviders = entitlements.allowedProviders.filter((p) => p.isConfiguredOnPlatform);

    const formattedProviders = activeProviders.map((p) => ({
      provider: p.providerCode,
      displayName: p.providerName,
      isAllowed: true,
      isDefault: p.providerCode === "gemini" || p.providerCode === "openai",
      models: (p.models || []).map((m, idx) => ({
        id: m.modelCode || m.id,
        name: m.modelName,
        isDefault: idx === 0,
      })),
    }));

    // If no specific models loaded, fallback to default active provider models
    if (formattedProviders.length === 0) {
      formattedProviders.push({
        provider: "gemini",
        displayName: "Google Gemini",
        isAllowed: true,
        isDefault: true,
        models: [
          { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash (Free & Fast)", isDefault: true },
          { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite", isDefault: false },
        ],
      });
    }

    return {
      success: true,
      planName: entitlements.planName,
      monthlyQuota: entitlements.monthlyQuota,
      usedRequests: entitlements.usedRequests,
      remainingRequests: entitlements.remainingRequests,
      providers: formattedProviders,
      allProviders: entitlements.allProviders,
    };
  },

  /**
   * Send a chat message through the central AI Gateway
   */
  async sendMessage(req) {
    const context = getAuthContext(req);
    const { conversationId, message, provider, model, attachmentName, attachmentUrl } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      const err = new Error("Message content is required.");
      err.statusCode = 400;
      throw err;
    }

    const convId = conversationId || `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Retrieve or initialize conversation
    let conv = conversationStore.get(convId);
    if (!conv || conv.organisationId !== context.organisationId) {
      conv = {
        id: convId,
        organisationId: context.organisationId,
        userId: context.userId,
        userName: context.userName,
        department: context.department,
        team: context.team,
        title: message.slice(0, 45) + (message.length > 45 ? "..." : ""),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      conversationStore.set(convId, conv);
    }

    // Append user message
    const userMsgId = `msg-u-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      role: "user",
      content: message.trim(),
      attachmentName: attachmentName || null,
      attachmentUrl: attachmentUrl || null,
      createdAt: new Date().toISOString(),
    };
    conv.messages.push(userMsg);

    // Build context prompt with conversation history (last 6 messages)
    const recentHistory = conv.messages.slice(-6, -1);
    let fullPrompt = message.trim();
    if (attachmentName) {
      fullPrompt = `[Attached Document Reference: ${attachmentName}]\n${fullPrompt}`;
    }

    const systemPrompt = `You are an enterprise AI assistant for Document Automation SaaS.
Context:
- User: ${context.userName} (${context.userRole})
- Department: ${context.department}
- Team: ${context.team}
Provide clear, formal, structured, high-accuracy enterprise outputs. Format documents with clean headings and sections.`;

    const startTime = Date.now();

    // Call Central AI Gateway
    const aiResult = await AIGateway.execute({
      organisationId: context.organisationId,
      userId: context.userId,
      operation: "generateText",
      feature: "chat",
      module: "ai_assistant",
      provider: provider || "gemini",
      model: model || "gemini-3.6-flash",
      params: {
        prompt: fullPrompt,
        systemPrompt,
        temperature: 0.3,
        maxTokens: 2500,
      },
    });

    const latencyMs = Date.now() - startTime;

    // Resolve display provider & model name
    const providerDisplayName =
      aiResult.provider === "gemini"
        ? "Google Gemini"
        : aiResult.provider === "openai"
        ? "OpenAI"
        : aiResult.provider === "anthropic"
        ? "Anthropic Claude"
        : "AI Provider";

    const modelDisplayName =
      aiResult.model === "gemini-3.6-flash"
        ? "Gemini 3.6 Flash"
        : aiResult.model === "gemini-1.5-flash"
        ? "Gemini 1.5 Flash"
        : aiResult.model === "gpt-4o"
        ? "GPT-4o"
        : aiResult.model === "gpt-4o-mini"
        ? "GPT-4o Mini"
        : aiResult.model || "Default Model";

    const assistantMsgId = `msg-a-${Date.now()}`;
    const assistantMsg = {
      id: assistantMsgId,
      role: "assistant",
      content: aiResult.text,
      provider: {
        id: aiResult.provider,
        name: providerDisplayName,
      },
      model: {
        id: aiResult.model,
        name: modelDisplayName,
      },
      usage: aiResult.usage || { inputTokens: 50, outputTokens: 150, totalTokens: 200 },
      latencyMs,
      createdAt: new Date().toISOString(),
    };

    conv.messages.push(assistantMsg);
    conv.updatedAt = new Date().toISOString();

    // Persist tool run to DB for audit history
    await prisma.departmentAiToolRun.create({
      data: {
        organisation_id: context.organisationId,
        department_name: context.department,
        tool: "AI_CHAT_ASSISTANT",
        title: conv.title,
        input: { prompt: message, provider: aiResult.provider, model: aiResult.model },
        output: { response: aiResult.text, provider: providerDisplayName, model: modelDisplayName },
        status: "COMPLETED",
      },
    }).catch(() => null);

    return {
      success: true,
      conversationId: conv.id,
      title: conv.title,
      message: assistantMsg,
    };
  },

  /**
   * Get user's chat conversations
   */
  async getConversations(req) {
    const context = getAuthContext(req);
    const list = Array.from(conversationStore.values())
      .filter((c) => c.organisationId === context.organisationId && (c.userId === context.userId || context.userRole === "SUPER_ADMIN" || context.userRole === "ORG_ADMIN"))
      .map((c) => ({
        id: c.id,
        title: c.title,
        department: c.department,
        team: c.team,
        messageCount: c.messages.length,
        lastMessage: c.messages[c.messages.length - 1]?.content?.slice(0, 80) || "",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return { success: true, data: list };
  },

  /**
   * Get single conversation with full message history
   */
  async getConversationById(req, id) {
    const context = getAuthContext(req);
    const conv = conversationStore.get(id);

    if (!conv || conv.organisationId !== context.organisationId) {
      // Check if fallback empty conversation needed
      return {
        success: true,
        data: {
          id,
          title: "New Conversation",
          messages: [],
          createdAt: new Date().toISOString(),
        },
      };
    }

    return { success: true, data: conv };
  },

  /**
   * Delete conversation
   */
  async deleteConversation(req, id) {
    const context = getAuthContext(req);
    const conv = conversationStore.get(id);
    if (conv && conv.organisationId === context.organisationId) {
      conversationStore.delete(id);
    }
    return { success: true, message: "Conversation deleted successfully." };
  },
};

module.exports = aiChatService;
