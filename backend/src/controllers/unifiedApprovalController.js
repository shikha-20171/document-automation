const prisma = require("../config/prismaClient");
const unifiedDocumentService = require("../services/unifiedDocumentService");
const { getOrgIdSafe, getUserId, getUserRole, getAuthContext } = require("../utils/authContext");

function formatApprovalRequest(reqItem) {
  if (!reqItem) return null;
  const doc = reqItem.unifiedDocument || {};
  const currentStep =
    reqItem.currentStepOrder ||
    (reqItem.stage === "STAGE_DEPARTMENT_MANAGER"
      ? 2
      : reqItem.stage === "STAGE_ORGANISATION_ADMIN" || reqItem.status === "APPROVED"
      ? 3
      : 1);

  return {
    id: reqItem.id,
    documentId: doc.id || reqItem.documentId || reqItem.unifiedDocumentId,
    documentName: doc.title || reqItem.documentName || "Enterprise Document",
    documentNumber: doc.documentNumber || `DOC-${String(reqItem.id).slice(0, 8)}`,
    documentType: doc.documentType || "Business Document",
    category: doc.category || "General",
    submittedBy: reqItem.requestedBy?.full_name || "Employee Associate",
    submittedEmail: reqItem.requestedBy?.email || "employee@docucore.ai",
    department: doc.departmentName || "Operations",
    departmentId: doc.departmentId || null,
    team: doc.teamName || "Operations Team",
    teamId: doc.teamId || null,
    clientName: doc.clientName || null,
    clientEmail: doc.clientEmail || null,
    submittedDate: reqItem.createdAt ? reqItem.createdAt.toISOString() : new Date().toISOString(),
    createdAt: reqItem.createdAt ? reqItem.createdAt.toISOString() : new Date().toISOString(),
    dueDate: reqItem.dueAt ? reqItem.dueAt.toISOString() : null,
    status: reqItem.status,
    stage: reqItem.stage || reqItem.status,
    currentStepOrder: currentStep,
    totalSteps: 3,
    assignedApproverRole: reqItem.assignedApproverRole || "TEAM_LEADER",
    priority: doc.priority || "NORMAL",
    comments: reqItem.comments || "Pending review",
    previousApprover: reqItem.previousApproverName || "None",
    currentApprover: reqItem.currentApproverName || reqItem.assignedApproverRole || "Assigned Reviewer",
    canSendForSignature: reqItem.status === "APPROVED" || doc.approvalStatus === "APPROVED",
    history: (reqItem.history || []).map((h, idx) => ({
      id: h.id || `hist-${idx}`,
      action: h.action,
      user: h.user?.full_name || h.userRole || "Reviewer",
      time: h.createdAt ? h.createdAt.toISOString() : new Date().toISOString(),
      createdAt: h.createdAt ? h.createdAt.toISOString() : new Date().toISOString(),
      comment: h.comment,
    })),
    actions: (reqItem.actions || []).map((a, idx) => ({
      id: a.id || `act-${idx}`,
      action: a.action,
      user: a.performedBy?.full_name || "Reviewer",
      time: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
      createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
      comment: a.comment,
    })),
    unifiedDocument: doc,
    document: doc,
  };
}

