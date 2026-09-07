const CrmService = require("../services/crmService");
const CrmProviderFactory = require("../services/crm/crmProviderFactory");

const getAuthContext = (req) => ({
  organisationId: req.user?.organisation_id || req.user?.organization_id || 1,
  userId: req.user?.id || 1,
  userName: req.user?.full_name || req.user?.name || "Admin",
});

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const stats = await CrmService.getDashboardStats(organisationId);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

// ─── DUPLICATE CHECK ─────────────────────────────────────────────────────────
const checkDuplicate = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const result = await CrmService.checkDuplicate(organisationId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ─── CLIENTS ─────────────────────────────────────────────────────────────────
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
    const { organisationId, userName } = getAuthContext(req);
    const client = await CrmService.createClient(organisationId, req.body, userName);
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

const updateClient = async (req, res, next) => {
  try {
    const { organisationId, userName } = getAuthContext(req);
    const client = await CrmService.updateClient(req.params.id, organisationId, req.body, userName);
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

const archiveClient = async (req, res, next) => {
  try {
    const { organisationId, userName } = getAuthContext(req);
    const client = await CrmService.archiveClient(req.params.id, organisationId, userName);
    res.json({ success: true, data: client, message: "Client archived successfully" });
  } catch (err) {
    next(err);
  }
};

const restoreClient = async (req, res, next) => {
  try {
    const { organisationId, userName } = getAuthContext(req);
    const client = await CrmService.restoreClient(req.params.id, organisationId, userName);
    res.json({ success: true, data: client, message: "Client restored successfully" });
  } catch (err) {
    next(err);
  }
};

const deleteClient = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    await CrmService.deleteClient(req.params.id, organisationId);
    res.json({ success: true, message: "Client removed safely" });
  } catch (err) {
    next(err);
  }
};

// ─── CONTACTS ────────────────────────────────────────────────────────────────
const getContacts = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const clientId = req.params.clientId || req.query.clientId;
    const contacts = await CrmService.getContacts(organisationId, clientId);
    res.json({ success: true, data: contacts });
  } catch (err) {
    next(err);
  }
};

const addContact = async (req, res, next) => {
  try {
    const { organisationId, userName } = getAuthContext(req);
    const clientId = req.params.clientId;
    const contact = await CrmService.addContact(organisationId, clientId, req.body, userName);
    res.status(201).json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
};

const updateContact = async (req, res, next) => {
  try {
    const { organisationId, userName } = getAuthContext(req);
    const contact = await CrmService.updateContact(req.params.id, organisationId, req.body, userName);
    res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    await CrmService.deleteContact(req.params.id, organisationId);
    res.json({ success: true, message: "Contact deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
const getClientDocuments = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const clientId = req.params.clientId || req.query.clientId;
    const docs = await CrmService.getClientDocuments(organisationId, clientId);
    res.json({ success: true, data: docs });
  } catch (err) {
    next(err);
  }
};

const addClientDocument = async (req, res, next) => {
  try {
    const { organisationId, userName } = getAuthContext(req);
    const clientId = req.params.clientId;
    const doc = await CrmService.addClientDocument(organisationId, clientId, req.body, userName);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

const updateClientDocument = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const doc = await CrmService.updateClientDocument(req.params.id, organisationId, req.body);
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

const deleteClientDocument = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    await CrmService.deleteClientDocument(req.params.id, organisationId);
    res.json({ success: true, message: "Document link removed" });
  } catch (err) {
    next(err);
  }
};

// ─── REQUESTS ────────────────────────────────────────────────────────────────
const getRequests = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const clientId = req.params.clientId || req.query.clientId;
    const requests = await CrmService.getRequests(organisationId, clientId);
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};

const createRequest = async (req, res, next) => {
  try {
    const { organisationId, userName } = getAuthContext(req);
    const clientId = req.params.clientId || req.body.clientId;
    const request = await CrmService.createRequest(organisationId, clientId, req.body, userName);
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};

const updateRequest = async (req, res, next) => {
  try {
    const { organisationId, userName } = getAuthContext(req);
    const request = await CrmService.updateRequest(req.params.id, organisationId, req.body, userName);
    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};

const deleteRequest = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    await CrmService.deleteRequest(req.params.id, organisationId);
    res.json({ success: true, message: "Request deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── NOTES ───────────────────────────────────────────────────────────────────
const getNotes = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const clientId = req.params.clientId || req.query.clientId;
    const notes = await CrmService.getNotes(organisationId, clientId);
    res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
};

const createNote = async (req, res, next) => {
  try {
    const { organisationId, userName } = getAuthContext(req);
    const clientId = req.params.clientId || req.body.clientId;
    const note = await CrmService.createNote(organisationId, clientId, req.body, userName);
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const note = await CrmService.updateNote(req.params.id, organisationId, req.body);
    res.json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    await CrmService.deleteNote(req.params.id, organisationId);
    res.json({ success: true, message: "Note deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── ACTIVITIES ──────────────────────────────────────────────────────────────
const getActivities = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const clientId = req.params.clientId || req.query.clientId;
    const activities = await CrmService.getActivities(organisationId, clientId);
    res.json({ success: true, data: activities });
  } catch (err) {
    next(err);
  }
};

const addActivity = async (req, res, next) => {
  try {
    const { organisationId, userName } = getAuthContext(req);
    const clientId = req.params.clientId || req.body.clientId;
    const activity = await CrmService.addActivity(organisationId, clientId, req.body, userName);
    res.status(201).json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
};

// ─── IMPORT / EXPORT ─────────────────────────────────────────────────────────
const importClients = async (req, res, next) => {
  try {
    const { organisationId, userName } = getAuthContext(req);
    const { records = [] } = req.body;
    const result = await CrmService.importClients(organisationId, records, userName);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ─── ONBOARDING & EXTERNAL SYNC ──────────────────────────────────────────────
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
  getDashboardStats,
  checkDuplicate,
  getClients,
  getClientById,
  createClient,
  updateClient,
  archiveClient,
  restoreClient,
  deleteClient,
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  getClientDocuments,
  addClientDocument,
  updateClientDocument,
  deleteClientDocument,
  getRequests,
  createRequest,
  updateRequest,
  deleteRequest,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getActivities,
  addActivity,
  importClients,
  onboardWithContract,
  getProviders,
  syncToExternal,
};
