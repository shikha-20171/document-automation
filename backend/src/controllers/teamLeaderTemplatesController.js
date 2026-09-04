const teamLeaderService = require("../services/teamLeaderService");

const getTemplates = async (req, res) => {
  try {
    const list = await teamLeaderService.getTemplates(req);
    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createTeamTemplate = async (req, res) => {
  try {
    const tmpl = await teamLeaderService.createTeamTemplate(req);
    return res.status(201).json({ success: true, message: `Team template "${tmpl.name}" created successfully!`, data: tmpl });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createDocFromTemplate = async (req, res) => {
  try {
    const doc = await teamLeaderService.createDocFromTemplate(req);
    return res.status(201).json({ success: true, message: `Document created from template!`, data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTemplates,
  createTeamTemplate,
  createDocFromTemplate,
};
