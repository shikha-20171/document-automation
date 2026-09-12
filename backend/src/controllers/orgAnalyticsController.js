const OrgAnalyticsService = require("../services/orgAnalyticsService");

function getOrgId(req) {
  return (
    req.user?.organisationId ||
    req.user?.organisation_id ||
    req.query?.organisationId ||
    1
  );
}

const getFilterOptions = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const data = await OrgAnalyticsService.getFilterOptions(orgId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAnalyticsOverview = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const data = await OrgAnalyticsService.getOverview(orgId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDocumentActivity = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const timeframe = req.query.timeframe || "daily";
    const data = await OrgAnalyticsService.getDocumentActivity(orgId, req.query, timeframe);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStatusDistribution = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const data = await OrgAnalyticsService.getStatusDistribution(orgId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDocumentTypes = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const data = await OrgAnalyticsService.getDocumentTypes(orgId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Backwards-compatible document analytics endpoint
const getDocumentAnalytics = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const [typesRes, statusRes, activityRes] = await Promise.all([
      OrgAnalyticsService.getDocumentTypes(orgId, req.query),
      OrgAnalyticsService.getStatusDistribution(orgId, req.query),
      OrgAnalyticsService.getDocumentActivity(orgId, req.query, "monthly"),
    ]);

    res.status(200).json({
      success: true,
      data: {
        byType: typesRes.types.map((t) => ({ type: t.documentType, count: t.created })),
        byStatus: statusRes.distribution.map((s) => ({ status: s.label, count: s.count })),
        uploadedOverTime: activityRes.series.map((s) => ({ month: s.label, count: s.created })),
        avgProcessingTimeSec: 14.2,
        avgApprovalTurnaroundHours: 8.5,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAiAnalytics = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const timeframe = req.query.timeframe || "daily";
    const data = await OrgAnalyticsService.getAiAnalytics(orgId, req.query, timeframe);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWorkflowAnalytics = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const data = await OrgAnalyticsService.getWorkflowAnalytics(orgId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getApprovalAnalytics = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const data = await OrgAnalyticsService.getApprovalAnalytics(orgId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDepartmentAnalytics = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const data = await OrgAnalyticsService.getDepartmentAnalytics(orgId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBranchAnalytics = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const data = await OrgAnalyticsService.getBranchAnalytics(orgId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserTeamAnalytics = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const data = await OrgAnalyticsService.getUserAnalytics(orgId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSignatureAnalytics = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const data = await OrgAnalyticsService.getSignatureAnalytics(orgId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getClientAnalytics = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const data = await OrgAnalyticsService.getClientAnalytics(orgId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBottlenecks = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const data = await OrgAnalyticsService.getBottlenecks(orgId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const limit = req.query.limit || 10;
    const data = await OrgAnalyticsService.getRecentActivity(orgId, limit);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTopDocuments = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const limit = req.query.limit || 6;
    const data = await OrgAnalyticsService.getTopDocuments(orgId, limit);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReportTable = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const data = await OrgAnalyticsService.getReportTable(orgId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const exportReport = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const result = await OrgAnalyticsService.exportReport(orgId, req.query);

    if (typeof result === "string") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="docucore_report_${Date.now()}.csv"`);
      return res.status(200).send(result);
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStorageAnalytics = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        totalAllocatedGB: 500,
        usedStorageGB: 184.2,
        availableStorageGB: 315.8,
        storageUtilizationPercent: 36.8,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFilterOptions,
  getAnalyticsOverview,
  getDocumentActivity,
  getStatusDistribution,
  getDocumentTypes,
  getDocumentAnalytics,
  getAiAnalytics,
  getWorkflowAnalytics,
  getApprovalAnalytics,
  getDepartmentAnalytics,
  getBranchAnalytics,
  getUserTeamAnalytics,
  getSignatureAnalytics,
  getClientAnalytics,
  getBottlenecks,
  getRecentActivity,
  getTopDocuments,
  getReportTable,
  exportReport,
  getStorageAnalytics,
};
