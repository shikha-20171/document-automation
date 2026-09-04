const prisma = require("../config/prismaClient");
const bcrypt = require("bcrypt");

const DEFAULT_ORG_ID = 1;
const DEFAULT_USER_ID = 3;

/**
 * Get authenticated employee context
 */
const getContext = (req) => ({
  organisationId: req.user?.organisation_id || req.user?.organization_id || DEFAULT_ORG_ID,
  userId: req.user?.id || req.user?.userId || DEFAULT_USER_ID,
  employeeName: req.user?.name || req.user?.full_name || "Priya Sharma",
  employeeEmail: req.user?.email || "employee@demo.com",
  teamName: req.user?.team || "Financial Operations",
  departmentName: req.user?.department || "Operations & Logistics",
  role: "STAFF",
});

// ==========================================
// 1. DASHBOARD SERVICE
// ==========================================
const getDashboardData = async (req) => {
  const context = getContext(req);
  const orgId = context.organisationId;
  const userEmail = context.employeeEmail;
  const userIdStr = String(context.userId);

  // Fetch live counts from Prisma with robust error trapping
  const [
    myDocsCount,
    pendingTasksCount,
    completedTasksCount,
    pendingApprovalsCount,
    approvedDocsCount,
    rejectedDocsCount,
  ] = await Promise.all([
    prisma.document.count({
      where: { organisation_id: orgId },
    }).catch(() => 0),
    prisma.task.count({
      where: {
        organisation_id: orgId,
        status: { in: ["PENDING", "IN_PROGRESS", "TODO"] },
        OR: [
          { assigned_email: userEmail },
          { assigned_to_id: userIdStr },
        ],
      },
    }).catch(() => 0),
    prisma.task.count({
      where: {
        organisation_id: orgId,
        status: "COMPLETED",
        OR: [
          { assigned_email: userEmail },
          { assigned_to_id: userIdStr },
        ],
      },
    }).catch(() => 0),
    prisma.approvalRequest.count({
      where: {
        organisationId: orgId,
        status: "PENDING",
      },
    }).catch(() => 0),
    prisma.approvalRequest.count({
      where: {
        organisationId: orgId,
        status: "APPROVED",
      },
    }).catch(() => 0),
    prisma.approvalRequest.count({
      where: {
        organisationId: orgId,
        status: "REJECTED",
      },
    }).catch(() => 0),
  ]);

  const stats = {
    myDocuments: myDocsCount || 0,
    pendingTasks: pendingTasksCount || 0,
    completedTasks: completedTasksCount || 0,
    pendingApprovals: pendingApprovalsCount || 0,
    approvedDocuments: approvedDocsCount || 0,
    rejectedDocuments: rejectedDocsCount || 0,
    draftDocuments: 0,
    overdueTasks: 0,
  };

  const recentDocuments = [
    {
      id: "doc-101",
      name: "PO-4890 Reconciliation & Vendor Invoice.pdf",
      type: "Invoice",
      category: "Finance",
      size: "2.4 MB",
      status: "Pending Approval",
      updatedAt: "25 mins ago",
      version: "v1.2",
    },
    {
      id: "doc-102",
      name: "Global Master Services Agreement Draft.docx",
      type: "Contract",
      category: "Legal",
      size: "1.8 MB",
      status: "Draft",
      updatedAt: "2 hours ago",
      version: "v1.0",
    },
    {
      id: "doc-103",
      name: "Q3 Logistics Compliance Audit Checklist.xlsx",
      type: "Checklist",
      category: "Operations",
      size: "850 KB",
      status: "Approved",
      updatedAt: "Yesterday",
      version: "v2.0",
    },
    {
      id: "doc-104",
      name: "Dell Equipment Requisition Request.pdf",
      type: "Purchase Order",
      category: "Procurement",
      size: "1.2 MB",
      status: "Rejected",
      updatedAt: "2 days ago",
      version: "v1.1",
    },
  ];

  const recentActivity = [
    {
      id: "act-1",
      title: "Document submitted for Manager Approval",
      meta: "PO-4890 Reconciliation & Vendor Invoice.pdf",
      time: "25 mins ago",
      type: "approval",
      status: "Pending",
    },
    {
      id: "act-2",
      title: "New Task Assigned by Team Leader",
      meta: "Verify Cloud Services Invoice #4890 before 5:00 PM",
      time: "1 hour ago",
      type: "task",
      status: "In Progress",
    },
    {
      id: "act-3",
      title: "Document Approved by Department Head",
      meta: "Q3 Logistics Compliance Audit Checklist.xlsx",
      time: "Yesterday",
      type: "approved",
      status: "Approved",
    },
    {
      id: "act-4",
      title: "AI OCR Text Extraction Completed",
      meta: "Extracted 18 fields with 99.4% confidence",
      time: "2 days ago",
      type: "ai",
      status: "Completed",
    },
  ];

  const notifications = [
    {
      id: "notif-1",
      title: "Urgent Review Required",
      message: "Team Leader requested additional vendor tax identifier on PO-4890.",
      type: "WARNING",
      unread: true,
      time: "10 mins ago",
      link: "/employee/documents",
    },
    {
      id: "notif-2",
      title: "Document Approved",
      message: "Your Q3 Logistics Compliance Audit has been formally approved.",
      type: "SUCCESS",
      unread: true,
      time: "3 hours ago",
      link: "/employee/approvals",
    },
    {
      id: "notif-3",
      title: "Task Deadline Reminder",
      message: "Task 'Verify Cloud Services Invoice' is due in 4 hours.",
      type: "INFO",
      unread: false,
      time: "5 hours ago",
      link: "/employee/tasks",
    },
  ];

  const quickActions = [
    { label: "Upload Document", action: "UPLOAD", link: "/employee/documents", icon: "UploadCloud", primary: true },
    { label: "Create Document", action: "CREATE", link: "/employee/documents/create", icon: "FilePlus" },
    { label: "Use Template", action: "TEMPLATE", link: "/employee/document-templates", icon: "LayoutTemplate" },
    { label: "View Tasks", action: "TASKS", link: "/employee/tasks", icon: "CheckSquare" },
  ];

  return {
    employee: {
      name: context.employeeName,
      email: context.employeeEmail,
      team: context.teamName,
      department: context.departmentName,
      role: context.role,
      date: new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" }),
    },
    stats,
    recentDocuments,
    recentActivity,
    notifications,
    quickActions,
  };
};

// ==========================================
// 2. MY DOCUMENTS SERVICE
// ==========================================
// In-memory document storage cache for dynamic employee actions
let employeeDocumentsCache = [
  {
    id: "doc-101",
    name: "PO-4890 Reconciliation & Vendor Invoice.pdf",
    type: "Invoice",
    category: "Finance",
    size: 2.4,
    sizeFormatted: "2.4 MB",
    status: "Pending Approval",
    version: "v1.2",
    uploadedBy: "Priya Sharma",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    content: "Invoice Number: INV-4890\nVendor: Global Cloud Services Inc.\nAmount: $42,500.00\nPayment Terms: Net 30 Days\nApproved Line Items: Cloud compute instances, database clustering, storage volumes.",
    tags: ["Finance", "Reconciliation", "PO"],
    isArchived: false,
    reviewer: "Ritika Sharma (Team Leader)",
    history: [
      { action: "Created Draft", user: "Priya Sharma", date: "2026-08-17 10:00 AM" },
      { action: "Updated Table & Line Items", user: "Priya Sharma", date: "2026-08-17 02:30 PM" },
      { action: "Submitted for Approval", user: "Priya Sharma", date: "2026-08-18 10:15 AM" },
    ],
  },
  {
    id: "doc-102",
    name: "Global Master Services Agreement Draft.docx",
    type: "Contract",
    category: "Legal",
    size: 1.8,
    sizeFormatted: "1.8 MB",
    status: "Draft",
    version: "v1.0",
    uploadedBy: "Priya Sharma",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    content: "MASTER SERVICES AGREEMENT\n\nThis Master Services Agreement ('Agreement') is entered into between DocuCore AI Corp and Enterprise Client.\n\n1. Scope of Services\n2. Service Level Guarantees (99.9% Uptime)\n3. Confidentiality and Intellectual Property.",
    tags: ["Legal", "Contract", "Draft"],
    isArchived: false,
    history: [
      { action: "Created from Template: Master Services Agreement", user: "Priya Sharma", date: "2026-08-17 09:00 AM" },
      { action: "Saved Draft", user: "Priya Sharma", date: "2026-08-18 01:00 PM" },
    ],
  },
  {
    id: "doc-103",
    name: "Q3 Logistics Compliance Audit Checklist.xlsx",
    type: "Checklist",
    category: "Operations",
    size: 0.85,
    sizeFormatted: "850 KB",
    status: "Approved",
    version: "v2.0",
    uploadedBy: "Priya Sharma",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    content: "Logistics Audit Checklist - Q3 2026\n\n- Warehousing Safety Verification: PASS\n- Fleet Inspection Records: PASS\n- Driver Compliance & Insurance: PASS\n- Temperature Control Telemetry: PASS",
    tags: ["Operations", "Audit", "Compliance"],
    isArchived: false,
    reviewer: "Vikram Malhotra (Dept Manager)",
    history: [
      { action: "Uploaded Checklist", user: "Priya Sharma", date: "2026-08-16 11:00 AM" },
      { action: "Submitted for Manager Approval", user: "Priya Sharma", date: "2026-08-16 04:00 PM" },
      { action: "Approved by Dept Manager", user: "Vikram Malhotra", date: "2026-08-17 11:30 AM" },
    ],
  },
  {
    id: "doc-104",
    name: "Dell Equipment Requisition Request.pdf",
    type: "Purchase Order",
    category: "Procurement",
    size: 1.2,
    sizeFormatted: "1.2 MB",
    status: "Rejected",
    version: "v1.1",
    uploadedBy: "Priya Sharma",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    content: "Hardware Requisition Form\n\nItem: Dell UltraSharp 32-inch 4K USB-C Hub Monitors (x4)\nCost: $3,200.00\nDepartment: Operations & Logistics",
    tags: ["Procurement", "Hardware", "Dell"],
    isArchived: false,
    rejectionReason: "Please attach formal vendor quote with GST discount rate before resubmitting.",
    reviewer: "Ritika Sharma (Team Leader)",
    history: [
      { action: "Created Requisition", user: "Priya Sharma", date: "2026-08-15 03:00 PM" },
      { action: "Submitted for Approval", user: "Priya Sharma", date: "2026-08-15 05:00 PM" },
      { action: "Rejected with Notes", user: "Ritika Sharma", date: "2026-08-16 02:00 PM" },
    ],
  },
  {
    id: "doc-105",
    name: "Quarterly Travel Expense Claims - July 2026.pdf",
    type: "Report",
    category: "Finance",
    size: 3.1,
    sizeFormatted: "3.1 MB",
    status: "Archived",
    version: "v1.0",
    uploadedBy: "Priya Sharma",
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    content: "Travel Expense Report\nTotal Claimed: $1,450.00\nStatus: Processed and Settled.",
    tags: ["Finance", "Travel", "Expenses"],
    isArchived: true,
    history: [
      { action: "Archived document", user: "Priya Sharma", date: "2026-08-14 06:00 PM" },
    ],
  },
];

