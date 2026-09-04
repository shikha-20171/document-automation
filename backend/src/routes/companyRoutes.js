const express = require("express");

const router = express.Router();

const {
  createCompany,
  getCompany,
  updateCompany,
} = require("../controllers/companyController");

const {
  validateCreateCompany,
} = require("../validations/companyValidation");

const verifyToken = require("../middleware/authMiddleware");

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Initial Company Registration
 *     description: Register the primary corporate tenant company (one-time setup).
 *     tags:
 *       - Companies
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: DocuCore Technologies Pvt Ltd
 *               email:
 *                 type: string
 *                 example: corporate@docucore.ai
 *               phone:
 *                 type: string
 *                 example: "+91 22 4567 8900"
 *               country:
 *                 type: string
 *                 example: India
 *     responses:
 *       201:
 *         description: Company registered successfully.
 *   get:
 *     summary: Get Logged-in Super Admin Company
 *     description: Retrieve company details for the authenticated Super Admin.
 *     tags:
 *       - Companies
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company profile returned.
 */
router.post("/", validateCreateCompany, createCompany);
router.get("/", verifyToken, getCompany);

/**
 * @swagger
 * /companies/{id}:
 *   put:
 *     summary: Update Company Profile
 *     description: Update company address, tax details, or contact information.
 *     tags:
 *       - Companies
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
 *         description: Company updated successfully.
 */
router.put("/:id", verifyToken, updateCompany);

module.exports = router;
