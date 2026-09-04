const prisma = require("../config/prismaClient");
const { workflowRepository } = require("../repositories");

/**
 * Workflow Service
 * Handles multi-step workflow configurations, triggers, and execution lifecycle
 */

const workflowService = {
  /**
   * Get all workflows for an organisation
   */
  async getWorkflows(params) {
    return await workflowRepository.findByOrganisation(params.organisationId, params);
  },

  /**
   * Get workflow by ID
   */
  async getWorkflowById(id) {
    const workflow = await workflowRepository.findById(id);
    if (!workflow) {
      throw new Error("Workflow not found.");
    }
    return workflow;
  },

  /**
   * Create a new workflow with steps
   */
  async createWorkflow(workflowData, steps = []) {
    if (!workflowData.name) {
      throw new Error("Workflow name is required.");
    }
    if (!workflowData.organisationId) {
      throw new Error("Organisation ID is required.");
    }

    return await workflowRepository.create(workflowData, steps);
  },

  /**
   * Update existing workflow
   */
  async updateWorkflow(id, updateData) {
    const existing = await workflowRepository.findById(id);
    if (!existing) {
      throw new Error("Workflow not found.");
    }

    return await workflowRepository.update(id, updateData);
  },

  /**
   * Toggle workflow status (ACTIVE, DRAFT, PAUSED)
   */
  async toggleWorkflowStatus(id, status) {
    const validStatuses = ["ACTIVE", "DRAFT", "PAUSED"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    return await workflowRepository.update(id, { status });
  },

  /**
   * Delete workflow
   */
  async deleteWorkflow(id) {
    const existing = await workflowRepository.findById(id);
    if (!existing) {
      throw new Error("Workflow not found.");
    }

    await workflowRepository.deleteWorkflow(id);

    return {
      success: true,
      message: "Workflow deleted successfully.",
    };
  },
};

module.exports = workflowService;
