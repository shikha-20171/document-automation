const prisma = require("../config/prismaClient");

/**
 * Approval Repository
 * Handles ApprovalRequest, ApprovalAction, ApprovalHistory, and ApprovalRule database operations
 */

const findById = async (id) => {
  return await prisma.approvalRequest.findUnique({
    where: { id: String(id) },
    include: {
      workflow: { include: { steps: { orderBy: { stepOrder: "asc" } } } },
      requestedBy: { select: { id: true, full_name: true, email: true, role: true } },
      document: true,
      actions: { orderBy: { createdAt: "desc" }, include: { performedBy: true } },
      history: { orderBy: { createdAt: "desc" }, include: { user: true } },
    },
  });
};

const findMany = async ({
  organisationId,
  status,
  workflowId,
  requestedById,
  page = 1,
  limit = 20,
} = {}) => {
  const where = {};
  if (organisationId) where.organisationId = Number(organisationId);
  if (status) where.status = status;
  if (workflowId) where.workflowId = String(workflowId);
  if (requestedById) where.requestedById = Number(requestedById);

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [requests, total] = await Promise.all([
    prisma.approvalRequest.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        workflow: true,
        requestedBy: { select: { id: true, full_name: true, email: true } },
        document: true,
      },
    }),
    prisma.approvalRequest.count({ where }),
  ]);

  return {
    requests,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
};

const createRequest = async (requestData) => {
  return await prisma.approvalRequest.create({
    data: {
      organisationId: Number(requestData.organisationId),
      workflowId: String(requestData.workflowId),
      documentId: requestData.documentId ? Number(requestData.documentId) : null,
      documentName: requestData.documentName,
      requestedById: Number(requestData.requestedById),
      currentStepOrder: Number(requestData.currentStepOrder || 1),
      status: requestData.status || "PENDING",
      dueAt: requestData.dueAt ? new Date(requestData.dueAt) : null,
    },
  });
};

const updateStatus = async (id, status, stepOrder = null) => {
  const data = { status };
  if (stepOrder !== null) data.currentStepOrder = stepOrder;

  return await prisma.approvalRequest.update({
    where: { id: String(id) },
    data,
  });
};

const addAction = async ({ approvalRequestId, stepOrder, performedById, action, comment }) => {
  return await prisma.approvalAction.create({
    data: {
      approvalRequestId: String(approvalRequestId),
      stepOrder: stepOrder ? Number(stepOrder) : null,
      performedById: performedById ? Number(performedById) : null,
      action,
      comment: comment || null,
    },
  });
};

const addHistory = async ({ approvalRequestId, workflowStepId, userId, userRole, action, comment }) => {
  return await prisma.approvalHistoryItem.create({
    data: {
      approvalRequestId: String(approvalRequestId),
      workflowStepId: workflowStepId ? String(workflowStepId) : null,
      userId: userId ? Number(userId) : null,
      userRole: userRole || null,
      action,
      comment: comment || null,
    },
  });
};

/* Approval Rules */
const findRulesByOrganisation = async (organisationId) => {
  return await prisma.approvalRule.findMany({
    where: { organisationId: Number(organisationId) },
    orderBy: { name: "asc" },
  });
};

const createRule = async (ruleData) => {
  return await prisma.approvalRule.create({
    data: {
      organisationId: Number(ruleData.organisationId),
      workflowId: ruleData.workflowId ? String(ruleData.workflowId) : null,
      name: ruleData.name,
      conditionJson: typeof ruleData.conditionJson === "string" ? ruleData.conditionJson : JSON.stringify(ruleData.conditionJson),
      approversJson: typeof ruleData.approversJson === "string" ? ruleData.approversJson : JSON.stringify(ruleData.approversJson),
      status: ruleData.status || "ACTIVE",
      createdById: Number(ruleData.createdById),
    },
  });
};

module.exports = {
  findById,
  findMany,
  createRequest,
  updateStatus,
  addAction,
  addHistory,
  findRulesByOrganisation,
  createRule,
};
