const prisma = require("../config/prismaClient");
const AuditLogService = require("./auditLogService");
const RetentionWorker = require("./retentionWorker");

class GovernanceService {
  /**
   * 1. High-Level Governance Dashboard Summary
   */
  static async getDashboardSummary(organisationId) {
    const orgId = Number(organisationId);

    const [
      securityPolicy,
      pendingChangesCount,
      activeCampaignsCount,
      pendingReviewItemsCount,
      openIncidentsCount,
      highRisksCount,
      retentionPoliciesCount,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.securityPolicy.findUnique({ where: { organisationId: orgId } }).catch(() => null),
      prisma.governanceChangeRequest.count({ where: { organisationId: orgId, status: "PENDING_APPROVAL" } }).catch(() => 0),
      prisma.accessReviewCampaign.count({ where: { organisationId: orgId, status: { in: ["ACTIVE", "IN_PROGRESS"] } } }).catch(() => 0),
      prisma.accessReviewItem.count({ where: { campaign: { organisationId: orgId }, status: "PENDING" } }).catch(() => 0),
      prisma.incident.count({ where: { organisationId: orgId, status: { in: ["OPEN", "INVESTIGATING", "CONTAINED"] } } }).catch(() => 0),
      prisma.risk.count({ where: { organisationId: orgId, severity: { in: ["HIGH", "CRITICAL"] }, status: { not: "CLOSED" } } }).catch(() => 0),
      prisma.storageRetentionPolicy.count({ where: { organisationId: String(orgId), status: "ACTIVE" } }).catch(() => 0),
      prisma.auditLog.findMany({
        where: { organisationId: String(orgId) },
        orderBy: { createdAt: "desc" },
        take: 8,
      }).catch((e) => {
        console.error("Dashboard audit log query error:", e);
        return [];
      }),
    ]);

    // Calculate real dynamic compliance score based on active security & governance controls
    let complianceScore = 70; // baseline
    if (securityPolicy) {
      if (securityPolicy.mfaEnforced) complianceScore += 8;
      if (securityPolicy.passwordMinLength >= 10) complianceScore += 6;
      if (securityPolicy.passwordRequireComplexity) complianceScore += 6;
      if (securityPolicy.maxLoginAttempts <= 5) complianceScore += 4;
      if (securityPolicy.sessionTimeoutMinutes <= 60) complianceScore += 3;
    }
    if (retentionPoliciesCount > 0) complianceScore += 3;
    if (openIncidentsCount === 0) complianceScore += 2;
    complianceScore = Math.min(100, Math.max(0, complianceScore));

