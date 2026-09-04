const FormBuilderService = require("../services/formBuilderService");

const getAuthContext = (req) => ({
  organisationId: req.user?.organisation_id || req.user?.organization_id || 1,
  userId: req.user?.id || 1,
});

const createForm = async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const form = await FormBuilderService.createForm(organisationId, {
      ...req.body,
      createdById: userId,
    });
    res.status(201).json({ success: true, data: form });
  } catch (err) {
    next(err);
  }
};

const listForms = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const forms = await FormBuilderService.listForms(organisationId);
    res.json({ success: true, data: forms });
  } catch (err) {
    next(err);
  }
};

const getFormById = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const form = await FormBuilderService.getFormById(req.params.id, organisationId);
    if (!form) return res.status(404).json({ success: false, message: "Form not found" });
    res.json({ success: true, data: form });
  } catch (err) {
    next(err);
  }
};

const submitForm = async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const result = await FormBuilderService.submitForm({
      formId: req.params.id,
      organisationId,
      submittedData: req.body.submittedData || req.body,
      userId,
    });
    res.status(201).json({ success: true, message: "Form submitted and document processed successfully.", data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createForm,
  listForms,
  getFormById,
  submitForm,
};
