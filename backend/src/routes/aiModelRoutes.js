const express = require("express");
const router = express.Router();
const aiModelService = require("../services/aiModelService");

/**
 * @swagger
 * /ai/models:
 *   get:
 *     summary: List All AI Models
 *     description: Retrieve all available LLMs, Vision models, and OCR engines.
 *     tags:
 *       - AI Providers & Models
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of models.
 *   post:
 *     summary: Register New AI Model
 *     description: Register a model (e.g. gpt-4o, claude-3-5-sonnet, gemini-1.5-pro) under a provider.
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
 *               - model_id
 *               - provider_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: GPT-4o
 *               model_id:
 *                 type: string
 *                 example: gpt-4o
 *               provider_id:
 *                 type: string
 *               context_window:
 *                 type: number
 *                 example: 128000
 *               max_tokens:
 *                 type: number
 *                 example: 4096
 *     responses:
 *       201:
 *         description: Model registered.
 */
router.get("/", async (req, res) => {
  try {
    const models = await aiModelService.getAll();
    res.json({ success: true, data: models });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const model = await aiModelService.create(req.body);
    res.status(201).json({ success: true, data: model });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /ai/models/{id}:
 *   get:
 *     summary: Get AI Model Details
 *     description: Retrieve specifications and quota limits for a model.
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
 *         description: Model details returned.
 *   put:
 *     summary: Update AI Model
 *     description: Update parameters, max tokens, or pricing for a model.
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
 *         description: Model updated.
 */
router.get("/:id", async (req, res) => {
  try {
    const model = await aiModelService.getById(req.params.id);
    if (!model) return res.status(404).json({ success: false, message: "Model not found" });
    res.json({ success: true, data: model });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const model = await aiModelService.update(req.params.id, req.body);
    res.json({ success: true, data: model });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /ai/models/{id}/status:
 *   patch:
 *     summary: Toggle Model Availability
 *     description: Enable or disable an AI model.
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
 *         description: Model status updated.
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const model = await aiModelService.toggleStatus(req.params.id, status);
    res.json({ success: true, data: model });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /ai/models/{id}/organizations:
 *   get:
 *     summary: Get Organisations Assigned to Model
 *     description: List which customer organisations have access to this AI model.
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
 *         description: Organisation assignment list returned.
 *   put:
 *     summary: Update Model Organisation Access
 *     description: Grant or restrict access to this AI model for specified organisations.
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
 *             properties:
 *               organisationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Access permissions saved.
 */
router.get("/:id/organizations", async (req, res) => {
  try {
    const assignments = await aiModelService.getOrgAssignments(req.params.id);
    res.json({ success: true, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id/organizations", async (req, res) => {
  try {
    const { organisationIds } = req.body;
    const assignments = await aiModelService.saveOrgAssignments(req.params.id, organisationIds || []);
    res.json({ success: true, data: assignments });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
