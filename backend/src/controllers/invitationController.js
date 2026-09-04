const invitationService = require("../services/invitationService");

const verifyInvitationController = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Invitation token is required." });
    }
    const result = await invitationService.verifyInvitation(token);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason });
    }
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const activateAccountController = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Token and password are required." });
    }
    const result = await invitationService.activateAccount({ rawToken: token, password });
    return res.json({ success: true, message: result.message, data: result.user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const resendInvitationController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await invitationService.resendInvitation(id);
    return res.json({ success: true, message: "Invitation resent successfully.", data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  verifyInvitationController,
  activateAccountController,
  resendInvitationController,
};