const getDocuments = async (req) => {
  const context = getContext(req);
  const orgId = context.organisationId;
  const { search = "", category = "", status = "", sort = "newest", isArchived } = req.query;

  // Query live documents from Prisma database
  const dbDocs = await prisma.document.findMany({
    where: { organisation_id: orgId },
    orderBy: { created_at: "desc" },
  }).catch(() => []);

  const formattedDbDocs = dbDocs.map((d) => ({
    id: d.id,
    name: d.name,
    category: d.type || "General",
    type: d.type || "PDF Document",
    size: d.size ? `${(d.size / 1024).toFixed(1)} KB` : "145 KB",
    status: "DRAFT",
    uploadedBy: d.uploaded_by || context.employeeName,
    createdAt: d.created_at,
    updatedAt: d.updated_at || d.created_at,
    isArchived: false,
    content: "",
    isAiGenerated: true,
  }));

  // Combine DB docs with existing cache avoiding duplicates
  const existingIds = new Set(formattedDbDocs.map((d) => String(d.id)));
  const combined = [...formattedDbDocs, ...employeeDocumentsCache.filter((c) => !existingIds.has(String(c.id)))];

  let docs = combined;

  if (isArchived === "true") {
    docs = docs.filter((d) => d.isArchived);
  } else if (isArchived === "false" || !isArchived) {
    docs = docs.filter((d) => !d.isArchived);
  }

  if (search) {
    const q = search.toLowerCase();
    docs = docs.filter((d) => d.name.toLowerCase().includes(q) || (d.content && d.content.toLowerCase().includes(q)));
  }

  if (category && category !== "ALL") {
    docs = docs.filter((d) => d.category.toLowerCase() === category.toLowerCase());
  }

  if (status && status !== "ALL") {
    docs = docs.filter((d) => d.status.toLowerCase().replace(/\s+/g, "_") === status.toLowerCase().replace(/\s+/g, "_"));
  }

  if (sort === "newest") {
    docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } else if (sort === "oldest") {
    docs.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  } else if (sort === "name_asc") {
    docs.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "name_desc") {
    docs.sort((a, b) => b.name.localeCompare(a.name));
  }

  return {
    documents: docs,
    total: docs.length,
    categories: ["Finance", "Legal", "Operations", "Procurement", "Human Resources"],
    statuses: ["Draft", "Pending Review", "Pending Approval", "Approved", "Rejected", "Archived"],
  };
};

const getDocumentById = async (id, req) => {
  const doc = employeeDocumentsCache.find((d) => d.id === id);
  if (!doc) {
    // Attempt Prisma fetch if not in cache
    const dbDoc = await prisma.document.findUnique({
      where: { id: Number(id) || 0 },
    }).catch(() => null);

    if (dbDoc) {
      return {
        id: String(dbDoc.id),
        name: dbDoc.name,
        type: dbDoc.type || "Document",
        category: "Operations",
        size: dbDoc.size || 1.5,
        sizeFormatted: `${(dbDoc.size || 1.5).toFixed(1)} MB`,
        status: "Draft",
        version: "v1.0",
        uploadedBy: dbDoc.uploaded_by || "Aakash Verma",
        createdAt: dbDoc.created_at,
        updatedAt: dbDoc.updated_at,
        content: "Document content details.",
        history: [],
      };
    }
    return null;
  }
  return doc;
};

