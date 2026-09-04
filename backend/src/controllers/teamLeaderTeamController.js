const teamLeaderService = require("../services/teamLeaderService");

const getTeamOverview = async (req, res) => {
  try {
    const data = await teamLeaderService.getTeamOverview(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getEmployeeProfile = async (req, res) => {
  try {
    const data = await teamLeaderService.getEmployeeProfile(req.params.id, req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const assignWorkToEmployee = async (req, res) => {
  try {
    const data = await teamLeaderService.assignWorkToEmployee(req);
    return res.status(201).json({ success: true, message: "Work assigned successfully!", data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const sendMessageToEmployee = async (req, res) => {
  try {
    await teamLeaderService.sendMessageToEmployee(req);
    return res.status(200).json({ success: true, message: "Message broadcasted successfully!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTeamOverview,
  getEmployeeProfile,
  assignWorkToEmployee,
  sendMessageToEmployee,
};
