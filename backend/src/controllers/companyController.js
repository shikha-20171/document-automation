const companyService = require("../services/companyService");

// Create Company
const createCompany = async (req, res) => {
  try {
    
    const userId = req.user && req.user.id ? req.user.id : null;
    
    const company = await companyService.createCompany(
      req.body,
      userId
    );

    return res.status(201).json({
      success: true,
      message: "Company created successfully.",
      data: company,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Logged-in User Company
const getCompany = async (req, res) => {
  try {
    const company = await companyService.getCompany(req.user.id, req.user.role);

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Company
const updateCompany = async (req, res) => {
  try {
    const company = await companyService.updateCompany(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Company updated successfully.",
      data: company,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCompany,
  getCompany,
  updateCompany,
};