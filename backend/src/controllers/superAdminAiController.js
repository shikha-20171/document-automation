const SuperAdminAiService = require("../services/superAdminAiService");

const getOverview = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.getOverviewMetrics();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getProviders = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.getProviders();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const createProvider = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.createProvider(req.body);
    res.status(201).json({ success: true, message: "AI Provider created successfully", data });
  } catch (error) {
    next(error);
  }
};

const updateProvider = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.updateProvider(req.params.id, req.body);
    res.status(200).json({ success: true, message: "AI Provider updated successfully", data });
  } catch (error) {
    next(error);
  }
};

const toggleProvider = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.toggleProvider(req.params.id, req.body);
    res.status(200).json({ success: true, message: "AI Provider status updated", data });
  } catch (error) {
    next(error);
  }
};

const testProvider = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.testProviderConnection(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const deleteProvider = async (req, res, next) => {
  try {
    await SuperAdminAiService.deleteProvider(req.params.id);
    res.status(200).json({ success: true, message: "AI Provider removed successfully" });
  } catch (error) {
    next(error);
  }
};

const getModels = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.getModels(req.query.providerId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const createModel = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.createModel(req.body);
    res.status(201).json({ success: true, message: "AI Model created successfully", data });
  } catch (error) {
    next(error);
  }
};

const updateModel = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.updateModel(req.params.id, req.body);
    res.status(200).json({ success: true, message: "AI Model updated successfully", data });
  } catch (error) {
    next(error);
  }
};

const deleteModel = async (req, res, next) => {
  try {
    await SuperAdminAiService.deleteModel(req.params.id);
    res.status(200).json({ success: true, message: "AI Model deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getCapabilities = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.getCapabilities();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const createCapability = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.createCapability(req.body);
    res.status(201).json({ success: true, message: "AI Capability created successfully", data });
  } catch (error) {
    next(error);
  }
};

const updateCapability = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.updateCapability(req.params.id, req.body);
    res.status(200).json({ success: true, message: "AI Capability updated successfully", data });
  } catch (error) {
    next(error);
  }
};

const toggleCapability = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.toggleCapability(req.params.id, req.body);
    res.status(200).json({ success: true, message: "AI Capability status updated", data });
  } catch (error) {
    next(error);
  }
};

const deleteCapability = async (req, res, next) => {
  try {
    await SuperAdminAiService.deleteCapability(req.params.id);
    res.status(200).json({ success: true, message: "AI Capability removed successfully" });
  } catch (error) {
    next(error);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.getJobs(req.query);
    res.status(200).json({ success: true, data: data.jobs, total: data.total });
  } catch (error) {
    next(error);
  }
};

const retryJob = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.retryJob(req.params.id);
    res.status(200).json({ success: true, message: "AI Job queued for retry", data });
  } catch (error) {
    next(error);
  }
};

const cancelJob = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.cancelJob(req.params.id);
    res.status(200).json({ success: true, message: "AI Job cancelled", data });
  } catch (error) {
    next(error);
  }
};

const getUsage = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.getUsageAndCosts(req.query);
    res.status(200).json({ success: true, data: data.usage });
  } catch (error) {
    next(error);
  }
};

const getCosts = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.getUsageAndCosts(req.query);
    res.status(200).json({ success: true, data: data.costs });
  } catch (error) {
    next(error);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.getLogs(req.query);
    res.status(200).json({ success: true, data: data.logs, total: data.total });
  } catch (error) {
    next(error);
  }
};

const getHealth = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.getHealth();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const testAllHealth = async (req, res, next) => {
  try {
    const data = await SuperAdminAiService.testAllHealth();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getProviders,
  createProvider,
  updateProvider,
  toggleProvider,
  testProvider,
  deleteProvider,
  getModels,
  createModel,
  updateModel,
  deleteModel,
  getCapabilities,
  createCapability,
  updateCapability,
  toggleCapability,
  deleteCapability,
  getJobs,
  retryJob,
  cancelJob,
  getUsage,
  getCosts,
  getLogs,
  getHealth,
  testAllHealth,
};
