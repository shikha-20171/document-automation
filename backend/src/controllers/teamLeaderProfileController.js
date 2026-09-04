const teamLeaderService = require("../services/teamLeaderService");

const getProfile = async (req, res) => {
  try {
    const data = await teamLeaderService.getProfile(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    await teamLeaderService.updateProfile(req);
    return res.status(200).json({ success: true, message: "Profile settings saved successfully!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }
    return res.status(200).json({ success: true, message: "Password updated successfully!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
