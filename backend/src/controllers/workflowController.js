const workflowService = require("../services/workflowService");
const prisma = require("../config/prismaClient");

const DEFAULT_ORG_ID = 1;
const DEFAULT_USER_ID = 1;

const getContext = (req) => ({
  organisationId: req.user?.organisation_id || req.user?.organisationId || req.user?.organization_id || DEFAULT_ORG_ID,
  userId: req.user?.id || req.user?.userId || DEFAULT_USER_ID,
});

/**
 * Get all workflows for the authenticated organisation
 */
const getWorkflows = async (req, res) => {
  try {
    const context = getContext(req);
    const { status, search, page = 1, limit = 50 } = req.query;

    const data = await workflowService.getWorkflows({
      organisationId: parseInt(context.organisationId, 10),
      status: status && status !== "ALL" ? status.toUpperCase() : undefined,
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch workflows.",
    });
  }
};

/**
 * Get workflow by ID
 */
const getWorkflowById = async (req, res) => {
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id);
    return res.status(200).json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const createWorkflow = async (req) => {
  const context = getContext(req);
  const orgId = parseInt(context.organisationId, 10) || 1;
  let userId = parseInt(context.userId, 10);

  // Validate user exists in DB to prevent foreign key failure
  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) {
    const adminUser = await prisma.user.findFirst({
      where: { organisation_id: orgId },
    });
    userId = adminUser ? adminUser.id : 26;
  }

  const {
    name,
    description,
    appliesTo,
    department,
    trigger,
    logicType,
    logicRequirement,
    status = "ACTIVE",
    steps = [],
  } = req.body;

  const created = await workflowService.createWorkflow(
    {
      name,
      description,
      appliesTo: appliesTo || "ALL",
      department: department || null,
      trigger: trigger || "DOCUMENT_SUBMITTED",
      logicType: logicType || "SEQUENTIAL",
      logicRequirement: logicRequirement || "ALL_REQUIRED",
      status: status ? status.toUpperCase() : "ACTIVE",
      organisationId: orgId,
      createdById: userId,
    },
    steps
  );

  return created;
};

const createWorkflowHandler = async (req, res) => {
  try {
    const created = await createWorkflow(req);
    return res.status(201).json({
      success: true,
      message: `Workflow "${created.name}" created successfully!`,
      data: created,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create workflow.",
    });
  }
};

/**
 * Update existing workflow
 */