    return {
      success: true,
      data: {
        complianceScore: Number(complianceScore.toFixed(1)),
        pendingChangeApprovals: pendingChangesCount,
        activeAccessReviewCampaigns: activeCampaignsCount,
        pendingAccessReviewsDue: pendingReviewItemsCount,
        openIncidents: openIncidentsCount,
        criticalRisks: highRisksCount,
        activeRetentionPolicies: retentionPoliciesCount,
        securitySummary: {
          mfaEnforced: securityPolicy?.mfaEnforced || false,
          passwordMinLength: securityPolicy?.passwordMinLength || 8,
          sessionTimeoutMinutes: securityPolicy?.sessionTimeoutMinutes || 60,
          maxLoginAttempts: securityPolicy?.maxLoginAttempts || 5,
        },
        recentActivity: recentAuditLogs.map((log) => ({
          id: log.id,
          eventId: log.eventId,
          action: log.action.replace(/_/g, " "),
          actor: log.actorName,
          resource: log.resourceName || log.resourceType,
          severity: log.severity,
          status: log.status,
          timestamp: log.createdAt,
        })),
      },
    };
  }

  /**
   * 2. Security Policy Management
   */
  static async getSecurityPolicy(organisationId) {
    const orgId = Number(organisationId);
    let policy = await prisma.securityPolicy.findUnique({
      where: { organisationId: orgId },
    });

    if (!policy) {
      policy = await prisma.securityPolicy.create({
        data: {
          organisationId: orgId,
          mfaEnforced: false,
          passwordMinLength: 8,
          passwordRequireComplexity: true,
          lockoutDurationMinutes: 15,
          sessionTimeoutMinutes: 60,
          ipAllowlist: [],
          maxLoginAttempts: 5,
          sensitiveDocAiRestricted: false,
          externalAiRestricted: false,
        },
      });
    }

    return { success: true, data: policy };
  }

  static async updateSecurityPolicy(organisationId, payload, user = {}, req = null) {
    const orgId = Number(organisationId);
    const existing = await prisma.securityPolicy.findUnique({ where: { organisationId: orgId } });

    const updated = await prisma.securityPolicy.upsert({
      where: { organisationId: orgId },
      create: {
        organisationId: orgId,
        mfaEnforced: Boolean(payload.mfaEnforced),
        passwordMinLength: payload.passwordMinLength ? Number(payload.passwordMinLength) : 8,
        passwordRequireComplexity: payload.passwordRequireComplexity !== undefined ? Boolean(payload.passwordRequireComplexity) : true,
        lockoutDurationMinutes: payload.lockoutDurationMinutes ? Number(payload.lockoutDurationMinutes) : 15,
        sessionTimeoutMinutes: payload.sessionTimeoutMinutes ? Number(payload.sessionTimeoutMinutes) : 60,
        ipAllowlist: Array.isArray(payload.ipAllowlist) ? payload.ipAllowlist : [],
        maxLoginAttempts: payload.maxLoginAttempts ? Number(payload.maxLoginAttempts) : 5,
        sensitiveDocAiRestricted: Boolean(payload.sensitiveDocAiRestricted),
        externalAiRestricted: Boolean(payload.externalAiRestricted),
      },
      update: {
        mfaEnforced: payload.mfaEnforced !== undefined ? Boolean(payload.mfaEnforced) : undefined,
        passwordMinLength: payload.passwordMinLength !== undefined ? Number(payload.passwordMinLength) : undefined,
        passwordRequireComplexity: payload.passwordRequireComplexity !== undefined ? Boolean(payload.passwordRequireComplexity) : undefined,
        lockoutDurationMinutes: payload.lockoutDurationMinutes !== undefined ? Number(payload.lockoutDurationMinutes) : undefined,
        sessionTimeoutMinutes: payload.sessionTimeoutMinutes !== undefined ? Number(payload.sessionTimeoutMinutes) : undefined,
        ipAllowlist: Array.isArray(payload.ipAllowlist) ? payload.ipAllowlist : undefined,
        maxLoginAttempts: payload.maxLoginAttempts !== undefined ? Number(payload.maxLoginAttempts) : undefined,
        sensitiveDocAiRestricted: payload.sensitiveDocAiRestricted !== undefined ? Boolean(payload.sensitiveDocAiRestricted) : undefined,
        externalAiRestricted: payload.externalAiRestricted !== undefined ? Boolean(payload.externalAiRestricted) : undefined,
      },
    });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Org Admin",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "GOVERNANCE",
      action: "SECURITY_POLICY_UPDATED",
      resourceType: "SECURITY_POLICY",
      resourceId: updated.id,
      severity: "WARNING",
      status: "SUCCESS",
      beforeData: existing,
      afterData: updated,
      req,
    });

    return { success: true, message: "Security policy updated and enforced successfully.", data: updated };
  }

  /**
   * 3. AI Usage Policy Management
   */
  static async getAiPolicies(organisationId) {
    const orgId = Number(organisationId);
    const policies = await prisma.aiUsagePolicy.findMany({
      where: { organisationId: orgId },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: policies };
  }

  static async saveAiPolicy(organisationId, payload, user = {}, req = null) {
    const orgId = Number(organisationId);
    const policy = await prisma.aiUsagePolicy.create({
      data: {
        organisationId: orgId,
        departmentId: payload.departmentId ? Number(payload.departmentId) : null,
        monthlyQuotaRequests: payload.monthlyQuotaRequests ? Number(payload.monthlyQuotaRequests) : 10000,
        allowedProviders: Array.isArray(payload.allowedProviders) ? payload.allowedProviders : ["GEMINI", "OPENAI", "CLAUDE"],
        allowedTools: Array.isArray(payload.allowedTools) ? payload.allowedTools : ["DOCUMENT_GENERATION", "OCR", "QA", "SUMMARIZATION"],
      },
    });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Org Admin",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "GOVERNANCE",
      action: "AI_POLICY_CREATED",
      resourceType: "AI_POLICY",
      resourceId: policy.id,
      severity: "INFO",
      status: "SUCCESS",
      afterData: policy,
      req,
    });

    return { success: true, message: "AI policy saved successfully.", data: policy };
  }

  /**
   * 4. Governance Change Requests
   */
  static async getChangeRequests(organisationId, filters = {}) {
    const orgId = Number(organisationId);
    const where = { organisationId: orgId };
    if (filters.status && filters.status !== "ALL") where.status = filters.status;
    if (filters.changeType && filters.changeType !== "ALL") where.changeType = filters.changeType;
    if (filters.severity && filters.severity !== "ALL") where.severity = filters.severity;

    const requests = await prisma.governanceChangeRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: requests };
  }

  static async createChangeRequest(organisationId, payload, user = {}, req = null) {
    const orgId = Number(organisationId);
    const changeRequestId = `CR-${Date.now().toString().slice(-6)}`;

    const newRequest = await prisma.governanceChangeRequest.create({
      data: {
        changeRequestId,
        organisationId: orgId,
        requesterId: Number(user.id || user.userId || 1),
        requesterName: user.name || user.email || "Requester",
        changeType: payload.changeType || "SECURITY_POLICY",
        title: payload.title || "Governance Change Request",
        description: payload.description || "Administrative configuration change request",
        currentValue: payload.currentValue || null,
        requestedValue: payload.requestedValue || null,
        severity: payload.severity || "MEDIUM",
        status: "PENDING_APPROVAL",
      },
    });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Requester",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "GOVERNANCE",
      action: "GOVERNANCE_CHANGE_REQUEST_CREATED",
      resourceType: "CHANGE_REQUEST",
      resourceId: newRequest.id,
      resourceName: newRequest.title,
      severity: newRequest.severity,
      status: "SUCCESS",
      afterData: newRequest,
      req,
    });

    return { success: true, message: `Change request ${changeRequestId} submitted for approval.`, data: newRequest };
  }

  static async approveChangeRequest(organisationId, id, { approvalReason }, user = {}, req = null) {
    const orgId = Number(organisationId);
    const existing = await prisma.governanceChangeRequest.findFirst({
      where: { id: String(id), organisationId: orgId },
    });

    if (!existing) throw new Error("Change request not found.");
    if (existing.status !== "PENDING_APPROVAL") throw new Error(`Change request cannot be approved in '${existing.status}' status.`);

    const updated = await prisma.governanceChangeRequest.update({
      where: { id: existing.id },
      data: {
        status: "APPROVED",
        approverId: Number(user.id || user.userId || 1),
        approverName: user.name || user.email || "Approver",
        approvalReason: approvalReason || "Approved after review",
        reviewedAt: new Date(),
      },
    });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Approver",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "GOVERNANCE",
      action: "GOVERNANCE_CHANGE_REQUEST_APPROVED",
      resourceType: "CHANGE_REQUEST",
      resourceId: updated.id,
      resourceName: updated.title,
      severity: "INFO",
      status: "SUCCESS",
      beforeData: { status: existing.status },
      afterData: { status: "APPROVED", approvalReason },
      req,
    });

    return { success: true, message: `Change request ${updated.changeRequestId} approved.`, data: updated };
  }

  static async rejectChangeRequest(organisationId, id, { approvalReason }, user = {}, req = null) {
    const orgId = Number(organisationId);
    const existing = await prisma.governanceChangeRequest.findFirst({
      where: { id: String(id), organisationId: orgId },
    });

    if (!existing) throw new Error("Change request not found.");
    if (existing.status !== "PENDING_APPROVAL") throw new Error(`Change request cannot be rejected in '${existing.status}' status.`);

    const updated = await prisma.governanceChangeRequest.update({
      where: { id: existing.id },
      data: {
        status: "REJECTED",
        approverId: Number(user.id || user.userId || 1),
        approverName: user.name || user.email || "Approver",
        approvalReason: approvalReason || "Rejected during review",
        reviewedAt: new Date(),
      },
    });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Approver",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "GOVERNANCE",
      action: "GOVERNANCE_CHANGE_REQUEST_REJECTED",
      resourceType: "CHANGE_REQUEST",
      resourceId: updated.id,
      resourceName: updated.title,
      severity: "WARNING",
      status: "SUCCESS",
      beforeData: { status: existing.status },
      afterData: { status: "REJECTED", approvalReason },
      req,
    });

    return { success: true, message: `Change request ${updated.changeRequestId} rejected.`, data: updated };
  }

  static async applyChangeRequest(organisationId, id, user = {}, req = null) {
    const orgId = Number(organisationId);
    const existing = await prisma.governanceChangeRequest.findFirst({
      where: { id: String(id), organisationId: orgId },
    });

    if (!existing) throw new Error("Change request not found.");
    if (existing.status !== "APPROVED") throw new Error("Only APPROVED change requests can be applied.");

    // If change is SECURITY_POLICY, apply requested values to SecurityPolicy table
    if (existing.changeType === "SECURITY_POLICY" && existing.requestedValue) {
      await GovernanceService.updateSecurityPolicy(orgId, existing.requestedValue, user, req);
    }

    const updated = await prisma.governanceChangeRequest.update({
      where: { id: existing.id },
      data: {
        status: "APPLIED",
        appliedAt: new Date(),
      },
    });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Administrator",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "GOVERNANCE",
      action: "GOVERNANCE_CHANGE_REQUEST_APPLIED",
      resourceType: "CHANGE_REQUEST",
      resourceId: updated.id,
      resourceName: updated.title,
      severity: "INFO",
      status: "SUCCESS",
      afterData: { status: "APPLIED", appliedAt: updated.appliedAt },
      req,
    });

    return { success: true, message: `Change request ${updated.changeRequestId} successfully applied to organisation.`, data: updated };
  }

  /**
   * 5. Access Review Campaigns & Items
   */
  static async getAccessReviewCampaigns(organisationId) {
    const orgId = Number(organisationId);
    const campaigns = await prisma.accessReviewCampaign.findMany({
      where: { organisationId: orgId },
      include: {
        items: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = campaigns.map((c) => {
      const total = c.items.length;
      const certified = c.items.filter((i) => i.status === "CERTIFIED").length;
      const revoked = c.items.filter((i) => i.status === "REVOKED").length;
      const changeReq = c.items.filter((i) => i.status === "CHANGE_REQUESTED").length;
      const pending = c.items.filter((i) => i.status === "PENDING").length;

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        reviewerName: c.reviewerName || "Unassigned",
        startDate: c.startDate,
        dueDate: c.dueDate,
        status: c.status,
        progress: total > 0 ? Math.round(((total - pending) / total) * 100) : 100,
        stats: { total, certified, revoked, changeReq, pending },
        createdAt: c.createdAt,
      };
    });

    return { success: true, data: formatted };
  }

  static async createAccessReviewCampaign(organisationId, payload, user = {}, req = null) {
    const orgId = Number(organisationId);
    const { name, description, dueDate, reviewerName } = payload;

    if (!name) throw new Error("Campaign name is required.");
    const due = dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Fetch all current active users in organisation to populate review checklist
    const orgUsers = await prisma.user.findMany({
      where: { organisation_id: orgId },
      include: { ownedDepartments: true },
    });

    const campaign = await prisma.accessReviewCampaign.create({
      data: {
        name,
        description: description || "Periodic User Access & Privilege Certification",
        organisationId: orgId,
        reviewerId: Number(user.id || user.userId || 1),
        reviewerName: reviewerName || user.name || user.email || "Access Reviewer",
        dueDate: due,
        status: "ACTIVE",
        items: {
          create: orgUsers.map((u) => ({
            userId: u.id,
            userName: u.full_name,
            userEmail: u.email,
            currentRole: u.role,
            currentDepartmentId: u.department_id || null,
            currentDepartment: u.role === "ORGANISATION_ADMIN" ? "Executive" : u.role === "DEPARTMENT_MANAGER" ? "Department Management" : "General Operations",
            lastLogin: u.last_login,
            status: "PENDING",
          })),
        },
      },
      include: { items: true },
    });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Access Reviewer",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "ACCESS_REVIEW",
      action: "ACCESS_REVIEW_CAMPAIGN_CREATED",
      resourceType: "ACCESS_CAMPAIGN",
      resourceId: campaign.id,
      resourceName: campaign.name,
      severity: "INFO",
      status: "SUCCESS",
      metadata: { targetUsersCount: orgUsers.length, dueDate: due },
      req,
    });

    return { success: true, message: `Access review campaign "${name}" created with ${orgUsers.length} user reviews.`, data: campaign };
  }

  static async getCampaignDetails(organisationId, campaignId) {
    const orgId = Number(organisationId);
    const campaign = await prisma.accessReviewCampaign.findFirst({
      where: { id: String(campaignId), organisationId: orgId },
      include: {
        items: {
          orderBy: { userName: "asc" },
        },
      },
    });

    if (!campaign) throw new Error("Access review campaign not found.");

    return { success: true, data: campaign };
  }

  static async decideAccessReviewItem(organisationId, campaignId, itemId, payload, user = {}, req = null) {
    const orgId = Number(organisationId);
    const { decision, decisionReason } = payload; // CERTIFIED, REVOKED, CHANGE_REQUESTED

    if (!["CERTIFIED", "REVOKED", "CHANGE_REQUESTED"].includes(decision)) {
      throw new Error("Invalid decision. Must be CERTIFIED, REVOKED, or CHANGE_REQUESTED.");
    }

    const item = await prisma.accessReviewItem.findFirst({
      where: { id: String(itemId), campaignId: String(campaignId), campaign: { organisationId: orgId } },
    });

    if (!item) throw new Error("Review item not found.");

    const updatedItem = await prisma.accessReviewItem.update({
      where: { id: item.id },
      data: {
        status: decision,
        decisionReason: decisionReason || `Access ${decision.toLowerCase()} by reviewer`,
        decidedById: Number(user.id || user.userId || 1),
        decidedByName: user.name || user.email || "Reviewer",
        decidedAt: new Date(),
      },
    });

    // If REVOKED, deactivate user account in DB
    if (decision === "REVOKED") {
      await prisma.user.update({
        where: { id: item.userId },
        data: { status: "inactive" },
      }).catch(() => {});
    }

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Reviewer",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "ACCESS_REVIEW",
      action: `ACCESS_DECISION_${decision}`,
      resourceType: "USER_ACCESS",
      resourceId: String(item.userId),
      resourceName: item.userName,
      severity: decision === "REVOKED" ? "WARNING" : "INFO",
      status: "SUCCESS",
      metadata: { campaignId, decision, reason: decisionReason },
      req,
    });

    return { success: true, message: `Access for ${item.userName} marked as ${decision}.`, data: updatedItem };
  }

  static async completeCampaign(organisationId, campaignId, user = {}, req = null) {
    const orgId = Number(organisationId);
    const campaign = await prisma.accessReviewCampaign.findFirst({
      where: { id: String(campaignId), organisationId: orgId },
      include: { items: true },
    });

    if (!campaign) throw new Error("Campaign not found.");

    const updated = await prisma.accessReviewCampaign.update({
      where: { id: campaign.id },
      data: { status: "COMPLETED" },
    });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Reviewer",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "ACCESS_REVIEW",
      action: "ACCESS_REVIEW_CAMPAIGN_COMPLETED",
      resourceType: "ACCESS_CAMPAIGN",
      resourceId: updated.id,
      resourceName: updated.name,
      severity: "INFO",
      status: "SUCCESS",
      req,
    });

    return { success: true, message: `Campaign "${updated.name}" marked as COMPLETED.`, data: updated };
  }

  /**
   * 6. Incident Management
   */
  static async getIncidents(organisationId, filters = {}) {
    const orgId = Number(organisationId);
    const where = { organisationId: orgId };
    if (filters.status && filters.status !== "ALL") where.status = filters.status;
    if (filters.severity && filters.severity !== "ALL") where.severity = filters.severity;
    if (filters.category && filters.category !== "ALL") where.category = filters.category;

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        history: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: incidents };
  }

  static async createIncident(organisationId, payload, user = {}, req = null) {
    const orgId = Number(organisationId);
    const incidentNumber = `INC-${Date.now().toString().slice(-6)}`;

    const incident = await prisma.incident.create({
      data: {
        incidentNumber,
        organisationId: orgId,
        title: payload.title || "Unclassified Incident",
        description: payload.description || "Incident investigation underway",
        category: payload.category || "SECURITY",
        severity: payload.severity || "MEDIUM",
        status: "OPEN",
        reporterId: Number(user.id || user.userId || 1),
        reporterName: user.name || user.email || "Reporter",
        assigneeId: payload.assigneeId ? Number(payload.assigneeId) : Number(user.id || 1),
        assigneeName: payload.assigneeName || user.name || "Incident Lead",
        history: {
          create: {
            actorId: Number(user.id || 1),
            actorName: user.name || "Reporter",
            action: "INCIDENT_OPENED",
            newStatus: "OPEN",
            notes: "Initial incident filed into governance register.",
          },
        },
      },
      include: { history: true },
    });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Reporter",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "INCIDENTS",
      action: "INCIDENT_CREATED",
      resourceType: "INCIDENT",
      resourceId: incident.id,
      resourceName: `${incident.incidentNumber}: ${incident.title}`,
      severity: incident.severity === "CRITICAL" || incident.severity === "HIGH" ? "CRITICAL" : "WARNING",
      status: "SUCCESS",
      afterData: incident,
      req,
    });

    return { success: true, message: `Incident ${incident.incidentNumber} created.`, data: incident };
  }

  static async updateIncident(organisationId, id, payload, user = {}, req = null) {
    const orgId = Number(organisationId);
    const existing = await prisma.incident.findFirst({
      where: { id: String(id), organisationId: orgId },
    });

    if (!existing) throw new Error("Incident not found.");

    const newStatus = payload.status || existing.status;
    const isClosing = newStatus === "CLOSED" || newStatus === "RESOLVED";

    const updated = await prisma.incident.update({
      where: { id: existing.id },
      data: {
        title: payload.title !== undefined ? payload.title : undefined,
        description: payload.description !== undefined ? payload.description : undefined,
        severity: payload.severity !== undefined ? payload.severity : undefined,
        status: newStatus,
        assigneeName: payload.assigneeName !== undefined ? payload.assigneeName : undefined,
        resolution: payload.resolution !== undefined ? payload.resolution : undefined,
        investigationNotes: payload.investigationNotes !== undefined ? payload.investigationNotes : undefined,
        resolvedAt: isClosing && !existing.resolvedAt ? new Date() : undefined,
        closedAt: newStatus === "CLOSED" ? new Date() : undefined,
        history: {
          create: {
            actorId: Number(user.id || 1),
            actorName: user.name || "Incident Lead",
            action: "STATUS_UPDATE",
            previousStatus: existing.status,
            newStatus,
            notes: payload.notes || payload.investigationNotes || `Status updated to ${newStatus}`,
          },
        },
      },
      include: { history: { orderBy: { createdAt: "desc" } } },
    });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Incident Lead",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "INCIDENTS",
      action: "INCIDENT_UPDATED",
      resourceType: "INCIDENT",
      resourceId: updated.id,
      resourceName: updated.incidentNumber,
      severity: updated.severity === "CRITICAL" ? "CRITICAL" : "INFO",
      status: "SUCCESS",
      beforeData: { status: existing.status, severity: existing.severity },
      afterData: { status: updated.status, severity: updated.severity, resolution: updated.resolution },
      req,
    });

    return { success: true, message: `Incident ${updated.incidentNumber} updated.`, data: updated };
  }

  /**
   * 7. Risk Register
   */
  static async getRisks(organisationId, filters = {}) {
    const orgId = Number(organisationId);
    const where = { organisationId: orgId };
    if (filters.status && filters.status !== "ALL") where.status = filters.status;
    if (filters.severity && filters.severity !== "ALL") where.severity = filters.severity;
    if (filters.category && filters.category !== "ALL") where.category = filters.category;

    const risks = await prisma.risk.findMany({
      where,
      include: { history: { orderBy: { createdAt: "desc" } } },
      orderBy: { riskScore: "desc" },
    });

    // Auto-seed baseline organizational risks if table is empty
    if (risks.length === 0) {
      const defaultRisks = [
        {
          riskId: `RSK-${Date.now().toString().slice(-4)}-01`,
          organisationId: orgId,
          title: "Unauthorized Access Attempts & Credential Stuffing",
          description: "Potential unauthorized account takeover via repeated credential brute-force attacks.",
          category: "SECURITY",
          likelihood: "LOW",
          impact: "HIGH",
          riskScore: 12,
          severity: "HIGH",
          ownerName: "Security Team",
          status: "MITIGATING",
          mitigationPlan: "Enforce account lockout after 5 attempts, mandatory bcrypt hashing, and JWT session timeouts.",
        },
        {
          riskId: `RSK-${Date.now().toString().slice(-4)}-02`,
          organisationId: orgId,
          title: "Cross-Tenant Data Exposure",
          description: "Risk of tenant records or documents leaking across organization boundaries.",
          category: "DATA_PRIVACY",
          likelihood: "LOW",
          impact: "CRITICAL",
          riskScore: 16,
          severity: "CRITICAL",
          ownerName: "Platform Architecture",
          status: "CONTROLLED",
          mitigationPlan: "Enforce strict organisationId query scoping across all backend controllers.",
        },
      ];

      for (const dr of defaultRisks) {
        await prisma.risk.create({ data: dr }).catch(() => {});
      }

      const refreshed = await prisma.risk.findMany({
        where,
        include: { history: { orderBy: { createdAt: "desc" } } },
        orderBy: { riskScore: "desc" },
      });
      return { success: true, data: refreshed };
    }

    return { success: true, data: risks };
  }

  static async createRisk(organisationId, payload, user = {}, req = null) {
    const orgId = Number(organisationId);
    const riskId = `RSK-${Date.now().toString().slice(-6)}`;

    const likelihood = payload.likelihood || "LOW";
    const impact = payload.impact || "MEDIUM";

    const likelihoodMultiplier = likelihood === "HIGH" ? 3 : likelihood === "MEDIUM" ? 2 : 1;
    const impactMultiplier = impact === "CRITICAL" ? 4 : impact === "HIGH" ? 3 : impact === "MEDIUM" ? 2 : 1;
    const score = likelihoodMultiplier * impactMultiplier * 2;

    let severity = "LOW";
    if (score >= 18) severity = "CRITICAL";
    else if (score >= 12) severity = "HIGH";
    else if (score >= 6) severity = "MEDIUM";

    const risk = await prisma.risk.create({
      data: {
        riskId,
        organisationId: orgId,
        title: payload.title || "Identified Governance Risk",
        description: payload.description || "Risk assessment item",
        category: payload.category || "SECURITY",
        likelihood,
        impact,
        riskScore: score,
        severity: payload.severity || severity,
        ownerName: payload.ownerName || user.name || "Risk Officer",
        status: payload.status || "IDENTIFIED",
        mitigationPlan: payload.mitigationPlan || "Mitigation strategy pending",
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        createdById: Number(user.id || user.userId || 1),
        history: {
          create: {
            actorId: Number(user.id || 1),
            actorName: user.name || "Risk Officer",
            action: "RISK_IDENTIFIED",
            newStatus: payload.status || "IDENTIFIED",
          },
        },
      },
      include: { history: true },
    });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Risk Officer",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "RISK_REGISTER",
      action: "RISK_CREATED",
      resourceType: "RISK",
      resourceId: risk.id,
      resourceName: `${risk.riskId}: ${risk.title}`,
      severity: risk.severity === "CRITICAL" || risk.severity === "HIGH" ? "WARNING" : "INFO",
      status: "SUCCESS",
      afterData: risk,
      req,
    });

    return { success: true, message: `Risk ${risk.riskId} added to register.`, data: risk };
  }

  static async updateRisk(organisationId, id, payload, user = {}, req = null) {
    const orgId = Number(organisationId);
    const existing = await prisma.risk.findFirst({
      where: { id: String(id), organisationId: orgId },
    });

    if (!existing) throw new Error("Risk entry not found.");

    const updated = await prisma.risk.update({
      where: { id: existing.id },
      data: {
        title: payload.title !== undefined ? payload.title : undefined,
        description: payload.description !== undefined ? payload.description : undefined,
        category: payload.category !== undefined ? payload.category : undefined,
        likelihood: payload.likelihood !== undefined ? payload.likelihood : undefined,
        impact: payload.impact !== undefined ? payload.impact : undefined,
        severity: payload.severity !== undefined ? payload.severity : undefined,
        status: payload.status !== undefined ? payload.status : undefined,
        ownerName: payload.ownerName !== undefined ? payload.ownerName : undefined,
        mitigationPlan: payload.mitigationPlan !== undefined ? payload.mitigationPlan : undefined,
        history: {
          create: {
            actorId: Number(user.id || 1),
            actorName: user.name || "Risk Officer",
            action: "RISK_UPDATED",
            previousStatus: existing.status,
            newStatus: payload.status || existing.status,
            changes: payload,
          },
        },
      },
      include: { history: { orderBy: { createdAt: "desc" } } },
    });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Risk Officer",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "RISK_REGISTER",
      action: "RISK_UPDATED",
      resourceType: "RISK",
      resourceId: updated.id,
      resourceName: updated.riskId,
      severity: "INFO",
      status: "SUCCESS",
      beforeData: { status: existing.status, severity: existing.severity },
      afterData: { status: updated.status, severity: updated.severity, mitigation: updated.mitigationPlan },
      req,
    });

    return { success: true, message: `Risk ${updated.riskId} updated.`, data: updated };
  }

  static async deleteRisk(organisationId, id, user = {}, req = null) {
    const orgId = Number(organisationId);
    const existing = await prisma.risk.findFirst({
      where: { id: String(id), organisationId: orgId },
    });

    if (!existing) throw new Error("Risk entry not found.");

    await prisma.risk.delete({ where: { id: existing.id } });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Risk Officer",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "RISK_REGISTER",
      action: "RISK_DELETED",
      resourceType: "RISK",
      resourceId: existing.id,
      resourceName: existing.riskId,
      severity: "WARNING",
      status: "SUCCESS",
      req,
    });

    return { success: true, message: `Risk ${existing.riskId} deleted from register.` };
  }

  /**
   * 8. Storage Data Retention Policies
   */
  static async getRetentionPolicies(organisationId) {
    const orgId = Number(organisationId);
    const policies = await prisma.storageRetentionPolicy.findMany({
      where: {
        OR: [{ organisationId: String(orgId) }, { isGlobalDefault: true }],
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: policies };
  }

  static async createRetentionPolicy(organisationId, payload, user = {}, req = null) {
    const orgId = Number(organisationId);
    const policy = await prisma.storageRetentionPolicy.create({
      data: {
        organisationId: String(orgId),
        policyName: payload.policyName || "Custom Retention Policy",
        description: payload.description || "Data retention rule",
        documentCategory: payload.documentCategory || "ALL_DOCUMENTS",
        retentionDays: payload.retentionDays ? Number(payload.retentionDays) : 365,
        actionOnExpiry: payload.actionOnExpiry || "DELETE",
        status: payload.status || "ACTIVE",
        createdBy: user.name || user.email || "Admin",
      },
    });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Admin",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "STORAGE_RETENTION",
      action: "RETENTION_POLICY_CREATED",
      resourceType: "RETENTION_POLICY",
      resourceId: policy.id,
      resourceName: policy.policyName,
      severity: "INFO",
      status: "SUCCESS",
      afterData: policy,
      req,
    });

    return { success: true, message: `Retention policy "${policy.policyName}" created.`, data: policy };
  }

  static async updateRetentionPolicy(organisationId, id, payload, user = {}, req = null) {
    const orgId = Number(organisationId);
    const existing = await prisma.storageRetentionPolicy.findFirst({
      where: { id: String(id), organisationId: String(orgId) },
    });

    if (!existing) throw new Error("Retention policy not found.");

    const updated = await prisma.storageRetentionPolicy.update({
      where: { id: existing.id },
      data: {
        policyName: payload.policyName !== undefined ? payload.policyName : undefined,
        description: payload.description !== undefined ? payload.description : undefined,
        documentCategory: payload.documentCategory !== undefined ? payload.documentCategory : undefined,
        retentionDays: payload.retentionDays !== undefined ? Number(payload.retentionDays) : undefined,
        actionOnExpiry: payload.actionOnExpiry !== undefined ? payload.actionOnExpiry : undefined,
        status: payload.status !== undefined ? payload.status : undefined,
        updatedBy: user.name || user.email || "Admin",
      },
    });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Admin",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "STORAGE_RETENTION",
      action: "RETENTION_POLICY_UPDATED",
      resourceType: "RETENTION_POLICY",
      resourceId: updated.id,
      resourceName: updated.policyName,
      severity: "INFO",
      status: "SUCCESS",
      beforeData: existing,
      afterData: updated,
      req,
    });

    return { success: true, message: `Retention policy "${updated.policyName}" updated.`, data: updated };
  }

  static async deleteRetentionPolicy(organisationId, id, user = {}, req = null) {
    const orgId = Number(organisationId);
    const existing = await prisma.storageRetentionPolicy.findFirst({
      where: { id: String(id), organisationId: String(orgId) },
    });

    if (!existing) throw new Error("Retention policy not found.");

    await prisma.storageRetentionPolicy.delete({ where: { id: existing.id } });

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || "Admin",
      actorRole: user.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "STORAGE_RETENTION",
      action: "RETENTION_POLICY_DELETED",
      resourceType: "RETENTION_POLICY",
      resourceId: existing.id,
      resourceName: existing.policyName,
      severity: "WARNING",
      status: "SUCCESS",
      req,
    });

    return { success: true, message: `Retention policy "${existing.policyName}" removed.` };
  }

  static async runRetentionSweep(organisationId, user = {}, req = null) {
    const orgId = Number(organisationId);
    const sweepResult = await RetentionWorker.runSweep({
      organisationId: orgId,
      actorUserId: user.id,
      actorName: user.name || user.email || "Administrator",
      req,
    });

    return {
      success: true,
      message: `Retention sweep completed: processed ${sweepResult.evaluatedPoliciesCount} policies, affected ${sweepResult.totalAffectedDocuments} expired documents.`,
      data: sweepResult,
    };
  }
}

module.exports = GovernanceService;
