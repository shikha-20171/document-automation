const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const authMiddleware = require("../middleware/authMiddleware");

// Optional / authenticated middleware
router.use(authMiddleware.optionalAuth);

/**
 * @swagger
 * tags:
 *   - name: Employee - Dashboard
 *     description: Employee personal KPI dashboard, quick actions, and recent activities
 *   - name: Employee - Documents
 *     description: Employee document lifecycle (Upload, Create, Edit, Draft, Submit, Archive, Delete)
 *   - name: Employee - Templates
 *     description: Read-only organization document templates and dynamic draft generation
 *   - name: Employee - Tasks
 *     description: Assigned tasks from Team Leaders / Managers with collaborative notes
 *   - name: Employee - Approvals
 *     description: Employee approval tracking, rejection review, and correction resubmissions
 *   - name: Employee - AI Tools
 *     description: Assisted AI document processing tools (OCR, Summarizer, Q&A, Translate, Rewrite)
 *   - name: Employee - Notifications
 *     description: Personal notifications queue and preference controls
 *   - name: Employee - Reports
 *     description: Individual productivity reports, task completion velocity, and personal audits
 *   - name: Employee - Profile
 *     description: Employee profile details, password updates, and active session management
 */

// =====================================================================
// 1. DASHBOARD
// =====================================================================
/**
 * @swagger
 * /employee/dashboard:
 *   get:
 *     summary: Get Employee Dashboard Metrics & Telemetry
 *     tags: [Employee - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics, recent documents, activity, and quick actions.
 */
router.get("/dashboard", employeeController.getDashboardData);

// =====================================================================
// 2. MY DOCUMENTS
// =====================================================================
/**
 * @swagger
 * /employee/documents:
 *   get:
 *     summary: List employee documents with search, category, status & archive filters
 *     tags: [Employee - Documents]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, name_asc, name_desc]
 *     responses:
 *       200:
 *         description: Filtered list of documents.
 *   post:
 *     summary: Create new employee document or save as draft
 *     tags: [Employee - Documents]
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
 *               category:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 default: Draft
 *     responses:
 *       201:
 *         description: Document created successfully.
 */
router.get("/documents", employeeController.getDocuments);
router.post("/documents", employeeController.createDocument);

/**
 * @swagger
 * /employee/documents/{id}:
 *   get:
 *     summary: Get single document details with content and history
 *     tags: [Employee - Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document detail object.
 *   put:
 *     summary: Update document content, rename, or update metadata
 *     tags: [Employee - Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document updated successfully.
 *   delete:
 *     summary: Delete own document (restricted if approved)
 *     tags: [Employee - Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted.
 */
router.get("/documents/:id", employeeController.getDocumentById);
router.put("/documents/:id", employeeController.updateDocument);
router.delete("/documents/:id", employeeController.deleteDocument);

/**
 * @swagger
 * /employee/documents/{id}/submit-approval:
 *   post:
 *     summary: Submit document for Team Leader / Manager review & approval
 *     tags: [Employee - Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document submitted for approval.
 */
router.post("/documents/:id/submit-approval", employeeController.submitDocumentForApproval);

/**
 * @swagger
 * /employee/documents/{id}/toggle-archive:
 *   post:
 *     summary: Toggle archive state of a document
 *     tags: [Employee - Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document archive status toggled.
 */
router.post("/documents/:id/toggle-archive", employeeController.toggleArchiveDocument);

/**
 * @swagger
 * /employee/documents/{id}/share:
 *   post:
 *     summary: Share document with collaborators and set access permissions
 *     tags: [Employee - Documents]
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
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *               permission:
 *                 type: string
 *                 enum: [VIEW, COMMENT, EDIT]
 *     responses:
 *       200:
 *         description: Document shared successfully.
 */
router.post("/documents/:id/share", employeeController.shareDocument);


// =====================================================================
// 3. DOCUMENT TEMPLATES
// =====================================================================
/**
 * @swagger
 * /employee/templates:
 *   get:
 *     summary: Browse available organization templates (Read-Only)
 *     tags: [Employee - Templates]
 *     responses:
 *       200:
 *         description: List of templates with fillable fields.
 */
