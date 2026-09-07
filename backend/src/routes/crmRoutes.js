const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
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
} = require("../controllers/crmController");

router.use(verifyToken);

// ─── CRM DASHBOARD STATS ───────────────────────────────────────────────────
router.get("/dashboard-stats", getDashboardStats);
router.get("/stats", getDashboardStats);

// ─── DUPLICATE CHECK ───────────────────────────────────────────────────────
router.post("/clients/check-duplicate", checkDuplicate);

// ─── CLIENTS IMPORT & BATCH ────────────────────────────────────────────────
router.post("/clients/import", importClients);

// ─── CLIENTS CRUD & ACTIONS ────────────────────────────────────────────────
router.get("/clients", getClients);
router.post("/clients", createClient);
router.post("/clients/onboard", onboardWithContract);

router.get("/clients/:id", getClientById);
router.put("/clients/:id", updateClient);
router.delete("/clients/:id", deleteClient);
router.patch("/clients/:id/archive", archiveClient);
router.patch("/clients/:id/restore", restoreClient);

// ─── CLIENT CONTACTS ───────────────────────────────────────────────────────
router.get("/contacts", getContacts);
router.get("/clients/:clientId/contacts", getContacts);
router.post("/clients/:clientId/contacts", addContact);
router.put("/contacts/:id", updateContact);
router.delete("/contacts/:id", deleteContact);

// ─── CLIENT DOCUMENTS ──────────────────────────────────────────────────────
router.get("/documents", getClientDocuments);
router.get("/clients/:clientId/documents", getClientDocuments);
router.post("/clients/:clientId/documents", addClientDocument);
router.put("/documents/:id", updateClientDocument);
router.delete("/documents/:id", deleteClientDocument);

// ─── CLIENT REQUESTS / TASKS ───────────────────────────────────────────────
router.get("/requests", getRequests);
router.get("/clients/:clientId/requests", getRequests);
router.post("/requests", createRequest);
router.post("/clients/:clientId/requests", createRequest);
router.put("/requests/:id", updateRequest);
router.delete("/requests/:id", deleteRequest);

// ─── CLIENT NOTES ──────────────────────────────────────────────────────────
router.get("/notes", getNotes);
router.get("/clients/:clientId/notes", getNotes);
router.post("/notes", createNote);
router.post("/clients/:clientId/notes", createNote);
router.put("/notes/:id", updateNote);
router.delete("/notes/:id", deleteNote);

// ─── CLIENT ACTIVITIES / AUDIT TIMELINE ────────────────────────────────────
router.get("/activities", getActivities);
router.get("/clients/:clientId/activities", getActivities);
router.post("/activities", addActivity);
router.post("/clients/:clientId/activities", addActivity);

// ─── EXTERNAL INTEGRATIONS ────────────────────────────────────────────────
router.get("/providers", getProviders);
router.post("/sync-external", syncToExternal);

// Root fallback
router.get("/", getClients);
router.post("/", createClient);

module.exports = router;
