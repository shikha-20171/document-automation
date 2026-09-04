const CrmService = require("../services/crmService");

const getAuthContext = (req) => ({
  organisationId: req.user?.organisation_id || req.user?.organization_id || 1,
  userId: req.user?.id || 1,
});

const getClients = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const clients = await CrmService.getClients(organisationId, req.query);
    res.json({ success: true, data: clients });
  } catch (err) {
    next(err);
  }
};

const getClientById = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const client = await CrmService.getClientById(req.params.id, organisationId);
    if (!client) return res.status(404).json({ success: false, message: "Client not found" });
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

const createClient = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const client = await CrmService.createClient(organisationId, req.body);
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

const updateClient = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const client = await CrmService.updateClient(req.params.id, organisationId, req.body);
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

const deleteClient = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    await CrmService.deleteClient(req.params.id, organisationId);
    res.json({ success: true, message: "Client deleted successfully" });
  } catch (err) {
    next(err);
  }
};

const addContact = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const contact = await CrmService.addContact(organisationId, req.params.clientId, req.body);
    res.status(201).json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
};

const onboardWithContract = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const result = await CrmService.onboardClientWithDocument(organisationId, req.body);
    res.status(201).json({
      success: true,
      message: "Client created and onboarding contract generated automatically.",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const CrmProviderFactory = require("../services/crm/crmProviderFactory");

const getProviders = async (req, res, next) => {
  try {
    const providers = CrmProviderFactory.getSupportedProviders();
    res.json({ success: true, data: providers });
  } catch (err) {
    next(err);
  }
};

const syncToExternal = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const { provider = "SALESFORCE", contactData } = req.body;
    const adapter = CrmProviderFactory.getAdapter(provider);
    const result = await adapter.syncContact(organisationId, contactData || { email: "contact@example.com" });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  addContact,
  onboardWithContract,
  getProviders,
  syncToExternal,
};

