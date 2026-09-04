const employeeService = require("../services/employeeService");

// 1. Dashboard
const getDashboardData = async (req, res) => {
  try {
    const data = await employeeService.getDashboardData(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Documents
const getDocuments = async (req, res) => {
  try {
    const data = await employeeService.getDocuments(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const doc = await employeeService.getDocumentById(req.params.id, req);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createDocument = async (req, res) => {
  try {
    const doc = await employeeService.createDocument(req);
    return res.status(201).json({ success: true, message: "Document created successfully!", data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateDocument = async (req, res) => {
  try {
    const doc = await employeeService.updateDocument(req.params.id, req);
    return res.status(200).json({ success: true, message: "Document updated successfully.", data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const submitDocumentForApproval = async (req, res) => {
  try {
    const doc = await employeeService.submitDocumentForApproval(req.params.id, req);
    return res.status(200).json({ success: true, message: "Document submitted for approval!", data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const result = await employeeService.deleteDocument(req.params.id, req);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const toggleArchiveDocument = async (req, res) => {
  try {
    const doc = await employeeService.toggleArchiveDocument(req.params.id);
    return res.status(200).json({
      success: true,
      message: doc.isArchived ? "Document archived." : "Document restored to active list.",
      data: doc,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Templates (Read-Only usage)
const getTemplates = async (req, res) => {
  try {
    const data = await employeeService.getTemplates(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTemplateById = async (req, res) => {
  try {
    const tmpl = await employeeService.getTemplateById(req.params.id);
    return res.status(200).json({ success: true, data: tmpl });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

const createTemplate = async (req, res) => {
  try {
    const tmpl = await employeeService.createTemplate(req.body, req);
    return res.status(201).json({ success: true, message: "Template created successfully!", data: tmpl });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const tmpl = await employeeService.updateTemplate(req.params.id, req.body, req);
    return res.status(200).json({ success: true, message: "Template updated successfully!", data: tmpl });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const duplicateTemplate = async (req, res) => {
  try {
    const tmpl = await employeeService.duplicateTemplate(req.params.id, req);
    return res.status(201).json({ success: true, message: "Template duplicated successfully!", data: tmpl });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const deleted = await employeeService.deleteTemplate(req.params.id, req);
    return res.status(200).json({ success: true, message: "Template deleted.", data: deleted });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const generateAiTemplate = async (req, res) => {
  try {
    const { prompt, category } = req.body;
    const aiDraft = await employeeService.generateAiTemplate(prompt, category, req);
    return res.status(200).json({ success: true, message: "AI Template drafted successfully!", data: aiDraft });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const generateDocumentFromTemplate = async (req, res) => {
  try {
    const { templateId, fieldValues, docName } = req.body;
    if (!templateId) {
      return res.status(400).json({ success: false, message: "Template ID is required." });
    }
    const doc = await employeeService.generateDocumentFromTemplate(templateId, fieldValues, docName, req);
    return res.status(201).json({ success: true, message: "Document generated successfully from template!", data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// 4. Tasks
const getTasks = async (req, res) => {
  try {
    const data = await employeeService.getTasks(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await employeeService.updateTaskStatus(req.params.id, status, req);
    return res.status(200).json({ success: true, message: `Task marked as ${status}.`, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addTaskComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Comment text is required." });
    const comment = await employeeService.addTaskComment(req.params.id, req.body, req);
    return res.status(201).json({ success: true, message: "Comment added.", data: comment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addTaskAttachment = async (req, res) => {
  try {
    const attachment = await employeeService.addTaskAttachment(req.params.id, req.body);
    return res.status(201).json({ success: true, message: "Attachment added to task.", data: attachment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Approvals
const getApprovals = async (req, res) => {
  try {
    const data = await employeeService.getApprovals(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resubmitApproval = async (req, res) => {
  try {
    const { content, notes } = req.body;
    const approval = await employeeService.resubmitApprovalRequest(req.params.id, content, notes, req);
    return res.status(200).json({ success: true, message: "Approval request resubmitted successfully!", data: approval });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. AI Tools
const runAiTool = async (req) => {
  // Helper for internal use if needed
};

const runAiToolAction = async (req, res) => {
  try {
    const result = await employeeService.runAiTool(req);
    return res.status(200).json({ success: true, message: "AI processing completed successfully.", data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Notifications
const getNotifications = async (req, res) => {
  try {
    const data = await employeeService.getNotifications(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const result = await employeeService.markNotificationRead(req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateNotificationPreferences = async (req, res) => {
  try {
    const prefs = await employeeService.updateNotificationPreferences(req);
    return res.status(200).json({ success: true, message: "Notification preferences updated.", data: prefs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Personal Reports
const getPersonalReports = async (req, res) => {
  try {
    const data = await employeeService.getPersonalReports(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Profile
const getProfile = async (req, res) => {
  try {
    const profile = await employeeService.getProfile(req);
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const profile = await employeeService.updateProfile(req);
    return res.status(200).json({ success: true, message: "Profile updated successfully.", data: profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const result = await employeeService.changePassword(req);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const terminateSession = async (req, res) => {
  try {
    const result = await employeeService.terminateSession(req.params.sessionId);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const cancelApproval = async (req, res) => {
  try {
    const approval = await employeeService.cancelApprovalRequest(req.params.id, req);
    return res.status(200).json({ success: true, message: "Approval request cancelled.", data: approval });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const shareDocument = async (req, res) => {
  try {
    const { email, permission } = req.body;
    const result = await employeeService.shareDocument(req.params.id, email, permission, req);
    return res.status(200).json({ success: true, message: "Document access shared.", data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardData,
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  submitDocumentForApproval,
  deleteDocument,
  toggleArchiveDocument,
  shareDocument,
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  duplicateTemplate,
  deleteTemplate,
  generateAiTemplate,
  generateDocumentFromTemplate,
  getTasks,
  updateTaskStatus,
  addTaskComment,
  addTaskAttachment,
  getApprovals,
  resubmitApproval,
  cancelApproval,
  runAiToolAction,
  getNotifications,
  markNotificationRead,
  updateNotificationPreferences,
  getPersonalReports,
  getProfile,
  updateProfile,
  changePassword,
  terminateSession,
};


