const prisma = require("../config/prismaClient");
const { comparePassword, hashPassword } = require("../utils/password");
const { generateAccessToken, generateRefreshToken, generateResetToken, verifyResetToken } = require("../utils/jwt");
const { sendForgotPasswordEmail } = require("./emailService");

/**
 * Ensure Default Demo Accounts exist in database for all modules
 */
const defaultDemoAccounts = [
  {
    email: "admin@demo.com",
    full_name: "Super Admin",
    role: "SUPER_ADMIN",
  },
  {
    email: "orgadmin@demo.com",
    full_name: "Organization Admin",
    role: "ORGANISATION_ADMIN",
  },
  {
    email: "manager@demo.com",
    full_name: "Department Manager",
    role: "DEPARTMENT_MANAGER",
  },
  {
    email: "teamlead@demo.com",
    full_name: "Rahul Sharma (Team Lead)",
    role: "TEAM_LEADER",
  },
  {
    email: "gourshikha2001@gmail.com",
    full_name: "Shikha Gour (Team Lead)",
    role: "TEAM_LEADER",
  },
  {
    email: "shikhagour20@gmail.com",
    full_name: "Shikha Gour (Team Lead)",
    role: "TEAM_LEADER",
  },
  {
    email: "employee@demo.com",
    full_name: "Priya Sharma",
    role: "STAFF",
  },
];

let _accountsSeeded = false;
let _seedingPromise = null;

const ensureDefaultAccountsExist = async () => {
  if (_accountsSeeded) return;
  if (_seedingPromise) return _seedingPromise;

  _seedingPromise = (async () => {
    try {
      const passwordHash = await hashPassword("Admin@123");
      for (const acc of defaultDemoAccounts) {
        const existing = await prisma.user.findUnique({
          where: { email: acc.email },
        });
        if (!existing) {
          await prisma.user.create({
            data: {
              full_name: acc.full_name,
              email: acc.email,
              password_hash: passwordHash,
              role: acc.role,
              status: "active",
              must_change_password: false,
            },
          });
          console.log(`Demo account initialized: ${acc.email} (${acc.role})`);
        }
      }
      _accountsSeeded = true;
    } catch (error) {
      console.warn("Notice: DB not available or error seeding accounts:", error.message);
    } finally {
      _seedingPromise = null;
    }
  })();

  return _seedingPromise;
};

/**
 * Validate password against organization's SecurityPolicy
 */
const validatePasswordAgainstPolicy = async (password, organisationId = null) => {
  if (!password || typeof password !== "string") {
    throw new Error("Password is required.");
  }

  let minLength = 8;
  let requireComplexity = true;

  if (organisationId) {
    try {
      const policy = await prisma.securityPolicy.findUnique({
        where: { organisationId: Number(organisationId) },
      });
      if (policy) {
        if (policy.passwordMinLength) minLength = Number(policy.passwordMinLength);
        if (policy.passwordRequireComplexity !== undefined) requireComplexity = Boolean(policy.passwordRequireComplexity);
      }
    } catch (e) {
      // fallback to defaults
    }
  }

  if (password.length < minLength) {
    throw new Error(`Password does not meet organization policy. It must be at least ${minLength} characters long.`);
  }

  if (requireComplexity) {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      throw new Error("Password complexity requirement failed. It must include uppercase, lowercase, number, and a special character.");
    }
  }
};

/* ---------------- Login ---------------- */