const updateWorkflow = async (req, res) => {
  try {
    const updated = await workflowService.updateWorkflow(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Workflow updated successfully.",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Toggle workflow status
 */
const toggleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await workflowService.toggleWorkflowStatus(req.params.id, (status || "ACTIVE").toUpperCase());
    return res.status(200).json({
      success: true,
      message: `Workflow status changed to ${updated.status}`,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete workflow
 */
const deleteWorkflow = async (req, res) => {
  try {
    await workflowService.deleteWorkflow(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Workflow deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get live approval requests for Org Admin
 */
const getApprovalRequests = async (req, res) => {
  try {
    const context = getContext(req);
    const orgId = parseInt(context.organisationId, 10);

    const rawRequests = await prisma.approvalRequest.findMany({
      where: { organisationId: orgId },
      include: {
        requestedBy: { select: { id: true, full_name: true, email: true } },
        document: true,
        workflow: true,
        actions: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    const dbFormatted = rawRequests.map((r) => {
      let st = (r.status || "").toUpperCase();
      let normalizedStatus = "Pending";
      if (st === "APPROVED") normalizedStatus = "Approved";
      else if (st === "REJECTED") normalizedStatus = "Rejected";
      else if (st === "CHANGES_REQUESTED" || st === "CHANGES_REQUIRED") normalizedStatus = "Changes Requested";
      else if (st === "FORWARDED" || st === "PENDING" || st === "IN_REVIEW") normalizedStatus = "Pending";

      return {
        id: r.id,
        documentId: r.documentId,
        documentName: r.documentName || r.document?.name || "Document",
        submittedBy: r.requestedBy?.full_name || "Employee",
        submittedEmail: r.requestedBy?.email || "employee@docucore.ai",
        submittedAt: r.createdAt ? r.createdAt.toISOString().split("T")[0] : "Recent",
        workflowName: r.workflow?.name || "Document Verification",
        department: r.workflow?.department || "Operations & Logistics",
        status: normalizedStatus,
        priority: "HIGH",
        notes: r.actions?.[0]?.comment || "",
        history: r.actions?.map((a) => ({
          action: a.action,
          user: "Reviewer",
          time: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
          comment: a.comment,
        })) || [],
      };
    });

    // Merge from memory cache
    const employeeService = require("../services/employeeService");
    const cache = employeeService.employeeApprovalsCache || [];
    const cacheFormatted = cache.map((c) => {
      let st = (c.status || "").toUpperCase();
      let normalizedStatus = "Pending";
      if (st.includes("APPROV")) normalizedStatus = "Approved";
      else if (st.includes("REJECT")) normalizedStatus = "Rejected";
      else if (st.includes("CHANGE")) normalizedStatus = "Changes Requested";
      else normalizedStatus = "Pending";

      return {
        id: c.id,
        documentId: Number(c.documentId) || 0,
        documentName: c.documentName || "Document",
        submittedBy: c.history?.[0]?.user || "Employee",
        submittedEmail: "employee@docucore.ai",
        submittedAt: "Recent",
        workflowName: c.category || "General Document Workflow",
        department: "Operations & Logistics",
        status: normalizedStatus,
        priority: "HIGH",
        notes: c.comments?.[0]?.text || "Pending Executive Sign-Off",
        history: c.history?.map((h) => ({
          action: h.step || "Step",
          user: h.user || "Reviewer",
          time: new Date().toISOString(),
          comment: h.status || "Processed",
        })) || [],
      };
    });

    const seenIds = new Set(dbFormatted.map((x) => String(x.id)));
    const seenNames = new Set(dbFormatted.map((x) => x.documentName.toLowerCase()));
    const combined = [...dbFormatted];
    for (const item of cacheFormatted) {
      if (!seenIds.has(String(item.id)) && !seenNames.has(item.documentName.toLowerCase())) {
        combined.push(item);
      }
    }

    return res.status(200).json({
      success: true,
      data: combined,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Duplicate a workflow
 */
const duplicateWorkflow = async (req, res) => {
  try {
    const context = getContext(req);
    const original = await workflowService.getWorkflowById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: "Workflow not found." });
    }

    const duplicated = await workflowService.createWorkflow(
      {
        name: `${original.name} (Copy)`,
        description: original.description,
        appliesTo: original.appliesTo,
        department: original.department,
        trigger: original.trigger,
        logicType: original.logicType,
        logicRequirement: original.logicRequirement,
        status: "DRAFT",
        approvalDeadlineDays: original.approvalDeadlineDays,
        reminderAfterHours: original.reminderAfterHours,
        escalationAfterHours: original.escalationAfterHours,
        commentsRequiredOnRejection: original.commentsRequiredOnRejection,
        allowRequestChanges: original.allowRequestChanges,
        organisationId: original.organisationId,
        createdById: context.userId,
      },
      (original.steps || []).map((s) => ({
        stepOrder: s.stepOrder,
        name: s.name,
        approverType: s.approverType,
        approvalType: s.approvalType,
        externalApproverName: s.externalApproverName,
        externalApproverEmail: s.externalApproverEmail,
        externalApproverCompany: s.externalApproverCompany,
      }))
    );

    return res.status(201).json({
      success: true,
      message: `Workflow duplicated as "${duplicated.name}"`,
      data: duplicated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Process approval request action (APPROVE, REJECT, REQUEST_CHANGES)
 */
const processOrgApprovalAction = async (req, res) => {
  try {
    const context = getContext(req);
    const { id } = req.params;
    const { action, comment } = req.body;

    const approvalService = require("../services/approvalService");
    const updated = await approvalService.processApprovalAction({
      approvalRequestId: id,
      action: action || "APPROVE",
      userId: Number(context.userId),
      userRole: "ORG_ADMIN",
      comment: comment || "",
    });

    // Update memory cache
    const employeeService = require("../services/employeeService");
    const cache = employeeService.employeeApprovalsCache || [];
    const found = cache.find((c) => c.id === id || String(c.documentId) === String(id));
    if (found) {
      found.status = action === "APPROVE" ? "Approved" : action === "REJECT" ? "Rejected" : "Changes Requested";
      found.stage = `Organisation Admin (${found.status})`;
      if (comment) {
        found.comments = found.comments || [];
        found.comments.unshift({ user: "Organisation Admin", text: comment, time: new Date().toLocaleTimeString() });
      }
    }

    const docCache = employeeService.employeeDocumentsCache || [];
    const foundDoc = docCache.find((d) => d.id === id || d.id === found?.documentId || String(d.dbId) === String(id));
    if (foundDoc) {
      foundDoc.status = action === "APPROVE" ? "Approved" : action === "REJECT" ? "Rejected" : "Changes Requested";
      foundDoc.reviewer = "Organisation Admin";
      foundDoc.history = foundDoc.history || [];
      foundDoc.history.unshift({
        action: `Organisation Admin: ${action}`,
        user: "Organisation Admin",
        date: new Date().toLocaleString(),
      });
    }

    // Dispatch real-time notification
    try {
      const { dispatchNotification } = require("../utils/notificationDispatcher");
      const docTitle = foundDoc?.name || found?.documentName || "Document";
      await dispatchNotification({
        organisationId: context.organisationId,
        title: `Organisation Admin ${action === 'APPROVE' ? 'Approved' : action === 'REJECT' ? 'Rejected' : 'Requested Changes on'} Document`,
        message: `"${docTitle}" was marked as ${action} by Organisation Admin. Comment: ${comment || 'None'}`,
        type: "APPROVAL",
        priority: "HIGH",
        link: "/org-admin/workflows?tab=approval-requests",
        relatedDocument: docTitle,
      });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: `Document approval action "${action}" processed successfully.`,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get workflow execution history logs
 */
const getWorkflowHistory = async (req, res) => {
  try {
    const context = getContext(req);
    const orgId = parseInt(context.organisationId, 10);

    const historyItems = await prisma.approvalHistoryItem.findMany({
      where: {
        approvalRequest: { organisationId: orgId },
      },
      include: {
        user: { select: { id: true, full_name: true, email: true } },
        approvalRequest: {
          include: {
            workflow: { select: { id: true, name: true, appliesTo: true, department: true } },
            document: { select: { id: true, name: true, type: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formatted = historyItems.map((h) => ({
      id: h.id,
      requestId: h.approvalRequestId,
      workflowName: h.approvalRequest?.workflow?.name || "General Workflow",
      documentName: h.approvalRequest?.documentName || h.approvalRequest?.document?.name || "Document",
      department: h.approvalRequest?.workflow?.department || "Operations",
      action: h.action,
      user: h.user?.full_name || "Organisation Admin",
      role: h.userRole || "Admin",
      comment: h.comment || "",
      date: h.createdAt ? h.createdAt.toISOString().split("T")[0] : "Recent",
      time: h.createdAt ? h.createdAt.toLocaleTimeString() : "Recent",
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWorkflows,
  getWorkflowById,
  createWorkflow: createWorkflowHandler,
  updateWorkflow,
  toggleStatus,
  deleteWorkflow,
  duplicateWorkflow,
  getApprovalRequests,
  processOrgApprovalAction,
  getWorkflowHistory,
};
