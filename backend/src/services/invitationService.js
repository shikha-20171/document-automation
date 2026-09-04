const prisma = require("../config/prismaClient");
const { generateInvitationToken, hashToken } = require("../utils/tokenUtils");
const { sendInvitationEmail } = require("./emailService");
const { hashPassword } = require("../utils/password");

/**
 * Create and dispatch invitation for Organisation Admin
 */
const createAndSendInvitation = async ({ organisationId, email, adminName }) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  const orgId = Number(organisationId);

  const organisation = await prisma.organisation.findUnique({
    where: { id: orgId },
  });

  if (!organisation) {
    throw new Error("Organisation not found.");
  }

  // Revoke previous PENDING invitations for this org & email
  await prisma.organisationInvitation.updateMany({
    where: {
      organisation_id: orgId,
      email: cleanEmail,
      status: "PENDING",
    },
    data: {
      status: "REVOKED",
    },
  });

  // Generate secure token
  const { rawToken, tokenHash, expiresAt } = generateInvitationToken(24);

  // Store token hash in PostgreSQL DB
  const invitation = await prisma.organisationInvitation.create({
    data: {
      organisation_id: orgId,
      email: cleanEmail,
      token_hash: tokenHash,
      expires_at: expiresAt,
      status: "PENDING",
    },
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const invitationUrl = `${frontendUrl}/accept-invitation/${rawToken}`;

  // Send Invitation Email
  const mailRes = await sendInvitationEmail({
    adminName: adminName || "Organisation Admin",
    organisationName: organisation.name,
    adminEmail: cleanEmail,
    invitationUrl,
    expiresAt,
  });

  return {
    success: true,
    invitationId: invitation.id,
    emailSent: mailRes.success,
    expiresAt,
  };
};

/**
 * Verify Raw Invitation Token from URL
 */
const verifyInvitation = async (rawToken) => {
  if (!rawToken || typeof rawToken !== "string") {
    return { valid: false, reason: "Invalid token format." };
  }

  const tokenHash = hashToken(rawToken);

  let invitation = await prisma.organisationInvitation.findFirst({
    where: {
      OR: [
        { token_hash: tokenHash },
        { token_hash: rawToken },
      ],
    },
    include: {
      organisation: true,
    },
  });

  let adminUser = null;

  if (invitation) {
    if (invitation.status !== "PENDING") {
      return { valid: false, reason: `Invitation has already been ${invitation.status.toLowerCase()}.` };
    }

    if (new Date() > new Date(invitation.expires_at)) {
      await prisma.organisationInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return { valid: false, reason: "Invitation link has expired." };
    }

    adminUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });
  } else {
    // Fallback: check User by reset_token
    adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { reset_token: rawToken },
          { reset_token: tokenHash },
        ],
      },
      include: {
        organisation: true,
      },
    });

    if (!adminUser) {
      return { valid: false, reason: "Invitation link is invalid or does not exist." };
    }
  }

  const orgName = invitation?.organisation?.name || adminUser?.organisation?.name || "DocuCore AI Organisation";

  return {
    valid: true,
    invitationId: invitation?.id || adminUser?.id,
    organisation: {
      id: invitation?.organisation?.id || adminUser?.organisation_id || 1,
      name: orgName,
      branch: invitation?.organisation?.branch || "HQ",
      city: invitation?.organisation?.city || "Headquarters",
    },
    admin: {
      name: adminUser?.full_name || "Team Member",
      email: invitation?.email || adminUser?.email,
      role: adminUser?.role || "TEAM_LEADER",
    },
  };
};

/**
 * Activate Account by Setting Password & Accepting Invitation
 */
const activateAccount = async ({ rawToken, password }) => {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const tokenHash = hashToken(rawToken);

  let invitation = await prisma.organisationInvitation.findFirst({
    where: {
      OR: [
        { token_hash: tokenHash },
        { token_hash: rawToken },
      ],
    },
    include: { organisation: true },
  });

  const passwordHash = await hashPassword(password);
  let targetEmail = invitation?.email;

  if (!invitation) {
    // Check fallback user
    const fallbackUser = await prisma.user.findFirst({
      where: {
        OR: [
          { reset_token: rawToken },
          { reset_token: tokenHash },
        ],
      },
    });

    if (!fallbackUser) {
      throw new Error("Invitation token is invalid or has expired.");
    }
    targetEmail = fallbackUser.email;
  } else if (invitation.status !== "PENDING" || new Date() > new Date(invitation.expires_at)) {
    throw new Error("Invitation token is invalid or has expired.");
  }

  // Update User password in database
  const user = await prisma.user.update({
    where: { email: targetEmail },
    data: {
      password_hash: passwordHash,
      status: "active",
      must_change_password: false,
      reset_token: null,
      reset_token_expires: null,
    },
  });

  if (invitation) {
    await prisma.organisationInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        accepted_at: new Date(),
      },
    }).catch(() => {});
  }

  return {
    success: true,
    message: "Account activated successfully. You can now log in.",
    user: {
      id: user.id,
      email: user.email,
      name: user.full_name,
    },
  };
};

/**
 * Resend Invitation for Organisation
 */
const resendInvitation = async (organisationId) => {
  const orgId = Number(organisationId);

  const organisation = await prisma.organisation.findUnique({
    where: { id: orgId },
    include: { users: true },
  });

  if (!organisation) {
    throw new Error("Organisation not found.");
  }

  const adminUser = organisation.users.find((u) => u.role === "ORGANISATION_ADMIN") || organisation.users[0];
  const adminEmail = organisation.email || (adminUser && adminUser.email);
  const adminName = (adminUser && adminUser.full_name) || "Organisation Admin";

  if (!adminEmail) {
    throw new Error("Organisation admin email not found.");
  }

  return createAndSendInvitation({
    organisationId: orgId,
    email: adminEmail,
    adminName,
  });
};

module.exports = {
  createAndSendInvitation,
  verifyInvitation,
  activateAccount,
  resendInvitation,
};
