const departmentManagerService = require("../services/departmentManagerService");

const getApprovals = async (req, res) => {
  try {
    const data = await departmentManagerService.getApprovals(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const handleApprovalAction = async (req, res) => {
  try {
    const { action, comment = "", forwardToOrgAdmin = false, forwardToTarget = "Organisation Admin" } = req.body;
    const result = await departmentManagerService.handleApprovalAction(
      req.params.id,
      action,
      comment,
      forwardToOrgAdmin,
      forwardToTarget,
      req
    );
    return res.status(200).json({
      success: true,
      message: `Approval request ${action.toLowerCase()} processed successfully!`,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getApprovals,
  handleApprovalAction,
};
