const departmentManagerService = require("../services/departmentManagerService");

const getTeamsData = async (req, res) => {
  try {
    const data = await departmentManagerService.getTeamsData(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createTeam = async (req, res) => {
  try {
    const team = await departmentManagerService.createTeam(req);
    return res.status(201).json({ success: true, message: `Team "${team.name}" created!`, data: team });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addTeamMember = async (req, res) => {
  try {
    const result = await departmentManagerService.addTeamMember(req);
    return res.status(201).json({ success: true, message: "Team member invited successfully.", data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const inviteTeamLeader = async (req, res) => {
  try {
    const result = await departmentManagerService.inviteTeamLeader(req);
    return res.status(201).json({ success: true, message: "Team Leader invited successfully!", data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resendTeamLeaderInvite = async (req, res) => {
  try {
    const result = await departmentManagerService.resendTeamLeaderInvite(req);
    return res.status(200).json({ success: true, message: "Invitation resent.", data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTeam = async (req, res) => {
  try {
    const team = await departmentManagerService.updateTeam(req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Team updated.", data: team });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleTeamStatus = async (req, res) => {
  try {
    const team = await departmentManagerService.toggleTeamStatus(req.params.id);
    return res.status(200).json({ success: true, message: "Team status updated.", data: team });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const changeTeamLead = async (req, res) => {
  try {
    const team = await departmentManagerService.changeTeamLead(req.params.id, req.body.teamLead);
    return res.status(200).json({ success: true, message: "Team Lead changed.", data: team });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const removeTeamMember = async (req, res) => {
  try {
    await departmentManagerService.removeTeamMember(req.params.id);
    return res.status(200).json({ success: true, message: "Team member removed." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const assignDocumentToTeam = async (req, res) => {
  try {
    await departmentManagerService.assignDocumentToTeam(req.body);
    return res.status(200).json({ success: true, message: "Document assigned to team." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTeamsData,
  createTeam,
  updateTeam,
  toggleTeamStatus,
  changeTeamLead,
  addTeamMember,
  removeTeamMember,
  inviteTeamLeader,
  resendTeamLeaderInvite,
  assignDocumentToTeam,
};
