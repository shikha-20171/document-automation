const prisma = require("../config/prismaClient");
const mailTransporter = require("../config/mail");
const PlatformSettingsService = require("../services/platformSettingsService");
const BrevoEmailAdapter = require("../services/integrations/BrevoEmailAdapter");
const WhatsAppAdapter = require("../services/integrations/WhatsAppAdapter");

const DEFAULT_PLATFORM_SETTINGS = {
  general: {
    defaultLanguage: "English (US)",
    defaultTimezone: "Asia/Kolkata (IST)",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12-hour (hh:mm A)",
    maintenanceMode: false,
    maintenanceMessage: "DocuCore AI is currently undergoing scheduled platform maintenance. Services will resume shortly.",
    systemStatus: "OPERATIONAL",
  },
  security: {
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    accountLockoutDuration: 30,
    passwordMinLength: 8,
    passwordComplexity: "STRONG",
    passwordExpiry: "90_DAYS",
    forceMfaSuperAdmin: true,
    loginSecurityAlerts: true,
    concurrentSessionControl: "TERMINATE_PREVIOUS",
  },
  ai: {
    aiServiceEnabled: true,
    defaultProvider: "Google Gemini",
    defaultModel: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    aiRequestTimeout: 30,
    aiRetryAttempts: 2,
    aiFailureHandling: "FALLBACK_MODEL",
    aiUsageTracking: true,
    aiCostMonitoring: true,
    status: "Connected",
  },
  ocr: {
    ocrServiceEnabled: true,
    defaultProvider: "Tesseract OCR (Local Engine)",
    maxFileSizeMb: 50,
    maxPagesPerDoc: 100,
    supportedFileTypes: ["PDF", "PNG", "JPG", "JPEG", "TIFF"],
    ocrTimeout: 60,
    ocrRetryAttempts: 2,
    ocrFailureHandling: "FALLBACK_ENGINE",
    ocrUsageTracking: true,
  },
  storage: {
    maxUploadFileSizeMb: 50,
    allowedFileTypes: "PDF, DOCX, XLSX, PNG, JPG, TIFF, CSV",
    storageRetentionPolicy: "7_YEARS",
    deletedFileRetentionDays: 30,
    temporaryFileRetentionHours: 24,
    storageEncryptionStatus: "AES-256 Enabled (AWS S3-SSE)",
    storageHealthCheck: "HEALTHY",
  },
  email: {
    emailServiceEnabled: true,
    smtpHost: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    smtpPort: Number(process.env.SMTP_PORT) || 587,
    smtpUser: process.env.SMTP_USER || "gourshikha2001@gmail.com",
    smtpPassword: "••••••••••••••••",
    smtpEncryption: "TLS",
    senderName: "DocuCore AI Platform",
    senderEmail: process.env.SMTP_USER || "support@docucore.ai",
    emailVerification: true,
    passwordResetEmails: true,
    userInvitationEmails: true,
    documentWorkflowNotifications: true,
    systemAlerts: true,
    // Gateway configs
    brevoApiKey: process.env.BREVO_API_KEY ? "••••••••••••••••" : "",
    brevoSenderEmail: process.env.SMTP_FROM || "support@docucore.ai",
    brevoStatus: "READY_TO_CONFIGURE",
    whatsappEnabled: false,
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    whatsappBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN ? "••••••••••••••••" : "",
    whatsappStatus: "CONFIGURE",
  },
  privacy: {
    dataRetentionPeriod: "7_YEARS",
    deletedDataRetentionDays: 30,
    auditLogRetention: "7_YEARS",
    automaticCleanupEnabled: true,
    userDataExportPolicy: "FULL_GDPR_EXPORT",
    dataDeletionPolicy: "SOFT_DELETE_GRACE_PERIOD",
  },
  defaults: {
    defaultDocumentSettings: "AUTO_CLASSIFICATION_AND_OCR",
    defaultFileSizeLimitMb: 50,
    defaultNotificationPreferences: "EMAIL_AND_INAPP",
    defaultSessionDurationHours: 12,
    defaultAiOcrAvailability: "ENABLED_FOR_ALL",
  },
};

