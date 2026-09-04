const AIAgentService = require("../services/aiAgentService");

const getAuthContext = (req) => ({
  organisationId: req.user?.organisation_id || req.user?.organization_id || 1,
  userId: req.user?.id || 1,
});

/**
 * POST /api/ai-agent/execute
 * Execute natural-language document automation task
 */
const executeAgentTask = async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ success: false, message: "Natural-language prompt is required." });
    }

    const result = await AIAgentService.execute({
      organisationId,
      userId,
      prompt,
    });

    res.status(200).json({
      success: true,
      message: "AI Document Agent executed workflow successfully.",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/ai-agent/history
 * List agent execution history
 */
const getExecutionHistory = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const history = await AIAgentService.listExecutions(organisationId);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  executeAgentTask,
  getExecutionHistory,
};
