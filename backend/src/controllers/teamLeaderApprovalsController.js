const teamLeaderService = require("../services/teamLeaderService");

const getApprovals = async (req, res) => {
  try {
    const list = await teamLeaderService.getApprovals(req);
    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const processApprovalAction = async (req, res) => {
  try {
    const { action, comment = "", forwardToManager = false, forwardToTarget = "Department Manager" } = req.body;
    const result = await teamLeaderService.processApprovalAction(req.params.id, action, comment, forwardToManager, forwardToTarget);
    return res.status(200).json({ success: true, message: `Approval ${action} processed successfully!`, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getApprovals,
  processApprovalAction,
};
