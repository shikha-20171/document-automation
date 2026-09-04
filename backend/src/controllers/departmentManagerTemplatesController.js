const departmentManagerService = require("../services/departmentManagerService");

const getTemplates = async (req, res) => {
  try {
    const data = await departmentManagerService.getTemplates(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createTemplate = async (req, res) => {
  try {
    const tmpl = await departmentManagerService.createTemplate(req);
    return res.status(201).json({ success: true, message: `Template "${tmpl.name}" created!`, data: tmpl });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const updated = await departmentManagerService.updateTemplate(req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Template updated.", data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const duplicateTemplate = async (req, res) => {
  try {
    const duplicate = await departmentManagerService.duplicateTemplate(req.params.id);
    return res.status(201).json({ success: true, message: "Template duplicated!", data: duplicate });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    await departmentManagerService.deleteTemplate(req.params.id);
    return res.status(200).json({ success: true, message: "Template deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
  duplicateTemplate,
  deleteTemplate,
};
