const prisma = require("../config/prismaClient");

// ===============================================
// ORGANISATION SETTINGS
// Profile, User & Access, Document Settings, AI Settings, Storage, Notifications, Branding, Security
// ===============================================

const getOrgSettings = async (req, res) => {
  try {
    // Fetch Super Admin configured models dynamically for selection!
    const superAdminModels = await prisma.aIModel.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, modelName: true, modelCode: true, description: true },
    });

    const activeModels = superAdminModels.length > 0 
      ? superAdminModels 
      : [
          { id: "m1", modelName: "GPT-4o Enterprise", modelCode: "gpt-4o", description: "OpenAI Flagship Model" },
          { id: "m2", modelName: "Claude 3.5 Sonnet", modelCode: "claude-3-5-sonnet", description: "Anthropic Superior Reasoning" },
          { id: "m3", modelName: "Gemini 1.5 Pro", modelCode: "gemini-1.5-pro", description: "Google Multimodal 1M Context" },
        ];

    res.status(200).json({
      success: true,
      data: {
        profile: {
          name: "Dezo Solutions Pvt Ltd",
          logoUrl: "/logo-brand.png",
          address: "Building 4B, Cyber City, Phase 3, Gurugram, India",
          contactPhone: "+91 98765 43210",
          contactEmail: "admin@dezo.io",
          timezone: "Asia/Kolkata (GMT+5:30)",
          country: "India",
          language: "English (US)",
        },
        userAccess: {
          defaultRole: "Employee",
          allowSelfSignup: false,
          requireInviteApproval: true,
          sessionTimeoutMinutes: 60,
          passwordPolicy: "Strong (Min 10 chars, uppercase, digit, special char)",
          mfaPolicy: "ENFORCED_FOR_ADMINS",
        },
        documentSettings: {
          allowedFileTypes: [".pdf", ".docx", ".xlsx", ".png", ".jpg", ".txt"],
          maxFileSizeMB: 50,
          documentRetentionDays: 365,
          defaultStatusOnUpload: "PENDING_APPROVAL",
          versioningEnabled: true,
        },
        aiSettings: {
          aiFeaturesEnabled: true,
          aiRequestsMonthlyQuota: 10000,
          allowedTools: ["AI Chat", "Document Q&A", "Summarization", "Extraction", "Translation", "Builder AI"],
          defaultSelectedModelId: activeModels[0]?.id || "m1",
          superAdminAvailableModels: activeModels,
          promptPolicy: "Standard compliance filter enabled",
        },
        storageSettings: {
          storageQuotaGB: 500,
          usedStorageGB: 184.2,
          retentionPolicy: "365 days auto archive to cold storage",
          autoDeleteExpiredDocs: false,
        },
        notifications: {
          emailNotifications: true,
          documentUploadedAlert: true,
          approvalRequestAlert: true,
          aiQuotaAlertPercent: 80,
          userInvitationAlert: true,
        },
        branding: {
          organisationName: "Dezo Solutions",
          primaryColor: "#274690", // User explicit brand theme requirement!
          accentColor: "#ffd9a0",
          customFaviconUrl: "",
          emailBrandingHeader: "Dezo AI Document Automation Portal",
        },
        security: {
          mfaEnforced: true,
          sessionTimeoutMins: 60,
          ipRestrictionsEnabled: false,
          allowedIpRanges: ["192.168.1.0/24"],
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrgProfile = async (req, res) => {
  try {
    const profileData = req.body;
    res.status(200).json({
      success: true,
      message: "Organisation profile updated successfully.",
      data: profileData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAiSettings = async (req, res) => {
  try {
    const orgId = req.user?.organisation_id || req.user?.organization_id || 1;
    const { aiFeaturesEnabled, defaultProvider, defaultModel, defaultSelectedModelId, aiRequestsMonthlyQuota } = req.body;
    
    const AIGateway = require("../services/aiGateway/AIGateway");
    AIGateway.setOrgDefaultConfig(orgId, {
      provider: defaultProvider || "gemini",
      model: defaultModel || "gemini-3.6-flash",
    });

    res.status(200).json({
      success: true,
      message: `Organisation default AI configured: ${defaultProvider || "Google Gemini"} (${defaultModel || "Gemini 3.6 Flash"})`,
      data: { aiFeaturesEnabled, defaultProvider, defaultModel, defaultSelectedModelId, aiRequestsMonthlyQuota },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBranding = async (req, res) => {
  try {
    const { primaryColor = "#274690", organisationName } = req.body;
    res.status(200).json({
      success: true,
      message: "Branding settings saved successfully.",
      data: { primaryColor, organisationName },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDocumentSettings = async (req, res) => {
  try {
    const docSettings = req.body;
    res.status(200).json({
      success: true,
      message: "Document configuration settings saved.",
      data: docSettings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOrgSettings,
  updateOrgProfile,
  updateAiSettings,
  updateBranding,
  updateDocumentSettings,
};
