const { supportRepository } = require("../repositories");

/**
 * Support Service
 * Handles customer support tickets, status updates, and support communications
 */

const supportService = {
  /**
   * Get support tickets with filtering
   */
  async getTickets(params) {
    return await supportRepository.getTickets(params);
  },

  /**
   * Get ticket details by ID
   */
  async getTicketById(id) {
    const ticket = await supportRepository.getTicketById(id);
    if (!ticket) {
      throw new Error("Support ticket not found.");
    }
    return ticket;
  },

  /**
   * Create a new support ticket
   */
  async createTicket(ticketData) {
    if (!ticketData.subject || !ticketData.description) {
      throw new Error("Subject and description are required.");
    }

    return await supportRepository.createTicket(ticketData);
  },

  /**
   * Update support ticket status
   */
  async updateTicketStatus(id, status, assignedTo = null) {
    const existing = await supportRepository.getTicketById(id);
    if (!existing) {
      throw new Error("Support ticket not found.");
    }

    return await supportRepository.updateTicketStatus(id, status, assignedTo);
  },

  /**
   * Add reply to a ticket
   */
  async addReply(ticketId, replyData) {
    if (!replyData.message) {
      throw new Error("Message is required for reply.");
    }

    const reply = await supportRepository.addReply(ticketId, replyData);

    // If customer replied, mark status as IN_PROGRESS
    if (!replyData.isStaffReply) {
      await supportRepository.updateTicketStatus(ticketId, "IN_PROGRESS");
    }

    return reply;
  },
};

module.exports = supportService;
