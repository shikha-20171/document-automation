const jwt = require("jsonwebtoken");

const generateAccessToken = (payload, customExpiresIn = null) => {
  const expiresIn = customExpiresIn || (payload.sessionTimeoutMinutes ? `${payload.sessionTimeoutMinutes}m` : (process.env.JWT_EXPIRES_IN || "60m"));
  return jwt.sign(payload, process.env.JWT_SECRET || "document-automation-dev-secret", {
    expiresIn,
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || "document-automation-dev-secret", {
    expiresIn: "7d",
  });
};

const generateResetToken = (email) => {
  return jwt.sign(
    { email, type: "password-reset" },
    process.env.JWT_SECRET || "document-automation-dev-secret",
    {
      expiresIn: "15m",
    }
  );
};

const verifyResetToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "document-automation-dev-secret"
    );
    return decoded;
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  verifyResetToken,
};
