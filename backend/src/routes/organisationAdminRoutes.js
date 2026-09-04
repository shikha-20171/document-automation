const express = require("express");
const router = express.Router();
const {
  createOrganisationAdmin,
  getAllOrganisationAdmins,
  getOrganisationAdminById,
  updateOrganisationAdmin,
  sendCredentials,
  deleteOrganisationAdmin,
} = require("../controllers/organisationAdminController");

/**
 * @swagger
 * /organisation-admins:
 *   get:
 *     summary: List All Organisation Admins
 *     description: Retrieve a paginated list of all organisation admins across the platform.
 *     tags:
 *       - Organisation Admins (Super Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of organisation admins.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 *   post:
 *     summary: Create Organisation Admin
 *     description: Provision a new administrative user for a specific organisation and trigger onboarding email.
 *     tags:
 *       - Organisation Admins (Super Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organisation_id
 *               - name
 *               - email
 *             properties:
 *               organisation_id:
 *                 type: string
 *               name:
 *                 type: string
 *                 example: Priya Patel
 *               email:
 *                 type: string
 *                 format: email
 *                 example: priya.p@company.com
 *               phone:
 *                 type: string
 *                 example: "+91 9876543210"
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organisation admin created.
 */
router.post("/", createOrganisationAdmin);
router.get("/", getAllOrganisationAdmins);

/**
 * @swagger
 * /organisation-admins/{id}:
 *   get:
 *     summary: Get Organisation Admin By ID
 *     description: Retrieve details of a specific organisation admin.
 *     tags:
 *       - Organisation Admins (Super Admin)
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
 *         description: Admin details returned.
 *   put:
 *     summary: Update Organisation Admin
 *     description: Update name, phone, status, or role permissions of an organisation admin.
 *     tags:
 *       - Organisation Admins (Super Admin)
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
 *         description: Admin updated successfully.
 *   delete:
 *     summary: Delete Organisation Admin
 *     description: Remove or revoke access for an organisation admin.
 *     tags:
 *       - Organisation Admins (Super Admin)
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
 *         description: Admin deleted successfully.
 */
router.get("/:id", getOrganisationAdminById);
router.put("/:id", updateOrganisationAdmin);
router.delete("/:id", deleteOrganisationAdmin);

/**
 * @swagger
 * /organisation-admins/{id}/send-credentials:
 *   post:
 *     summary: Send Login Credentials Email
 *     description: Dispatch login credentials email directly to the organisation admin's inbox.
 *     tags:
 *       - Organisation Admins (Super Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Credentials email dispatched successfully.
 */
router.post("/:id/send-credentials", sendCredentials);

module.exports = router;