const getPlatformSettings = async (req, res, next) => {
  try {
    let record = await prisma.platformSetting.findFirst();
    if (!record) {
      record = await prisma.platformSetting.create({
        data: {
          systemName: "DocuCore AI",
          supportEmail: "support@docucore.ai",
          maintenanceMode: false,
          maxFileUploadMb: 50,
          defaultStorageQuotaGb: 500,
          enforceTwoFactor: true,
          sessionTimeoutMinutes: 60,
          customConfig: DEFAULT_PLATFORM_SETTINGS,
        },
      });
    }

    const savedConfig = (record.customConfig && typeof record.customConfig === "object") ? record.customConfig : {};
    const merged = {
      id: record.id,
      systemName: record.systemName,
      supportEmail: record.supportEmail,
      maintenanceMode: record.maintenanceMode,
      general: { ...DEFAULT_PLATFORM_SETTINGS.general, ...(savedConfig.general || {}) },
      security: { ...DEFAULT_PLATFORM_SETTINGS.security, ...(savedConfig.security || {}) },
      ai: { ...DEFAULT_PLATFORM_SETTINGS.ai, ...(savedConfig.ai || {}) },
      ocr: { ...DEFAULT_PLATFORM_SETTINGS.ocr, ...(savedConfig.ocr || {}) },
      storage: { ...DEFAULT_PLATFORM_SETTINGS.storage, ...(savedConfig.storage || {}) },
      email: { ...DEFAULT_PLATFORM_SETTINGS.email, ...(savedConfig.email || {}) },
      privacy: { ...DEFAULT_PLATFORM_SETTINGS.privacy, ...(savedConfig.privacy || {}) },
      defaults: { ...DEFAULT_PLATFORM_SETTINGS.defaults, ...(savedConfig.defaults || {}) },
    };

    // Mask passwords in response
    if (merged.email?.smtpPassword) {
      merged.email.smtpPassword = "••••••••••••••••";
    }
    if (merged.email?.brevoApiKey && merged.email.brevoApiKey.length > 8) {
      merged.email.brevoApiKey = "••••••••••••••••";
    }
    if (merged.email?.whatsappAccessToken && merged.email.whatsappAccessToken.length > 8) {
      merged.email.whatsappAccessToken = "••••••••••••••••";
    }

    res.status(200).json({
      success: true,
      data: merged,
    });
  } catch (error) {
    next(error);
  }
};

const updatePlatformSettings = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const existing = await prisma.platformSetting.findFirst();

    const currentConfig = (existing?.customConfig && typeof existing.customConfig === "object") ? existing.customConfig : {};
    
    // Preserve existing sensitive keys if masked ones were sent back
    const incomingEmail = payload.email || {};
    if (incomingEmail.smtpPassword === "••••••••••••••••" && currentConfig.email?.smtpPassword) {
      incomingEmail.smtpPassword = currentConfig.email.smtpPassword;
    }
    if (incomingEmail.brevoApiKey === "••••••••••••••••" && currentConfig.email?.brevoApiKey) {
      incomingEmail.brevoApiKey = currentConfig.email.brevoApiKey;
    }
    if (incomingEmail.whatsappAccessToken === "••••••••••••••••" && currentConfig.email?.whatsappAccessToken) {
      incomingEmail.whatsappAccessToken = currentConfig.email.whatsappAccessToken;
    }

    const updatedCustomConfig = {
      general: { ...DEFAULT_PLATFORM_SETTINGS.general, ...(currentConfig.general || {}), ...(payload.general || {}) },
      security: { ...DEFAULT_PLATFORM_SETTINGS.security, ...(currentConfig.security || {}), ...(payload.security || {}) },
      ai: { ...DEFAULT_PLATFORM_SETTINGS.ai, ...(currentConfig.ai || {}), ...(payload.ai || {}) },
      ocr: { ...DEFAULT_PLATFORM_SETTINGS.ocr, ...(currentConfig.ocr || {}), ...(payload.ocr || {}) },
      storage: { ...DEFAULT_PLATFORM_SETTINGS.storage, ...(currentConfig.storage || {}), ...(payload.storage || {}) },
      email: { ...DEFAULT_PLATFORM_SETTINGS.email, ...(currentConfig.email || {}), ...incomingEmail },
      privacy: { ...DEFAULT_PLATFORM_SETTINGS.privacy, ...(currentConfig.privacy || {}), ...(payload.privacy || {}) },
      defaults: { ...DEFAULT_PLATFORM_SETTINGS.defaults, ...(currentConfig.defaults || {}), ...(payload.defaults || {}) },
    };

    // Map top-level columns on prisma.platformSetting
    const dataToSave = {
      maintenanceMode: updatedCustomConfig.general.maintenanceMode !== undefined ? Boolean(updatedCustomConfig.general.maintenanceMode) : undefined,
      sessionTimeoutMinutes: updatedCustomConfig.security.sessionTimeout ? Number(updatedCustomConfig.security.sessionTimeout) : undefined,
      enforceTwoFactor: updatedCustomConfig.security.forceMfaSuperAdmin !== undefined ? Boolean(updatedCustomConfig.security.forceMfaSuperAdmin) : undefined,
      maxFileUploadMb: updatedCustomConfig.storage.maxUploadFileSizeMb ? Number(updatedCustomConfig.storage.maxUploadFileSizeMb) : undefined,
      supportEmail: updatedCustomConfig.email.senderEmail || undefined,
      customConfig: updatedCustomConfig,
      updatedAt: new Date(),
    };

    let updated;
    if (existing) {
      updated = await prisma.platformSetting.update({
        where: { id: existing.id },
        data: dataToSave,
      });
    } else {
      updated = await prisma.platformSetting.create({
        data: {
          systemName: "DocuCore AI",
          ...dataToSave,
        },
      });
    }

    // Invalidate PlatformSettingsService cache so changes propagate to all modules immediately
    PlatformSettingsService.invalidateCache();

    res.status(200).json({
      success: true,
      message: "Platform settings saved and propagated across cluster",
      data: updatedCustomConfig,
    });
  } catch (error) {
    next(error);
  }
};

