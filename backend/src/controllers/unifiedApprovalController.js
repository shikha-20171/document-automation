const prisma = require("../config/prismaClient");
const unifiedDocumentService = require("../services/unifiedDocumentService");

const unifiedApprovalController = {
  /**
   * GET /api/approvals
   * List approval requests for current user / role
   */
  async getApprovals(req, res) {
    try {
      const orgId = req.user?.organisationId || req.user?.organisation_id || req.user?.organization_id || 1;
      const userId = req.user?.id || req.user?.userId || null;
      const userRole = (req.user?.role || "").toUpperCase();
      const { status = "", tab = "PENDING", search = "" } = req.query;

      const where = { organisationId: parseInt(orgId, 10) };

      // Status / Tab filtering
      if (tab === "PENDING") {
        where.status = "PENDING";
      } else if (tab === "APPROVED") {
        where.status = "APPROVED";
      } else if (tab === "REJECTED") {
        where.status = "REJECTED";
      } else if (tab === "MY_SUBMISSIONS" && userId) {
        where.requestedById = userId;
      }

      if (status && status !== "ALL") {
        where.status = status.toUpperCase();
      }

      // Role-Based Filtering
      if (userRole === "STAFF") {
        // Employees see requests they submitted
        where.requestedById = userId;
      } else if (userRole === "TEAM_LEADER") {
        // Team Leads see items assigned to their role or team members or themselves
        // If not in MY_SUBMISSIONS tab:
        if (tab !== "MY_SUBMISSIONS") {
          where.OR = [
            { assignedApproverId: userId },
            { assignedApproverRole: "TEAM_LEADER" },
            { assignedApproverRole: null },
            { requestedById: userId },
          ];
        }
      } else if (userRole === "DEPARTMENT_MANAGER") {
        if (tab !== "MY_SUBMISSIONS") {
          where.OR = [
            { assignedApproverId: userId },
            { assignedApproverRole: "DEPARTMENT_MANAGER" },
            { assignedApproverRole: "TEAM_LEADER" },
            { assignedApproverRole: null },
            { requestedById: userId },
          ];
        }
      }

      const requests = await prisma.approvalRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          requestedBy: {
            select: { id: true, full_name: true, email: true },
          },
          unifiedDocument: {
            select: {
              id: true,
              documentNumber: true,
              title: true,
              documentType: true,
              category: true,
              status: true,
              approvalStatus: true,
              signatureStatus: true,
              departmentName: true,
              teamName: true,
              priority: true,
              createdAt: true,
              content: true,
              financialData: true,
            },
          },
          actions: {
            orderBy: { createdAt: "desc" },
            include: { performedBy: { select: { id: true, full_name: true } } },
          },
          history: {
            orderBy: { createdAt: "desc" },
            include: { user: { select: { id: true, full_name: true } } },
          },
        },
      });

      const formatted = requests.map((reqItem) => {
        const doc = reqItem.unifiedDocument || {};
        return {
          id: reqItem.id,
          documentId: doc.id || reqItem.documentId || reqItem.unifiedDocumentId,
          documentName: doc.title || reqItem.documentName,
          documentNumber: doc.documentNumber || "DOC",
          documentType: doc.documentType || "Business Document",
          category: doc.category || "General",
          submittedBy: reqItem.requestedBy?.full_name || "Employee Associate",
          submittedEmail: reqItem.requestedBy?.email || "employee@docucore.ai",
          department: doc.departmentName || "Operations",
          team: doc.teamName || "Operations Team",
          submittedDate: reqItem.createdAt.toISOString(),
          dueDate: reqItem.dueAt ? reqItem.dueAt.toISOString() : null,
          status: reqItem.status,
          stage: reqItem.stage || reqItem.status,
          priority: doc.priority || "NORMAL",
          comments: reqItem.comments || "Pending review",
          previousApprover: reqItem.previousApproverName || "None",
          currentApprover: reqItem.currentApproverName || reqItem.assignedApproverRole || "Assigned Reviewer",
          canSendForSignature: reqItem.status === "APPROVED" || doc.approvalStatus === "APPROVED",
          history: reqItem.history?.map((h) => ({
            action: h.action,
            user: h.user?.full_name || h.userRole || "Reviewer",
            time: h.createdAt.toISOString(),
            comment: h.comment,
          })) || [],
          actions: reqItem.actions?.map((a) => ({
            action: a.action,
            user: a.performedBy?.full_name || "Reviewer",
            time: a.createdAt.toISOString(),
            comment: a.comment,
          })) || [],
        };
      });

      return res.json({ success: true, data: formatted, total: formatted.length });
    } catch (err) {
      console.error("[UnifiedApprovalController.getApprovals]", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * GET /api/approvals/:id
   * Get single approval request details
   */
  async getApprovalById(req, res) {
    try {
      const orgId = req.user?.organisationId || req.user?.organisation_id || req.user?.organization_id || 1;
      const { id } = req.params;

      const approvalReq = await prisma.approvalRequest.findFirst({
        where: { id, organisationId: parseInt(orgId, 10) },
        include: {
          requestedBy: { select: { id: true, full_name: true, email: true } },
          unifiedDocument: {
            include: {
              versions: { orderBy: { versionNumber: "desc" }, take: 5 },
              shares: true,
              comments: { orderBy: { createdAt: "desc" } },
            },
          },
          actions: {
            orderBy: { createdAt: "desc" },
            include: { performedBy: { select: { id: true, full_name: true } } },
          },
          history: {
            orderBy: { createdAt: "desc" },
            include: { user: { select: { id: true, full_name: true } } },
          },
        },
      });

      if (!approvalReq) {
        return res.status(404).json({ success: false, message: "Approval request not found." });
      }

      return res.json({ success: true, data: approvalReq });
    } catch (err) {
      console.error("[UnifiedApprovalController.getApprovalById]", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/approvals/submit
   * Submit document for approval
   */
  async submitApproval(req, res) {
    try {
      const orgId = req.user?.organisationId || req.user?.organisation_id || req.user?.organization_id || 1;
      const { documentId, approverId, approverRole, comments } = req.body;

      if (!documentId) {
        return res.status(400).json({ success: false, message: "documentId is required." });
      }

      const result = await unifiedDocumentService.submitForApproval(
        documentId,
        parseInt(orgId, 10),
        { approverId, approverRole, comments },
        req.user,
        req
      );

      return res.status(201).json({ success: true, message: "Submitted for approval successfully.", data: result });
    } catch (err) {
      console.error("[UnifiedApprovalController.submitApproval]", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/approvals/:id/action
   * Handle Approve / Reject / Request Changes
   */
  async handleAction(req, res) {
    try {
      const orgId = req.user?.organisationId || req.user?.organisation_id || req.user?.organization_id || 1;
      const { id } = req.params;
      const { action, comment = "", comments = "" } = req.body;
      const decisionComment = comment || comments;

      // Find approval request to locate unified document
      const approvalReq = await prisma.approvalRequest.findFirst({
        where: { id, organisationId: parseInt(orgId, 10) },
      });

      if (!approvalReq) {
        return res.status(404).json({ success: false, message: "Approval request not found." });
      }

      const docId = approvalReq.unifiedDocumentId;
      if (!docId) {
        return res.status(400).json({ success: false, message: "No document attached to this approval request." });
      }

      const result = await unifiedDocumentService.processApproval(
        docId,
        parseInt(orgId, 10),
        { action, comments: decisionComment },
        req.user,
        req
      );

      return res.json({
        success: true,
        message: `Approval request ${action.toLowerCase()} successfully.`,
        data: result,
        canSendForSignature: result.canSendForSignature,
      });
    } catch (err) {
      console.error("[UnifiedApprovalController.handleAction]", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = unifiedApprovalController;
