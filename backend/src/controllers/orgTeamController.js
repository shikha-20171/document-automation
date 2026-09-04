const prisma = require("../config/prismaClient");
const { hashPassword } = require("../utils/password");
const { generateInvitationToken } = require("../utils/tokenUtils");
const { sendTeamMemberInvitationEmail } = require("../services/emailService");
const AuditLogService = require("../services/auditLogService");

// Helper to format role names
const formatRoleName = (roleStr) => {
  if (!roleStr) return "Employee";
  const r = roleStr.toUpperCase().replace(/\s+/g, "_");
  if (r === "ORGANISATION_ADMIN" || r === "ORGANIZATION_ADMIN") return "Organisation Admin";
  if (r === "DEPARTMENT_MANAGER" || r === "DEPT_MANAGER") return "Department Manager";
  if (r === "TEAM_LEAD") return "Team Lead";
  if (r === "EMPLOYEE") return "Employee";
  if (r === "VIEWER") return "Viewer";
  if (r === "GUEST") return "Guest";
  return roleStr;
};

const getOrgId = (req) => {
  return Number(req.user?.organisation_id || req.user?.organization_id || req.user?.organisationId || 1);
};

// ==========================================
// USERS MANAGEMENT
// ==========================================

const getUsers = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const users = await prisma.user.findMany({
      where: { organisation_id: orgId },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        status: true,
        last_login: true,
        created_at: true,
        department_id: true,
      },
      orderBy: { created_at: "desc" },
    });

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      role: formatRoleName(u.role),
      department: u.role === "ORGANISATION_ADMIN" ? "Executive" : u.role === "DEPARTMENT_MANAGER" ? "Legal & Operations" : "General",
      status: u.status === "active" ? "Active" : "Inactive",
      lastLogin: u.last_login ? new Date(u.last_login).toLocaleString() : "Never",
    }));

    res.status(200).json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { name, email, role = "Employee", department = "Legal & Operations" } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: "User email address is required." });
    }

    const roleCode = role.toUpperCase().replace(/\s+/g, "_");
    const defaultPass = req.body.password || req.body.password_hash || "Manager@123";
    const passwordHash = await hashPassword(defaultPass);
    const { rawToken, tokenHash, expiresAt } = generateInvitationToken(48);

    const deptId = req.body.department_id ? parseInt(req.body.department_id, 10) : null;
    const teamId = req.body.team_id ? parseInt(req.body.team_id, 10) : null;

    // Persist or Update user in PostgreSQL database via Prisma
    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {
        full_name: name || cleanEmail.split("@")[0],
        role: roleCode,
        password_hash: passwordHash,
        organisation_id: orgId,
        department_id: deptId,
        team_id: teamId,
        status: "active",
        must_change_password: false,
        reset_token: rawToken,
        reset_token_expires: expiresAt,
      },
      create: {
        full_name: name || cleanEmail.split("@")[0],
        email: cleanEmail,
        role: roleCode,
        password_hash: passwordHash,
        organisation_id: orgId,
        department_id: deptId,
        team_id: teamId,
        status: "active",
        must_change_password: false,
        reset_token: rawToken,
        reset_token_expires: expiresAt,
      },
    });

    // Create Organisation Invitation Record if organisation exists
    try {
      await prisma.organisationInvitation.create({
        data: {
          organisation_id: orgId,
          email: cleanEmail,
          token_hash: tokenHash,
          expires_at: expiresAt,
          status: "PENDING",
        },
      });
    } catch (e) {
      console.warn("[OrgTeam] Notice on invitation record:", e.message);
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const invitationUrl = `${frontendUrl}/accept-invitation/${rawToken}`;

    // Dispatch real email via Gmail Nodemailer
    const emailResult = await sendTeamMemberInvitationEmail({
      name: name || cleanEmail.split("@")[0],
      role: formatRoleName(roleCode),
      department,
      email: cleanEmail,
      password: defaultPass,
      invitationUrl,
    });

    // Audit Logging
    AuditLogService.log({
      actorUserId: req.user?.id ? String(req.user.id) : null,
      actorName: req.user?.name || req.user?.email || "Org Admin",
      actorRole: req.user?.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "TEAM",
      action: "USER_CREATED",
      resourceType: "USER",
      resourceId: String(user.id),
      resourceName: user.full_name,
      severity: "INFO",
      status: "SUCCESS",
      afterData: { email: cleanEmail, role: roleCode, department_id: deptId },
      req,
    });

    const formattedUser = {
      id: user.id,
      name: user.full_name,
      email: user.email,
      role: formatRoleName(user.role),
      department,
      status: "Active",
      lastLogin: "Just now",
    };

    res.status(201).json({
      success: true,
      message: `User ${name || cleanEmail} created & credentials dispatched to Gmail (${cleanEmail}).`,
      emailSent: emailResult.success,
      data: formattedUser,
    });
  } catch (error) {
    console.error("[OrgTeam] Error in createUser:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const inviteUser = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { name, email, role = "Department Manager", department = "Legal & Operations" } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: "Email address is required for invitation." });
    }

    const roleCode = role.toUpperCase().replace(/\s+/g, "_");
    const defaultPass = "Manager@123";
    const passwordHash = await hashPassword(defaultPass);
    const { rawToken, tokenHash, expiresAt } = generateInvitationToken(48);

    // Upsert User in Prisma DB scoped to tenant
    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {
        full_name: name || cleanEmail.split("@")[0],
        role: roleCode,
        organisation_id: orgId,
        password_hash: passwordHash,
        status: "active",
        must_change_password: true,
        reset_token: rawToken,
        reset_token_expires: expiresAt,
      },
      create: {
        full_name: name || cleanEmail.split("@")[0],
        email: cleanEmail,
        role: roleCode,
        organisation_id: orgId,
        password_hash: passwordHash,
        status: "active",
        must_change_password: true,
        reset_token: rawToken,
        reset_token_expires: expiresAt,
      },
    });

    // Revoke previous PENDING invitations for this email
    await prisma.organisationInvitation.updateMany({
      where: { email: cleanEmail, organisation_id: orgId, status: "PENDING" },
      data: { status: "REVOKED" },
    }).catch(() => {});

    await prisma.organisationInvitation.create({
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

    // Send Gmail Invitation Email via Nodemailer
    const emailResult = await sendTeamMemberInvitationEmail({
      name: name || cleanEmail.split("@")[0],
      role: formatRoleName(roleCode),
      department,
      email: cleanEmail,
      password: defaultPass,
      invitationUrl,
    });

    AuditLogService.log({
      actorUserId: req.user?.id ? String(req.user.id) : null,
      actorName: req.user?.name || req.user?.email || "Org Admin",
      actorRole: req.user?.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "TEAM",
      action: "USER_INVITED",
      resourceType: "USER",
      resourceId: String(user.id),
      resourceName: user.full_name,
      severity: "INFO",
      status: "SUCCESS",
      afterData: { email: cleanEmail, role: roleCode },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Invitation email sent to Gmail (${cleanEmail}) for ${role}.`,
      emailSent: emailResult.success,
      data: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: formatRoleName(user.role),
        department,
        status: "Pending Invite",
        lastLogin: "Invitation Sent",
      },
    });
  } catch (error) {
    console.error("[OrgTeam] Error in inviteUser:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const resendInvite = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { email } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: "Email is required to resend invite." });
    }

    const user = await prisma.user.findFirst({ where: { email: cleanEmail, organisation_id: orgId } });
    const defaultPass = "Manager@123";
    const passwordHash = await hashPassword(defaultPass);
    const { rawToken, expiresAt } = generateInvitationToken(48);

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password_hash: passwordHash,
          reset_token: rawToken,
          reset_token_expires: expiresAt,
        },
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const invitationUrl = `${frontendUrl}/accept-invitation/${rawToken}`;

    const emailResult = await sendTeamMemberInvitationEmail({
      name: user?.full_name || cleanEmail.split("@")[0],
      role: formatRoleName(user?.role || "DEPARTMENT_MANAGER"),
      department: "Legal & Operations",
      email: cleanEmail,
      password: defaultPass,
      invitationUrl,
    });

    res.status(200).json({
      success: true,
      message: `Invitation email resent to Gmail (${cleanEmail}).`,
      emailSent: emailResult.success,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { id } = req.params;
    const { name, role, status } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: "Valid user ID is required." });
    }

    const existing = await prisma.user.findFirst({
      where: { id: Number(id), organisation_id: orgId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "User not found in this organisation." });
    }

    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        full_name: name || undefined,
        role: role ? role.toUpperCase().replace(/\s+/g, "_") : undefined,
        status: status ? status.toLowerCase() : undefined,
      },
    });

    AuditLogService.log({
      actorUserId: req.user?.id ? String(req.user.id) : null,
      actorName: req.user?.name || req.user?.email || "Org Admin",
      actorRole: req.user?.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "TEAM",
      action: "USER_UPDATED",
      resourceType: "USER",
      resourceId: String(id),
      resourceName: updated.full_name,
      severity: "INFO",
      status: "SUCCESS",
      beforeData: { name: existing.full_name, role: existing.role, status: existing.status },
      afterData: { name: updated.full_name, role: updated.role, status: updated.status },
      req,
    });

    res.status(200).json({
      success: true,
      message: `User updated successfully.`,
      data: { id: updated.id, name: updated.full_name, role: updated.role, status: updated.status },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { id } = req.params;
    const { status } = req.body; // Active or Inactive

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: "Valid user ID is required." });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: Number(id), organisation_id: orgId },
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found in organisation." });
    }

    const newStatus = status === "Active" ? "active" : "inactive";
    await prisma.user.update({
      where: { id: Number(id) },
      data: { status: newStatus },
    });

    AuditLogService.log({
      actorUserId: req.user?.id ? String(req.user.id) : null,
      actorName: req.user?.name || req.user?.email || "Org Admin",
      actorRole: req.user?.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "TEAM",
      action: "USER_STATUS_TOGGLED",
      resourceType: "USER",
      resourceId: String(id),
      resourceName: targetUser.full_name,
      severity: "WARNING",
      status: "SUCCESS",
      beforeData: { status: targetUser.status },
      afterData: { status: newStatus },
      req,
    });

    res.status(200).json({
      success: true,
      message: `User status changed to ${status}.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: "Valid user ID is required." });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: Number(id), organisation_id: orgId },
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await prisma.user.delete({ where: { id: Number(id) } });

    AuditLogService.log({
      actorUserId: req.user?.id ? String(req.user.id) : null,
      actorName: req.user?.name || req.user?.email || "Org Admin",
      actorRole: req.user?.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "TEAM",
      action: "USER_DELETED",
      resourceType: "USER",
      resourceId: String(id),
      resourceName: targetUser.full_name,
      severity: "WARNING",
      status: "SUCCESS",
      beforeData: { email: targetUser.email, role: targetUser.role },
      req,
    });

    res.status(200).json({ success: true, message: `User deleted successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// DEPARTMENTS MANAGEMENT
// ==========================================

const getDepartments = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const depts = await prisma.department.findMany({
      where: { organisation_id: orgId },
      include: {
        owner: {
          select: { id: true, full_name: true, email: true },
        },
      },
      orderBy: { created_at: "asc" },
    });

    const formatted = depts.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      manager: d.owner?.full_name || d.head || "Unassigned",
      managerEmail: d.owner?.email || null,
      ownerUserId: d.owner_user_id || null,
      membersCount: d.employees_count || 0,
      createdAt: d.created_at,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { name, description, manager, managerName, managerEmail, email, ownerUserId } = req.body;
    const targetManagerEmail = (managerEmail || email || (manager && manager.includes("@") ? manager : "")).trim().toLowerCase();
    const targetManagerName = (managerName || (manager && !manager.includes("@") ? manager : "") || targetManagerEmail.split("@")[0] || "Department Manager").trim();

    let resolvedOwnerUserId = ownerUserId ? Number(ownerUserId) : null;

    // If manager email provided, upsert user account & dispatch Gmail invite
    if (targetManagerEmail) {
      try {
        const defaultPass = "Manager@123";
        const passwordHash = await hashPassword(defaultPass);
        const { rawToken, expiresAt } = generateInvitationToken(48);

        const managerUser = await prisma.user.upsert({
          where: { email: targetManagerEmail },
          update: {
            full_name: targetManagerName,
            role: "DEPARTMENT_MANAGER",
            organisation_id: orgId,
            password_hash: passwordHash,
            status: "active",
            must_change_password: true,
            reset_token: rawToken,
            reset_token_expires: expiresAt,
          },
          create: {
            full_name: targetManagerName,
            email: targetManagerEmail,
            role: "DEPARTMENT_MANAGER",
            organisation_id: orgId,
            password_hash: passwordHash,
            status: "active",
            must_change_password: true,
            reset_token: rawToken,
            reset_token_expires: expiresAt,
          },
        });

        resolvedOwnerUserId = managerUser.id;

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const invitationUrl = `${frontendUrl}/accept-invitation/${rawToken}`;

        await sendTeamMemberInvitationEmail({
          name: targetManagerName,
          role: "Department Manager",
          department: name,
          email: targetManagerEmail,
          password: defaultPass,
          invitationUrl,
        }).catch(() => {});
      } catch (err) {
        console.error("[OrgTeam] Error dispatching manager invite on department creation:", err.message);
      }
    }

    const newDept = await prisma.department.create({
      data: {
        organisation_id: orgId,
        name,
        description: description || "Department group",
        head: targetManagerName || "Unassigned",
        owner_user_id: resolvedOwnerUserId,
        employees_count: 1,
      },
    });

    AuditLogService.log({
      actorUserId: req.user?.id ? String(req.user.id) : null,
      actorName: req.user?.name || req.user?.email || "Org Admin",
      actorRole: req.user?.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "GOVERNANCE",
      action: "DEPARTMENT_CREATED",
      resourceType: "DEPARTMENT",
      resourceId: String(newDept.id),
      resourceName: newDept.name,
      severity: "INFO",
      status: "SUCCESS",
      afterData: { name: newDept.name, head: newDept.head, owner_user_id: newDept.owner_user_id },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Department "${name}" created successfully.`,
      data: {
        id: newDept.id,
        name: newDept.name,
        description: newDept.description,
        manager: newDept.head,
        ownerUserId: newDept.owner_user_id,
        membersCount: newDept.employees_count,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { id } = req.params;
    const { name, description, manager, head, ownerUserId } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: "Valid department ID is required." });
    }

    const existing = await prisma.department.findFirst({
      where: { id: Number(id), organisation_id: orgId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Department not found in organisation." });
    }

    const updated = await prisma.department.update({
      where: { id: Number(id) },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        head: head || manager || undefined,
        owner_user_id: ownerUserId !== undefined ? (ownerUserId ? Number(ownerUserId) : null) : undefined,
      },
    });

    AuditLogService.log({
      actorUserId: req.user?.id ? String(req.user.id) : null,
      actorName: req.user?.name || req.user?.email || "Org Admin",
      actorRole: req.user?.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "GOVERNANCE",
      action: "DEPARTMENT_UPDATED",
      resourceType: "DEPARTMENT",
      resourceId: String(id),
      resourceName: updated.name,
      severity: "INFO",
      status: "SUCCESS",
      beforeData: { name: existing.name, head: existing.head, owner_user_id: existing.owner_user_id },
      afterData: { name: updated.name, head: updated.head, owner_user_id: updated.owner_user_id },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Department "${updated.name}" updated successfully.`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: "Valid department ID is required." });
    }

    const existing = await prisma.department.findFirst({
      where: { id: Number(id), organisation_id: orgId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Department not found." });
    }

    await prisma.department.delete({
      where: { id: Number(id) },
    });

    AuditLogService.log({
      actorUserId: req.user?.id ? String(req.user.id) : null,
      actorName: req.user?.name || req.user?.email || "Org Admin",
      actorRole: req.user?.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "GOVERNANCE",
      action: "DEPARTMENT_DELETED",
      resourceType: "DEPARTMENT",
      resourceId: String(id),
      resourceName: existing.name,
      severity: "WARNING",
      status: "SUCCESS",
      beforeData: { name: existing.name, head: existing.head },
      req,
    });

    res.status(200).json({ success: true, message: `Department "${existing.name}" removed.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// TEAMS MANAGEMENT
// ==========================================

const getTeams = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const teams = await prisma.team.findMany({
      where: { organisation_id: orgId },
      orderBy: { created_at: "asc" },
    });

    const formatted = teams.map((t) => ({
      id: t.id,
      name: t.name,
      department: t.department || "General",
      teamLead: t.team_lead || "Unassigned",
      membersCount: t.members || 0,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTeam = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { name, department, teamLead } = req.body;

    const newTeam = await prisma.team.create({
      data: {
        organisation_id: orgId,
        name,
        department: department || "General",
        team_lead: teamLead || "Unassigned",
        members: 1,
      },
    });

    AuditLogService.log({
      actorUserId: req.user?.id ? String(req.user.id) : null,
      actorName: req.user?.name || req.user?.email || "Org Admin",
      actorRole: req.user?.role || "ORGANISATION_ADMIN",
      organisationId: orgId,
      module: "TEAM",
      action: "TEAM_CREATED",
      resourceType: "TEAM",
      resourceId: String(newTeam.id),
      resourceName: newTeam.name,
      severity: "INFO",
      status: "SUCCESS",
      afterData: { name: newTeam.name, department: newTeam.department, team_lead: newTeam.team_lead },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Team "${name}" created under ${department}.`,
      data: newTeam,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// PERMISSIONS MATRIX & USER ACTIVITY
// ==========================================

const getPermissionsMatrix = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        roles: ["Organisation Admin", "Department Manager", "Team Lead", "Employee", "Viewer", "Guest"],
        permissions: [
          { name: "Document Creation & Upload", orgAdmin: true, deptManager: true, teamLead: true, employee: true, viewer: false, guest: false },
          { name: "Document Edit & Delete", orgAdmin: true, deptManager: true, teamLead: true, employee: false, viewer: false, guest: false },
          { name: "Approval Routing & Execution", orgAdmin: true, deptManager: true, teamLead: true, employee: false, viewer: false, guest: false },
          { name: "AI Tool Execution (Q&A/Extract)", orgAdmin: true, deptManager: true, teamLead: true, employee: true, viewer: true, guest: false },
          { name: "AI Document Builder Publishing", orgAdmin: true, deptManager: true, teamLead: false, employee: false, viewer: false, guest: false },
          { name: "Department-Level Data Access", orgAdmin: true, deptManager: true, teamLead: true, employee: true, viewer: true, guest: false },
          { name: "User Management & Invites", orgAdmin: true, deptManager: false, teamLead: false, employee: false, viewer: false, guest: false },
          { name: "Integrations & API Settings", orgAdmin: true, deptManager: false, teamLead: false, employee: false, viewer: false, guest: false },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserActivityLog = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const logs = await prisma.auditLog.findMany({
      where: { organisationId: String(orgId) },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const formatted = logs.map((l) => ({
      id: l.id,
      user: l.actorName,
      action: l.action.replace(/_/g, " "),
      target: l.resourceName || l.resourceType,
      timestamp: new Date(l.createdAt).toLocaleString(),
      ip: l.ipAddress || "127.0.0.1",
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  inviteUser,
  resendInvite,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getTeams,
  createTeam,
  getPermissionsMatrix,
  getUserActivityLog,
};
