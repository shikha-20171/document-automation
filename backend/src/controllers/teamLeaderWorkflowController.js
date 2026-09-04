const teamLeaderService = require("../services/teamLeaderService");

const getWorkflows = async (req, res) => {
  try {
    const { summaryCards, workflows } = await teamLeaderService.getWorkflows(req);
    return res.status(200).json({
      success: true,
      count: workflows.length,
      summaryCards,
      data: workflows,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const executeWorkflowStep = async (req, res) => {
  try {
    const { action, notes = "" } = req.body;
    const result = await teamLeaderService.executeWorkflowStep(req.params.id, action, notes);
    return res.status(200).json({ success: true, message: `Workflow step updated successfully (${action})!`, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addWorkflowComment = async (req, res) => {
  try {
    const result = await teamLeaderService.addWorkflowComment(req.params.id, req.body.text);
    return res.status(201).json({ success: true, message: "Comment posted!", data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWorkflows,
  executeWorkflowStep,
  addWorkflowComment,
};
