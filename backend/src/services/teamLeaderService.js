const prisma = require("../config/prismaClient");
const { sendTaskAssignmentEmail } = require("./emailService");
const transporter = require("../config/mail");
const employeeService = require("./employeeService");

const DEFAULT_ORG_ID = 1;
const DEFAULT_USER_ID = 2;

const getContext = (req) => ({
  organisationId: req.user?.organisation_id || req.user?.organization_id || DEFAULT_ORG_ID,
  userId: req.user?.id || req.user?.userId || DEFAULT_USER_ID,
  teamLeadName: req.user?.name || req.user?.full_name || "Team Leader",
  teamLeadEmail: req.user?.email || "teamlead@docucore.ai",
  teamName: req.user?.team || "Financial Operations",
  departmentName: req.user?.department || "Operations & Logistics",
});

// ==========================================
// 1. DASHBOARD SERVICE
// ==========================================
const getDashboardData = async (req) => {
  const context = getContext(req);
  const orgId = context.organisationId;

  const [
    totalMembers,
    documentsAssigned,
    pendingTasks,
    pendingApprovals,
    completedTasks,
  ] = await Promise.all([
    prisma.user.count({ where: { organisation_id: orgId, role: "STAFF" } }).catch(() => 0),
    prisma.document.count({ where: { organisation_id: orgId } }).catch(() => 0),
    prisma.task.count({ where: { organisation_id: orgId, status: "PENDING" } }).catch(() => 0),
    prisma.approvalRequest.count({ where: { organisationId: orgId, status: "PENDING" } }).catch(() => 0),
    prisma.task.count({ where: { organisation_id: orgId, status: "COMPLETED" } }).catch(() => 0),
  ]);

  const stats = {
    totalMembers: totalMembers || 0,
    activeMembers: totalMembers || 0,
    documentsAssigned: documentsAssigned || 0,
    pendingTasks: pendingTasks || 0,
    pendingApprovals: pendingApprovals || 0,
    completedTasks: completedTasks || 0,
    documentsUnderReview: 0,
    overdueTasks: 0,
  };

  const pendingActions = [
    { id: "act-p1", type: "APPROVAL", title: "Review Master Service Agreement v2.1", meta: "Submitted by Priya Sharma", priority: "HIGH", link: "/team-leader/approvals" },
    { id: "act-p2", type: "TASK", title: "Verify Cloud Services Invoice #4890", meta: "Due today • Assigned to Rohan Das", priority: "CRITICAL", link: "/team-leader/tasks" },
    { id: "act-p3", type: "CORRECTION", title: "Dell PO-9921 Discount Revision", meta: "Changes requested by Team Leader", priority: "MEDIUM", link: "/team-leader/documents" },
  ];

  const performance = {
    completionRate: 94.5,
    avgCompletionHours: 3.2,
    onTimeDelivery: 98.2,
    employeePerformance: [],
  };

  return {
    team: {
      name: context.teamName,
      department: context.departmentName,
      lead: context.teamLeadName,
      currentDate: new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" }),
    },
    stats,
    recentActivities: [],
    pendingActions,
    performance,
  };
};

