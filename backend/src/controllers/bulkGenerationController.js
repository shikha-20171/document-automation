const BulkGenerationService = require("../services/bulkGenerationService");

const getAuthContext = (req) => ({
  organisationId: req.user?.organisation_id || req.user?.organization_id || 1,
  userId: req.user?.id || 1,
});

/**
 * POST /api/bulk-generation/jobs
 * Launch bulk generation with JSON array of records or CSV text
 */
const createBulkJob = async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const { templateId, records, csvText } = req.body;

    if (!templateId) {
      return res.status(400).json({ success: false, message: "templateId is required." });
    }

    let recordsToProcess = [];
    if (Array.isArray(records) && records.length > 0) {
      recordsToProcess = records;
    } else if (csvText && typeof csvText === "string") {
      recordsToProcess = BulkGenerationService.parseCsv(csvText);
    }

    if (recordsToProcess.length === 0) {
      return res.status(400).json({ success: false, message: "At least 1 record or valid CSV text is required." });
    }

    const job = await BulkGenerationService.startBulkJob({
      organisationId,
      templateId,
      records: recordsToProcess,
      createdById: userId,
    });

    res.status(201).json({
      success: true,
      message: `Bulk generation job initiated with ${job.totalRecords} records.`,
      data: job,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/bulk-generation/jobs
 * List all bulk generation jobs for organisation
 */
const listBulkJobs = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const jobs = await BulkGenerationService.listJobs(organisationId);
    res.json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/bulk-generation/jobs/:id
 * Get single bulk generation job status
 */
const getBulkJobById = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const job = await BulkGenerationService.getJobStatus(req.params.id, organisationId);

    if (!job) {
      return res.status(404).json({ success: false, message: "Bulk job not found." });
    }

    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBulkJob,
  listBulkJobs,
  getBulkJobById,
};
