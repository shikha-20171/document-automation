const prisma = require("../config/prismaClient");

/**
 * AI Job & Tools Repository
 * Handles AIJobQueue, DepartmentAiToolRun, DepartmentAiTemplate, DepartmentAiExtractedRecord, AILog
 */

/* AI Job Queue */
const createJob = async (jobData) => {
  return await prisma.aIJobQueue.create({
    data: {
      jobCode: jobData.jobCode || `JOB-${Date.now()}`,
      organisationId: String(jobData.organisationId),
      userId: jobData.userId ? String(jobData.userId) : null,
      providerId: String(jobData.providerId),
      modelId: String(jobData.modelId),
      documentId: jobData.documentId ? String(jobData.documentId) : null,
      requestType: jobData.requestType,
      priority: jobData.priority || "MEDIUM",
      status: jobData.status || "QUEUED",
      maxRetries: jobData.maxRetries ? Number(jobData.maxRetries) : 3,
    },
  });
};

const updateJobStatus = async (id, status, extra = {}) => {
  const data = { status };
  if (status === "RUNNING") data.startedAt = new Date();
  if (["COMPLETED", "FAILED", "CANCELLED"].includes(status)) data.completedAt = new Date();
  if (extra.processingTimeMs) data.processingTimeMs = Number(extra.processingTimeMs);
  if (extra.errorMessage) data.errorMessage = extra.errorMessage;

  return await prisma.aIJobQueue.update({
    where: { id: String(id) },
    data,
  });
};

/* Department AI Tool Runs */
const createToolRun = async ({ organisation_id, user_id, department_name, tool, title, input, output, status }) => {
  return await prisma.departmentAiToolRun.create({
    data: {
      organisation_id: organisation_id ? Number(organisation_id) : null,
      user_id: user_id ? Number(user_id) : null,
      department_name: department_name || null,
      tool,
      title: title || `${tool} execution`,
      input: input || {},
      output: output || {},
      status: status || "COMPLETED",
    },
  });
};

const getToolRuns = async ({ organisation_id, user_id, tool, page = 1, limit = 20 } = {}) => {
  const where = {};
  if (organisation_id) where.organisation_id = Number(organisation_id);
  if (user_id) where.user_id = Number(user_id);
  if (tool) where.tool = tool;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [runs, total] = await Promise.all([
    prisma.departmentAiToolRun.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
      include: {
        extractedRecords: true,
      },
    }),
    prisma.departmentAiToolRun.count({ where }),
  ]);

  return {
    runs,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
};

/* AI Department Templates */
const createDepartmentAiTemplate = async ({ organisation_id, user_id, name, template_body, fields }) => {
  return await prisma.departmentAiTemplate.create({
    data: {
      organisation_id: organisation_id ? Number(organisation_id) : null,
      user_id: user_id ? Number(user_id) : null,
      name,
      template_body,
      fields: fields || [],
    },
  });
};

const getDepartmentAiTemplates = async (organisation_id) => {
  return await prisma.departmentAiTemplate.findMany({
    where: organisation_id ? { organisation_id: Number(organisation_id) } : {},
    orderBy: { updated_at: "desc" },
  });
};

/* AI Extracted Records */
const saveExtractedRecord = async ({ run_id, organisation_id, user_id, document_name, record_type, data, saved_to }) => {
  return await prisma.departmentAiExtractedRecord.create({
    data: {
      run_id: run_id ? String(run_id) : null,
      organisation_id: organisation_id ? Number(organisation_id) : null,
      user_id: user_id ? Number(user_id) : null,
      document_name: document_name || null,
      record_type: record_type || "DOCUMENT",
      data: data || {},
      saved_to: saved_to || "DOCUMENT",
    },
  });
};

module.exports = {
  createJob,
  updateJobStatus,
  createToolRun,
  getToolRuns,
  createDepartmentAiTemplate,
  getDepartmentAiTemplates,
  saveExtractedRecord,
};