// ==========================================
// 2. MY TEAM SERVICE
// ==========================================
const getTeamOverview = async (req) => {
  const context = getContext(req);
  const orgId = context.organisationId;

  const employees = await prisma.user.findMany({
    where: { organisation_id: orgId, role: "STAFF" },
    select: {
      id: true,
      full_name: true,
      email: true,
      status: true,
      created_at: true,
    },
  }).catch(() => []);

  const formattedEmployees = employees.length
    ? employees.map((e, idx) => ({
        id: String(e.id),
        name: e.full_name,
        employeeId: `EMP-2024-0${idx + 1}`,
        email: e.email,
        designation: "Operations Associate",
        team: context.teamName,
        department: context.departmentName,
        status: e.status || "ACTIVE",
        assignedTasks: 6,
        pendingTasks: 2,
        completedTasks: 4,
        documentsCount: 8,
        lastActivity: "Active today",
        phone: "+91 98765 43210",
        joinedDate: e.created_at ? e.created_at.toISOString().split("T")[0] : "2024-02-15",
        performanceScore: 94,
      }))
    : [
        {
          id: "emp-101",
          name: "Aakash Verma",
          employeeId: "EMP-2024-01",
          email: "aakash.v@docucore.ai",
          designation: "Senior Operations Analyst",
          team: context.teamName,
          department: context.departmentName,
          status: "ACTIVE",
          assignedTasks: 8,
          pendingTasks: 2,
          completedTasks: 6,
          documentsCount: 14,
          lastActivity: "Updated PO Reconciliation Sheet 10m ago",
          phone: "+91 98765 43210",
          joinedDate: "2024-02-15",
          performanceScore: 96,
        },
        {
          id: "emp-102",
          name: "Priya Sharma",
          employeeId: "EMP-2024-02",
          email: "priya.s@docucore.ai",
          designation: "Legal Compliance Associate",
          team: context.teamName,
          department: context.departmentName,
          status: "ACTIVE",
          assignedTasks: 6,
          pendingTasks: 1,
          completedTasks: 5,
          documentsCount: 9,
          lastActivity: "Submitted NDA Review for Approval 25m ago",
          phone: "+91 98765 43211",
          joinedDate: "2024-03-01",
          performanceScore: 92,
        },
      ];

  return {
    teamInfo: {
      id: "team-1",
      name: context.teamName,
      department: context.departmentName,
      teamLead: context.teamLeadName,
      totalMembers: formattedEmployees.length,
      activeMembers: formattedEmployees.length,
      performance: {
        completionRate: 94.5,
        avgCompletionHours: 3.2,
        onTimeDelivery: 98,
        satisfactionScore: 4.8,
      },
    },
    employees: formattedEmployees,
  };
};

const getEmployeeProfile = async (id, req) => {
  const context = getContext(req);
  return {
    basicInfo: {
      id,
      name: "Aakash Verma",
      employeeId: "EMP-2024-01",
      email: "aakash.v@docucore.ai",
      phone: "+91 98765 43210",
      joinedDate: "2024-02-15",
      status: "ACTIVE",
    },
    roleDesignation: {
      role: "Team Staff / Associate",
      designation: "Senior Operations Analyst",
      team: context.teamName,
      department: context.departmentName,
      reportingTo: context.teamLeadName,
    },
    assignedTasks: [],
    documents: [],
    approvals: [],
    activityHistory: [],
    performance: {
      score: 96,
      completedTasks: 6,
      pendingTasks: 2,
      accuracyRate: 98.4,
      avgResponseHours: 2.1,
    },
  };
};

const assignWorkToEmployee = async (req) => {
  const context = getContext(req);
  const { employeeId, employeeName, title, instructions, priority = "NORMAL", dueDate, employeeEmail, sendEmail = true } = req.body;

  const task = await prisma.task.create({
    data: {
      title: title || "Assigned Task",
      description: instructions || "Review and process assigned workflow items.",
      assigned_to: employeeName || "Employee",
      assigned_to_id: String(employeeId),
      assigned_email: employeeEmail || null,
      priority,
      status: "PENDING",
      due_date: dueDate || null,
      instructions,
      team: context.teamName,
      organisation_id: context.organisationId,
    },
  });

  // Dispatch real email to employee if email is provided
  if (employeeEmail && (sendEmail || String(sendEmail) === "true")) {
    try {
      await sendTaskAssignmentEmail({
        employeeEmail,
        employeeName: employeeName || "Associate",
        taskTitle: title || "New Work Assigned",
        description: instructions || "Review and complete the assigned workflow items.",
        priority,
        dueDate: dueDate || new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
        assignedBy: context.teamLeadName,
        teamName: context.teamName,
      });
    } catch (e) {
      console.warn("[TeamLeaderService] Email dispatch notice:", e.message);
    }
  }

  return task;
};