const unifiedApprovalController = {
  async getApprovals(req, res) {
    try {
      const ctx = getAuthContext(req);
      const orgId = getOrgIdSafe(req);
      const { userId, role: userRole, departmentId: userDeptId } = ctx;
      const { status = "", tab = "PENDING" } = req.query;

      const where = { organisationId: parseInt(orgId, 10) };

      if (tab === "PENDING") { where.status = "PENDING"; }
      else if (tab === "APPROVED") { where.status = "APPROVED"; }
      else if (tab === "REJECTED") { where.status = "REJECTED"; }
      else if (tab === "MY_SUBMISSIONS" && userId) { where.requestedById = userId; }

      if (status && status !== "ALL" && tab !== "MY_SUBMISSIONS") {
        where.status = status.toUpperCase();
      }

      if (userRole === "STAFF" || userRole === "EMPLOYEE") {
        where.requestedById = userId;
      } else if (userRole === "TEAM_LEADER") {
        if (tab === "PENDING") {
          where.AND = [
            {
              OR: [
                { assignedApproverRole: "TEAM_LEADER" },
                { assignedApproverId: userId },
                { stage: "STAGE_TEAM_LEADER" },
                { currentStepOrder: 1 },
              ],
            },
            ...(userDeptId
              ? [{ unifiedDocument: { OR: [{ departmentId: userDeptId }, { departmentId: null }] } }]
              : []),
          ];
        } else if (tab === "MY_SUBMISSIONS") {
          where.requestedById = userId;
        }
      } else if (userRole === "DEPARTMENT_MANAGER") {
        if (tab === "PENDING") {
          where.AND = [
            {
              OR: [
                { assignedApproverRole: "DEPARTMENT_MANAGER" },
                { assignedApproverId: userId },
                { stage: "STAGE_DEPARTMENT_MANAGER" },
                { currentStepOrder: 2 },
              ],
            },
            ...(userDeptId
              ? [{ unifiedDocument: { OR: [{ departmentId: userDeptId }, { departmentId: null }] } }]
              : []),
          ];
        } else if (tab === "MY_SUBMISSIONS") {
          where.requestedById = userId;
        }
      } else if (userRole === "ORGANISATION_ADMIN" || userRole === "SUPER_ADMIN") {
        if (tab === "PENDING") {
          where.OR = [
            { assignedApproverRole: "ORGANISATION_ADMIN" },
            { assignedApproverId: userId },
            { stage: "STAGE_ORGANISATION_ADMIN" },
            { currentStepOrder: 3 },
          ];
        } else if (tab === "MY_SUBMISSIONS") {
          where.requestedById = userId;
        }
      }

      const requests = await prisma.approvalRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          requestedBy: { select: { id: true, full_name: true, email: true } },
          unifiedDocument: {
            select: { id: true, documentNumber: true, title: true, documentType: true, category: true, status: true, approvalStatus: true, signatureStatus: true, departmentId: true, departmentName: true, teamId: true, teamName: true, priority: true, createdAt: true, content: true, financialData: true, clientName: true, clientEmail: true },
          },
          actions: { orderBy: { createdAt: "desc" }, include: { performedBy: { select: { id: true, full_name: true } } } },
          history: { orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, full_name: true } } } },
        },
      });

      const formatted = requests.map(formatApprovalRequest);

      return res.json({ success: true, data: formatted, total: formatted.length });
    } catch (err) {
      console.error("[UnifiedApprovalController.getApprovals]", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getApprovalById(req, res) {
    try {
      const orgId = getOrgIdSafe(req);
      const approvalReq = await prisma.approvalRequest.findFirst({
        where: { id: req.params.id, organisationId: parseInt(orgId, 10) },
        include: {
          requestedBy: { select: { id: true, full_name: true, email: true } },
          unifiedDocument: { include: { versions: { orderBy: { versionNumber: "desc" }, take: 5 }, shares: true, comments: { orderBy: { createdAt: "desc" } } } },
          actions: { orderBy: { createdAt: "desc" }, include: { performedBy: { select: { id: true, full_name: true } } } },
          history: { orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, full_name: true } } } },
        },
      });
      if (!approvalReq) return res.status(404).json({ success: false, message: "Approval request not found." });
      return res.json({ success: true, data: formatApprovalRequest(approvalReq) });
    } catch (err) {
      console.error("[UnifiedApprovalController.getApprovalById]", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async submitApproval(req, res) {
    try {
      const orgId = getOrgIdSafe(req);
      const { documentId, approverId, approverRole, comments } = req.body;
      if (!documentId) return res.status(400).json({ success: false, message: "documentId is required." });
      const result = await unifiedDocumentService.submitForApproval(documentId, parseInt(orgId, 10), { approverId, approverRole, comments }, req.user, req);
      return res.status(201).json({ success: true, message: "Submitted for approval successfully.", data: result });
    } catch (err) {
      console.error("[UnifiedApprovalController.submitApproval]", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async handleAction(req, res) {
    try {
      const orgId = getOrgIdSafe(req);
      const { id } = req.params;
      const { action, comment = "", comments = "", forwardToRole } = req.body;
      const decisionComment = comment || comments;

      const approvalReq = await prisma.approvalRequest.findFirst({ where: { id, organisationId: parseInt(orgId, 10) } });
      if (!approvalReq) return res.status(404).json({ success: false, message: "Approval request not found." });

      const docId = approvalReq.unifiedDocumentId;
      if (!docId) return res.status(400).json({ success: false, message: "No document attached to this approval request." });

      const result = await unifiedDocumentService.processApproval(
        docId,
        parseInt(orgId, 10),
        { action, comments: decisionComment, forwardToRole },
        req.user,
        req
      );

      // Fetch refreshed approval request with actions & history
      const updatedReq = await prisma.approvalRequest.findFirst({
        where: { id, organisationId: parseInt(orgId, 10) },
        include: {
          requestedBy: { select: { id: true, full_name: true, email: true } },
          unifiedDocument: {
            select: { id: true, documentNumber: true, title: true, documentType: true, category: true, status: true, approvalStatus: true, signatureStatus: true, departmentId: true, departmentName: true, teamId: true, teamName: true, priority: true, createdAt: true, content: true, financialData: true, clientName: true, clientEmail: true },
          },
          actions: { orderBy: { createdAt: "desc" }, include: { performedBy: { select: { id: true, full_name: true } } } },
          history: { orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, full_name: true } } } },
        },
      });

      const formatted = formatApprovalRequest(updatedReq);

      return res.json({
        success: true,
        message: `Approval request ${action.toLowerCase()} processed successfully.`,
        data: formatted,
        canSendForSignature: result?.canSendForSignature || false,
      });
    } catch (err) {
      console.error("[UnifiedApprovalController.handleAction]", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = unifiedApprovalController;
