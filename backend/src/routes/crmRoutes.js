const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  addContact,
  onboardWithContract,
  getProviders,
  syncToExternal,
} = require("../controllers/crmController");

router.use(verifyToken);

router.get("/", getClients);
router.post("/", createClient);
router.get("/providers", getProviders);
router.post("/sync-external", syncToExternal);
router.get("/clients", getClients);
router.post("/clients", createClient);
router.post("/clients/onboard", onboardWithContract);
router.get("/clients/:id", getClientById);
router.put("/clients/:id", updateClient);
router.delete("/clients/:id", deleteClient);
router.post("/clients/:clientId/contacts", addContact);

module.exports = router;

