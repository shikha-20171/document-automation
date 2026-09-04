const teamLeaderService = require("../services/teamLeaderService");

const getSupportData = async (req, res) => {
  try {
    const data = await teamLeaderService.getSupportData(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createSupportTicket = async (req, res) => {
  try {
    const ticket = await teamLeaderService.createSupportTicket(req);
    return res.status(201).json({ success: true, message: `Support Ticket ${ticket.id} created successfully!`, data: ticket });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSupportData,
  createSupportTicket,
};
