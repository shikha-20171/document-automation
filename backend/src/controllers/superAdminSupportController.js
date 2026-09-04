const prisma = require("../config/prismaClient");

const getTickets = async (req, res, next) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

const createTicket = async (req, res, next) => {
  try {
    const ticketCode = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const {
      organisationName,
      adminName,
      adminEmail,
      category,
      priority,
      description,
      internalNotes,
    } = req.body;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketCode,
        organisationName,
        adminName,
        adminEmail,
        category,
        priority: priority || "MEDIUM",
        status: "OPEN",
        description,
        internalNotes,
      },
    });

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, priority, internalNotes } = req.body;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(internalNotes !== undefined && { internalNotes }),
      },
      include: { replies: true },
    });

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

const replyToTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { senderName, senderRole, message } = req.body;

    const reply = await prisma.supportTicketReply.create({
      data: {
        ticketId: id,
        senderName: senderName || "Super Admin",
        senderRole: senderRole || "Super Admin",
        message,
      },
    });

    // Optionally update ticket updated_at
    await prisma.supportTicket.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({
      success: true,
      data: reply,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTickets,
  createTicket,
  updateTicket,
  replyToTicket,
};