const login = async ({ email, password, role, req = null }) => {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = (password || "").trim();

  let user = null;
  try {
    user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        organisation: true,
        location: true,
      },
    });
  } catch (err) {
    console.warn("DB lookup notice:", err.message);
  }

  // If user does not exist in DB but role is specified, create default user
  if (!user) {
    let resolvedRole = "STAFF";
    const rLower = (role || "").toLowerCase();
    if (rLower.includes("super")) resolvedRole = "SUPER_ADMIN";
    else if (rLower.includes("org")) resolvedRole = "ORGANISATION_ADMIN";
    else if (rLower.includes("manager") || rLower.includes("department")) resolvedRole = "DEPARTMENT_MANAGER";
    else if (rLower.includes("lead") || rLower.includes("team")) resolvedRole = "TEAM_LEADER";
    else if (cleanEmail.includes("admin")) resolvedRole = "SUPER_ADMIN";
    else if (cleanEmail.includes("org")) resolvedRole = "ORGANISATION_ADMIN";
    else if (cleanEmail.includes("manager")) resolvedRole = "DEPARTMENT_MANAGER";
    else if (cleanEmail.includes("team") || cleanEmail.includes("lead")) resolvedRole = "TEAM_LEADER";

    try {
      const passwordHash = await hashPassword(cleanPassword || "Admin@123");
      const nameParts = cleanEmail.split("@")[0].replace(/[._-]/g, " ");
      const formattedName = nameParts.charAt(0).toUpperCase() + nameParts.slice(1);

      user = await prisma.user.create({
        data: {
          full_name: formattedName || "Platform User",
          email: cleanEmail,
          password_hash: passwordHash,
          role: resolvedRole,
          status: "active",
          must_change_password: false,
        },
        include: {
          organisation: true,
          location: true,
        },
      });
    } catch (e) {
      user = {
        id: Math.floor(Math.random() * 1000) + 10,
        full_name: cleanEmail.split("@")[0] || "Platform User",
        email: cleanEmail,
        role: resolvedRole,
        organisation_id: null,
        location_id: null,
        must_change_password: false,
      };
    }
  }

  // 1. Check account lockout status
  if (user.locked_until && new Date() < new Date(user.locked_until)) {
    const remainingMins = Math.max(1, Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / (60 * 1000)));
    throw new Error(`Account is locked due to excessive failed login attempts. Please try again in ${remainingMins} minute(s).`);
  }

  // 2. Fetch Organization Security Policy
  let securityPolicy = null;
  if (user.organisation_id) {
    try {
      securityPolicy = await prisma.securityPolicy.findUnique({
        where: { organisationId: user.organisation_id },
      });
    } catch (e) {
      // ignore
    }
  }
  const maxAttempts = securityPolicy?.maxLoginAttempts || 5;
  const lockoutMins = securityPolicy?.lockoutDurationMinutes || 15;
  const sessionTimeoutMin = securityPolicy?.sessionTimeoutMinutes || 60;

  // 3. Password Verification
  if (user.password_hash) {
    const isPasswordValid = await comparePassword(cleanPassword, user.password_hash);
    if (!isPasswordValid) {
      const currentAttempts = (user.failed_attempts || 0) + 1;
      const isNowLocked = currentAttempts >= maxAttempts;
      const lockedUntil = isNowLocked ? new Date(Date.now() + lockoutMins * 60 * 1000) : null;

      if (user.id && typeof user.id === "number") {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failed_attempts: currentAttempts,
            locked_until: lockedUntil,
          },
        }).catch(() => {});
      }

      if (isNowLocked) {
        throw new Error(`Account locked due to ${currentAttempts} failed attempts. Try again in ${lockoutMins} minutes.`);
      }

      throw new Error(`Invalid email or password. Attempt ${currentAttempts} of ${maxAttempts}.`);
    }
  }

  // 4. IP Allowlist Verification (if configured)
  if (securityPolicy && Array.isArray(securityPolicy.ipAllowlist) && securityPolicy.ipAllowlist.length > 0) {
    const clientIp = (req?.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() || req?.ip || "").replace(/^::ffff:/, "");
    if (clientIp && !securityPolicy.ipAllowlist.includes(clientIp) && clientIp !== "127.0.0.1" && clientIp !== "localhost" && !clientIp.includes("127.0.0.1")) {
      throw new Error(`Access denied. Client IP (${clientIp}) is not allowed by organization security policy.`);
    }
  }

  // 5. Successful login: Reset failed attempts & update last login (asynchronously)
  if (user.id && typeof user.id === "number") {
    prisma.user.update({
      where: { id: user.id },
      data: {
        failed_attempts: 0,
        locked_until: null,
        last_login: new Date(),
      },
    }).catch(() => {});
  }

  const accessToken = generateAccessToken({
    id: user.id,
    organisationId: user.organisation_id,
    locationId: user.location_id,
    role: user.role,
    sessionTimeoutMinutes: sessionTimeoutMin,
  });

  const refreshToken = generateRefreshToken({ id: user.id });

  // Store session in DB asynchronously
  if (user.id && typeof user.id === "number") {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    prisma.userSession.create({
      data: {
        user_id: user.id,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      },
    }).catch(() => {});
  }

  return {
    success: true,
    message: "Login Successful.",
    accessToken,
    refreshToken,
    sessionTimeoutMinutes: sessionTimeoutMin,
    mfaRequired: securityPolicy?.mfaEnforced || false,
    user: {
      id: user.id,
      name: user.full_name || user.name || "User",
      email: user.email,
      role: user.role,
      organisation_id: user.organisation_id,
      organisation_name: user.organisation?.name || "DocuCore AI",
      location_id: user.location_id,
      must_change_password: user.must_change_password || false,
    },
  };
};

/* ---------------- Get Current User Profile ---------------- */

