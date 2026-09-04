const express = require("express");
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  inviteUser,
  resendInvite,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getTeams,
  createTeam,
  getPermissionsMatrix,
  getUserActivityLog,
} = require("../controllers/orgTeamController");

/**
 * @swagger
 * /org-admin/team/users:
 *   get:
 *     summary: List Organisation Staff & Users
 *     description: Retrieve all users within the organisation.
 *     tags:
 *       - Org Admin - Team
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list returned.
 *   post:
 *     summary: Add Organisation User
 *     description: Direct manual addition of a staff member.
 *     tags:
 *       - Org Admin - Team
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
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created.
 */
router.get("/", getUsers);
router.get("/users", getUsers);
router.post("/users", createUser);
router.get("/members", getUsers);
router.post("/members", createUser);

/**
 * @swagger
 * /org-admin/team/users/{id}:
 *   put:
 *     summary: Update User
 *     description: Update name, role, department, or phone for an organisation user.
 *     tags:
 *       - Org Admin - Team
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
 *         description: User updated.
 *   delete:
 *     summary: Delete User
 *     description: Remove a user from the organisation roster.
 *     tags:
 *       - Org Admin - Team
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
 *         description: User deleted.
 */
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.put("/members/:id", updateUser);
router.delete("/members/:id", deleteUser);

/**
 * @swagger
 * /org-admin/team/users/{id}/status:
 *   patch:
 *     summary: Toggle User Active Status
 *     description: Activate or deactivate a user account.
 *     tags:
 *       - Org Admin - Team
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
 *         description: Status updated.
 */
router.patch("/users/:id/status", toggleUserStatus);

/**
 * @swagger
 * /org-admin/team/users/invite:
 *   post:
 *     summary: Invite User via Email
 *     description: Dispatch onboarding email with password setup token.
 *     tags:
 *       - Org Admin - Team
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation sent.
 */
router.post("/users/invite", inviteUser);

/**
 * @swagger
 * /org-admin/team/users/resend-invite:
 *   post:
 *     summary: Resend User Invitation
 *     description: Re-generate and dispatch invitation email.
 *     tags:
 *       - Org Admin - Team
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation resent.
 */
router.post("/users/resend-invite", resendInvite);

/**
 * @swagger
 * /org-admin/team/departments:
 *   get:
 *     summary: List Organisation Departments
 *     description: Retrieve all departments and assigned department managers.
 *     tags:
 *       - Org Admin - Team
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Departments returned.
 *   post:
 *     summary: Create Department
 *     description: Create a new organizational unit.
 *     tags:
 *       - Org Admin - Team
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
 *             properties:
 *               name:
 *                 type: string
 *               manager:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department created.
 */
router.get("/departments", getDepartments);
router.post("/departments", createDepartment);

/**
 * @swagger
 * /org-admin/team/departments/{id}:
 *   put:
 *     summary: Update Department
 *     description: Update department name, manager, or description.
 *     tags:
 *       - Org Admin - Team
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
 *         description: Department updated.
 *   delete:
 *     summary: Delete Department
 *     description: Delete a department.
 *     tags:
 *       - Org Admin - Team
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
 *         description: Department deleted.
 */
router.put("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);

/**
 * @swagger
 * /org-admin/team/teams:
 *   get:
 *     summary: List Organisation Teams
 *     description: Retrieve internal teams and leads.
 *     tags:
 *       - Org Admin - Team
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teams list returned.
 *   post:
 *     summary: Create Team
 *     description: Register a new internal team.
 *     tags:
 *       - Org Admin - Team
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
 *             properties:
 *               name:
 *                 type: string
 *               teamLead:
 *                 type: string
 *     responses:
 *       201:
 *         description: Team created.
 */
router.get("/teams", getTeams);
router.post("/teams", createTeam);

/**
 * @swagger
 * /org-admin/team/permissions:
 *   get:
 *     summary: RBAC Permissions Matrix
 *     description: Retrieve role permission mappings.
 *     tags:
 *       - Org Admin - Team
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions matrix returned.
 */
router.get("/permissions", getPermissionsMatrix);

/**
 * @swagger
 * /org-admin/team/activity:
 *   get:
 *     summary: Organisation Staff Activity Log
 *     description: Retrieve audit logs for user logins, document updates, and status changes.
 *     tags:
 *       - Org Admin - Team
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity logs returned.
 */
router.get("/activity", getUserActivityLog);

module.exports = router;
