const departmentManagerService = require("../services/departmentManagerService");

const getReportsData = async (req, res) => {
  try {
    const data = await departmentManagerService.getReportsData(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReportsData,
};