router.get("/templates", employeeController.getTemplates);
router.get("/document-templates", employeeController.getTemplates);
router.post("/document-templates", employeeController.createTemplate);
router.post("/ai-tools/generate", employeeController.runAiToolAction);
router.post("/ai-tools/ocr", employeeController.runAiToolAction);

/**
 * @swagger
 * /employee/templates:
 *   post:
 *     summary: Create a reusable document template with dynamic placeholders
 *     tags: [Employee - Templates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - contentTemplate
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               contentTemplate:
 *                 type: string
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Template created and permanently stored.
 */
router.post("/templates", employeeController.createTemplate);

/**
 * @swagger
 * /employee/templates/{id}:
 *   get:
 *     summary: Get template details and schema
 *     tags: [Employee - Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template structure and fields.
 *   put:
 *     summary: Update template content and bump version
 *     tags: [Employee - Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template updated.
 *   delete:
 *     summary: Delete a custom template
 *     tags: [Employee - Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted.
 */
router.get("/templates/:id", employeeController.getTemplateById);
router.put("/templates/:id", employeeController.updateTemplate);
router.delete("/templates/:id", employeeController.deleteTemplate);

/**
 * @swagger
 * /employee/templates/{id}/duplicate:
 *   post:
 *     summary: Duplicate an existing template to create a new variant
 *     tags: [Employee - Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Template cloned successfully.
 */
router.post("/templates/:id/duplicate", employeeController.duplicateTemplate);

/**
 * @swagger
 * /employee/templates/generate-ai:
 *   post:
 *     summary: Use AI to draft template structure and insert placeholders
 *     tags: [Employee - Templates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI generated template content with placeholders.
 */
router.post("/templates/generate-ai", employeeController.generateAiTemplate);

/**
 * @swagger
 * /employee/templates/generate-document:
 *   post:
 *     summary: Fill template fields and generate a document draft
 *     tags: [Employee - Templates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *               - fieldValues
 *             properties:
 *               templateId:
 *                 type: string
 *               fieldValues:
 *                 type: object
 *               docName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Generated document draft ready for editing.
 */
router.post("/templates/generate-document", employeeController.generateDocumentFromTemplate);


// =====================================================================
// 4. MY TASKS
// =====================================================================
/**
 * @swagger
 * /employee/tasks:
 *   get:
 *     summary: View tasks assigned to employee with status & priority filters
 *     tags: [Employee - Tasks]
 *     responses:
 *       200:
 *         description: List of assigned tasks and metric counts.
 */
router.get("/tasks", employeeController.getTasks);

/**
 * @swagger
 * /employee/tasks/{id}/status:
 *   patch:
 *     summary: Update task status (e.g. IN_PROGRESS, SUBMITTED, COMPLETED)
 *     tags: [Employee - Tasks]
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
 *     responses:
 *       200:
 *         description: Task status updated.
 */
router.patch("/tasks/:id/status", employeeController.updateTaskStatus);

/**
 * @swagger
 * /employee/tasks/{id}/comments:
 *   post:
 *     summary: Add collaborative comment to task
 *     tags: [Employee - Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Comment recorded.
 */
router.post("/tasks/:id/comments", employeeController.addTaskComment);

/**
 * @swagger
 * /employee/tasks/{id}/attachments:
 *   post:
 *     summary: Attach deliverable file to task
 *     tags: [Employee - Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Attachment added.
 */
router.post("/tasks/:id/attachments", employeeController.addTaskAttachment);

// =====================================================================
// 5. APPROVALS WORKFLOW
// =====================================================================
/**
 * @swagger
 * /employee/approvals:
 *   get:
 *     summary: View status and reviewer remarks on employee submitted approvals
 *     tags: [Employee - Approvals]
 *     responses:
 *       200:
 *         description: List of approval workflows and current stages.
 */
router.get("/approvals", employeeController.getApprovals);
router.post("/approvals", (req, res, next) => {
  req.params.id = req.body.document_id || req.body.documentId || req.params.id;
  return employeeController.submitDocumentForApproval(req, res, next);
});

