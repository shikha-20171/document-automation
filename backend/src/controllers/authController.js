const authService = require("../services/authService");
const AuditLogService = require("../services/auditLogService");

/* ---------------- Login ---------------- */

const login = async (req, res) => {
  const { email } = req.body || {};
  try {
    const result = await authService.login(req.body);
    const user = result.data?.user || result.user || {};

    AuditLogService.log({
      actorUserId: user.id ? String(user.id) : null,
      actorName: user.name || user.email || email || "User",
      actorRole: user.role || "USER",
      organisationId: user.organisationId || user.companyId || null,
      organisationName: user.companyName || user.organisation_name || "Platform",
      module: "SECURITY",
      action: "LOGIN_SUCCESS",
      resourceType: "AUTH",
      resourceId: String(user.id || ""),
      severity: "INFO",
      status: "SUCCESS",
      metadata: { email },
      req,
    });

    return res.status(200).json(result);
  } catch (error) {
    AuditLogService.log({
      actorName: email || "Anonymous User",
      actorRole: "UNAUTHENTICATED",
      module: "SECURITY",
      action: "LOGIN_FAILED",
      resourceType: "AUTH",
      severity: "WARNING",
      status: "FAILED",
      metadata: { email, reason: error.message },
      req,
    });

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ------------ Forgot Password ------------ */

const forgotPassword = async (req, res) => {
  const { email } = req.body || {};
  try {
    const result = await authService.forgotPassword(req.body);

    AuditLogService.log({
      actorName: email || "Anonymous User",
      actorRole: "USER",
      module: "SECURITY",
      action: "PASSWORD_RESET_REQUESTED",
      resourceType: "AUTH",
      severity: "INFO",
      status: "SUCCESS",
      metadata: { email },
      req,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ------------ Reset Password ------------ */

const resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body);

    AuditLogService.log({
      actorName: "User",
      actorRole: "USER",
      module: "SECURITY",
      action: "PASSWORD_RESET_COMPLETED",
      resourceType: "AUTH",
      severity: "INFO",
      status: "SUCCESS",
      req,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ------------ Change Password ------------ */

const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword({ userId, currentPassword, newPassword });

    AuditLogService.log({
      actorUserId: req.user?.id ? String(req.user.id) : String(userId),
      actorName: req.user?.name || req.user?.email || "User",
      actorRole: req.user?.role || "USER",
      organisationId: req.user?.organisationId || null,
      module: "SECURITY",
      action: "PASSWORD_CHANGED",
      resourceType: "USER",
      resourceId: String(userId),
      severity: "INFO",
      status: "SUCCESS",
      req,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ------------ Get Current User Profile (/me) ------------ */

const getMe = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const result = await authService.getMe(userId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ------------ Refresh Token ------------ */

const refreshToken = async (req, res) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    const result = await authService.refreshAccessToken({ refreshToken: token });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

/* ------------ Logout ------------ */

const logout = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    const result = await authService.logout({ userId, refreshToken: token });

    AuditLogService.log({
      actorUserId: req.user?.id ? String(req.user.id) : userId ? String(userId) : null,
      actorName: req.user?.name || req.user?.email || "User",
      actorRole: req.user?.role || "USER",
      organisationId: req.user?.organisationId || null,
      module: "SECURITY",
      action: "LOGOUT",
      resourceType: "AUTH",
      severity: "INFO",
      status: "SUCCESS",
      req,
    });

    res.clearCookie("token");
    res.clearCookie("access_token");
    res.clearCookie("refreshToken");

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  login,
  getMe,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
};