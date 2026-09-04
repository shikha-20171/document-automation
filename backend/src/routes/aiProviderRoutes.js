const express = require("express");
const router = express.Router();
const aiProviderService = require("../services/aiProviderService");

/**
 * @swagger
 * /ai/providers:
 *   get:
 *     summary: List All AI Providers
 *     description: Retrieve all configured AI providers (OpenAI, Anthropic, Google Gemini, Ollama, etc.).
 *     tags:
 *       - AI Providers & Models
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of AI providers.
 *   post:
 *     summary: Register AI Provider
 *     description: Add a new AI model provider with API credentials and configuration.
 *     tags:
 *       - AI Providers & Models
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: OpenAI
 *               type:
 *                 type: string
 *                 example: openai
 *               api_key:
 *                 type: string
 *                 example: sk-proj-...
 *               base_url:
 *                 type: string
 *                 example: https://api.openai.com/v1
 *               status:
 *                 type: string
 *                 example: active
 *     responses:
 *       201:
 *         description: Provider registered successfully.
 */
router.get("/", async (req, res) => {
  try {
    const providers = await aiProviderService.getAll();
    res.json({ success: true, data: providers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const provider = await aiProviderService.create(req.body);
    res.status(201).json({ success: true, data: provider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /ai/providers/{id}:
 *   get:
 *     summary: Get AI Provider Details
 *     description: Fetch configuration and supported models for a specific AI provider.
 *     tags:
 *       - AI Providers & Models
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Provider details returned.
 *   put:
 *     summary: Update AI Provider
 *     description: Update provider API key, base URL, or endpoint configurations.
 *     tags:
 *       - AI Providers & Models
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Provider updated.
 */
router.get("/:id", async (req, res) => {
  try {
    const provider = await aiProviderService.getById(req.params.id);
    if (!provider) return res.status(404).json({ success: false, message: "Provider not found" });
    res.json({ success: true, data: provider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const provider = await aiProviderService.update(req.params.id, req.body);
    res.json({ success: true, data: provider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /ai/providers/{id}/status:
 *   patch:
 *     summary: Toggle Provider Active Status
 *     description: Enable or disable an AI provider globally.
 *     tags:
 *       - AI Providers & Models
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Provider status updated.
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const provider = await aiProviderService.toggleStatus(req.params.id, status);
    res.json({ success: true, data: provider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post("/:id/configure", async (req, res) => {
  try {
    const provider = await aiProviderService.configure(req.params.id, req.body);
    res.json({ success: true, message: "Provider credentials and configuration updated.", data: provider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post("/:id/activate", async (req, res) => {
  try {
    const provider = await aiProviderService.activate(req.params.id);
    res.json({ success: true, message: `${provider.providerName} activated successfully.`, data: provider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post("/:id/deactivate", async (req, res) => {
  try {
    const provider = await aiProviderService.deactivate(req.params.id);
    res.json({ success: true, message: `${provider.providerName} deactivated successfully.`, data: provider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post("/:id/test", async (req, res) => {
  try {
    const result = await aiProviderService.testConnection(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, status: "failed", message: err.message });
  }
});

router.post("/:id/test-connection", async (req, res) => {
  try {
    const result = await aiProviderService.testConnection(req.params.id);
    res.json({ success: result.success, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
