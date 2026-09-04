const organisationAdminService = require("../services/organisationAdminService");

const createOrganisationAdmin = async (req, res, next) => {
  try {
    const admin = await organisationAdminService.createOrganisationAdmin(req.body);
    return res.status(201).json({
      success: true,
      message: "Organisation Admin created successfully",
      data: admin,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllOrganisationAdmins = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
      organisation_id: req.query.organisation_id,
    };
    const result = await organisationAdminService.getAllOrganisationAdmins(filters);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getOrganisationAdminById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = await organisationAdminService.getOrganisationAdminById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Organisation Admin not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrganisationAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = await organisationAdminService.updateOrganisationAdmin(id, req.body);
    return res.status(200).json({
      success: true,
      message: "Organisation Admin updated successfully",
      data: admin,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const sendCredentials = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const result = await organisationAdminService.sendCredentialsEmail(id, password);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteOrganisationAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    await organisationAdminService.deleteOrganisationAdmin(id);
    return res.status(200).json({
      success: true,
      message: "Organisation Admin deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrganisationAdmin,
  getAllOrganisationAdmins,
  getOrganisationAdminById,
  updateOrganisationAdmin,
  sendCredentials,
  deleteOrganisationAdmin,
};
