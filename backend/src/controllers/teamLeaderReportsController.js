const teamLeaderService = require("../services/teamLeaderService");

const getReports = async (req, res) => {
  try {
    const data = await teamLeaderService.getReports(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReports,
};
