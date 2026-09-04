const prisma = require("../config/prismaClient");
const AuditLogService = require("../services/auditLogService");

/**
 * List all users across all organisations with filtering, search, pagination, and role breakdown
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, search, organisationId, page = 1, limit = 25 } = req.query;

    const where = {};
    if (role && role !== "ALL") {
      where.role = { equals: role, mode: "insensitive" };
    }
    if (status && status !== "ALL") {
      where.status = { equals: status, mode: "insensitive" };
    }
    if (organisationId && organisationId !== "ALL") {
      where.organisation_id = Number(organisationId);
    }
    if (search && search.trim()) {
      where.OR = [
        { full_name: { contains: search.trim(), mode: "insensitive" } },
        { email: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [users, total, roleCounts] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: {
          organisation: { select: { id: true, name: true } },
          userRole: { select: { id: true, name: true } },
        },
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
    ]);

    const stats = {
      totalUsers: total,
      superAdmins: 0,
      orgAdmins: 0,
      deptManagers: 0,
      teamLeads: 0,
      employees: 0,
    };

    roleCounts.forEach((r) => {
      const rName = (r.role || "").toUpperCase();
      if (rName.includes("SUPER_ADMIN")) stats.superAdmins += r._count.id;
      else if (rName.includes("ORG_ADMIN") || rName.includes("ADMIN")) stats.orgAdmins += r._count.id;
      else if (rName.includes("MANAGER")) stats.deptManagers += r._count.id;
      else if (rName.includes("LEAD")) stats.teamLeads += r._count.id;
      else stats.employees += r._count.id;
    });

    return res.status(200).json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        role: u.role,
        status: (u.status || "active").toUpperCase(),
        organisationName: u.organisation?.name || "Global / System",
        departmentName: u.userRole?.name || "-",
        teamName: "-",
        createdAt: u.created_at,
      })),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
      stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle user status (ACTIVE / SUSPENDED)
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentStatus = (user.status || "active").toLowerCase();
    const newStatus = status ? status.toLowerCase() : currentStatus === "active" ? "suspended" : "active";

    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: { status: newStatus },
    });

    AuditLogService.log({
      actorName: "Super Admin",
      actorRole: "SUPER_ADMIN",
      module: "SECURITY",
      action: newStatus === "active" ? "USER_ACTIVATED" : "USER_SUSPENDED",
      resourceType: "USER",
      resourceId: String(id),
      resourceName: updated.full_name,
      severity: "WARNING",
      status: "SUCCESS",
      beforeData: { status: user.status },
      afterData: { status: updated.status },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `User status changed to ${updated.status}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change user role
 */
const changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
    });

    AuditLogService.log({
      actorName: "Super Admin",
      actorRole: "SUPER_ADMIN",
      module: "SECURITY",
      action: "USER_ROLE_CHANGED",
      resourceType: "USER",
      resourceId: String(id),
      resourceName: updated.full_name,
      severity: "WARNING",
      status: "SUCCESS",
      beforeData: { role: user.role },
      afterData: { role: updated.role },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `User role changed to ${updated.role}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  toggleUserStatus,
  changeUserRole,
};