/**
 * @swagger
 * /employee/approvals/{id}/resubmit:
 *   post:
 *     summary: Resubmit rejected or revised document for approval
 *     tags: [Employee - Approvals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Approval request refreshed and placed under review.
 */
router.post("/approvals/:id/resubmit", employeeController.resubmitApproval);

/**
 * @swagger
 * /employee/approvals/{id}/cancel:
 *   post:
 *     summary: Cancel a pending approval request submitted by employee
 *     tags: [Employee - Approvals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Approval request cancelled.
 */
router.post("/approvals/:id/cancel", employeeController.cancelApproval);


// =====================================================================
// 6. AI TOOLS SUITE
// =====================================================================
/**
 * @swagger
 * /employee/ai-tools/run:
 *   post:
 *     summary: Execute AI assistant tool (OCR, Summarize, Ask Document, Translate, Rewrite, Generate)
 *     tags: [Employee - AI Tools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tool
 *             properties:
 *               tool:
 *                 type: string
 *                 enum: [OCR, SUMMARIZE, ASK_DOCUMENT, EXTRACT_INFO, TRANSLATE, REWRITE, IMPROVE, GENERATE, CATEGORIZE]
 *               content:
 *                 type: string
 *               prompt:
 *                 type: string
 *               targetLanguage:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI generated response formatted for manual review and editing.
 */
router.post("/ai-tools/run", employeeController.runAiToolAction);

// =====================================================================
// 7. NOTIFICATIONS
// =====================================================================
/**
 * @swagger
 * /employee/notifications:
 *   get:
 *     summary: List employee notifications with category/status filters
 *     tags: [Employee - Notifications]
 *     responses:
 *       200:
 *         description: Notification items and unread count.
 */
router.get("/notifications", employeeController.getNotifications);

/**
 * @swagger
 * /employee/notifications/{id}/read:
 *   patch:
 *     summary: Mark single notification or all notifications as read (id=ALL)
 *     tags: [Employee - Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification read state updated.
 */
router.patch("/notifications/read-all", (req, res) => { req.params.id = "ALL"; return employeeController.markNotificationRead(req, res); });
router.post("/notifications/read-all", (req, res) => { req.params.id = "ALL"; return employeeController.markNotificationRead(req, res); });
router.patch("/notifications/:id/read", employeeController.markNotificationRead);
router.post("/notifications/:id/read", employeeController.markNotificationRead);

/**
 * @swagger
 * /employee/notifications/preferences:
 *   put:
 *     summary: Update notification alert preferences
 *     tags: [Employee - Notifications]
 *     responses:
 *       200:
 *         description: Updated preferences.
 */
router.put("/notifications/preferences", employeeController.updateNotificationPreferences);

// =====================================================================
// 8. PERSONAL REPORTS
// =====================================================================
/**
 * @swagger
 * /employee/reports:
 *   get:
 *     summary: Get personal document activity, task completion velocity, and approval stats
 *     tags: [Employee - Reports]
 *     responses:
 *       200:
 *         description: Individual employee performance metrics.
 */
router.get("/reports", employeeController.getPersonalReports);

// =====================================================================
// 9. PROFILE & SECURITY
// =====================================================================
/**
 * @swagger
 * /employee/profile:
 *   get:
 *     summary: Get employee profile with read-only department/team and active sessions
 *     tags: [Employee - Profile]
 *     responses:
 *       200:
 *         description: Profile object.
 *   put:
 *     summary: Update permitted personal contact information & bio
 *     tags: [Employee - Profile]
 *     responses:
 *       200:
 *         description: Profile updated.
 */
router.get("/profile", employeeController.getProfile);
router.put("/profile", employeeController.updateProfile);

/**
 * @swagger
 * /employee/profile/change-password:
 *   post:
 *     summary: Update employee password
 *     tags: [Employee - Profile]
 *     responses:
 *       200:
 *         description: Password updated.
 */
router.post("/profile/change-password", employeeController.changePassword);

/**
 * @swagger
 * /employee/profile/sessions/{sessionId}:
 *   delete:
 *     summary: Terminate an active device session
 *     tags: [Employee - Profile]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session terminated.
 */
router.delete("/profile/sessions/:sessionId", employeeController.terminateSession);

module.exports = router;