const testEmail = async (req, res, next) => {
  try {
    const { toEmail } = req.body || {};
    const recipient = toEmail || process.env.SMTP_USER || "admin@docucore.ai";

    const mailOptions = {
      to: recipient,
      subject: "DocuCore AI - Super Admin Platform Settings SMTP Test",
      text: "This is a verification email from DocuCore AI Platform Settings.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #1f3561, #274690); padding: 16px 20px; border-radius: 12px; color: #ffffff; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">DocuCore AI Platform</h2>
            <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.85;">SMTP Communication Service</p>
          </div>
          <div style="padding: 24px 0;">
            <h3 style="color: #0f172a; margin-top: 0;">✓ SMTP Verification Successful</h3>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              This test email confirms that your system email service, SMTP host, and notification pipelines are operational.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 12px; color: #334155;">
              <strong>Delivery Target:</strong> ${recipient}<br/>
              <strong>Dispatch Time:</strong> ${new Date().toUTCString()}
            </div>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
            DocuCore Enterprise SaaS Platform • Super Admin Settings
          </div>
        </div>
      `,
    };

    await mailTransporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: `Test email successfully dispatched to ${recipient}`,
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      message: "Email delivery notice: " + error.message,
    });
  }
};

const testBrevo = async (req, res) => {
  try {
    const { apiKey } = req.body || {};
    const keyToTest = (apiKey && apiKey !== "••••••••••••••••") ? apiKey : process.env.BREVO_API_KEY;
    const adapter = new BrevoEmailAdapter({ apiKey: keyToTest });
    const result = await adapter.testConnection();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(200).json({ success: false, status: "ERROR", error: err.message });
  }
};

const testWhatsapp = async (req, res) => {
  try {
    const { accessToken, phoneNumberId, businessAccountId } = req.body || {};
    const tokenToTest = (accessToken && accessToken !== "••••••••••••••••") ? accessToken : process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneIdToTest = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const businessIdToTest = businessAccountId || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    const adapter = new WhatsAppAdapter({
      accessToken: tokenToTest,
      phoneNumberId: phoneIdToTest,
      businessAccountId: businessIdToTest,
    });
    const result = await adapter.testConnection();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(200).json({ success: false, status: "ERROR", error: err.message });
  }
};

module.exports = {
  getPlatformSettings,
  updatePlatformSettings,
  testEmail,
  testBrevo,
  testWhatsapp,
};
