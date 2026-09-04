const UsageMeteringService = require("../services/usageMeteringService");

const getAuthContext = (req) => ({
  organisationId: req.user?.organisation_id || req.user?.organization_id || 1,
  userId: req.user?.id || 1,
});

const getUsage = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const targetOrgId = req.query.organisationId || organisationId;
    const usage = await UsageMeteringService.getOrganisationUsage(targetOrgId);
    res.json({ success: true, data: usage });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsage,
};
