const departmentManagerService = require("../services/departmentManagerService");
const authService = require("../services/authService");

const getProfile = async (req, res) => {
  try {
    const data = await departmentManagerService.getProfile(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    await departmentManagerService.updateProfile(req);
    return res.status(200).json({ success: true, message: "Profile updated successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword({ userId, currentPassword, newPassword });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
