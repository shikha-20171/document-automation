const SuperAdminOcrService = require("../services/superAdminOcrService");

const getOverview = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.getOverviewMetrics();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getProviders = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.getProviders();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const createProvider = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.createProvider(req.body);
    res.status(201).json({ success: true, message: "OCR Provider created successfully", data });
  } catch (error) {
    next(error);
  }
};

const updateProvider = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.updateProvider(req.params.id, req.body);
    res.status(200).json({ success: true, message: "OCR Provider updated successfully", data });
  } catch (error) {
    next(error);
  }
};

const toggleProvider = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.toggleProvider(req.params.id, req.body);
    res.status(200).json({ success: true, message: "OCR Provider status updated", data });
  } catch (error) {
    next(error);
  }
};

const testProvider = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.testProviderConnection(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const deleteProvider = async (req, res, next) => {
  try {
    await SuperAdminOcrService.deleteProvider(req.params.id);
    res.status(200).json({ success: true, message: "OCR Provider removed successfully" });
  } catch (error) {
    next(error);
  }
};

const getProfiles = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.getProfiles(req.query.providerId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const createProfile = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.createProfile(req.body);
    res.status(201).json({ success: true, message: "OCR Profile created successfully", data });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.updateProfile(req.params.id, req.body);
    res.status(200).json({ success: true, message: "OCR Profile updated successfully", data });
  } catch (error) {
    next(error);
  }
};

const toggleProfile = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.toggleProfile(req.params.id, req.body);
    res.status(200).json({ success: true, message: "OCR Profile status updated", data });
  } catch (error) {
    next(error);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    await SuperAdminOcrService.deleteProfile(req.params.id);
    res.status(200).json({ success: true, message: "OCR Profile deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.getJobs(req.query);
    res.status(200).json({ success: true, data: data.jobs, total: data.total });
  } catch (error) {
    next(error);
  }
};

const retryJob = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.retryJob(req.params.id);
    res.status(200).json({ success: true, message: "OCR Job queued for retry", data });
  } catch (error) {
    next(error);
  }
};

const reprocessJob = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.reprocessJob(req.params.id);
    res.status(200).json({ success: true, message: "OCR Job reprocessing initiated", data });
  } catch (error) {
    next(error);
  }
};

const cancelJob = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.cancelJob(req.params.id);
    res.status(200).json({ success: true, message: "OCR Job cancelled", data });
  } catch (error) {
    next(error);
  }
};

const getUsage = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.getUsageAndCosts();
    res.status(200).json({ success: true, data: data.usage });
  } catch (error) {
    next(error);
  }
};

const getCosts = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.getUsageAndCosts();
    res.status(200).json({ success: true, data: data.costs });
  } catch (error) {
    next(error);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.getLogs(req.query);
    res.status(200).json({ success: true, data: data.logs, total: data.total });
  } catch (error) {
    next(error);
  }
};

const getHealth = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.getHealth();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const testAllHealth = async (req, res, next) => {
  try {
    const data = await SuperAdminOcrService.testAllHealth();
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
  getProfiles,
  createProfile,
  updateProfile,
  toggleProfile,
  deleteProfile,
  getJobs,
  retryJob,
  reprocessJob,
  cancelJob,
  getUsage,
  getCosts,
  getLogs,
  getHealth,
  testAllHealth,
};