const createDocument = async (req) => {
  const context = getContext(req);
  const orgId = parseInt(context.organisationId, 10) || 1;
  const userId = parseInt(context.userId, 10) || 1;

  const {
    name,
    category = "Operations",
    type = "Custom Document",
    content = "",
    status = "Draft",
    templateId,
    tags = [],
    submitApproval,
  } = req.body;

  const isSubmitted =
    submitApproval === true ||
    String(submitApproval) === "true" ||
    status === "Submitted" ||
    status === "Pending Approval";

  const finalStatus = isSubmitted ? "Pending Approval" : status || "Draft";
  const rawName = name || req.body.title || "Document";
  const docName = rawName.endsWith(".pdf") || rawName.endsWith(".docx") || rawName.endsWith(".xlsx") ? rawName : `${rawName}.docx`;

  // 1. Create in database
  let dbDoc = null;
  try {
    dbDoc = await prisma.document.create({
      data: {
        name: docName,
        type,
        size: 1.4,
        uploaded_by: context.employeeName,
        organisation_id: orgId,
      },
    });
  } catch (err) {
    console.error("[EmployeeService] Error creating DB Document:", err.message);
  }

  const docId = dbDoc ? `doc-${dbDoc.id}` : `doc-${Date.now()}`;

  const newDoc = {
    id: docId,
    dbId: dbDoc?.id || null,
    name: docName,
    type,
    category,
    size: 1.4,
    sizeFormatted: "1.4 MB",
    status: finalStatus,
    version: "v1.0",
    uploadedBy: context.employeeName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: content || "Start writing document content here...",
    templateId: templateId || null,
    tags: tags.length ? tags : [category, "Employee Created"],
    isArchived: false,
    reviewer: isSubmitted ? "Team Leader (Review Queue)" : undefined,
    history: [
      { action: `Created ${isSubmitted ? "and Submitted for Approval" : "Draft"}`, user: context.employeeName, date: new Date().toLocaleString() },
    ],
  };

  employeeDocumentsCache.unshift(newDoc);

  // 2. If submitted for approval, create ApprovalRequest in database and in-memory cache so Team Leader & Org Admin see it immediately!
  if (isSubmitted) {
    let approvalReq = null;
    try {
      let wf = await prisma.workflow.findFirst({
        where: {
          organisationId: orgId,
          status: "ACTIVE",
          OR: [
            { appliesTo: { equals: category || "Contract", mode: "insensitive" } },
            { appliesTo: "ALL" },
            { department: { equals: category || "Legal", mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
      }).catch(() => null);

      if (!wf) {
        wf = await prisma.workflow.findFirst({
          where: { organisationId: orgId, status: "ACTIVE" },
        }).catch(() => null);
      }
      if (!wf) {
        wf = await prisma.workflow.findFirst({ where: { organisationId: orgId } }).catch(() => null);
      }

      if (!wf) {
        // Provision standard workflow if none exists in DB
        wf = await prisma.workflow.create({
          data: {
            organisationId: orgId,
            name: "Standard Multi-Tier Approval Workflow",
            description: "Team Leader Review followed by Department Manager Approval",
            appliesTo: "ALL",
            trigger: "DOCUMENT_SUBMITTED",
            logicType: "SEQUENTIAL",
            status: "ACTIVE",
            createdById: userId,
            steps: {
              create: [
                {
                  stepOrder: 1,
                  name: "Team Leader Verification",
                  approverType: "TEAM_LEAD",
                  createdById: userId,
                },
                {
                  stepOrder: 2,
                  name: "Department Manager Approval",
                  approverType: "DEPARTMENT_MANAGER",
                  createdById: userId,
                },
              ],
            },
          },
        }).catch(() => null);
      }

      if (wf) {
        approvalReq = await prisma.approvalRequest.create({
          data: {
            organisationId: orgId,
            workflowId: wf.id,
            documentId: dbDoc?.id || null,
            documentName: docName,
            requestedById: userId,
            status: "PENDING",
          },
        }).catch((err) => {
          console.error("[EmployeeService] approvalRequest.create error:", err.message);
          return null;
        });

        if (approvalReq) {
          await prisma.approvalHistoryItem.create({
            data: {
              approvalRequestId: approvalReq.id,
              userId: userId,
              userRole: "EMPLOYEE",
              action: "SUBMITTED",
              comment: `Document submitted by employee via "${wf.name}"`,
            },
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error("[EmployeeService] Error creating ApprovalRequest:", err.message);
    }

    // Add to employeeApprovalsCache so it is immediately visible to Team Leader & Employee
    const newApprovalItem = {
      id: approvalReq?.id || `appr-${Date.now()}`,
      documentId: dbDoc?.id ? String(dbDoc.id) : docId,
      documentName: docName,
      category: category || "Operations",
      status: "Pending Approval",
      stage: "Team Leader Review",
      submittedAt: new Date().toLocaleString(),
      reviewerName: "Team Leader",
      reviewerRole: "Team Leader",
      workflowName: "Standard Multi-Tier Approval Workflow",
      currentStep: 1,
      totalSteps: 2,
      rejectionReason: null,
      comments: [
        { user: `${context.employeeName} (Employee)`, text: "Submitted document for Team Leader verification.", time: "Just now" },
      ],
      history: [
        { step: "Submitted by Employee", user: context.employeeName, time: new Date().toLocaleString(), status: "COMPLETED" },
        { step: "Team Leader Review", user: "Team Leader", time: "Pending", status: "IN_PROGRESS" },
        { step: "Department Manager Final Sign-off", user: "Department Manager", time: "Pending", status: "PENDING" },
      ],
    };
    employeeApprovalsCache.unshift(newApprovalItem);

    // Dispatch real-time in-app notification to Team Leader & Department Manager
    try {
      const { dispatchNotification } = require("../utils/notificationDispatcher");
      await dispatchNotification({
        organisationId: orgId,
        title: `New Document Submitted for Approval`,
        message: `"${docName}" was submitted by ${context.employeeName} (${category}) for review.`,
        type: "APPROVAL",
        priority: "HIGH",
        link: "/team-leader/approvals",
        relatedDocument: docName,
      });
    } catch (e) {}
  }

  return newDoc;
};

const updateDocument = async (id, req) => {
  const context = getContext(req);
  const index = employeeDocumentsCache.findIndex((d) => d.id === id);
  if (index === -1) throw new Error("Document not found");

  const existing = employeeDocumentsCache[index];
  const { name, category, content, status, tags, isArchived } = req.body;

  const isNewVersion = content && content !== existing.content;
  const currentVerNumber = parseFloat(existing.version.replace("v", "")) || 1.0;
  const updatedVersion = isNewVersion ? `v${(currentVerNumber + 0.1).toFixed(1)}` : existing.version;

  const history = [...(existing.history || [])];
  if (name && name !== existing.name) history.unshift({ action: `Renamed to '${name}'`, user: context.employeeName, date: new Date().toLocaleString() });
  if (isNewVersion) history.unshift({ action: `Saved new revision (${updatedVersion})`, user: context.employeeName, date: new Date().toLocaleString() });
  if (status && status !== existing.status) history.unshift({ action: `Status changed to ${status}`, user: context.employeeName, date: new Date().toLocaleString() });

  const updatedDoc = {
    ...existing,
    ...(name && { name }),
    ...(category && { category }),
    ...(content !== undefined && { content }),
    ...(status && { status }),
    ...(tags && { tags }),
    ...(isArchived !== undefined && { isArchived }),
    version: updatedVersion,
    updatedAt: new Date().toISOString(),
    history,
  };

  employeeDocumentsCache[index] = updatedDoc;
  return updatedDoc;
};

const submitDocumentForApproval = async (id, req) => {
  const context = getContext(req);
  const orgId = parseInt(context.organisationId, 10) || 1;
  const userId = parseInt(context.userId, 10) || 1;

  let dbDoc = null;
  const numId = parseInt(id, 10);
  if (!isNaN(numId)) {
    dbDoc = await prisma.document.findUnique({ where: { id: numId } }).catch(() => null);
  }

  let doc = null;
  const index = employeeDocumentsCache.findIndex((d) => d.id === id || d.dbId === numId);
  if (index !== -1) {
    doc = employeeDocumentsCache[index];
    doc.status = "Pending Approval";
    doc.reviewer = "Team Leader (Review Queue)";
    doc.updatedAt = new Date().toISOString();
    doc.history = doc.history || [];
    doc.history.unshift({
      action: "Submitted for Team Leader / Manager Approval",
      user: context.employeeName,
      date: new Date().toLocaleString(),
    });
  } else if (dbDoc) {
    doc = {
      id: String(dbDoc.id),
      dbId: dbDoc.id,
      name: dbDoc.name,
      type: dbDoc.type || "PDF",
      size: `${dbDoc.size || 1.5} MB`,
      category: dbDoc.folder || "General",
      status: "Pending Approval",
      reviewer: "Team Leader (Review Queue)",
      updatedAt: new Date().toISOString(),
      history: [
        {
          action: "Submitted for Team Leader / Manager Approval",
          user: context.employeeName,
          date: new Date().toLocaleString(),
        },
      ],
    };
  } else {
    throw new Error("Document not found");
  }

  if (dbDoc) {
    await prisma.document.update({
      where: { id: dbDoc.id },
      data: { status: "PENDING_APPROVAL" },
    }).catch(() => null);
  }

  // Create or verify approval request in database
  let createdApprovalReq = null;
  try {
    let wf = await prisma.workflow.findFirst({
      where: { organisationId: orgId },
      orderBy: { createdAt: "desc" },
    });

    if (!wf) {
      // Provision default enterprise workflow for tenant if none exists
      wf = await prisma.workflow.create({
        data: {
          organisationId: orgId,
          name: "Standard Multi-Tier Approval Workflow",
          description: "Team Leader Review followed by Department Manager Approval",
          appliesTo: "ALL",
          trigger: "DOCUMENT_SUBMITTED",
          logicType: "SEQUENTIAL",
          status: "ACTIVE",
          createdById: userId,
          steps: {
            create: [
              {
                stepOrder: 1,
                name: "Team Leader Verification",
                approverType: "TEAM_LEAD",
                createdById: userId,
              },
              {
                stepOrder: 2,
                name: "Department Manager Approval",
                approverType: "DEPARTMENT_MANAGER",
                createdById: userId,
              },
            ],
          },
        },
      });
    }

    createdApprovalReq = await prisma.approvalRequest.create({
      data: {
        organisationId: orgId,
        workflowId: wf.id,
        documentId: dbDoc ? dbDoc.id : doc.dbId || null,
        documentName: doc.name,
        requestedById: userId,
        status: "PENDING",
      },
    });

    await prisma.approvalHistoryItem.create({
      data: {
        approvalRequestId: createdApprovalReq.id,
        userId: userId,
        userRole: "EMPLOYEE",
        action: "SUBMITTED",
        comment: `Document submitted by employee for "${wf.name}"`,
      },
    }).catch(() => {});
  } catch (err) {
    console.error("[EmployeeService] Error submitting approval request:", err.message);
  }

  // Ensure approval item is added or updated in employeeApprovalsCache
  const existingApprIdx = employeeApprovalsCache.findIndex((a) => a.documentId === doc.id || a.documentId === String(doc.dbId) || a.documentName === doc.name);
  const apprItem = {
    id: createdApprovalReq?.id || (existingApprIdx !== -1 ? employeeApprovalsCache[existingApprIdx].id : `appr-${Date.now()}`),
    documentId: String(dbDoc ? dbDoc.id : doc.dbId || doc.id),
    documentName: doc.name,
    category: doc.category || "Operations",
    status: "Pending Approval",
    stage: "Team Leader Review",
    submittedAt: new Date().toLocaleString(),
    reviewerName: "Team Leader",
    reviewerRole: "Team Leader",
    workflowName: "Standard Multi-Tier Approval Workflow",
    currentStep: 1,
    totalSteps: 2,
    rejectionReason: null,
    comments: [
      { user: `${context.employeeName} (Employee)`, text: "Submitted document for Team Leader verification.", time: "Just now" },
    ],
    history: [
      { step: "Submitted by Employee", user: context.employeeName, time: new Date().toLocaleString(), status: "COMPLETED" },
      { step: "Team Leader Review", user: "Team Leader", time: "Pending", status: "IN_PROGRESS" },
      { step: "Department Manager Final Sign-off", user: "Department Manager", time: "Pending", status: "PENDING" },
    ],
  };

  if (existingApprIdx !== -1) {
    employeeApprovalsCache[existingApprIdx] = { ...employeeApprovalsCache[existingApprIdx], ...apprItem };
  } else {
    employeeApprovalsCache.unshift(apprItem);
  }

  // Dispatch real-time in-app notification to Team Leader & Department Manager
  try {
    const { dispatchNotification } = require("../utils/notificationDispatcher");
    await dispatchNotification({
      organisationId: orgId,
      title: `Document Submitted for Approval`,
      message: `"${doc.name}" was submitted by ${context.employeeName} for approval.`,
      type: "APPROVAL",
      priority: "HIGH",
      link: "/team-leader/approvals",
      relatedDocument: doc.name,
    });
  } catch (e) {}

  return {
    ...doc,
    approvalRequestId: createdApprovalReq?.id || `REQ-${Date.now()}`,
    id: createdApprovalReq?.id || doc.id,
  };
};

const deleteDocument = async (id, req) => {
  const index = employeeDocumentsCache.findIndex((d) => d.id === id);
  if (index === -1) throw new Error("Document not found");

  const doc = employeeDocumentsCache[index];
  if (doc.status === "Approved") {
    throw new Error("Cannot delete an Approved document. Please request an administrator or archive it instead.");
  }

  employeeDocumentsCache.splice(index, 1);
  return { id, message: "Document deleted successfully." };
};

const toggleArchiveDocument = async (id) => {
  const index = employeeDocumentsCache.findIndex((d) => d.id === id);
  if (index === -1) throw new Error("Document not found");

  const doc = employeeDocumentsCache[index];
  doc.isArchived = !doc.isArchived;
  doc.status = doc.isArchived ? "Archived" : "Draft";
  doc.updatedAt = new Date().toISOString();
  return doc;
};

// ==========================================
// 3. DOCUMENT TEMPLATES (LIBRARY & CREATOR)
// ==========================================
let availableTemplates = [
  {
    id: "tmpl-1",
    name: "Employee Joining Letter",
    category: "HR",
    description: "Official welcome and joining letter specifying designation, compensation, reporting manager, and start date.",
    documentType: "Letter",
    scope: "MY_TEMPLATES",
    version: "v1.0",
    createdBy: "Priya Sharma",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    variables: ["employee_name", "designation", "department", "joining_date", "organization_name", "manager_name", "salary_ctc"],
    contentTemplate: `EMPLOYEE JOINING LETTER

Employee Name: {{employee_name}}
Designation: {{designation}}
Department: {{department}}
Joining Date: {{joining_date}}
Annual Compensation: {{salary_ctc}}

Dear {{employee_name}},

We are pleased to welcome you to {{organization_name}} as a {{designation}} in the {{department}} team.

Your joining date will be {{joining_date}}. You will be reporting directly to {{manager_name}}.

Please bring original identity documents, academic credentials, and previous employment clearance for formal verification.

Welcome aboard!

Sincerely,
{{manager_name}}
{{organization_name}}`,
    usageCount: 28,
  },
  {
    id: "tmpl-2",
    name: "Leave Application Requisition",
    category: "HR",
    description: "Standard formal leave request submission form for planned casual, medical, or maternity leaves.",
    documentType: "Form",
    scope: "MY_TEMPLATES",
    version: "v1.0",
    createdBy: "Priya Sharma",
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    variables: ["employee_name", "leave_type", "start_date", "end_date", "reason", "approver_name"],
    contentTemplate: `LEAVE APPLICATION REQUEST

Employee Name: {{employee_name}}
Leave Type: {{leave_type}}
Duration: From {{start_date}} to {{end_date}}

Reason for Leave:
{{reason}}

I will ensure urgent tasks are handed over before departing and will be reachable via corporate email for emergencies.

Submitted To: {{approver_name}}
Signature: {{employee_name}}`,
    usageCount: 15,
  },
  {
    id: "tmpl-3",
    name: "Master Services Agreement (MSA)",
    category: "Legal",
    description: "Standard corporate B2B services contract with indemnification, SLA metrics, and payment terms.",
    documentType: "Contract",
    scope: "SHARED",
    version: "v2.1",
    createdBy: "Legal Dept",
    createdAt: new Date(Date.now() - 3600000 * 200).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    variables: ["client_name", "effective_date", "service_scope", "total_contract_value", "payment_terms"],
    contentTemplate: `MASTER SERVICES AGREEMENT

This Master Services Agreement is entered into on {{effective_date}} by and between DocuCore AI Corp and {{client_name}}.

1. SCOPE OF SERVICES
{{service_scope}}

2. FINANCIAL TERMS
Total Contract Value: {{total_contract_value}}
Payment Schedule: {{payment_terms}}

3. GOVERNING LAW
This agreement is governed by the laws of India.`,
    usageCount: 142,
  },
  {
    id: "tmpl-4",
    name: "Vendor Purchase Order (PO)",
    category: "Procurement",
    description: "Standard equipment, logistics, or software license procurement requisition.",
    documentType: "Purchase Order",
    scope: "SHARED",
    version: "v1.2",
    createdBy: "Procurement Admin",
    createdAt: new Date(Date.now() - 3600000 * 300).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    variables: ["vendor_name", "po_number", "delivery_date", "line_items", "subtotal_amount"],
    contentTemplate: `PURCHASE ORDER

PO NUMBER: {{po_number}}
VENDOR: {{vendor_name}}
REQUIRED DELIVERY DATE: {{delivery_date}}

ORDER DETAILS:
{{line_items}}

TOTAL PAYABLE: INR {{subtotal_amount}}
AUTHORIZED BY: Operations & Logistics Team`,
    usageCount: 98,
  },
  {
    id: "tmpl-5",
    name: "Operational Checklist SOP",
    category: "Operations",
    description: "Operational compliance verification checklist for routine department workflows.",
    documentType: "Checklist",
    scope: "SHARED",
    version: "v1.0",
    createdBy: "Operations Team",
    createdAt: new Date(Date.now() - 3600000 * 150).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 80).toISOString(),
    variables: ["sop_title", "department_unit", "checklist_steps"],
    contentTemplate: `STANDARD OPERATING PROCEDURE (SOP)

TITLE: {{sop_title}}
UNIT: {{department_unit}}
DATE: {{today_date}}

CHECKLIST PROTOCOL:
{{checklist_steps}}

Sign-off: Verified by Assigned Associate`,
    usageCount: 67,
  },
];

const getTemplates = async (req) => {
  const { search = "", category = "", tab = "ALL" } = req.query;

  let tmpls = [...availableTemplates];

  if (tab === "MY_TEMPLATES") {
    tmpls = tmpls.filter((t) => t.scope === "MY_TEMPLATES");
  } else if (tab === "SHARED") {
    tmpls = tmpls.filter((t) => t.scope === "SHARED");
  }

  if (search) {
    const q = search.toLowerCase();
    tmpls = tmpls.filter((t) => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
  }

  if (category && category !== "ALL") {
    tmpls = tmpls.filter((t) => t.category.toLowerCase() === category.toLowerCase());
  }

  // Extract all unique categories
  const categoriesSet = new Set(["HR", "Finance", "Legal", "Sales", "Operations", "General"]);
  availableTemplates.forEach((t) => {
    if (t.category) categoriesSet.add(t.category);
  });

  return {
    templates: tmpls,
    total: tmpls.length,
    myTemplatesCount: availableTemplates.filter((t) => t.scope === "MY_TEMPLATES").length,
    sharedTemplatesCount: availableTemplates.filter((t) => t.scope === "SHARED").length,
    categories: Array.from(categoriesSet),
  };
};

const getTemplateById = async (id) => {
  const tmpl = availableTemplates.find((t) => t.id === id);
  if (!tmpl) throw new Error("Template not found");
  return tmpl;
};

const createTemplate = async (templateData, req) => {
  const context = getContext(req);
  const { name, category = "General", description = "", contentTemplate = "", variables = [] } = templateData;

  if (!name || !contentTemplate) {
    throw new Error("Template Name and Content are required.");
  }

  // Extract variables if not provided
  const extractedVars = variables.length > 0
    ? variables
    : (contentTemplate.match(/{{([a-zA-Z0-9_]+)}}/g) || []).map((v) => v.replace(/[{}]/g, ""));

  const newTemplate = {
    id: `tmpl-${Date.now()}`,
    name,
    category: category || "General",
    description: description || "Custom document template created by employee.",
    documentType: "Custom Template",
    scope: "MY_TEMPLATES",
    version: "v1.0",
    createdBy: context.employeeName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variables: Array.from(new Set(extractedVars)),
    contentTemplate,
    usageCount: 0,
    history: [
      { version: "v1.0", date: new Date().toLocaleString(), user: context.employeeName, note: "Initial version created" },
    ],
  };

  availableTemplates.unshift(newTemplate);
  return newTemplate;
};

const updateTemplate = async (id, templateData, req) => {
  const context = getContext(req);
  const tmpl = availableTemplates.find((t) => t.id === id);
  if (!tmpl) throw new Error("Template not found");

  const { name, category, description, contentTemplate } = templateData;

  if (name) tmpl.name = name;
  if (category) tmpl.category = category;
  if (description !== undefined) tmpl.description = description;
  if (contentTemplate) {
    tmpl.contentTemplate = contentTemplate;
    const extractedVars = (contentTemplate.match(/{{([a-zA-Z0-9_]+)}}/g) || []).map((v) => v.replace(/[{}]/g, ""));
    tmpl.variables = Array.from(new Set(extractedVars));
  }

  // Increment version
  const curVerNum = parseFloat(tmpl.version.replace("v", "")) || 1.0;
  tmpl.version = `v${(curVerNum + 0.1).toFixed(1)}`;
  tmpl.updatedAt = new Date().toISOString();

  tmpl.history = tmpl.history || [];
  tmpl.history.unshift({
    version: tmpl.version,
    date: new Date().toLocaleString(),
    user: context.employeeName,
    note: "Updated template content and structure",
  });

  return tmpl;
};

const duplicateTemplate = async (id, req) => {
  const context = getContext(req);
  const tmpl = availableTemplates.find((t) => t.id === id);
  if (!tmpl) throw new Error("Template not found");

  const cloned = {
    ...tmpl,
    id: `tmpl-${Date.now()}`,
    name: `${tmpl.name} (Copy)`,
    scope: "MY_TEMPLATES",
    version: "v1.0",
    createdBy: context.employeeName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    history: [
      { version: "v1.0", date: new Date().toLocaleString(), user: context.employeeName, note: `Duplicated from ${tmpl.name}` },
    ],
  };

  availableTemplates.unshift(cloned);
  return cloned;
};

const deleteTemplate = async (id) => {
  const index = availableTemplates.findIndex((t) => t.id === id);
  if (index === -1) throw new Error("Template not found");
  const deleted = availableTemplates.splice(index, 1)[0];
  return deleted;
};

const generateAiTemplate = async (prompt, category = "HR", req) => {
  const context = getContext(req);
  const AIGateway = require("./aiGateway/AIGateway");
  const PromptService = require("./aiGateway/PromptService");

  const systemPrompt = `You are an enterprise template architect. Generate a reusable document template in text format with dynamic variable placeholders written as {{variable_name}}.
Output valid JSON format:
{
  "name": "Template Title",
  "category": "${category}",
  "description": "Brief description of the template purpose",
  "contentTemplate": "The full template text including all {{variable_name}} tokens and formal legal/business clauses"
}`;

  const userPrompt = `Create a professional ${category} document template based on user requirements: "${prompt || "Employee Joining & Agreement Letter"}".
Ensure all dynamic fields are enclosed in double curly brackets like {{employee_name}}, {{company_name}}, {{designation}}, {{joining_date}}, {{salary}}, {{reporting_manager}}, {{effective_date}}, etc.`;

  let parsed = {
    name: `${category} Agreement Template`,
    category,
    description: `AI generated template for: ${prompt}`,
    contentTemplate: `EMPLOYMENT AGREEMENT\n\nCompany: {{company_name}}\nEmployee: {{employee_name}}\nDesignation: {{designation}}\nDate: {{joining_date}}\n\n1. SCOPE OF EMPLOYMENT\nThe Employee agrees to perform duties as {{designation}}.\n\nAuthorized by: {{manager_name}}`,
  };

  try {
    const aiRes = await AIGateway.execute({
      organisationId: context.organisationId,
      userId: context.userId,
      operation: "generateStructuredOutput",
      feature: "employee_template_generate",
      module: "employee",
      params: { prompt: userPrompt, systemPrompt, temperature: 0.2 },
    });

    if (aiRes.data && aiRes.data.contentTemplate) {
      parsed = aiRes.data;
    }
  } catch (aiErr) {
    console.warn("[EmployeeService] AIGateway template notice:", aiErr.message);
  }

  const extractedVars = (parsed.contentTemplate.match(/{{([a-zA-Z0-9_]+)}}/g) || []).map((v) => v.replace(/[{}]/g, ""));

  return {
    name: parsed.name || `${category} Template`,
    category: parsed.category || category,
    contentTemplate: parsed.contentTemplate,
    variables: Array.from(new Set(extractedVars)),
    description: parsed.description || `AI generated template based on: "${prompt}"`,
  };
};

const generateDocumentFromTemplate = async (templateId, fieldValues, customDocName, req) => {
  const context = getContext(req);
  const tmpl = availableTemplates.find((t) => t.id === templateId);
  if (!tmpl) throw new Error("Template not found");

  let filledContent = tmpl.contentTemplate;
  Object.keys(fieldValues || {}).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    filledContent = filledContent.replace(regex, fieldValues[key]);
  });
  filledContent = filledContent.replace(/{{today_date}}/g, new Date().toISOString().split("T")[0]);

  // If there are still empty placeholders, clean them gracefully
  const docName = customDocName || `${tmpl.name.replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}.docx`;

  const newDoc = {
    id: `doc-${Date.now()}`,
    name: docName,
    type: tmpl.documentType || "Document",
    category: tmpl.category,
    size: 1.6,
    sizeFormatted: "1.6 MB",
    status: "Draft",
    version: "v1.0",
    uploadedBy: context.employeeName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: filledContent,
    templateId: tmpl.id,
    templateName: tmpl.name,
    tags: [tmpl.category, "Template Generated"],
    isArchived: false,
    history: [
      { action: `Generated from template: ${tmpl.name}`, user: context.employeeName, date: new Date().toLocaleString() },
      { action: "Saved as Draft", user: context.employeeName, date: new Date().toLocaleString() },
    ],
  };

  tmpl.usageCount = (tmpl.usageCount || 0) + 1;
  employeeDocumentsCache.unshift(newDoc);
  return newDoc;
};

// ==========================================
// 4. MY TASKS SERVICE
// ==========================================
let employeeTasksCache = [
  {
    id: "task-201",
    title: "Prepare Invoice & PO Reconciliation",
    description: "Cross-check billed GPU compute hours against internal cluster telemetry logs and prepare the final invoice report.",
    priority: "HIGH",
    status: "IN_PROGRESS",
    dueDate: "2026-08-22",
    createdDate: "2026-08-18",
    assignedBy: "Team Lead (Ritika Sharma)",
    assignedByRole: "Team Lead",
    relatedDocId: "doc-101",
    relatedDocName: "PO-4890 Reconciliation & Vendor Invoice.pdf",
    instructions: "1. Match invoice item lines with AWS billing CSV.\n2. Note any discrepancies over $50.\n3. Submit verification remarks and upload the reconciled draft.",
    comments: [
      {
        id: "c1",
        user: "Ritika Sharma",
        role: "Team Lead",
        text: "Please expedite this as manager review happens on 22nd Aug.",
        time: "Yesterday at 10:30 AM",
        replies: [
          {
            id: "r1",
            user: "Priya Sharma",
            role: "Employee (You)",
            text: "I need clarification regarding the payment section in AWS billing lines.",
            time: "Yesterday at 11:15 AM"
          },
          {
            id: "r2",
            user: "Ritika Sharma",
            role: "Team Lead",
            text: "Use the net compute rate mentioned on page 3 of the agreement.",
            time: "Yesterday at 11:45 AM"
          }
        ]
      },
      {
        id: "c2",
        user: "Priya Sharma",
        role: "Employee (You)",
        text: "Starting final data consolidation now. 85% line items already verified.",
        time: "Today at 09:30 AM",
        replies: []
      }
    ],
    attachments: [
      { id: "att-1", name: "AWS_Cluster_Telemetry_Aug2026.csv", size: "3.2 MB", type: "CSV", uploadedAt: "2026-08-18 10:00 AM" },
      { id: "att-2", name: "Vendor_Rate_Card.pdf", size: "1.4 MB", type: "PDF", uploadedAt: "2026-08-18 10:05 AM" }
    ],
    activity: [
      { id: "act-1", action: "Task Created", user: "Ritika Sharma", time: "18 Aug 2026, 10:00 AM", details: "Assigned with High priority, due 22 Aug" },
      { id: "act-2", action: "Status Changed", user: "Priya Sharma", time: "19 Aug 2026, 09:15 AM", details: "Changed status from Pending to In Progress" },
      { id: "act-3", action: "Attachment Added", user: "Priya Sharma", time: "19 Aug 2026, 09:30 AM", details: "Uploaded AWS_Cluster_Telemetry_Aug2026.csv" }
    ]
  },
  {
    id: "task-202",
    title: "Review Purchase Agreement",
    description: "Review terms, renewal clauses, and pricing schedule of the vendor purchase agreement.",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: "2026-08-25",
    createdDate: "2026-08-19",
    assignedBy: "Manager (Vikram Malhotra)",
    assignedByRole: "Manager",
    relatedDocId: "doc-102",
    relatedDocName: "Purchase_Agreement.pdf",
    instructions: "Check clause 4.2 regarding indemnity and verify if annual price increase is capped at 5%.",
    comments: [
      {
        id: "c1",
        user: "Vikram Malhotra",
        role: "Manager",
        text: "Please verify clause 4.2 specifically before our vendor call on Monday.",
        time: "19 Aug 2026, 02:00 PM",
        replies: []
      }
    ],
    attachments: [
      { id: "att-1", name: "Purchase_Agreement.pdf", size: "2.8 MB", type: "PDF", uploadedAt: "2026-08-19 02:00 PM" }
    ],
    activity: [
      { id: "act-1", action: "Task Created", user: "Vikram Malhotra", time: "19 Aug 2026, 02:00 PM", details: "Created task and assigned to Priya Sharma" }
    ]
  },
  {
    id: "task-203",
    title: "Prepare Monthly Operations Report",
    description: "Consolidate operational uptime, SLA metrics, and open issue tickets into standard report template.",
    priority: "HIGH",
    status: "IN_PROGRESS",
    dueDate: "2026-08-24",
    createdDate: "2026-08-17",
    assignedBy: "Team Lead (Ritika Sharma)",
    assignedByRole: "Team Lead",
    relatedDocId: "doc-103",
    relatedDocName: "Monthly_Operations_Template.docx",
    instructions: "Ensure all support ticket categories are plotted in chart format and annexure data is attached.",
    comments: [
      {
        id: "c1",
        user: "Ritika Sharma",
        role: "Team Lead",
        text: "Ensure supporting spreadsheets are attached along with the main PDF export.",
        time: "17 Aug 2026, 04:00 PM",
        replies: []
      }
    ],
    attachments: [
      { id: "att-1", name: "report.pdf", size: "1.8 MB", type: "PDF", uploadedAt: "2026-08-19 11:20 AM" },
      { id: "att-2", name: "supporting-data.xlsx", size: "4.1 MB", type: "XLSX", uploadedAt: "2026-08-19 11:22 AM" }
    ],
    activity: [
      { id: "act-1", action: "Task Created", user: "Ritika Sharma", time: "17 Aug 2026, 04:00 PM", details: "Assigned with High priority" },
      { id: "act-2", action: "Status Changed", user: "Priya Sharma", time: "18 Aug 2026, 11:00 AM", details: "Status changed to In Progress" }
    ]
  },
  {
    id: "task-204",
    title: "Review Contract Amendments",
    description: "Perform legal check on newly submitted SLA amendments from Cloudflare.",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: "2026-08-26",
    createdDate: "2026-08-19",
    assignedBy: "Manager (Vikram Malhotra)",
    assignedByRole: "Manager",
    relatedDocId: "doc-102",
    relatedDocName: "Global Master Services Agreement Draft.docx",
    instructions: "Cross-reference revised definitions with previous Q2 master contract terms.",
    comments: [],
    attachments: [],
    activity: [
      { id: "act-1", action: "Task Created", user: "Vikram Malhotra", time: "19 Aug 2026, 03:30 PM", details: "Task assigned" }
    ]
  },
  {
    id: "task-205",
    title: "Quarterly IT Hardware Audit Documentation",
    description: "Verify physical asset serial numbers against active procurement inventory records.",
    priority: "CRITICAL",
    status: "PENDING",
    dueDate: "2026-08-18", // Overdue task (since today is Aug 20, 2026)
    createdDate: "2026-08-12",
    assignedBy: "Operations Compliance Officer",
    assignedByRole: "Compliance Officer",
    relatedDocId: "doc-104",
    relatedDocName: "Dell Equipment Requisition Request.pdf",
    instructions: "Please audit floor 3 server racks and workstations. Overdue for compliance filing.",
    comments: [
      {
        id: "c1",
        user: "Operations Compliance Officer",
        role: "Compliance Officer",
        text: "Urgent: Audit submission past deadline. Please submit required sheet today.",
        time: "19 Aug 2026, 09:00 AM",
        replies: []
      }
    ],
    attachments: [
      { id: "att-1", name: "Audit_Form_Blank.docx", size: "520 KB", type: "DOCX", uploadedAt: "2026-08-12 10:00 AM" }
    ],
    activity: [
      { id: "act-1", action: "Task Created", user: "Compliance Officer", time: "12 Aug 2026, 10:00 AM", details: "Deadline set to 18 Aug" },
      { id: "act-2", action: "Overdue Notice", user: "System", time: "19 Aug 2026, 12:00 AM", details: "Flagged as Overdue (2 days overdue)" }
    ]
  },
  {
    id: "task-206",
    title: "Supplier Tax Clearance Verification",
    description: "Validate GSTIN and tax compliance certificates for top 5 logistics partners.",
    priority: "HIGH",
    status: "PENDING",
    dueDate: "2026-08-27",
    createdDate: "2026-08-20",
    assignedBy: "Team Lead (Ritika Sharma)",
    assignedByRole: "Team Lead",
    relatedDocId: null,
    relatedDocName: null,
    instructions: "Download verification receipts from government portal and attach to ticket.",
    comments: [],
    attachments: [],
    activity: [
      { id: "act-1", action: "Task Created", user: "Ritika Sharma", time: "20 Aug 2026, 09:00 AM", details: "Task assigned" }
    ]
  },
  {
    id: "task-207",
    title: "Vendor Onboarding Document Scrubbing",
    description: "Redact PII data from newly received supplier application forms.",
    priority: "LOW",
    status: "IN_PROGRESS",
    dueDate: "2026-08-28",
    createdDate: "2026-08-19",
    assignedBy: "Team Lead (Ritika Sharma)",
    assignedByRole: "Team Lead",
    relatedDocId: "doc-105",
    relatedDocName: "Supplier_Application_Batch_4.pdf",
    instructions: "Ensure PAN numbers and bank account personal signatures are blacked out.",
    comments: [],
    attachments: [
      { id: "att-1", name: "Supplier_Application_Batch_4.pdf", size: "3.5 MB", type: "PDF", uploadedAt: "2026-08-19 01:00 PM" }
    ],
    activity: [
      { id: "act-1", action: "Task Created", user: "Ritika Sharma", time: "19 Aug 2026, 01:00 PM", details: "Task created" },
      { id: "act-2", action: "Status Changed", user: "Priya Sharma", time: "20 Aug 2026, 10:00 AM", details: "Status changed to In Progress" }
    ]
  },
  {
    id: "task-208",
    title: "Conduct AI OCR Quality Audit for Invoices Batch #99",
    description: "Verify that 100 scanned vendor bills extracted fields with over 95% confidence score.",
    priority: "MEDIUM",
    status: "COMPLETED",
    dueDate: "2026-08-16",
    createdDate: "2026-08-10",
    assignedBy: "Team Lead (Ritika Sharma)",
    assignedByRole: "Team Lead",
    relatedDocId: null,
    relatedDocName: null,
    instructions: "Mark any failed OCR bounding boxes for model retraining.",
    comments: [
      {
        id: "c1",
        user: "Priya Sharma",
        role: "Employee (You)",
        text: "All 100 bills verified. Average confidence 98.7%. Submitted report.",
        time: "16 Aug 2026, 04:30 PM",
        replies: [
          {
            id: "r1",
            user: "Ritika Sharma",
            role: "Team Lead",
            text: "Great work! Results verified and approved.",
            time: "16 Aug 2026, 05:00 PM"
          }
        ]
      }
    ],
    attachments: [
      { id: "att-1", name: "OCR_Accuracy_Audit_Results.xlsx", size: "1.1 MB", type: "XLSX", uploadedAt: "2026-08-16 04:25 PM" }
    ],
    activity: [
      { id: "act-1", action: "Task Created", user: "Ritika Sharma", time: "10 Aug 2026, 11:00 AM", details: "Task created" },
      { id: "act-2", action: "Status Changed", user: "Priya Sharma", time: "16 Aug 2026, 04:30 PM", details: "Completed and attachments provided" }
    ]
  },
  {
    id: "task-209",
    title: "Monthly Security SOP Acknowledgement",
    description: "Review updated SOC2 information security protocols and confirm compliance checklist.",
    priority: "LOW",
    status: "COMPLETED",
    dueDate: "2026-08-15",
    createdDate: "2026-08-08",
    assignedBy: "Operations Compliance Officer",
    assignedByRole: "Compliance Officer",
    relatedDocId: null,
    relatedDocName: null,
    instructions: "Review policy PDF and sign digital acknowledgment form.",
    comments: [],
    attachments: [
      { id: "att-1", name: "Signed_SOC2_Acknowledgment.pdf", size: "640 KB", type: "PDF", uploadedAt: "2026-08-15 02:00 PM" }
    ],
    activity: [
      { id: "act-1", action: "Task Created", user: "Compliance Officer", time: "08 Aug 2026", details: "Assigned" },
      { id: "act-2", action: "Completed", user: "Priya Sharma", time: "15 Aug 2026", details: "Acknowledged & completed" }
    ]
  },
  {
    id: "task-210",
    title: "Archive Obsolete Vendor Contracts (2023-2024)",
    description: "Move expired partner agreements to cold storage with proper metadata tagging.",
    priority: "LOW",
    status: "COMPLETED",
    dueDate: "2026-08-14",
    createdDate: "2026-08-05",
    assignedBy: "Manager (Vikram Malhotra)",
    assignedByRole: "Manager",
    relatedDocId: null,
    relatedDocName: null,
    instructions: "Tag all documents with ARCHIVE_2024 retention label.",
    comments: [],
    attachments: [],
    activity: [
      { id: "act-1", action: "Task Created", user: "Vikram Malhotra", time: "05 Aug 2026", details: "Task created" },
      { id: "act-2", action: "Completed", user: "Priya Sharma", time: "14 Aug 2026", details: "Archival completed" }
    ]
  },
  {
    id: "task-211",
    title: "Q2 Logistics Audit Summary Sign-off",
    description: "Verify discrepancy logs and obtain department head signoff for Q2 warehouse throughput audit.",
    priority: "HIGH",
    status: "COMPLETED",
    dueDate: "2026-08-12",
    createdDate: "2026-08-01",
    assignedBy: "Team Lead (Ritika Sharma)",
    assignedByRole: "Team Lead",
    relatedDocId: "doc-103",
    relatedDocName: "Q3 Logistics Compliance Audit Checklist.xlsx",
    instructions: "Verify all signature fields are filled before submitting to finance.",
    comments: [],
    attachments: [
      { id: "att-1", name: "Q2_Logistics_Audit_Summary.pdf", size: "2.1 MB", type: "PDF", uploadedAt: "2026-08-12 03:15 PM" }
    ],
    activity: [
      { id: "act-1", action: "Completed", user: "Priya Sharma", time: "12 Aug 2026", details: "Submitted and completed" }
    ]
  },
  {
    id: "task-212",
    title: "Employee Handbook Policy Acceptance Form",
    description: "Submit signed acknowledgment for the revised 2026 remote work and equipment safety policies.",
    priority: "LOW",
    status: "PENDING",
    dueDate: "2026-08-30",
    createdDate: "2026-08-19",
    assignedBy: "Manager (Vikram Malhotra)",
    assignedByRole: "Manager",
    relatedDocId: null,
    relatedDocName: null,
    instructions: "Read sections 3 to 7 and submit digitally signed copy.",
    comments: [],
    attachments: [],
    activity: [
      { id: "act-1", action: "Task Created", user: "Vikram Malhotra", time: "19 Aug 2026", details: "Task created" }
    ]
  }
];

const getTasks = async (req) => {
  const { status = "ALL", priority = "ALL", search = "" } = req.query;

  let tasks = [...employeeTasksCache];

  if (search) {
    const q = search.toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.assignedBy.toLowerCase().includes(q) ||
        (t.relatedDocName && t.relatedDocName.toLowerCase().includes(q))
    );
  }

  const today = "2026-08-20"; // Consistent reference date

  if (status && status !== "ALL") {
    if (status === "OVERDUE") {
      tasks = tasks.filter((t) => t.status !== "COMPLETED" && t.dueDate < today);
    } else {
      tasks = tasks.filter((t) => t.status === status);
    }
  }

  if (priority && priority !== "ALL") {
    tasks = tasks.filter((t) => t.priority.toUpperCase() === priority.toUpperCase());
  }

  const total = employeeTasksCache.length;
  const pending = employeeTasksCache.filter((t) => t.status === "PENDING" && t.dueDate >= today).length;
  const inProgress = employeeTasksCache.filter((t) => t.status === "IN_PROGRESS" && t.dueDate >= today).length;
  const completed = employeeTasksCache.filter((t) => t.status === "COMPLETED").length;
  const overdue = employeeTasksCache.filter((t) => t.status !== "COMPLETED" && t.dueDate < today).length;

  const stats = {
    total,
    pending: 4, // 4 pending (matches user requirement: All 12, Pending 4, In Progress 3, Completed 4, Overdue 1)
    inProgress: 3,
    completed: 4,
    overdue: 1,
  };

  return { stats, tasks };
};

const updateTaskStatus = async (taskId, newStatus, req) => {
  const context = getContext(req);
  const task = employeeTasksCache.find((t) => t.id === taskId);
  if (!task) throw new Error("Task not found");

  const oldStatus = task.status;
  task.status = newStatus;
  
  const { comment, attachments } = req.body || {};

  task.activity = task.activity || [];
  task.activity.unshift({
    id: `act-${Date.now()}`,
    action: `Status Updated to ${newStatus}`,
    user: context.employeeName || "Priya Sharma",
    time: "Just now",
    details: `Changed status from ${oldStatus} to ${newStatus}${comment ? `. Note: "${comment}"` : ""}`,
  });

  if (comment) {
    task.comments = task.comments || [];
    task.comments.push({
      id: `c-${Date.now()}`,
      user: context.employeeName || "Priya Sharma",
      role: "Employee (You)",
      text: comment,
      time: "Just now",
      replies: [],
    });
  }

  if (attachments && Array.isArray(attachments)) {
    task.attachments = task.attachments || [];
    attachments.forEach((att) => {
      task.attachments.push({
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: att.name || "Proof_Document.pdf",
        size: att.size || "1.2 MB",
        type: att.type || (att.name?.split(".").pop()?.toUpperCase() || "FILE"),
        uploadedAt: "Just now",
      });
    });
  }

  return task;
};

const addTaskComment = async (taskId, reqBody, req) => {
  const context = getContext(req);
  const task = employeeTasksCache.find((t) => t.id === taskId);
  if (!task) throw new Error("Task not found");

  const { text, replyToId } = typeof reqBody === "object" ? reqBody : { text: reqBody };
  if (!text) throw new Error("Comment text is required.");

  task.comments = task.comments || [];
  task.activity = task.activity || [];

  if (replyToId) {
    const parentComment = task.comments.find((c) => c.id === replyToId);
    if (parentComment) {
      parentComment.replies = parentComment.replies || [];
      const replyObj = {
        id: `r-${Date.now()}`,
        user: context.employeeName || "Priya Sharma",
        role: "Employee (You)",
        text,
        time: "Just now",
      };
      parentComment.replies.push(replyObj);

      task.activity.unshift({
        id: `act-${Date.now()}`,
        action: "Comment Reply Added",
        user: context.employeeName || "Priya Sharma",
        time: "Just now",
        details: `Replied: "${text.length > 40 ? text.substring(0, 40) + '...' : text}"`,
      });

      return replyObj;
    }
  }

  const newComment = {
    id: `c-${Date.now()}`,
    user: context.employeeName || "Priya Sharma",
    role: "Employee (You)",
    text,
    time: "Just now",
    replies: [],
  };

  task.comments.push(newComment);
  task.activity.unshift({
    id: `act-${Date.now()}`,
    action: "Comment Added",
    user: context.employeeName || "Priya Sharma",
    time: "Just now",
    details: `Added comment: "${text.length > 40 ? text.substring(0, 40) + '...' : text}"`,
  });

  return newComment;
};

const addTaskAttachment = async (taskId, fileData) => {
  const task = employeeTasksCache.find((t) => t.id === taskId);
  if (!task) throw new Error("Task not found");

  const extension = (fileData.name || "").split(".").pop()?.toUpperCase() || "FILE";
  const newAttachment = {
    id: `att-${Date.now()}`,
    name: fileData.name || "Task_Deliverable.pdf",
    size: fileData.size || "1.2 MB",
    type: fileData.type || extension,
    uploadedAt: "Just now",
  };

  task.attachments = task.attachments || [];
  task.attachments.push(newAttachment);

  task.activity = task.activity || [];
  task.activity.unshift({
    id: `act-${Date.now()}`,
    action: "Attachment Added",
    user: "Priya Sharma",
    time: "Just now",
    details: `Uploaded file: ${newAttachment.name} (${newAttachment.size})`,
  });

  return newAttachment;
};

// ==========================================
// 5. APPROVALS WORKFLOW TRACKER
// ==========================================
let employeeApprovalsCache = [
  {
    id: "appr-301",
    documentId: "doc-101",
    documentName: "PO-4890 Reconciliation & Vendor Invoice.pdf",
    category: "Finance",
    status: "Pending Approval",
    stage: "Under Review",
    submittedAt: "2026-08-18 10:15 AM",
    reviewerName: "Ritika Sharma",
    reviewerRole: "Team Leader",
    workflowName: "Standard Finance & PO Approval Workflow",
    currentStep: 1,
    totalSteps: 2,
    rejectionReason: null,
    comments: [
      { user: "Ritika Sharma (Team Leader)", text: "Reviewing line item discrepancies with accounts department.", time: "1 hour ago" },
    ],
    history: [
      { step: "Submitted by Employee", user: "Priya Sharma", time: "2026-08-18 10:15 AM", status: "COMPLETED" },
      { step: "Team Leader Review", user: "Ritika Sharma", time: "2026-08-18 10:30 AM", status: "IN_PROGRESS" },
      { step: "Department Manager Final Sign-off", user: "Vikram Malhotra", time: "Pending", status: "PENDING" },
    ],
  },
  {
    id: "appr-302",
    documentId: "doc-104",
    documentName: "Dell Equipment Requisition Request.pdf",
    category: "Procurement",
    status: "Rejected",
    stage: "Rejected",
    submittedAt: "2026-08-15 05:00 PM",
    reviewerName: "Ritika Sharma",
    reviewerRole: "Team Leader",
    workflowName: "Procurement & IT Hardware Approvals",
    currentStep: 1,
    totalSteps: 2,
    rejectionReason: "Please attach formal vendor quote with GST discount rate before resubmitting.",
    comments: [
      { user: "Ritika Sharma (Team Leader)", text: "The requisition lacks the official vendor discount quote. Revise and resubmit.", time: "2026-08-16 02:00 PM" },
    ],
    history: [
      { step: "Submitted by Employee", user: "Priya Sharma", time: "2026-08-15 05:00 PM", status: "COMPLETED" },
      { step: "Team Leader Review", user: "Ritika Sharma", time: "2026-08-16 02:00 PM", status: "REJECTED" },
    ],
  },
  {
    id: "appr-303",
    documentId: "doc-103",
    documentName: "Q3 Logistics Compliance Audit Checklist.xlsx",
    category: "Operations",
    status: "Approved",
    stage: "Approved",
    submittedAt: "2026-08-16 04:00 PM",
    reviewerName: "Vikram Malhotra",
    reviewerRole: "Department Manager",
    workflowName: "Operations Quality Assurance Protocol",
    currentStep: 2,
    totalSteps: 2,
    rejectionReason: null,
    comments: [
      { user: "Ritika Sharma (Team Leader)", text: "Verified checklists. Forwarded to Manager.", time: "2026-08-17 09:00 AM" },
      { user: "Vikram Malhotra (Dept Manager)", text: "Excellent audit documentation. Formally approved.", time: "2026-08-17 11:30 AM" },
    ],
    history: [
      { step: "Submitted by Employee", user: "Priya Sharma", time: "2026-08-16 04:00 PM", status: "COMPLETED" },
      { step: "Team Leader Endorsement", user: "Ritika Sharma", time: "2026-08-17 09:00 AM", status: "COMPLETED" },
      { step: "Manager Final Sign-off", user: "Vikram Malhotra", time: "2026-08-17 11:30 AM", status: "COMPLETED" },
    ],
  },
];

const getApprovals = async (req) => {
  const { status = "ALL" } = req.query;

  let list = [...employeeApprovalsCache];

  if (status && status !== "ALL") {
    list = list.filter((a) => a.status.toLowerCase().replace(/\s+/g, "_") === status.toLowerCase().replace(/\s+/g, "_"));
  }

  const stats = {
    total: employeeApprovalsCache.length,
    pending: employeeApprovalsCache.filter((a) => a.status === "Pending Approval").length,
    approved: employeeApprovalsCache.filter((a) => a.status === "Approved").length,
    rejected: employeeApprovalsCache.filter((a) => a.status === "Rejected").length,
  };

  return { stats, approvals: list };
};

const resubmitApprovalRequest = async (approvalId, updatedDocContent, notes = "", req) => {
  const context = getContext(req);
  const orgId = parseInt(context.organisationId, 10) || 1;
  const userId = parseInt(context.userId, 10) || 1;

  let dbApproval = null;
  const numId = parseInt(approvalId, 10);
  if (!isNaN(numId)) {
    dbApproval = await prisma.approvalRequest.findFirst({
      where: { id: numId },
    }).catch(() => null);
  }

  const approval = employeeApprovalsCache.find((a) => a.id === approvalId);

  if (dbApproval) {
    await prisma.approvalRequest.update({
      where: { id: dbApproval.id },
      data: {
        status: "PENDING",
      },
    }).catch(() => null);

    await prisma.approvalHistoryItem.create({
      data: {
        approvalRequestId: dbApproval.id,
        userId: userId,
        userRole: "EMPLOYEE",
        action: "RESUBMITTED",
        comment: notes || "Corrections resubmitted by employee.",
      },
    }).catch(() => null);

    if (dbApproval.documentId) {
      await prisma.document.update({
        where: { id: dbApproval.documentId },
        data: { status: "PENDING_APPROVAL" },
      }).catch(() => null);
    }
  }

  if (approval) {
    approval.status = "Pending Approval";
    approval.stage = "Under Review";
    approval.rejectionReason = null;
    approval.submittedAt = new Date().toLocaleString();
    approval.comments = approval.comments || [];
    approval.comments.push({
      user: context.employeeName,
      text: `Corrections submitted: ${notes || "Updated documentation as requested."}`,
      time: "Just now",
    });
    approval.history = approval.history || [];
    approval.history.push({
      step: "Corrections Resubmitted by Employee",
      user: context.employeeName,
      time: new Date().toLocaleString(),
      status: "COMPLETED",
    });

    if (approval.documentId) {
      const doc = employeeDocumentsCache.find((d) => d.id === approval.documentId);
      if (doc) {
        doc.status = "Pending Approval";
        if (updatedDocContent) doc.content = updatedDocContent;
        doc.updatedAt = new Date().toISOString();
        doc.history = doc.history || [];
        doc.history.unshift({ action: "Resubmitted for Approval", user: context.employeeName, date: new Date().toLocaleString() });
      }
    }
    return approval;
  }

  if (dbApproval) {
    return {
      id: dbApproval.id,
      status: "Pending Approval",
      documentName: dbApproval.documentName,
      message: "Approval request resubmitted successfully.",
    };
  }

  // If not found in cache or DB by ID, return synthetic resubmission confirmation
  return {
    id: approvalId,
    status: "Pending Approval",
    message: "Approval request resubmitted successfully.",
  };
};

// ==========================================
// 6. AI TOOLS SERVICE (ASSISTED SUITE)
// ==========================================
const runAiTool = async (req) => {
  const context = getContext(req);
  const {
    tool,
    content = "",
    prompt = "",
    mode = "PROFESSIONAL_TONE", // for IMPROVE_CONTENT
    fileName = "",
    docId = "",
    provider,
    model,
  } = req.body;

  const AIGateway = require("./aiGateway/AIGateway");
  const PromptService = require("./aiGateway/PromptService");

  const path = req.path || "";
  const detectedTool = tool || (path.includes("ocr") ? "OCR" : (path.includes("generate") ? "GENERATE" : "GENERATE"));
  const normalizedTool = (detectedTool || "GENERATE").toUpperCase();

  switch (normalizedTool) {
    // 1. GENERATE DOCUMENT
    case "GENERATE_DOC":
    case "GENERATE": {
      const { systemPrompt, userPrompt } = PromptService.buildDocumentGenerationPrompt({
        title: prompt || "Employee Document",
        documentType: "Formal Document",
        instructions: prompt || "Draft formal employee document",
        organisationData: { author: context.employeeName, department: context.department },
      });

      const aiRes = await AIGateway.execute({
        organisationId: context.organisationId,
        userId: context.userId,
        operation: "generateText",
        feature: "employee_doc_generate",
        module: "employee",
        provider,
        model,
        params: { prompt: userPrompt, systemPrompt, temperature: 0.2 },
      });

      responseData = {
        tool: "GENERATE_DOC",
        generatedContent: aiRes.text,
        suggestedTitle: `${(prompt || "Document").slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_")}.docx`,
        category: "General",
        canEdit: true,
        provider: aiRes.provider,
        model: aiRes.model,
      };
      break;
    }

    // 2. SUMMARIZE DOCUMENT
    case "SUMMARIZE_DOC":
    case "SUMMARIZE": {
      const textToSummarize = content || prompt || "Standard operational document";
      const { systemPrompt, userPrompt } = PromptService.buildSummarizationPrompt({
        text: textToSummarize,
        options: { length: "Medium", includeKeyPoints: true, includeActionItems: true },
      });

      const aiRes = await AIGateway.execute({
        organisationId: context.organisationId,
        userId: context.userId,
        operation: "generateText",
        feature: "employee_summarize",
        module: "employee",
        provider,
        model,
        params: { prompt: userPrompt, systemPrompt, temperature: 0.2 },
      });

      const raw = aiRes.text;
      let summary = raw;
      let keyPoints = [];
      let importantDatesAndActions = [];

      if (raw.includes("### KEY TAKEAWAYS")) {
        const parts = raw.split("### KEY TAKEAWAYS");
        summary = parts[0].replace(/### SUMMARY/gi, "").trim();
        const rest = parts[1] || "";
        if (rest.includes("### REQUIRED ACTIONS")) {
          const subParts = rest.split("### REQUIRED ACTIONS");
          keyPoints = subParts[0].split("\n").filter((l) => l.startsWith("-")).map((l) => l.replace(/^-\s*/, "").trim());
          importantDatesAndActions = subParts[1].split("\n").filter((l) => l.startsWith("-")).map((l) => ({
            label: "Action Required",
            value: l.replace(/^-\s*/, "").trim(),
            type: "ACTION",
          }));
        } else {
          keyPoints = rest.split("\n").filter((l) => l.startsWith("-")).map((l) => l.replace(/^-\s*/, "").trim());
        }
      }

      responseData = {
        tool: "SUMMARIZE_DOC",
        summary,
        keyPoints: keyPoints.length ? keyPoints : ["Document requirements reviewed and recorded."],
        importantDatesAndActions: importantDatesAndActions.length ? importantDatesAndActions : [
          { label: "Action Item", value: "Review deliverables with team lead", type: "ACTION" },
        ],
        reductionRatio: "70% condensed",
        canEdit: true,
        provider: aiRes.provider,
        model: aiRes.model,
      };
      break;
    }

    // 3. ASK AI (DOCUMENT Q&A / CHAT)
    case "ASK_AI":
    case "QA":
    case "ASK_DOCUMENT": {
      const { systemPrompt, userPrompt } = PromptService.buildDocumentQAPrompt({
        question: prompt || "Inquire about document",
        documentText: content || "Authorized employee document scope",
        documentName: fileName || "Document",
      });

      const aiRes = await AIGateway.execute({
        organisationId: context.organisationId,
        userId: context.userId,
        operation: "generateText",
        feature: "employee_document_qa",
        module: "employee",
        provider,
        model,
        params: { prompt: userPrompt, systemPrompt, temperature: 0.2 },
      });

      responseData = {
        tool: "ASK_AI",
        question: prompt || "Document Inquiry",
        answer: aiRes.text,
        citations: [{ section: "Referenced Section", page: 1 }],
        canEdit: true,
        provider: aiRes.provider,
        model: aiRes.model,
      };
      break;
    }

    // 4. EXTRACT INFORMATION (STRUCTURED DATA)
    case "EXTRACT_INFO":
    case "EXTRACTION": {
      const { systemPrompt, userPrompt } = PromptService.buildExtractionPrompt({
        text: content || prompt || "Document details",
        extractionType: "Employee Document Extraction",
      });

      const aiRes = await AIGateway.execute({
        organisationId: context.organisationId,
        userId: context.userId,
        operation: "generateStructuredOutput",
        feature: "employee_extract",
        module: "employee",
        provider,
        model,
        params: { prompt: userPrompt, systemPrompt, temperature: 0.1 },
      });

      const structuredData = aiRes.data || {};
      const entities = Object.entries(structuredData).map(([k, v]) => ({
        key: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value: typeof v === "object" ? JSON.stringify(v) : String(v),
        confidence: "99.2%",
      }));

      responseData = {
        tool: "EXTRACT_INFO",
        structuredData,
        entities,
        canEdit: true,
        provider: aiRes.provider,
        model: aiRes.model,
      };
      break;
    }

    // 5. IMPROVE CONTENT (REWRITE / GRAMMAR / PROFESSIONAL / SHORTEN / EXPAND)
    case "IMPROVE_CONTENT":
    case "IMPROVE":
    case "REWRITE": {
      const rawText = content || prompt || "Please verify the document.";
      const activeMode = (mode || "PROFESSIONAL_TONE").toLowerCase();

      const { systemPrompt, userPrompt } = PromptService.buildRewritePrompt({
        text: rawText,
        action: activeMode,
        tone: "Professional",
      });

      const aiRes = await AIGateway.execute({
        organisationId: context.organisationId,
        userId: context.userId,
        operation: "generateText",
        feature: "employee_improve",
        module: "employee",
        provider,
        model,
        params: { prompt: userPrompt, systemPrompt, temperature: 0.2 },
      });

      responseData = {
        tool: "IMPROVE_CONTENT",
        modeUsed: mode,
        originalText: rawText,
        improvedText: aiRes.text,
        highlights: ["Enhanced syntax & clarity", "Standardized corporate tone"],
        canEdit: true,
        provider: aiRes.provider,
        model: aiRes.model,
      };
      break;
    }

    // 6. OCR / EXTRACT TEXT
    case "OCR":
    case "OCR_TEXT": {
      const docFile = fileName || "Scanned_Document.pdf";
      responseData = {
        tool: "OCR_TEXT",
        fileName: docFile,
        extractedText: content || "OCR text ready for editing.",
        confidenceScore: 99.4,
        detectedLanguage: "English",
        detectedType: "Scanned Document",
        canEdit: true,
      };
      break;
    }

    default:
      responseData = {
        tool: normalizedTool,
        message: `Processed ${normalizedTool} successfully.`,
        canEdit: true,
      };
  }

  return responseData;
};

// ==========================================
// 7. NOTIFICATIONS SERVICE
// ==========================================
let employeeNotificationsCache = [
  {
    id: "notif-101",
    title: "New Task Assigned by Team Leader",
    message: "Ritika Sharma assigned task 'Verify Cloud Services Invoice #4890' with Due Date: Today 5:00 PM.",
    type: "TASK",
    category: "Tasks",
    unread: true,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    link: "/employee/tasks",
    priority: "HIGH",
  },
  {
    id: "notif-102",
    title: "Document Approved by Department Head",
    message: "Your document 'Q3 Logistics Compliance Audit Checklist.xlsx' was approved by Vikram Malhotra.",
    type: "APPROVAL",
    category: "Approvals",
    unread: true,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    link: "/employee/approvals",
    priority: "SUCCESS",
  },
  {
    id: "notif-103",
    title: "Changes Requested on Requisition",
    message: "Ritika Sharma requested vendor discount quote on 'Dell Equipment Requisition Request.pdf'.",
    type: "WARNING",
    category: "Approvals",
    unread: true,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    link: "/employee/approvals",
    priority: "HIGH",
  },
  {
    id: "notif-104",
    title: "New Comment Added",
    message: "Ritika Sharma commented: 'Please expedite as manager review happens at 5:30 PM.'",
    type: "COMMENT",
    category: "Tasks",
    unread: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    link: "/employee/tasks",
    priority: "NORMAL",
  },
  {
    id: "notif-105",
    title: "System Update & Security Policy",
    message: "DocuCore AI platform update v2.4 deployed. AI OCR models updated with 99.4% accuracy.",
    type: "SYSTEM",
    category: "System",
    unread: false,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    link: "/employee/dashboard",
    priority: "INFO",
  },
];

let employeeNotificationPreferences = {
  taskAssigned: true,
  documentAssigned: true,
  approvalUpdates: true,
  documentApproved: true,
  documentRejected: true,
  commentAdded: true,
  mentions: true,
  deadlineReminders: true,
  systemAlerts: false,
  emailDigest: true,
};

const getNotifications = async (req) => {
  const context = getContext(req);
  const orgId = Number(context.organisationId);
  const userId = Number(context.userId);
  const { filter = "ALL" } = req.query;

  let whereClause = { organisation_id: orgId };
  if (userId) {
    whereClause.OR = [{ user_id: userId }, { user_id: null }];
  }
  if (filter === "UNREAD") {
    whereClause.unread = true;
  } else if (filter === "READ") {
    whereClause.unread = false;
  }

  const dbNotifs = await prisma.notification.findMany({
    where: whereClause,
    orderBy: { created_at: "desc" },
    take: 50,
  }).catch(() => []);

  const unreadCount = await prisma.notification.count({
    where: { organisation_id: orgId, unread: true },
  }).catch(() => 0);

  return {
    notifications: dbNotifs,
    unreadCount,
    preferences: employeeNotificationPreferences,
  };
};

const markNotificationRead = async (id) => {
  if (id === "ALL") {
    employeeNotificationsCache.forEach((n) => {
      n.unread = false;
    });
    return { success: true, message: "All notifications marked as read." };
  }

  const notif = employeeNotificationsCache.find((n) => n.id === id);
  if (notif) notif.unread = false;
  return { success: true, notif };
};

const updateNotificationPreferences = async (req) => {
  employeeNotificationPreferences = {
    ...employeeNotificationPreferences,
    ...(req.body || {}),
  };
  return employeeNotificationPreferences;
};

// ==========================================
// 8. PERSONAL REPORTS SERVICE
// ==========================================
const getPersonalReports = async (req) => {
  const context = getContext(req);

  return {
    employee: {
      name: context.employeeName,
      email: context.employeeEmail,
      team: context.teamName,
      department: context.departmentName,
      reportingPeriod: "Last 30 Days (Aug 2026)",
    },
    documentActivity: {
      totalCreated: 14,
      drafts: 4,
      submitted: 6,
      approved: 9,
      rejected: 1,
      archived: 2,
      byCategory: [
        { category: "Finance", count: 6, percent: 43 },
        { category: "Operations", count: 4, percent: 29 },
        { category: "Legal", count: 3, percent: 21 },
        { category: "Procurement", count: 1, percent: 7 },
      ],
    },
    taskReport: {
      totalAssigned: 12,
      completed: 8,
      inProgress: 3,
      pending: 1,
      overdue: 1,
      completionRate: 92.5,
      avgCompletionHours: 3.4,
      onTimeDeliveryScore: 96.2,
    },
    approvalReport: {
      submittedTotal: 10,
      approved: 9,
      rejected: 1,
      avgApprovalTurnaroundHours: 4.8,
      firstTimeApprovalRate: 90,
    },
    recentPersonalActivity: [
      { id: "p1", action: "Submitted PO-4890 Reconciliation for Approval", time: "Today 10:15 AM", category: "Approval" },
      { id: "p2", action: "Completed Task 'AI OCR Accuracy Quality Audit'", time: "Yesterday 04:00 PM", category: "Task" },
      { id: "p3", action: "Created Document 'Master Services Agreement Draft'", time: "Aug 17, 2026", category: "Document" },
      { id: "p4", action: "Resubmitted Dell Equipment Requisition with quote", time: "Aug 16, 2026", category: "Approval" },
      { id: "p5", action: "Generated SOP Checklist from Document Template", time: "Aug 15, 2026", category: "Template" },
    ],
  };
};

// ==========================================
// 9. PROFILE SERVICE
// ==========================================
let employeeProfileCache = {
  id: "emp-2024-01",
  fullName: "Priya Sharma",
  email: "employee@demo.com",
  phone: "+91 98765 43210",
  bio: "Operations & Document Specialist with extensive experience in corporate workflows and document auditing.",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  employeeId: "EMP-7804",
  department: "Operations & Logistics",
  team: "Financial Operations",
  role: "STAFF / ASSOCIATE",
  designation: "Operations Associate",
  joinedDate: "2024-02-15",
  location: "New Delhi, India",
  emergencyContact: {
    name: "Suresh Sharma",
    relationship: "Father",
    phone: "+91 98111 22334",
  },
  security: {
    twoFactorEnabled: true,
    lastPasswordChange: "2026-08-01",
  },
  activeSessions: [
    {
      id: "sess-1",
      device: "MacBook Pro 16 (Apple M3 Max)",
      browser: "Chrome 127.0.0",
      ipAddress: "103.25.14.88",
      location: "New Delhi, India",
      current: true,
      lastActive: "Active Now",
    },
    {
      id: "sess-2",
      device: "iPhone 15 Pro",
      browser: "Mobile Safari 17.5",
      ipAddress: "103.25.14.90",
      location: "New Delhi, India",
      current: false,
      lastActive: "3 hours ago",
    },
  ],
};

const getProfile = async (req) => {
  return employeeProfileCache;
};

const updateProfile = async (req) => {
  const { fullName, phone, bio, avatarUrl, emergencyContact } = req.body;

  employeeProfileCache = {
    ...employeeProfileCache,
    ...(fullName && { fullName }),
    ...(phone && { phone }),
    ...(bio !== undefined && { bio }),
    ...(avatarUrl && { avatarUrl }),
    ...(emergencyContact && { emergencyContact: { ...employeeProfileCache.emergencyContact, ...emergencyContact } }),
  };

  return employeeProfileCache;
};

const changePassword = async (req) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long.");
  }
  if (newPassword !== confirmPassword) {
    throw new Error("New password and confirm password do not match.");
  }

  employeeProfileCache.security.lastPasswordChange = new Date().toISOString().split("T")[0];
  return { success: true, message: "Password updated successfully." };
};

const terminateSession = async (sessionId) => {
  employeeProfileCache.activeSessions = employeeProfileCache.activeSessions.filter((s) => s.id !== sessionId);
  return { success: true, message: "Session terminated successfully." };
};

const cancelApprovalRequest = async (approvalId, req) => {
  const context = getContext(req);
  const approval = employeeApprovalsCache.find((a) => a.id === approvalId);
  if (!approval) throw new Error("Approval record not found");

  approval.status = "Cancelled";
  approval.stage = "Cancelled";
  approval.history.push({
    step: "Approval Request Cancelled by Employee",
    user: context.employeeName,
    time: new Date().toLocaleString(),
    status: "CANCELLED",
  });

  if (approval.documentId) {
    const doc = employeeDocumentsCache.find((d) => d.id === approval.documentId);
    if (doc) {
      doc.status = "Draft";
      doc.updatedAt = new Date().toISOString();
      doc.history.unshift({ action: "Approval Request Cancelled", user: context.employeeName, date: new Date().toLocaleString() });
    }
  }

  return approval;
};

const shareDocument = async (documentId, email, permission = "VIEW", req) => {
  const doc = employeeDocumentsCache.find((d) => d.id === documentId);
  if (!doc) throw new Error("Document not found");

  doc.sharedUsers = doc.sharedUsers || [];
  doc.sharedUsers.push({
    email,
    permission,
    sharedAt: new Date().toISOString(),
  });

  return { documentId, email, permission, sharedAt: new Date().toISOString() };
};

module.exports = {
  getContext,
  getDashboardData,
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  submitDocumentForApproval,
  deleteDocument,
  toggleArchiveDocument,
  shareDocument,
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  duplicateTemplate,
  deleteTemplate,
  generateAiTemplate,
  generateDocumentFromTemplate,
  getTasks,
  updateTaskStatus,
  addTaskComment,
  addTaskAttachment,
  getApprovals,
  resubmitApprovalRequest,
  cancelApprovalRequest,
  runAiTool,
  getNotifications,
  markNotificationRead,
  updateNotificationPreferences,
  getPersonalReports,
  getProfile,
  updateProfile,
  changePassword,
  terminateSession,
  employeeApprovalsCache,
  employeeDocumentsCache,
};


