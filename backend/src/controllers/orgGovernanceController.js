const prisma = require("../config/prismaClient");

/**
 * Organisation Governance & Policy Controller
 */

const getSecurityPolicy = async (req, res) => {
  try {
    const orgId = Number(req.user?.organisation_id || req.user?.organization_id);

    let policy = await prisma.securityPolicy.findUnique({
      where: { organisationId: orgId },
    });

    if (!policy) {
      policy = await prisma.securityPolicy.create({
        data: {
          organisationId: orgId,
          mfaEnforced: false,
          passwordMinLength: 8,
          sessionTimeoutMinutes: 60,
          ipAllowlist: [],
          maxLoginAttempts: 5,
        },
      });
    }

    return res.json({ success: true, data: policy });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateSecurityPolicy = async (req, res) => {
  try {
    const orgId = Number(req.user?.organisation_id || req.user?.organization_id);
    const {
      mfaEnforced,
      passwordMinLength,
      sessionTimeoutMinutes,
      ipAllowlist,
      maxLoginAttempts,
    } = req.body;

    const policy = await prisma.securityPolicy.upsert({
      where: { organisationId: orgId },
      create: {
        organisationId: orgId,
        mfaEnforced: !!mfaEnforced,
        passwordMinLength: passwordMinLength ? Number(passwordMinLength) : 8,
        sessionTimeoutMinutes: sessionTimeoutMinutes ? Number(sessionTimeoutMinutes) : 60,
        ipAllowlist: Array.isArray(ipAllowlist) ? ipAllowlist : [],
        maxLoginAttempts: maxLoginAttempts ? Number(maxLoginAttempts) : 5,
      },
      update: {
        mfaEnforced: mfaEnforced !== undefined ? !!mfaEnforced : undefined,
        passwordMinLength: passwordMinLength !== undefined ? Number(passwordMinLength) : undefined,
        sessionTimeoutMinutes: sessionTimeoutMinutes !== undefined ? Number(sessionTimeoutMinutes) : undefined,
        ipAllowlist: Array.isArray(ipAllowlist) ? ipAllowlist : undefined,
        maxLoginAttempts: maxLoginAttempts !== undefined ? Number(maxLoginAttempts) : undefined,
      },
    });

    return res.json({ success: true, message: "Security policy updated.", data: policy });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAiPolicies = async (req, res) => {
  try {
    const orgId = Number(req.user?.organisation_id || req.user?.organization_id);

    const policies = await prisma.aiUsagePolicy.findMany({
      where: { organisationId: orgId },
    });

    return res.json({ success: true, data: policies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateAiPolicy = async (req, res) => {
  try {
    const orgId = Number(req.user?.organisation_id || req.user?.organization_id);
    const { departmentId, monthlyQuotaRequests, allowedProviders, allowedTools } = req.body;

    const policy = await prisma.aiUsagePolicy.create({
      data: {
        organisationId: orgId,
        departmentId: departmentId ? Number(departmentId) : null,
        monthlyQuotaRequests: monthlyQuotaRequests ? Number(monthlyQuotaRequests) : 10000,
        allowedProviders: Array.isArray(allowedProviders) ? allowedProviders : ["GEMINI", "OPENAI", "CLAUDE"],
        allowedTools: Array.isArray(allowedTools) ? allowedTools : ["DOCUMENT_GENERATION", "OCR", "QA", "SUMMARIZATION"],
      },
    });

    return res.json({ success: true, message: "AI policy created/updated.", data: policy });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSecurityPolicy,
  updateSecurityPolicy,
  getAiPolicies,
  updateAiPolicy,
};