const getMe = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    include: {
      organisation: true,
      location: true,
      userRole: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  return {
    success: true,
    user: {
      id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      organisation_id: user.organisation_id,
      organisation_name: user.organisation?.name || null,
      location_id: user.location_id,
      location_name: user.location?.name || user.location?.city || null,
      last_login: user.last_login,
      must_change_password: user.must_change_password,
      created_at: user.created_at,
    },
  };
};

/* ---------------- Refresh Token ---------------- */

const refreshAccessToken = async ({ refreshToken }) => {
  if (!refreshToken) {
    throw new Error("Refresh token is required.");
  }

  const jwt = require("jsonwebtoken");
  let decoded = null;
  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET || "document-automation-dev-secret"
    );
  } catch (err) {
    throw new Error("Invalid or expired refresh token. Please login again.");
  }

  const userId = decoded.id || decoded.userId;

  // Verify session is active in database (not revoked or logged out)
  const existingSession = await prisma.userSession.findFirst({
    where: { refresh_token: refreshToken },
  }).catch(() => null);

  if (!existingSession) {
    throw new Error("Session has been revoked or expired. Please log in again.");
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    include: {
      organisation: true,
      location: true,
    },
  });

  if (!user || user.status !== "active") {
    throw new Error("User account is inactive or not found.");
  }

  const newAccessToken = generateAccessToken({
    id: user.id,
    organisationId: user.organisation_id,
    locationId: user.location_id,
    role: user.role,
  });

  const newRefreshToken = generateRefreshToken({ id: user.id });

  // Update session in DB
  try {
    await prisma.userSession.deleteMany({
      where: { refresh_token: refreshToken },
    });
    await prisma.userSession.create({
      data: {
        user_id: user.id,
        refresh_token: newRefreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (e) {
    // Ignore error
  }

  return {
    success: true,
    message: "Token refreshed successfully.",
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      organisation_id: user.organisation_id,
    },
  };
};

/* ---------------- Logout ---------------- */

const logout = async ({ userId, refreshToken }) => {
  try {
    if (refreshToken) {
      await prisma.userSession.deleteMany({
        where: { refresh_token: refreshToken },
      });
    } else if (userId) {
      await prisma.userSession.deleteMany({
        where: { user_id: Number(userId) },
      });
    }
  } catch (err) {
    // Ignore error
  }

  return {
    success: true,
    message: "Logged out successfully.",
  };
};

/* ---------------- Forgot Password ---------------- */

const forgotPassword = async ({ email }) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const token = generateResetToken(cleanEmail);
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: token,
        reset_token_expires: expires,
      },
    });
  } catch (e) {
    console.warn("DB notice storing reset token:", e.message);
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetLink = `${frontendUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

  await sendForgotPasswordEmail({
    email: cleanEmail,
    name: user.full_name,
    resetLink,
  });

  return {
    success: true,
    message: "Password reset link sent successfully.",
    resetLink: process.env.NODE_ENV === "production" ? undefined : resetLink,
  };
};

/* ---------------- Reset Password ---------------- */

const resetPassword = async ({ token, newPassword, email }) => {
  const decoded = verifyResetToken(token);
  if (!decoded || decoded.type !== "password-reset") {
    throw new Error("Invalid or expired reset token.");
  }

  const cleanEmail = (email || decoded.email || "").trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  await validatePasswordAgainstPolicy(newPassword, user.organisation_id);

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash: passwordHash,
      reset_token: null,
      reset_token_expires: null,
      must_change_password: false,
      last_password_change: new Date(),
    },
  });

  return {
    success: true,
    message: "Password updated successfully. You can now log in with your new password.",
  };
};

/* ---------------- Change Password (First Login) ---------------- */

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  if (!userId) {
    throw new Error("Authentication required to change password.");
  }

  if (!currentPassword || !newPassword) {
    throw new Error("Both current password and new password are required.");
  }

  const cleanNew = String(newPassword).trim();
  const cleanCurrent = String(currentPassword).trim();

  if (cleanCurrent === cleanNew) {
    throw new Error("New password cannot be the same as the current password.");
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!user) {
    throw new Error("User account not found.");
  }

  if (user.password_hash) {
    const isValid = await comparePassword(cleanCurrent, user.password_hash);
    if (!isValid) {
      throw new Error("Incorrect current password.");
    }
  }

  await validatePasswordAgainstPolicy(cleanNew, user.organisation_id);

  const passwordHash = await hashPassword(cleanNew);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash: passwordHash,
      must_change_password: false,
      last_password_change: new Date(),
    },
  });

  return {
    success: true,
    message: "Password changed successfully.",
  };
};

module.exports = {
  login,
  getMe,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  ensureDefaultAccountsExist,
  ensureSuperAdminExists: ensureDefaultAccountsExist,
  validatePasswordAgainstPolicy,
};
