const prisma = require("../config/prismaClient");

/**
 * Workflow Repository
 * Handles Workflow and WorkflowStep database operations
 */

const findById = async (id) => {
  return await prisma.workflow.findUnique({
    where: { id: String(id) },
    include: {
      steps: { orderBy: { stepOrder: "asc" } },
      createdBy: { select: { id: true, full_name: true, email: true } },
      approvalRequests: true,
    },
  });
};

const findByOrganisation = async (organisationId, { status, search, page = 1, limit = 20 } = {}) => {
  const where = { organisationId: Number(organisationId) };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [workflows, total] = await Promise.all([
    prisma.workflow.findMany({
      where,
      skip,
      take,
      orderBy: { lastRunAt: "desc" },
      include: {
        steps: { orderBy: { stepOrder: "asc" } },
        createdBy: { select: { id: true, full_name: true } },
        _count: { select: { approvalRequests: true } },
      },
    }),
    prisma.workflow.count({ where }),
  ]);

  return {
    workflows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
};

const normalizeTrigger = (trigger) => {
  if (!trigger) return "DOCUMENT_SUBMITTED";
  const upper = String(trigger).toUpperCase().replace(/[\s-]+/g, "_");
  if (upper.includes("CREATE")) return "DOCUMENT_CREATED";
  if (upper.includes("UPLOAD")) return "DOCUMENT_UPLOADED";
  if (upper.includes("UPDATE")) return "DOCUMENT_UPDATED";
  if (upper.includes("SUBMIT")) return "DOCUMENT_SUBMITTED";
  const validTriggers = ["DOCUMENT_CREATED", "DOCUMENT_SUBMITTED", "DOCUMENT_UPDATED", "DOCUMENT_UPLOADED"];
  if (validTriggers.includes(upper)) return upper;
  return "DOCUMENT_SUBMITTED";
};

const normalizeStatus = (status) => {
  if (!status) return "DRAFT";
  const upper = String(status).toUpperCase();
  const validStatus = ["DRAFT", "ACTIVE", "PAUSED"];
  return validStatus.includes(upper) ? upper : "DRAFT";
};

const normalizeLogicType = (logicType) => {
  if (!logicType) return "SEQUENTIAL";
  const upper = String(logicType).toUpperCase();
  return ["SEQUENTIAL", "PARALLEL"].includes(upper) ? upper : "SEQUENTIAL";
};

const normalizeLogicRequirement = (logicReq) => {
  if (!logicReq) return "ALL_REQUIRED";
  const upper = String(logicReq).toUpperCase();
  return ["ALL_REQUIRED", "ANY_ONE"].includes(upper) ? upper : "ALL_REQUIRED";
};

const normalizeApprovalType = (approvalType) => {
  if (!approvalType) return "INTERNAL";
  const upper = String(approvalType).toUpperCase();
  return ["INTERNAL", "EXTERNAL"].includes(upper) ? upper : "INTERNAL";
};

const create = async (workflowData, steps = []) => {
  return await prisma.workflow.create({
    data: {
      organisationId: Number(workflowData.organisationId),
      name: workflowData.name,
      description: workflowData.description || null,
      appliesTo: workflowData.appliesTo || "ALL",
      department: workflowData.department || null,
      trigger: normalizeTrigger(workflowData.trigger),
      logicType: normalizeLogicType(workflowData.logicType),
      logicRequirement: normalizeLogicRequirement(workflowData.logicRequirement),
      status: normalizeStatus(workflowData.status),
      approvalDeadlineDays: Number(workflowData.approvalDeadlineDays || 3),
      reminderAfterHours: Number(workflowData.reminderAfterHours || 24),
      escalationAfterHours: Number(workflowData.escalationAfterHours || 48),
      commentsRequiredOnRejection: Boolean(workflowData.commentsRequiredOnRejection),
      allowRequestChanges: Boolean(workflowData.allowRequestChanges ?? true),
      createdById: Number(workflowData.createdById),
      steps: steps.length > 0 ? {
        create: steps.map((s, idx) => ({
          stepOrder: s.stepOrder ?? idx + 1,
          name: s.name || `Step ${idx + 1}`,
          approverType: s.approverType || "ROLE",
          approvalType: normalizeApprovalType(s.approvalType),
          externalApproverName: s.externalApproverName || null,
          externalApproverEmail: s.externalApproverEmail || null,
          externalApproverCompany: s.externalApproverCompany || null,
          createdById: Number(workflowData.createdById),
        })),
      } : undefined,
    },
    include: {
      steps: true,
    },
  });
};

const update = async (id, updateData) => {
  return await prisma.workflow.update({
    where: { id: String(id) },
    data: updateData,
  });
};

const deleteWorkflow = async (id) => {
  return await prisma.workflow.delete({
    where: { id: String(id) },
  });
};

module.exports = {
  findById,
  findByOrganisation,
  create,
  update,
  deleteWorkflow,
};
