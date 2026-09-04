const prisma = require("../config/prismaClient");

/**
 * Support Repository
 * Handles SupportTicket and SupportTicketReply database operations
 */

const getTickets = async ({ organisationId, status, priority, page = 1, limit = 20 } = {}) => {
  const where = {};
  if (organisationId) where.organisationId = String(organisationId);
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        replies: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    tickets,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
};

const getTicketById = async (id) => {
  return await prisma.supportTicket.findUnique({
    where: { id: String(id) },
    include: {
      replies: { orderBy: { createdAt: "asc" } },
    },
  });
};

const createTicket = async (ticketData) => {
  return await prisma.supportTicket.create({
    data: {
      ticketNumber: ticketData.ticketNumber || `TKT-${Date.now()}`,
      organisationId: String(ticketData.organisationId),
      subject: ticketData.subject,
      description: ticketData.description,
      category: ticketData.category || "GENERAL",
      priority: ticketData.priority || "MEDIUM",
      status: ticketData.status || "OPEN",
      createdBy: ticketData.createdBy,
      createdByName: ticketData.createdByName || null,
      createdByEmail: ticketData.createdByEmail || null,
    },
  });
};

const updateTicketStatus = async (id, status, assignedTo = null) => {
  const data = { status };
  if (assignedTo) data.assignedTo = assignedTo;
  if (status === "RESOLVED" || status === "CLOSED") data.resolvedAt = new Date();

  return await prisma.supportTicket.update({
    where: { id: String(id) },
    data,
  });
};

const addReply = async (ticketId, replyData) => {
  return await prisma.supportTicketReply.create({
    data: {
      ticketId: String(ticketId),
      message: replyData.message,
      repliedBy: replyData.repliedBy,
      repliedByName: replyData.repliedByName || null,
      isStaffReply: Boolean(replyData.isStaffReply),
    },
  });
};

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  addReply,
};
