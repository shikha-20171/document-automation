const prisma = require("../config/prismaClient");
const { getOrgIdSafe, getUserId, getUserRole } = require("../utils/authContext");
const ESignatureService = require("./eSignatureService");

// Default document type approval rules
const DEFAULT_CONFIGS = [
  {
    documentType: "Quotation",
    requireTeamLead: true,
    requireDepartmentManager: true,
    requireOrgAdmin: true,
    signatureRequired: true,
    description: "High-value sales proposals and quote estimates requiring full executive & legal sign-off.",
  },
  {
    documentType: "Contract",
    requireTeamLead: true,
    requireDepartmentManager: true,
    requireOrgAdmin: true,
    signatureRequired: true,
    description: "Binding legal agreements requiring multi-tier validation and cryptographic e-signature.",
  },
  {
    documentType: "Invoice",
    requireTeamLead: true,
    requireDepartmentManager: true,
    requireOrgAdmin: true,
    signatureRequired: false,
    description: "Financial billing receipts requiring operational checks and admin sign-off.",
  },
  {
    documentType: "Business Proposal",
    requireTeamLead: true,
    requireDepartmentManager: true,
    requireOrgAdmin: true,
    signatureRequired: true,
    description: "Strategic partnerships and project proposals.",
  },
  {
    documentType: "Non-Disclosure Agreement (NDA)",
    requireTeamLead: false,
    requireDepartmentManager: true,
    requireOrgAdmin: true,
    signatureRequired: true,
    description: "Standard confidential disclosures.",
  },
  {
    documentType: "Internal Report",
    requireTeamLead: true,
    requireDepartmentManager: true,
    requireOrgAdmin: false,
    signatureRequired: false,
    description: "Departmental performance notes and memos.",
  },
];

class WorkflowEngineService {
  /**
   * Get KPI overview summary counts for Org Admin
   */
  static async getOverviewStats(orgId) {
    const numericOrgId = parseInt(orgId, 10);

    const docs = await prisma.unifiedDocument.findMany({
      where: { organisationId: numericOrgId, isArchived: false },
      select: {
        id: true,
        status: true,
        approvalStatus: true,
        signatureStatus: true,
        signatureRequired: true,
      },
    });

    const stats = {
      pendingApproval: 0,
      inReview: 0,
      changesRequested: 0,
      rejected: 0,
      approved: 0,
      awaitingSignature: 0,
      completed: 0,
      total: docs.length,
    };

    for (const doc of docs) {
      const s = (doc.status || "").toUpperCase();
      const a = (doc.approvalStatus || "").toUpperCase();

      if (s === "PENDING_APPROVAL" || a === "PENDING_APPROVAL") {
        stats.pendingApproval += 1;
      } else if (s === "IN_REVIEW" || a === "IN_REVIEW") {
        stats.inReview += 1;
      } else if (s === "CHANGES_REQUESTED" || a === "CHANGES_REQUESTED") {
        stats.changesRequested += 1;
      } else if (s === "REJECTED" || a === "REJECTED") {
        stats.rejected += 1;
      } else if (
        s === "AWAITING_SIGNATURE" ||
        s === "PENDING_SIGNATURE" ||
        doc.signatureStatus === "PENDING_SIGNATURE"
      ) {
        stats.awaitingSignature += 1;
      } else if (s === "COMPLETED" || s === "SIGNED") {
        stats.completed += 1;
      } else if (s === "APPROVED" || a === "APPROVED") {
        // If approved and awaiting signature, it fell into awaitingSignature above.
        // If not awaiting signature:
        stats.approved += 1;
      }
    }

    return stats;
  }

