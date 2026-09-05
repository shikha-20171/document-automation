const organisationService = require("../services/organisationService");

const getAllOrganisations = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    };
    const result = await organisationService.getAllOrganisations(filters);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getOrganisationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organisation = await organisationService.getOrganisationById(id);
    if (!organisation) {
      return res.status(404).json({
        success: false,
        message: "Organisation not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: organisation,
    });
  } catch (error) {
    next(error);
  }
};

const AuditLogService = require("../services/auditLogService");

const createOrganisation = async (req, res, next) => {
  try {
    const organisation = await organisationService.createOrganisation(req.body);

    AuditLogService.log({
      actorUserId: req.user?.id ? String(req.user.id) : null,
      actorName: req.user?.name || req.user?.email || "Super Admin",
      actorRole: req.user?.role || "SUPER_ADMIN",
      organisationId: String(organisation.id),
      organisationName: organisation.name,
      module: "ORGANISATION",
      action: "ORGANISATION_CREATED",
      resourceType: "ORGANISATION",
      resourceId: String(organisation.id),
      resourceName: organisation.name,
      severity: "INFO",
      status: "SUCCESS",
      afterData: {
        id: organisation.id,
        name: organisation.name,
        slug: organisation.slug,
        status: organisation.status,
      },
      req,
    });

    return res.status(201).json({
      success: true,
      message: "Organisation created successfully",
      data: organisation,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateOrganisation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await organisationService.getOrganisationById(id);
    const organisation = await organisationService.updateOrganisation(id, req.body);

    AuditLogService.log({
      actorUserId: req.user?.id ? String(req.user.id) : null,
      actorName: req.user?.name || req.user?.email || "Super Admin",
      actorRole: req.user?.role || "SUPER_ADMIN",
      organisationId: String(id),
      organisationName: organisation.name,
      module: "ORGANISATION",
      action: "ORGANISATION_UPDATED",
      resourceType: "ORGANISATION",
      resourceId: String(id),
      resourceName: organisation.name,
      severity: "INFO",
      status: "SUCCESS",
      beforeData: existing ? { name: existing.name, status: existing.status, plan: existing.plan } : null,
      afterData: { name: organisation.name, status: organisation.status, plan: organisation.plan },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Organisation updated successfully",
      data: organisation,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteOrganisation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await organisationService.getOrganisationById(id);
    await organisationService.deleteOrganisation(id);

    AuditLogService.log({
      actorUserId: req.user?.id ? String(req.user.id) : null,
      actorName: req.user?.name || req.user?.email || "Super Admin",
      actorRole: req.user?.role || "SUPER_ADMIN",
      organisationId: String(id),
      organisationName: existing?.name || "Organisation",
      module: "ORGANISATION",
      action: "ORGANISATION_DELETED",
      resourceType: "ORGANISATION",
      resourceId: String(id),
      severity: "WARNING",
      status: "SUCCESS",
      beforeData: existing ? { name: existing.name, status: existing.status } : null,
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Organisation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getOrganisationAdmins = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admins = await organisationService.getOrganisationAdmins(id);
    return res.status(200).json({ success: true, data: admins });
  } catch (error) {
    next(error);
  }
};

const getOrganisationDepartments = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
};

const getOrganisationTeams = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
};

const getOrganisationEmployees = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
};

const getOrganisationDocuments = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
};

const getOrganisationAnalytics = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

const getOrganisationActivityLogs = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
};

const updateOrganisationSettings = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, message: "Settings updated" });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await organisationService.getDashboardMetrics();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

const updateOrganisationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const org = await organisationService.updateOrganisationStatus(id, status || "active");
    return res.status(200).json({
      success: true,
      message: `Organisation status updated to ${status}`,
      data: org,
    });
  } catch (error) {
    next(error);
  }
};

const resendWelcomeEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await organisationService.resendWelcomeEmail(id);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllOrganisations,
  getOrganisationById,
  createOrganisation,
  updateOrganisation,
  deleteOrganisation,
  updateOrganisationStatus,
  resendWelcomeEmail,
  getOrganisationAdmins,
  getOrganisationDepartments,
  getOrganisationTeams,
  getOrganisationEmployees,
  getOrganisationDocuments,
  getOrganisationAnalytics,
  getOrganisationActivityLogs,
  updateOrganisationSettings,
  getDashboardStats,
};