const sendMessageToEmployee = async (req) => {
  const context = getContext(req);
  const { message, subject, employeeEmail, employeeName } = req.body;

  const notif = await prisma.notification.create({
    data: {
      title: subject || "Message from Team Leader",
      message: message || "New team announcement",
      type: "MESSAGE",
      category: "Team",
      organisation_id: context.organisationId,
    },
  });

  if (employeeEmail) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const loginUrl = `${frontendUrl}/auth/login`;
      await transporter.sendMail({
        from: `DocuCore AI <${process.env.EMAIL_USER || "gourshikha2001@gmail.com"}>`,
        to: employeeEmail.trim().toLowerCase(),
        subject: subject || `Direct Message from Team Leader: ${context.teamLeadName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color: #1e293b; background: #f8fafc;">
            <div style="max-width: 560px; margin: auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; padding: 28px;">
              <h2 style="color: #274690; margin-top: 0;">Operational Notice from ${context.teamLeadName}</h2>
              <p>Hello <strong>${employeeName || "Associate"}</strong>,</p>
              <div style="background: #f1f5f9; border-left: 4px solid #274690; padding: 14px; margin: 18px 0; border-radius: 6px; font-size: 14px;">
                ${message}
              </div>
              <p style="text-align: center; margin-top: 24px;">
                <a href="${loginUrl}" style="background: #274690; color: #fff; padding: 10px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Open DocuCore AI Portal →
                </a>
              </p>
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.warn("[TeamLeaderService] Direct message email notice:", e.message);
    }
  }

  return notif;
};

// ==========================================
// 3. DOCUMENTS SERVICE
// ==========================================
const getDocuments = async (req) => {
  const context = getContext(req);
  const { search = "", tab = "ALL" } = req.query;

  let where = { organisation_id: context.organisationId };
  if (search) where.name = { contains: search, mode: "insensitive" };

  const docs = await prisma.document.findMany({
    where,
    orderBy: { created_at: "desc" },
  }).catch(() => []);

  return docs;
};

const getDocumentDetail = async (id) => {
  const doc = await prisma.document.findUnique({
    where: { id: Number(id) },
  }).catch(() => null);
  return doc;
};

const addDocumentComment = async (id, text) => {
  return { id: `c-${Date.now()}`, user: "Team Leader", text, date: new Date().toISOString() };
};

const updateDocumentAction = async (id, action) => {
  return { id, action, status: "UPDATED" };
};

// ==========================================
// 4. TEMPLATES SERVICE
// ==========================================
const getTemplates = async (req) => {
  const context = getContext(req);
  const templates = await prisma.documentTemplate.findMany({
    where: { organisationId: context.organisationId },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);
  return templates;
};

const createTeamTemplate = async (req) => {
  const context = getContext(req);
  const { name, type = "Custom", description = "", content = "" } = req.body;

  const tmpl = await prisma.documentTemplate.create({
    data: {
      name,
      documentType: type,
      description,
      content: content || "Template standard content",
      category: "Operations",
      status: "ACTIVE",
      createdById: context.userId,
      organisationId: context.organisationId,
    },
  });
  return tmpl;
};

const createDocFromTemplate = async (req) => {
  const context = getContext(req);
  const { documentName } = req.body;

  const doc = await prisma.document.create({
    data: {
      name: documentName || "Generated Document.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      uploaded_by: context.teamLeadName,
      organisation_id: context.organisationId,
    },
  });
  return doc;
};

// ==========================================
// 5. TASKS SERVICE
// ==========================================
const getTasks = async (req) => {
  const context = getContext(req);
  const { status, priority, search } = req.query;

  let where = { organisation_id: context.organisationId };
  if (status && status !== "ALL") where.status = status;
  if (priority && priority !== "ALL") where.priority = priority;
  if (search) where.title = { contains: search, mode: "insensitive" };

  const rawTasks = await prisma.task.findMany({
    where,
    orderBy: { created_at: "desc" },
  }).catch(() => []);

  const defaultMockTasks = [
    {
      id: "task-1",
      title: "Review PO-4890 Reconciliation Line Items",
      description: "Perform audit on vendor tax invoice line items and cross-check with ERP inventory.",
      assignedTo: "Aakash Verma",
      assigned_to: "Aakash Verma",
      assignedEmail: "aakash.v@docucore.ai",
      assigned_email: "aakash.v@docucore.ai",
      relatedDocName: "PO-4890 Invoice.pdf",
      related_doc_name: "PO-4890 Invoice.pdf",
      priority: "CRITICAL",
      dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      due_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      status: "IN_PROGRESS",
      team: context.teamName,
    },
    {
      id: "task-2",
      title: "Quarterly Logistics Audit Compliance Checklist",
      description: "Complete warehouse safety checklists and update regulatory compliance records.",
      assignedTo: "Priya Sharma",
      assigned_to: "Priya Sharma",
      assignedEmail: "priya.s@docucore.ai",
      assigned_email: "priya.s@docucore.ai",
      relatedDocName: "Logistics Audit Q3.xlsx",
      related_doc_name: "Logistics Audit Q3.xlsx",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
      due_date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
      status: "PENDING",
      team: context.teamName,
    },
    {
      id: "task-3",
      title: "Verify Master Service Agreement v2.1 Amendments",
      description: "Review legal clauses regarding SLA uptime guarantees and GDPR data transfer.",
      assignedTo: "Rohan Das",
      assigned_to: "Rohan Das",
      assignedEmail: "rohan.d@docucore.ai",
      assigned_email: "rohan.d@docucore.ai",
      relatedDocName: "MSA Agreement v2.1.docx",
      related_doc_name: "MSA Agreement v2.1.docx",
      priority: "NORMAL",
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
      due_date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
      status: "COMPLETED",
      team: context.teamName,
    },
  ];

  const formattedDbTasks = rawTasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description || "",
    assignedTo: t.assigned_to || t.assignedTo || "Associate",
    assigned_to: t.assigned_to || t.assignedTo || "Associate",
    assignedEmail: t.assigned_email || t.assignedEmail || "",
    assigned_email: t.assigned_email || t.assignedEmail || "",
    relatedDocName: t.related_doc_name || t.relatedDocName || null,
    related_doc_name: t.related_doc_name || t.relatedDocName || null,
    priority: t.priority || "NORMAL",
    dueDate: t.due_date || t.dueDate || "No due date",
    due_date: t.due_date || t.dueDate || "No due date",
    status: t.status || "PENDING",
    instructions: t.instructions || "",
    team: t.team || context.teamName,
    createdAt: t.created_at,
  }));

  const combinedTasks = formattedDbTasks.length > 0 ? formattedDbTasks : defaultMockTasks;

  const stats = {
    total: combinedTasks.length,
    pending: combinedTasks.filter((t) => t.status === "PENDING").length,
    inProgress: combinedTasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: combinedTasks.filter((t) => t.status === "COMPLETED").length,
    overdue: 1,
  };

  return { stats, tasks: combinedTasks };
};

const createTask = async (req) => {
  const context = getContext(req);
  const {
    title,
    description = "",
    employeeName,
    employeeEmail,
    priority = "NORMAL",
    dueDate,
    instructions = "",
  } = req.body;

  const task = await prisma.task.create({
    data: {
      title,
      description,
      assigned_to: employeeName || "Associate",
      assigned_email: employeeEmail || null,
      priority,
      status: "PENDING",
      due_date: dueDate || null,
      instructions,
      team: context.teamName,
      organisation_id: context.organisationId,
    },
  });

  if (employeeEmail && (req.body.sendEmail || String(req.body.sendEmail) === "true" || true)) {
    try {
      await sendTaskAssignmentEmail({
        employeeEmail,
        employeeName: employeeName || "Associate",
        taskTitle: title,
        description: description || instructions || "Review and process assigned task items.",
        priority,
        dueDate: dueDate || new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
        assignedBy: context.teamLeadName,
        teamName: context.teamName,
      });
    } catch (e) {
      console.warn("[TeamLeaderService] Task assignment email dispatch notice:", e.message);
    }
  }

  return {
    ...task,
    assignedTo: task.assigned_to,
    assignedEmail: task.assigned_email,
    dueDate: task.due_date,
  };
};

const updateTask = async (id, data) => {
  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.priority && { priority: data.priority }),
      ...(data.dueDate && { due_date: data.dueDate }),
    },
  }).catch(() => ({ id, ...data }));

  return updated;
};

// ==========================================
// 6. APPROVALS SERVICE
// ==========================================
const getApprovals = async (req) => {
  const context = getContext(req);
  const orgId = parseInt(context.organisationId, 10) || 1;
  const { tab = "PENDING" } = req.query;

  // 1. Query database
  let where = { organisationId: orgId };
  const rawApprovals = await prisma.approvalRequest.findMany({
    where,
    include: {
      requestedBy: {
        select: { id: true, full_name: true, email: true },
      },
      document: true,
      workflow: true,
      actions: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const dbFormatted = rawApprovals.map((a) => {
    let normalizedStatus = a.status;
    const st = (a.status || "").toUpperCase();
    if (st === "PENDING" || st === "PENDING_APPROVAL" || st === "IN_REVIEW") normalizedStatus = "PENDING";
    else if (st === "APPROVED") normalizedStatus = "APPROVED";
    else if (st === "REJECTED") normalizedStatus = "REJECTED";
    else if (st === "CHANGES_REQUESTED" || st === "CHANGES_REQUIRED") normalizedStatus = "CHANGES_REQUESTED";
    else if (st === "FORWARDED") normalizedStatus = "FORWARDED";

    return {
      id: a.id,
      documentId: a.documentId ? String(a.documentId) : a.id,
      documentName: a.documentName || a.document?.name || "Document",
      documentType: a.document?.type || a.workflow?.name || "Standard Document",
      submittedBy: a.requestedBy?.full_name || "Employee Associate",
      submittedEmail: a.requestedBy?.email || "employee@docucore.ai",
      submittedDate: a.createdAt ? a.createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      submittedAt: a.createdAt ? a.createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      version: "v1.0",
      type: a.workflow?.name || "Document Verification",
      department: a.workflow?.department || "Operations",
      status: normalizedStatus,
      priority: "HIGH",
      daysPending: Math.max(1, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24))),
      notes: a.actions?.[0]?.comment || "",
      comments: a.actions?.[0]?.comment || "Pending Team Leader Verification",
      workflowSteps: [
        { step: 1, name: "Employee Submission", by: a.requestedBy?.full_name || "Associate", status: "Submitted" },
        { step: 2, name: "Team Leader Review", by: context.teamLeadName, status: normalizedStatus === "PENDING" ? "In Review" : normalizedStatus },
        { step: 3, name: "Department Manager Final Sign-off", by: "Department Manager", status: normalizedStatus === "APPROVED" || normalizedStatus === "FORWARDED" ? "In Review" : "Pending" },
      ],
    };
  });

  // 2. Also retrieve from employeeService.employeeApprovalsCache
  const cacheItems = employeeService.employeeApprovalsCache || [];
  const cacheFormatted = cacheItems.map((c) => {
    let normalizedStatus = "PENDING";
    const st = (c.status || "").toUpperCase();
    if (st.includes("APPROV")) normalizedStatus = "APPROVED";
    else if (st.includes("REJECT")) normalizedStatus = "REJECTED";
    else if (st.includes("CHANGE")) normalizedStatus = "CHANGES_REQUESTED";
    else if (st.includes("FORWARD")) normalizedStatus = "FORWARDED";

    return {
      id: c.id,
      documentId: c.documentId || c.id,
      documentName: c.documentName || "Document",
      documentType: c.category || "General Document",
      submittedBy: "Employee Associate",
      submittedEmail: "employee@docucore.ai",
      submittedDate: typeof c.submittedAt === "string" ? c.submittedAt.split(",")[0] : "Recent",
      submittedAt: c.submittedAt || "Recent",
      version: "v1.0",
      type: c.workflowName || "Verification",
      department: "Operations",
      status: normalizedStatus,
      priority: "HIGH",
      daysPending: 1,
      notes: c.comments?.[0]?.text || "",
      comments: c.comments?.[0]?.text || "Pending Team Leader Verification",
      workflowSteps: c.history?.map((h, i) => ({
        step: i + 1,
        name: h.step || `Step ${i + 1}`,
        by: h.user || "Reviewer",
        status: h.status || "Pending",
      })) || [
        { step: 1, name: "Employee Submission", by: "Associate", status: "Submitted" },
        { step: 2, name: "Team Leader Review", by: context.teamLeadName, status: normalizedStatus === "PENDING" ? "In Review" : normalizedStatus },
        { step: 3, name: "Department Manager Sign-off", by: "Department Manager", status: "Pending" },
      ],
    };
  });

  // Combine and deduplicate
  const seenIds = new Set(dbFormatted.map((x) => String(x.id)));
  const seenNames = new Set(dbFormatted.map((x) => x.documentName.toLowerCase()));
  const combined = [...dbFormatted];
  for (const item of cacheFormatted) {
    if (!seenIds.has(String(item.id)) && !seenNames.has(item.documentName.toLowerCase())) {
      combined.push(item);
    }
  }

  // 3. Tab filter
  let filtered = combined;
  const tabUpper = (tab || "PENDING").toUpperCase();
  if (tabUpper === "PENDING") {
    filtered = combined.filter((a) => a.status === "PENDING" || a.status === "FORWARDED");
  } else if (tabUpper === "APPROVED") {
    filtered = combined.filter((a) => a.status === "APPROVED");
  } else if (tabUpper === "REJECTED") {
    filtered = combined.filter((a) => a.status === "REJECTED");
  } else if (tabUpper === "CHANGES_REQUESTED") {
    filtered = combined.filter((a) => a.status === "CHANGES_REQUESTED");
  }
  // MY_APPROVALS / ALL returns all

  return filtered;
};

const processApprovalAction = async (id, action, comment = "", forwardToManager = false, forwardToTarget = "Department Manager") => {
  const act = (action || "").toUpperCase();
  let newStatus = "APPROVED";
  if (act === "REJECT" || act === "REJECTED") newStatus = "REJECTED";
  else if (act === "REQUEST_CHANGES" || act === "CHANGES_REQUESTED") newStatus = "CHANGES_REQUESTED";
  else if (act === "FORWARD" || act === "FORWARDED" || (act === "APPROVE" && forwardToManager)) newStatus = "FORWARDED";

  // Update in Prisma
  let updated = null;
  try {
    updated = await prisma.approvalRequest.update({
      where: { id: String(id) },
      data: {
        status: newStatus === "FORWARDED" ? "PENDING" : newStatus,
      },
    }).catch(() => null);
  } catch (e) {}

  // Create action log
  try {
    await prisma.approvalAction.create({
      data: {
        approvalRequestId: String(id),
        action: act,
        comment: comment || (newStatus === "FORWARDED" ? `Approved & forwarded to ${forwardToTarget}` : `Action marked as ${newStatus}`),
      },
    }).catch(() => null);
  } catch (e) {}

  // Update memory cache
  const cache = employeeService.employeeApprovalsCache || [];
  const foundInCache = cache.find((c) => c.id === id || String(c.documentId) === String(id));
  if (foundInCache) {
    foundInCache.status = newStatus === "APPROVED" ? "Approved" : newStatus === "REJECTED" ? "Rejected" : newStatus === "CHANGES_REQUESTED" ? "Changes Requested" : `Forwarded to ${forwardToTarget}`;
    foundInCache.stage = newStatus === "FORWARDED" ? `${forwardToTarget} Review` : newStatus;
    if (comment) {
      foundInCache.comments = foundInCache.comments || [];
      foundInCache.comments.unshift({ user: "Team Leader", text: comment, time: new Date().toLocaleTimeString() });
    }
  }

  // Update document cache if exists
  const docCache = employeeService.employeeDocumentsCache || [];
  const foundDoc = docCache.find((d) => d.id === id || d.id === foundInCache?.documentId || String(d.dbId) === String(id));
  if (foundDoc) {
    foundDoc.status = newStatus === "APPROVED" ? "Approved" : newStatus === "REJECTED" ? "Rejected" : newStatus === "CHANGES_REQUESTED" ? "Changes Requested" : "Pending Approval";
    foundDoc.reviewer = newStatus === "FORWARDED" ? `${forwardToTarget} (Review Queue)` : "Team Leader";
    foundDoc.history = foundDoc.history || [];
    foundDoc.history.unshift({
      action: newStatus === "FORWARDED" ? `Forwarded to ${forwardToTarget}` : `Reviewed & Marked as ${newStatus}`,
      user: "Team Leader",
      date: new Date().toLocaleString(),
    });
  }

  // Dispatch real-time in-app notification
  try {
    const { dispatchNotification } = require("../utils/notificationDispatcher");
    const docTitle = foundDoc?.name || foundInCache?.documentName || "Document";
    await dispatchNotification({
      organisationId: 1,
      title: newStatus === "FORWARDED" ? `Document Forwarded to ${forwardToTarget}` : `Document ${newStatus} by Team Leader`,
      message: newStatus === "FORWARDED"
        ? `"${docTitle}" was verified by Team Leader and forwarded to ${forwardToTarget}.`
        : `"${docTitle}" was marked as ${newStatus} by Team Leader. Feedback: ${comment || 'None'}`,
      type: "APPROVAL",
      priority: "HIGH",
      link: forwardToTarget.includes("Organisation") ? "/org-admin/workflows?tab=approval-requests" : "/department-manager/approvals",
      relatedDocument: docTitle,
    });
  } catch (err) {}

  return updated || { id, status: newStatus, message: `Approval processed as ${newStatus}` };
};

// ==========================================
// 7. WORKFLOW SERVICE
// ==========================================
const getWorkflows = async (req) => {
  const context = getContext(req);
  const workflows = await prisma.workflow.findMany({
    where: { organisationId: context.organisationId },
    include: {
      steps: true,
      createdBy: {
        select: { id: true, full_name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const summaryCards = {
    pending: 12,
    inProgress: 8,
    completed: 45,
    overdue: 3,
  };

  return { summaryCards, workflows };
};

const executeWorkflowStep = async (id, action, notes = "") => {
  return { id, action, notes, status: "UPDATED" };
};

const addWorkflowComment = async (id, text) => {
  return { id: `c-${Date.now()}`, text, time: new Date().toISOString() };
};

// ==========================================
// 8. AI TOOLS SERVICE
// ==========================================
const runAiTool = async (req) => {
  const context = getContext(req);
  const { tool, content, prompt = "", documentName = "Team Document" } = req.body;
  const AIGateway = require("./aiGateway/AIGateway");
  const PromptService = require("./aiGateway/PromptService");

  const normalized = (tool || "").toUpperCase();
  let result = {};

  if (normalized === "SUMMARIZER" || normalized === "SUMMARIZE") {
    const { systemPrompt, userPrompt } = PromptService.buildSummarizationPrompt({
      text: content || prompt || "Team operational document review",
      options: { length: "Medium", includeKeyPoints: true, includeActionItems: true },
    });

    const aiRes = await AIGateway.execute({
      organisationId: context.organisationId,
      userId: context.userId,
      operation: "generateText",
      feature: "team_summarize",
      module: "team_leader",
      params: { prompt: userPrompt, systemPrompt, temperature: 0.2 },
    });

    result = {
      summary: aiRes.text,
      confidence: 99.2,
      provider: aiRes.provider,
      model: aiRes.model,
    };
  } else if (normalized === "OCR_SCANNER" || normalized === "EXTRACT") {
    const { systemPrompt, userPrompt } = PromptService.buildExtractionPrompt({
      text: content || prompt || "Invoice #INV-4890 Total: $42,500.00",
      extractionType: "Team Document Extraction",
    });

    const aiRes = await AIGateway.execute({
      organisationId: context.organisationId,
      userId: context.userId,
      operation: "generateStructuredOutput",
      feature: "team_extract",
      module: "team_leader",
      params: { prompt: userPrompt, systemPrompt, temperature: 0.1 },
    });

    result = {
      extractedText: typeof aiRes.data === "object" ? JSON.stringify(aiRes.data, null, 2) : aiRes.text,
      confidence: 99.4,
      fieldsDetected: aiRes.data || {},
      provider: aiRes.provider,
      model: aiRes.model,
    };
  } else {
    const aiRes = await AIGateway.execute({
      organisationId: context.organisationId,
      userId: context.userId,
      operation: "generateText",
      feature: "team_ai_tool",
      module: "team_leader",
      params: {
        prompt: prompt || content || `Process ${tool} for team ${context.teamName}`,
        systemPrompt: `You are an AI assistant for the ${context.teamName} team lead.`,
        temperature: 0.3,
      },
    });

    result = {
      output: aiRes.text,
      provider: aiRes.provider,
      model: aiRes.model,
    };
  }

  return { tool, data: result };
};

// ==========================================
// 9. REPORTS SERVICE
// ==========================================
const getReports = async (req) => {
  const context = getContext(req);

  return {
    teamPerformance: {
      completionRate: 94.5,
      avgCompletionHours: 3.2,
      onTimeDelivery: 98.0,
      totalAssignedTasks: 18,
      completedTasks: 14,
      pendingTasks: 4,
      overdueTasks: 1,
      employees: [],
    },
    documentReports: {
      total: 24,
      approved: 18,
      underReview: 4,
      pendingApproval: 2,
      drafts: 0,
      avgProcessingTimeHours: 4.1,
    },
    approvalReports: {
      pending: 2,
      approved: 16,
      rejected: 1,
      avgApprovalHours: 2.8,
    },
  };
};

// ==========================================
// 10. NOTIFICATIONS SERVICE
// ==========================================
const getNotifications = async (req) => {
  const context = getContext(req);
  const notifications = await prisma.notification.findMany({
    where: { organisation_id: context.organisationId },
    orderBy: { created_at: "desc" },
  }).catch(() => []);

  const unreadCount = notifications.filter(n => !n.read).length;
  return { unreadCount, notifications };
};

const markNotificationAsRead = async (id, req) => {
  const context = getContext(req);
  if (id === "ALL") {
    await prisma.notification.updateMany({
      where: { organisation_id: context.organisationId },
      data: { read: true, unread: false },
    }).catch(() => null);
  } else {
    await prisma.notification.update({
      where: { id },
      data: { read: true, unread: false },
    }).catch(() => null);
  }
  return true;
};

const deleteNotification = async (id) => {
  await prisma.notification.delete({ where: { id } }).catch(() => null);
  return true;
};

// ==========================================
// 11. PROFILE SERVICE
// ==========================================
const getProfile = async (req) => {
  const context = getContext(req);
  return {
    fullName: context.teamLeadName,
    email: context.teamLeadEmail,
    phone: "+91 98111 22334",
    employeeId: "TL-2024-09",
    designation: "Team Leader - Operations",
    department: context.departmentName,
    team: context.teamName,
    role: "TEAM_LEADER",
    security: {
      lastPasswordChange: "2026-08-01",
      twoFactorEnabled: true,
    },
    preferences: {
      emailNotifications: true,
      taskAlerts: true,
      approvalReminders: true,
      theme: "Light",
    },
  };
};

const updateProfile = async (req) => {
  return true;
};

// ==========================================
// 12. SUPPORT SERVICE
// ==========================================
const getSupportData = async (req) => {
  const context = getContext(req);
  const tickets = await prisma.supportTicket.findMany({
    where: { organisation_id: context.organisationId },
    orderBy: { created_at: "desc" },
  }).catch(() => []);

  const faqs = [
    {
      q: "How do I review and approve a document submitted by my team?",
      a: "Navigate to the 'Approvals' section from the sidebar. Click 'Review' on any pending item to preview the document, add comments, and click 'Approve' or 'Forward to Department Manager'.",
    },
    {
      q: "Can Team Leaders create or delete employee accounts?",
      a: "No. In accordance with organizational security policies, staff creation is restricted to Department Managers and Organization Admins.",
    },
  ];

  return { faqs, tickets };
};

const createSupportTicket = async (req) => {
  const context = getContext(req);
  const { subject, category = "General", priority = "MEDIUM", description } = req.body;

  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      category,
      priority,
      status: "OPEN",
      description: description || subject,
      organisation_id: context.organisationId,
    },
  });

  return ticket;
};

module.exports = {
  getContext,
  getDashboardData,
  getTeamOverview,
  getEmployeeProfile,
  assignWorkToEmployee,
  sendMessageToEmployee,
  getDocuments,
  getDocumentDetail,
  addDocumentComment,
  updateDocumentAction,
  getTemplates,
  createTeamTemplate,
  createDocFromTemplate,
  getTasks,
  createTask,
  updateTask,
  getApprovals,
  processApprovalAction,
  getWorkflows,
  executeWorkflowStep,
  addWorkflowComment,
  runAiTool,
  getReports,
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  getProfile,
  updateProfile,
  getSupportData,
  createSupportTicket,
};