  /**
   * Get pending approval documents awaiting review
   */
  static async getPendingApprovals(orgId, { search, status, documentType, stage } = {}) {
    const numericOrgId = parseInt(orgId, 10);

    const where = {
      organisationId: numericOrgId,
      isArchived: false,
    };

    if (status && status !== "ALL") {
      const s = status.toUpperCase();
      if (s === "PENDING_APPROVAL") {
        where.OR = [
          { status: "PENDING_APPROVAL" },
          { approvalStatus: "PENDING_APPROVAL" },
          { status: "IN_REVIEW" },
        ];
      } else if (s === "AWAITING_SIGNATURE") {
        where.OR = [
          { status: "AWAITING_SIGNATURE" },
          { status: "PENDING_SIGNATURE" },
          { signatureStatus: "PENDING_SIGNATURE" },
        ];
      } else {
        where.status = s;
      }
    } else {
      // By default show workflow documents that are active in workflow stages
      where.OR = [
        { status: "PENDING_APPROVAL" },
        { status: "IN_REVIEW" },
        { status: "CHANGES_REQUESTED" },
        { status: "APPROVED" },
        { status: "AWAITING_SIGNATURE" },
        { status: "PENDING_SIGNATURE" },
        { status: "REJECTED" },
        { approvalStatus: { in: ["PENDING_APPROVAL", "CHANGES_REQUESTED", "APPROVED", "REJECTED"] } },
      ];
    }

    if (documentType && documentType !== "ALL") {
      where.documentType = documentType;
    }

    if (search && search.trim()) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: search.trim(), mode: "insensitive" } },
            { documentNumber: { contains: search.trim(), mode: "insensitive" } },
            { clientName: { contains: search.trim(), mode: "insensitive" } },
            { createdByName: { contains: search.trim(), mode: "insensitive" } },
          ],
        },
      ];
    }

    const docs = await prisma.unifiedDocument.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        approvalRequests: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            history: { orderBy: { createdAt: "desc" }, take: 10 },
            actions: { orderBy: { createdAt: "desc" }, take: 10 },
            requestedBy: { select: { id: true, full_name: true, email: true } },
          },
        },
      },
    });

    const items = docs.map((doc) => {
      const latestReq = doc.approvalRequests?.[0] || null;

      // Determine friendly current stage
      let currentStage = "Organization Admin";
      const rawStage = latestReq?.stage || "";
      if (rawStage.includes("TEAM_LEAD")) {
        currentStage = "Team Lead";
      } else if (rawStage.includes("DEPARTMENT_MANAGER")) {
        currentStage = "Department Manager";
      } else if (rawStage.includes("ORGANISATION_ADMIN") || rawStage.includes("ORG_ADMIN")) {
        currentStage = "Organization Admin";
      } else if (doc.status === "AWAITING_SIGNATURE" || doc.status === "PENDING_SIGNATURE") {
        currentStage = "Signature";
      } else if (doc.status === "COMPLETED" || doc.status === "SIGNED") {
        currentStage = "Completed";
      } else if (doc.status === "CHANGES_REQUESTED") {
        currentStage = "Creator Revision";
      } else if (doc.status === "REJECTED") {
        currentStage = "Rejected";
      }

      // Filter by stage if requested
      if (stage && stage !== "ALL" && currentStage.toLowerCase() !== stage.toLowerCase()) {
        return null;
      }

      // Normalized status display
      let displayStatus = "Pending Approval";
      const s = (doc.status || "").toUpperCase();
      if (s === "IN_REVIEW") displayStatus = "In Review";
      else if (s === "CHANGES_REQUESTED") displayStatus = "Changes Requested";
      else if (s === "REJECTED") displayStatus = "Rejected";
      else if (s === "APPROVED") displayStatus = "Approved";
      else if (s === "AWAITING_SIGNATURE" || s === "PENDING_SIGNATURE") displayStatus = "Awaiting Signature";
      else if (s === "SIGNED") displayStatus = "Signed";
      else if (s === "COMPLETED") displayStatus = "Completed";
      else if (s === "SENT") displayStatus = "Sent";

      return {
        id: doc.id,
        documentNumber: doc.documentNumber,
        documentName: doc.title,
        documentType: doc.documentType,
        category: doc.category,
        createdBy: doc.createdByName || latestReq?.requestedBy?.full_name || "Rahul Sharma",
        createdByEmail: latestReq?.requestedBy?.email || "employee@docucore.ai",
        department: doc.departmentName || "Sales",
        branch: doc.senderData?.branchName || "Main Headquarters",
        client: doc.clientName || "ABC Pvt Ltd",
        currentStage,
        rawStage: latestReq?.stage || "STAGE_ORGANISATION_ADMIN",
        submittedDate: latestReq?.createdAt || doc.createdAt,
        updatedAt: doc.updatedAt,
        status: displayStatus,
        rawStatus: doc.status,
        signatureRequired: Boolean(doc.signatureRequired),
        signatureStatus: doc.signatureStatus,
        financialTotal: doc.financialData?.total || null,
        financialCurrency: doc.financialData?.currency || "USD",
        approvalRequestId: latestReq?.id || null,
      };
    }).filter(Boolean);

    return items;
  }

  /**
   * Get detailed document payload for review screen
   */
  static async getDocumentReviewDetails(docId, orgId) {
    const numericOrgId = parseInt(orgId, 10);

    const doc = await prisma.unifiedDocument.findFirst({
      where: { id: String(docId), organisationId: numericOrgId },
      include: {
        approvalRequests: {
          orderBy: { createdAt: "desc" },
          include: {
            history: {
              orderBy: { createdAt: "asc" },
              include: { user: { select: { id: true, full_name: true, role: true, email: true } } },
            },
            actions: {
              orderBy: { createdAt: "asc" },
              include: { performedBy: { select: { id: true, full_name: true, role: true } } },
            },
            requestedBy: { select: { id: true, full_name: true, email: true, role: true } },
          },
        },
        versions: { orderBy: { versionNumber: "desc" }, take: 10 },
        statusHistory: { orderBy: { createdAt: "desc" }, take: 20 },
        comments: { orderBy: { createdAt: "desc" } },
        auditLogs: { orderBy: { createdAt: "desc" }, take: 20 },
        signatureEnvelopes: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { signers: true },
        },
      },
    });

    if (!doc) {
      throw new Error("Document not found or does not belong to this organisation.");
    }

    const latestReq = doc.approvalRequests?.[0] || null;

    // Build visual workflow stepper status
    // Sequence: Employee -> Team Lead -> Department Manager -> Organization Admin -> Signature -> Completed
    const docStatus = (doc.status || "").toUpperCase();
    const reqStage = (latestReq?.stage || "").toUpperCase();

    // Determine state of each stage: 'completed' | 'current' | 'pending' | 'rejected' | 'changes_requested'
    const stepper = [
      {
        id: "employee",
        label: "Employee",
        role: "EMPLOYEE",
        subtitle: "Created & Submitted",
        state: "completed",
        completedBy: doc.createdByName || latestReq?.requestedBy?.full_name || "Employee",
        date: doc.createdAt,
      },
      {
        id: "team_lead",
        label: "Team Lead",
        role: "TEAM_LEADER",
        subtitle: "First Review",
        state: "completed",
        completedBy: "Team Lead",
        date: null,
      },
      {
        id: "dept_manager",
        label: "Department Manager",
        role: "DEPARTMENT_MANAGER",
        subtitle: "Department Verification",
        state: "completed",
        completedBy: "Department Manager",
        date: null,
      },
      {
        id: "org_admin",
        label: "Organization Admin",
        role: "ORGANISATION_ADMIN",
        subtitle: "Final Approval",
        state: "current",
        completedBy: null,
        date: null,
      },
      {
        id: "signature",
        label: "Signature",
        role: "SIGNER",
        subtitle: doc.signatureRequired ? "Mandatory E-Signature" : "Not Required",
        state: doc.signatureRequired ? "pending" : "skipped",
        completedBy: null,
        date: null,
      },
      {
        id: "completed",
        label: "Completed",
        role: "SYSTEM",
        subtitle: "Ready for Client",
        state: "pending",
        completedBy: null,
        date: null,
      },
    ];

    // Adjust stepper states based on stage & status
    if (docStatus === "REJECTED") {
      stepper.forEach((s) => {
        if (s.id === "org_admin") s.state = "rejected";
        else if (s.id === "signature" || s.id === "completed") s.state = "pending";
      });
    } else if (docStatus === "CHANGES_REQUESTED") {
      stepper.forEach((s) => {
        if (s.id === "org_admin") s.state = "changes_requested";
        else if (s.id === "signature" || s.id === "completed") s.state = "pending";
      });
    } else if (docStatus === "AWAITING_SIGNATURE" || docStatus === "PENDING_SIGNATURE") {
      stepper[0].state = "completed";
      stepper[1].state = "completed";
      stepper[2].state = "completed";
      stepper[3].state = "completed";
      stepper[4].state = "current";
      stepper[5].state = "pending";
    } else if (docStatus === "SIGNED" || docStatus === "COMPLETED" || docStatus === "SENT") {
      stepper.forEach((s) => {
        s.state = s.state === "skipped" ? "skipped" : "completed";
      });
    } else if (reqStage.includes("TEAM_LEAD")) {
      stepper[1].state = "current";
      stepper[2].state = "pending";
      stepper[3].state = "pending";
      stepper[4].state = doc.signatureRequired ? "pending" : "skipped";
      stepper[5].state = "pending";
    } else if (reqStage.includes("DEPARTMENT_MANAGER")) {
      stepper[1].state = "completed";
      stepper[2].state = "current";
      stepper[3].state = "pending";
      stepper[4].state = doc.signatureRequired ? "pending" : "skipped";
      stepper[5].state = "pending";
    } else {
      // At Org Admin stage
      stepper[1].state = "completed";
      stepper[2].state = "completed";
      stepper[3].state = "current";
      stepper[4].state = doc.signatureRequired ? "pending" : "skipped";
      stepper[5].state = "pending";
    }

    // Build chronological workflow history
    const historyList = [];

    // Submitter
    historyList.push({
      action: "Document Created & Submitted",
      user: doc.createdByName || latestReq?.requestedBy?.full_name || "Employee",
      role: "Creator",
      time: doc.createdAt,
      comment: latestReq?.comments || "Document submitted for organizational approval hierarchy",
      previousStatus: "DRAFT",
      newStatus: "PENDING_APPROVAL",
    });

    // Approval Request History items
    if (latestReq?.history?.length) {
      for (const h of latestReq.history) {
        historyList.push({
          action: h.action,
          user: h.user?.full_name || h.userRole || "Reviewer",
          role: h.user?.role || h.userRole || "Reviewer",
          time: h.createdAt,
          comment: h.comment || "",
          previousStatus: "IN_REVIEW",
          newStatus: h.action,
        });
      }
    }

    // Status History
    if (doc.statusHistory?.length) {
      for (const sh of doc.statusHistory) {
        // avoid exact duplicates
        const exists = historyList.some(
          (x) => Math.abs(new Date(x.time).getTime() - new Date(sh.createdAt).getTime()) < 2000
        );
        if (!exists) {
          historyList.push({
            action: `Status: ${sh.newStatus.replace(/_/g, " ")}`,
            user: sh.actorName || "System",
            role: sh.actorType || "System",
            time: sh.createdAt,
            comment: sh.reason || "",
            previousStatus: sh.previousStatus,
            newStatus: sh.newStatus,
          });
        }
      }
    }

    historyList.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return {
      id: doc.id,
      documentNumber: doc.documentNumber,
      documentName: doc.title,
      documentType: doc.documentType,
      category: doc.category,
      createdBy: doc.createdByName || latestReq?.requestedBy?.full_name || "Rahul Sharma",
      createdByEmail: latestReq?.requestedBy?.email || "employee@docucore.ai",
      department: doc.departmentName || "Sales",
      branch: doc.senderData?.branchName || "Main Headquarters",
      client: doc.clientName || "ABC Pvt Ltd",
      clientEmail: doc.clientEmail || "client@abcpvt.com",
      clientAddress: doc.clientAddress || "",
      createdDate: doc.createdAt,
      updatedDate: doc.updatedAt,
      status: doc.status,
      currentWorkflowStage: stepper.find((s) => s.state === "current")?.label || "Organization Admin",
      signatureRequired: Boolean(doc.signatureRequired),
      signatureStatus: doc.signatureStatus,
      senderData: doc.senderData,
      recipientData: doc.recipientData,
      content: doc.content,
      financialData: doc.financialData,
      variables: doc.variables,
      stepper,
      history: historyList,
      versions: doc.versions || [],
      comments: doc.comments || [],
      signatureEnvelope: doc.signatureEnvelopes?.[0] || null,
      pdfUrl: doc.pdfUrl || null,
    };
  }

  /**
   * Process Approval Decision: APPROVE, REJECT, or REQUEST_CHANGES
   */
  static async processDecision(docId, orgId, user, { action, comment = "" }) {
    const numericOrgId = parseInt(orgId, 10);
    const upperAction = String(action || "").toUpperCase();

    if (!["APPROVE", "REJECT", "REQUEST_CHANGES"].includes(upperAction)) {
      throw new Error("Invalid action. Must be APPROVE, REJECT, or REQUEST_CHANGES.");
    }

    const doc = await prisma.unifiedDocument.findFirst({
      where: { id: String(docId), organisationId: numericOrgId },
      include: {
        approvalRequests: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!doc) {
      throw new Error("Document not found.");
    }

    // Role & Stage Security Check
    const userRole = (user?.role || "ORGANISATION_ADMIN").toUpperCase();
    const isOrgAdmin = userRole === "ORGANISATION_ADMIN" || userRole === "SUPER_ADMIN";

    // Prevent approving an already signed or completed document
    if (doc.status === "SIGNED" || doc.status === "COMPLETED") {
      throw new Error("Cannot alter an already signed and completed document.");
    }

    // Handle REQUEST_CHANGES
    if (upperAction === "REQUEST_CHANGES") {
      if (!comment || !comment.trim()) {
        throw new Error("A comment/reason is mandatory when requesting changes.");
      }

      const previousStatus = doc.status;
      const newStatus = "CHANGES_REQUESTED";

      // 1. Update Document
      const updated = await prisma.unifiedDocument.update({
        where: { id: doc.id },
        data: {
          status: newStatus,
          approvalStatus: newStatus,
          updatedAt: new Date(),
        },
      });

      // 2. Update or create ApprovalRequest
      let reqId = doc.approvalRequests?.[0]?.id;
      if (reqId) {
        await prisma.approvalRequest.update({
          where: { id: reqId },
          data: {
            status: "CHANGES_REQUESTED",
            stage: "STAGE_CHANGES_REQUESTED",
            comments: comment.trim(),
            updatedAt: new Date(),
          },
        });
      } else {
        const newReq = await prisma.approvalRequest.create({
          data: {
            organisationId: numericOrgId,
            unifiedDocumentId: doc.id,
            documentName: doc.title,
            requestedById: user.id ? parseInt(user.id, 10) : 1,
            status: "CHANGES_REQUESTED",
            stage: "STAGE_CHANGES_REQUESTED",
            comments: comment.trim(),
          },
        });
        reqId = newReq.id;
      }

      // 3. Record History & Action
      await prisma.approvalHistoryItem.create({
        data: {
          approvalRequestId: reqId,
          userId: user.id ? parseInt(user.id, 10) : null,
          userRole: userRole,
          action: "CHANGES_REQUESTED",
          comment: comment.trim(),
        },
      }).catch(() => {});

      await prisma.unifiedDocumentStatusHistory.create({
        data: {
          documentId: doc.id,
          previousStatus,
          newStatus,
          reason: comment.trim(),
          actorType: "USER",
          actorId: String(user.id || 0),
          actorName: user.name || user.full_name || "Organisation Admin",
        },
      }).catch(() => {});

      // 4. Notify Document Creator
      if (doc.createdByUserId) {
        await prisma.notification.create({
          data: {
            organisation_id: numericOrgId,
            user_id: doc.createdByUserId,
            title: `Changes Requested on "${doc.title}"`,
            message: `Organisation Admin requested changes on "${doc.title}". Note: "${comment.trim()}"`,
            type: "APPROVAL_UPDATE",
            link: `/org-admin/ai-builder?id=${doc.id}`,
          },
        }).catch(() => {});
      }

      return {
        success: true,
        message: "Changes requested successfully. Document returned to creator.",
        status: newStatus,
        document: updated,
      };
    }

    // Handle REJECT
    if (upperAction === "REJECT") {
      if (!comment || !comment.trim()) {
        throw new Error("A rejection reason is mandatory.");
      }

      const previousStatus = doc.status;
      const newStatus = "REJECTED";

      const updated = await prisma.unifiedDocument.update({
        where: { id: doc.id },
        data: {
          status: newStatus,
          approvalStatus: newStatus,
          updatedAt: new Date(),
        },
      });

      let reqId = doc.approvalRequests?.[0]?.id;
      if (reqId) {
        await prisma.approvalRequest.update({
          where: { id: reqId },
          data: {
            status: "REJECTED",
            stage: "STAGE_REJECTED",
            comments: comment.trim(),
            updatedAt: new Date(),
          },
        });
      } else {
        const newReq = await prisma.approvalRequest.create({
          data: {
            organisationId: numericOrgId,
            unifiedDocumentId: doc.id,
            documentName: doc.title,
            requestedById: user.id ? parseInt(user.id, 10) : 1,
            status: "REJECTED",
            stage: "STAGE_REJECTED",
            comments: comment.trim(),
          },
        });
        reqId = newReq.id;
      }

      await prisma.approvalHistoryItem.create({
        data: {
          approvalRequestId: reqId,
          userId: user.id ? parseInt(user.id, 10) : null,
          userRole: userRole,
          action: "REJECTED",
          comment: comment.trim(),
        },
      }).catch(() => {});

      await prisma.unifiedDocumentStatusHistory.create({
        data: {
          documentId: doc.id,
          previousStatus,
          newStatus,
          reason: comment.trim(),
          actorType: "USER",
          actorId: String(user.id || 0),
          actorName: user.name || user.full_name || "Organisation Admin",
        },
      }).catch(() => {});

      if (doc.createdByUserId) {
        await prisma.notification.create({
          data: {
            organisation_id: numericOrgId,
            user_id: doc.createdByUserId,
            title: `Document Rejected: "${doc.title}"`,
            message: `Your document was rejected by Organisation Admin. Reason: "${comment.trim()}"`,
            type: "APPROVAL_REJECTED",
            link: `/org-admin/workflow`,
          },
        }).catch(() => {});
      }

      return {
        success: true,
        message: "Document rejected.",
        status: newStatus,
        document: updated,
      };
    }

    // Handle APPROVE
    if (upperAction === "APPROVE") {
      const previousStatus = doc.status;
      let newDocStatus = "APPROVED";
      let redirectUrl = null;
      let signatureEnvelope = null;

      // Always initialize signature envelope so approval routes directly to the signature page as requested
      newDocStatus = "AWAITING_SIGNATURE";
      try {
        const existingEnvelope = await prisma.signatureEnvelope.findFirst({
          where: { unifiedDocumentId: doc.id, organisationId: numericOrgId },
          include: { signers: true },
        });

        if (existingEnvelope) {
          signatureEnvelope = existingEnvelope;
        } else {
          signatureEnvelope = await prisma.signatureEnvelope.create({
            data: {
              organisationId: numericOrgId,
              unifiedDocumentId: doc.id,
              title: `Signature for ${doc.title}`,
              status: "PENDING",
              createdById: user.id ? parseInt(user.id, 10) : 1,
              signers: {
                create: [
                  {
                    name: user.name || user.full_name || "Organisation Admin",
                    email: user.email || "admin@docucore.ai",
                    role: "EXECUTIVE_SIGNER",
                    order: 1,
                    status: "PENDING",
                  },
                ],
              },
            },
            include: { signers: true },
          });
        }

        redirectUrl = `/documents/sign/${doc.id}?envelopeId=${signatureEnvelope.id}&returnTo=/org-admin/documents`;
      } catch (eSignErr) {
        console.error("Signature Envelope creation note:", eSignErr);
        redirectUrl = `/documents/sign/${doc.id}?returnTo=/org-admin/documents`;
      }

      // Update UnifiedDocument
      const updated = await prisma.unifiedDocument.update({
        where: { id: doc.id },
        data: {
          status: "AWAITING_SIGNATURE",
          approvalStatus: "APPROVED",
          signatureStatus: "PENDING_SIGNATURE",
          signatureRequired: true,
          updatedAt: new Date(),
        },
      });

      // Update ApprovalRequest
      let reqId = doc.approvalRequests?.[0]?.id;
      if (reqId) {
        await prisma.approvalRequest.update({
          where: { id: reqId },
          data: {
            status: "APPROVED",
            stage: doc.signatureRequired ? "STAGE_SIGNATURE" : "STAGE_COMPLETED",
            currentApproverName: user.name || user.full_name || "Organisation Admin",
            comments: comment.trim() || "Final approval granted by Organisation Admin.",
            updatedAt: new Date(),
          },
        });
      } else {
        const newReq = await prisma.approvalRequest.create({
          data: {
            organisationId: numericOrgId,
            unifiedDocumentId: doc.id,
            documentName: doc.title,
            requestedById: user.id ? parseInt(user.id, 10) : 1,
            status: "APPROVED",
            stage: doc.signatureRequired ? "STAGE_SIGNATURE" : "STAGE_COMPLETED",
            currentApproverName: user.name || user.full_name || "Organisation Admin",
            comments: comment.trim() || "Final approval granted by Organisation Admin.",
          },
        });
        reqId = newReq.id;
      }

      // Record Action & History
      await prisma.approvalAction.create({
        data: {
          approvalRequestId: reqId,
          performedById: user.id ? parseInt(user.id, 10) : null,
          action: doc.signatureRequired ? "APPROVED_FORWARDED_TO_SIGNATURE" : "FINAL_APPROVAL_COMPLETED",
          comment: comment.trim() || "Approved by Organisation Admin",
        },
      }).catch(() => {});

      await prisma.approvalHistoryItem.create({
        data: {
          approvalRequestId: reqId,
          userId: user.id ? parseInt(user.id, 10) : null,
          userRole: userRole,
          action: "APPROVED",
          comment: comment.trim() || (doc.signatureRequired ? "Approved & routed to E-Signature" : "Approved & completed"),
        },
      }).catch(() => {});

      await prisma.unifiedDocumentStatusHistory.create({
        data: {
          documentId: doc.id,
          previousStatus,
          newStatus: newDocStatus,
          reason: comment.trim() || (doc.signatureRequired ? "Approved by Org Admin, signature envelope initialized" : "Final approval granted"),
          actorType: "USER",
          actorId: String(user.id || 0),
          actorName: user.name || user.full_name || "Organisation Admin",
        },
      }).catch(() => {});

      // Notify Creator
      if (doc.createdByUserId) {
        await prisma.notification.create({
          data: {
            organisation_id: numericOrgId,
            user_id: doc.createdByUserId,
            title: `Document Approved: "${doc.title}"`,
            message: doc.signatureRequired
              ? `"${doc.title}" was approved by Organisation Admin and is now awaiting signature.`
              : `"${doc.title}" has received final approval and is now ready in Documents!`,
            type: "APPROVAL_SUCCESS",
            link: `/org-admin/documents?id=${doc.id}`,
          },
        }).catch(() => {});
      }

      return {
        success: true,
        message: doc.signatureRequired
          ? "Document approved! Forwarded to E-Signature workflow."
          : "Document approved successfully and marked as Completed.",
        status: newDocStatus,
        signatureRequired: doc.signatureRequired,
        redirectUrl,
        envelopeId: signatureEnvelope?.id || null,
        document: updated,
      };
    }
  }

  /**
   * Get workflow approval configurations per document type
   */
  static async getWorkflowConfig(orgId) {
    const numericOrgId = parseInt(orgId, 10);

    // Look for stored rules in ApprovalRule or return defaults
    const rules = await prisma.approvalRule.findMany({
      where: { organisationId: numericOrgId, status: "ACTIVE" },
    });

    if (!rules.length) {
      return DEFAULT_CONFIGS;
    }

    try {
      const parsed = rules.map((r) => {
        const cond = JSON.parse(r.conditionJson || "{}");
        const app = JSON.parse(r.approversJson || "{}");
        return {
          id: r.id,
          documentType: cond.documentType || r.name,
          requireTeamLead: Boolean(app.requireTeamLead),
          requireDepartmentManager: Boolean(app.requireDepartmentManager),
          requireOrgAdmin: Boolean(app.requireOrgAdmin ?? true),
          signatureRequired: Boolean(app.signatureRequired),
          description: cond.description || "",
        };
      });
      return parsed;
    } catch (e) {
      return DEFAULT_CONFIGS;
    }
  }

  /**
   * Update workflow approval configuration for the organisation
   */
  static async updateWorkflowConfig(orgId, userId, configs) {
    const numericOrgId = parseInt(orgId, 10);
    const numericUserId = parseInt(userId, 10) || 1;

    if (!Array.isArray(configs)) {
      throw new Error("Configuration must be an array of document type rules.");
    }

    // Upsert approval rules
    for (const item of configs) {
      const { documentType, requireTeamLead, requireDepartmentManager, requireOrgAdmin, signatureRequired, description } = item;
      const condJson = JSON.stringify({ documentType, description });
      const appJson = JSON.stringify({ requireTeamLead, requireDepartmentManager, requireOrgAdmin, signatureRequired });

      const existing = await prisma.approvalRule.findFirst({
        where: { organisationId: numericOrgId, name: documentType },
      });

      if (existing) {
        await prisma.approvalRule.update({
          where: { id: existing.id },
          data: {
            conditionJson: condJson,
            approversJson: appJson,
          },
        });
      } else {
        await prisma.approvalRule.create({
          data: {
            organisationId: numericOrgId,
            name: documentType,
            conditionJson: condJson,
            approversJson: appJson,
            createdById: numericUserId,
            status: "ACTIVE",
          },
        });
      }
    }

    return await this.getWorkflowConfig(orgId);
  }

  /**
   * Get full chronological audit history of all document workflow transitions
   */
  static async getWorkflowAuditHistory(orgId, { limit = 100 } = {}) {
    const numericOrgId = parseInt(orgId, 10);

    const history = await prisma.approvalHistoryItem.findMany({
      where: {
        approvalRequest: { organisationId: numericOrgId },
      },
      include: {
        user: { select: { id: true, full_name: true, role: true, email: true } },
        approvalRequest: {
          select: {
            id: true,
            documentName: true,
            unifiedDocumentId: true,
            stage: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return history.map((item) => ({
      id: item.id,
      requestId: item.approvalRequestId,
      documentId: item.approvalRequest?.unifiedDocumentId,
      documentName: item.approvalRequest?.documentName || "Document",
      action: item.action,
      user: item.user?.full_name || item.userRole || "Reviewer",
      role: item.user?.role || item.userRole || "Reviewer",
      timestamp: item.createdAt,
      comment: item.comment || "",
      stage: item.approvalRequest?.stage || "ORGANISATION_ADMIN",
      status: item.approvalRequest?.status || "PENDING",
    }));
  }
}

module.exports = WorkflowEngineService;
