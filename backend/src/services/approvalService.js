const prisma = require("../config/prismaClient");
const { approvalRepository, notificationRepository } = require("../repositories");

/**
 * Approval Service
 * Handles approval requests, multi-step approvals, action auditing, and history logs
 */

const approvalService = {
  /**
   * Get approval requests with filters
   */
  async getApprovalRequests(params) {
    return await approvalRepository.findMany(params);
  },

  /**
   * Get approval request details
   */
  async getApprovalRequestById(id) {
    const request = await approvalRepository.findById(id);
    if (!request) {
      throw new Error("Approval request not found.");
    }
    return request;
  },

  /**
   * Initiate a new approval request
   */
  async createApprovalRequest(requestData) {
    if (!requestData.workflowId || !requestData.documentName) {
      throw new Error("Workflow ID and document name are required.");
    }

    const request = await approvalRepository.createRequest(requestData);

    // Add initial history entry
    await approvalRepository.addHistory({
      approvalRequestId: request.id,
      userId: requestData.requestedById,
      userRole: "REQUESTER",
      action: "SUBMITTED",
      comment: "Document submitted for approval",
    });

    // Notify approvers / managers
    try {
      await notificationRepository.create({
        organisation_id: Number(requestData.organisationId),
        title: "New Document Approval Requested",
        message: `Approval requested for document "${requestData.documentName}".`,
        type: "APPROVAL",
        priority: "HIGH",
        related_document: requestData.documentName,
      });
    } catch (err) {
      // Non-blocking notification
    }

    return request;
  },

  /**
   * Process an approval action (APPROVE, REJECT, REQUEST_CHANGES)
   */
  async processApprovalAction({ approvalRequestId, action, userId, userRole, comment }) {
    const request = await approvalRepository.findById(approvalRequestId);
    if (!request) {
      throw new Error("Approval request not found.");
    }

    const validActions = ["APPROVE", "REJECT", "REQUEST_CHANGES"];
    if (!validActions.includes(action.toUpperCase())) {
      throw new Error(`Invalid action. Must be one of: ${validActions.join(", ")}`);
    }

    // 1. Record the action
    await approvalRepository.addAction({
      approvalRequestId,
      stepOrder: request.currentStepOrder,
      performedById: userId,
      action: action.toUpperCase(),
      comment,
    });

    // 2. Add history item
    await approvalRepository.addHistory({
      approvalRequestId,
      userId,
      userRole,
      action: action.toUpperCase(),
      comment,
    });

    // 3. Determine next status / step
    let newStatus = request.status;
    let nextStepOrder = request.currentStepOrder;

    const totalSteps = request.workflow?.steps?.length || 1;

    if (action.toUpperCase() === "APPROVE") {
      if (request.currentStepOrder >= totalSteps) {
        newStatus = "APPROVED";
      } else {
        nextStepOrder = request.currentStepOrder + 1;
        newStatus = "PENDING";
      }
    } else if (action.toUpperCase() === "REJECT") {
      newStatus = "REJECTED";
    } else if (action.toUpperCase() === "REQUEST_CHANGES") {
      newStatus = "CHANGES_REQUESTED";
    }

    // 4. Update request status
    const updated = await approvalRepository.updateStatus(approvalRequestId, newStatus, nextStepOrder);

    // 5. Send notification back to requester
    try {
      if (request.requestedById) {
        await notificationRepository.create({
          organisation_id: request.organisationId,
          user_id: request.requestedById,
          title: `Document Approval Status: ${newStatus}`,
          message: `Your document "${request.documentName}" was ${newStatus.toLowerCase().replace("_", " ")}.${comment ? ` Note: "${comment}"` : ""}`,
          type: "APPROVAL",
          priority: newStatus === "REJECTED" ? "HIGH" : "NORMAL",
          related_document: request.documentName,
        });
      }
    } catch (e) {
      // Non-blocking
    }

    // 6. Enterprise Integration & Webhook Event Triggers
    try {
      const WebhookDeliveryService = require("./integrations/WebhookDeliveryService");
      const IntegrationManager = require("./integrations/IntegrationManager");

      const eventName = newStatus === "APPROVED" ? "document.approved" : newStatus === "REJECTED" ? "document.rejected" : "approval.status_changed";
      await WebhookDeliveryService.triggerEvent(request.organisationId, eventName, {
        approvalRequestId,
        documentName: request.documentName,
        status: newStatus,
        comment,
        timestamp: new Date().toISOString(),
      });

      if (newStatus === "APPROVED") {
        // Non-blocking Slack alert if connected
        IntegrationManager.executeAction(request.organisationId, "SLACK", "send_approval_alert", {
          documentTitle: request.documentName,
          requestedBy: "Approver",
        }).catch(() => {});
      }
    } catch (integrationErr) {
      console.warn("[ApprovalService] Integration dispatch notice:", integrationErr.message);
    }

    return updated;
  },

  /**
   * Get approval rules for organisation
   */
  async getApprovalRules(organisationId) {
    return await approvalRepository.findRulesByOrganisation(organisationId);
  },

  /**
   * Create a new approval rule
   */
  async createApprovalRule(ruleData) {
    return await approvalRepository.createRule(ruleData);
  },
};

module.exports = approvalService;
