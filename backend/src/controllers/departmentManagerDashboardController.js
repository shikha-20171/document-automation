const departmentManagerService = require("../services/departmentManagerService");

const getDashboardData = async (req, res) => {
  try {
    const data = await departmentManagerService.getDashboardData(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardData,
};
