const teamLeaderService = require("../services/teamLeaderService");

const runAiTool = async (req, res) => {
  try {
    const { tool, data } = await teamLeaderService.runAiTool(req);
    return res.status(200).json({ success: true, tool, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  runAiTool,
};
