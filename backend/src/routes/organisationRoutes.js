const express = require("express");

const router = express.Router();

const {
  getAllOrganisations,
  getOrganisationById,
  createOrganisation,
  updateOrganisation,
  deleteOrganisation,
  updateOrganisationStatus,
  resendWelcomeEmail,
  getOrganisationAdmins,
  getOrganisationDepartments,
  getOrganisationTeams,
  getOrganisationEmployees,
  getOrganisationDocuments,
  getOrganisationAnalytics,
  getOrganisationActivityLogs,
  updateOrganisationSettings,
  getDashboardStats,
} = require("../controllers/organisationController");

const {
  resendInvitationController,
} = require("../controllers/invitationController");

/**
 * @swagger
 * /organisations/dashboard-stats:
 *   get:
 *     summary: Super Admin Organisations Dashboard Metrics
 *     description: Retrieve global aggregated counts and metrics across all registered organisations.
 *     tags:
 *       - Organisations (Super Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 */
router.get("/dashboard-stats", getDashboardStats);

/**
 * @swagger
 * /organisations:
 *   get:
 *     summary: List All Organisations
 *     description: Retrieve paginated list of all customer organisations with filtering and search support.
 *     tags:
 *       - Organisations (Super Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword for organisation name or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending]
 *         description: Filter by organisation status
 *     responses:
 *       200:
 *         description: List of organisations retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 *   post:
 *     summary: Create New Organisation
 *     description: Register a new customer organisation and automatically dispatch invitation email to the initial admin.
 *     tags:
 *       - Organisations (Super Admin)
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
 *               - email
 *               - admin_name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Acme Corporation
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@acme.com
 *               admin_name:
 *                 type: string
 *                 example: Jane Doe
 *               domain:
 *                 type: string
 *                 example: acme.com
 *               plan:
 *                 type: string
 *                 example: Enterprise
 *               storage_limit_gb:
 *                 type: number
 *                 example: 50
 *     responses:
 *       201:
 *         description: Organisation created and invitation dispatched.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 *       400:
 *         description: Invalid input or organisation already exists.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 */
const prismaClient = require("../config/prismaClient");

router.get("/", getAllOrganisations);
router.post("/", createOrganisation);
router.get("/stats/summary", getDashboardStats);

router.patch("/:id/status", updateOrganisationStatus);
router.post("/:id/status", updateOrganisationStatus);
router.post("/:id/resend-welcome-email", resendWelcomeEmail);

router.post("/:id/suspend", async (req, res, next) => {
  try {
    const org = await updateOrganisationStatus(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/activate", async (req, res, next) => {
  try {
    const org = await updateOrganisationStatus(req, res, next);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /organisations/{id}/resend-invitation:
 *   post:
 *     summary: Resend Organisation Invitation
 *     description: Re-generate and dispatch a fresh 24/48-hour onboarding invitation email to the organisation admin.
 *     tags:
 *       - Organisations (Super Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organisation ID
 *     responses:
 *       200:
 *         description: Invitation resent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 */
router.post("/:id/resend-invitation", resendInvitationController);

/**
 * @swagger
 * /organisations/{id}:
 *   get:
 *     summary: Get Organisation By ID
 *     description: Fetch full profile, tier, storage usage, and admin metadata for an organisation.
 *     tags:
 *       - Organisations (Super Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organisation ID
 *     responses:
 *       200:
 *         description: Organisation details returned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 *       404:
 *         description: Organisation not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 *   put:
 *     summary: Update Organisation
 *     description: Update organisation profile, status, domain, or plan details.
 *     tags:
 *       - Organisations (Super Admin)
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
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *               domain:
 *                 type: string
 *               plan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Organisation updated successfully.
 *   delete:
 *     summary: Delete Organisation
 *     description: Soft delete or purge an organisation and associated records.
 *     tags:
 *       - Organisations (Super Admin)
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
 *         description: Organisation deleted successfully.
 */
router.get("/:id", getOrganisationById);
router.put("/:id", updateOrganisation);
router.delete("/:id", deleteOrganisation);

/**
 * @swagger
 * /organisations/{id}/admins:
 *   get:
 *     summary: Get Organisation Admins
 *     description: List all administrative users associated with an organisation.
 *     tags:
 *       - Organisations (Super Admin)
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
 *         description: List of admins returned.
 */
router.get("/:id/admins", getOrganisationAdmins);

/**
 * @swagger
 * /organisations/{id}/departments:
 *   get:
 *     summary: Get Organisation Departments
 *     description: List departments configured within an organisation.
 *     tags:
 *       - Organisations (Super Admin)
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
 *         description: List of departments returned.
 */
router.get("/:id/departments", getOrganisationDepartments);

/**
 * @swagger
 * /organisations/{id}/teams:
 *   get:
 *     summary: Get Organisation Teams
 *     description: List internal teams and team leads within an organisation.
 *     tags:
 *       - Organisations (Super Admin)
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
 *         description: List of teams returned.
 */
router.get("/:id/teams", getOrganisationTeams);

/**
 * @swagger
 * /organisations/{id}/employees:
 *   get:
 *     summary: Get Organisation Employees
 *     description: List all employee staff members registered in an organisation.
 *     tags:
 *       - Organisations (Super Admin)
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
 *         description: List of employees returned.
 */
router.get("/:id/employees", getOrganisationEmployees);

/**
 * @swagger
 * /organisations/{id}/documents:
 *   get:
 *     summary: Get Organisation Documents
 *     description: List documents uploaded and processed by an organisation.
 *     tags:
 *       - Organisations (Super Admin)
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
 *         description: Document list returned.
 */
router.get("/:id/documents", getOrganisationDocuments);

/**
 * @swagger
 * /organisations/{id}/analytics:
 *   get:
 *     summary: Get Organisation Analytics
 *     description: Retrieve usage, processing volume, and SLA metrics for an organisation.
 *     tags:
 *       - Organisations (Super Admin)
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
 *         description: Analytics metrics returned.
 */
router.get("/:id/analytics", getOrganisationAnalytics);

/**
 * @swagger
 * /organisations/{id}/activity:
 *   get:
 *     summary: Get Organisation Activity Logs
 *     description: Audit trail of user actions, status changes, and logins for an organisation.
 *     tags:
 *       - Organisations (Super Admin)
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
 *         description: Activity logs returned.
 */
router.get("/:id/activity", getOrganisationActivityLogs);

/**
 * @swagger
 * /organisations/{id}/settings:
 *   put:
 *     summary: Update Organisation Settings
 *     description: Update custom settings, feature flags, or storage quota for an organisation.
 *     tags:
 *       - Organisations (Super Admin)
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
 *         description: Settings updated successfully.
 */
router.put("/:id/settings", updateOrganisationSettings);

module.exports = router;