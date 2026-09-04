const departmentManagerService = require("../services/departmentManagerService");

const getDocuments = async (req, res) => {
  try {
    const data = await departmentManagerService.getDocuments(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const doc = await departmentManagerService.getDocumentById(req.params.id, req);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found." });
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createDocument = async (req, res) => {
  try {
    const doc = await departmentManagerService.createDocument(req);
    return res.status(201).json({ success: true, message: "Document created successfully!", data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateDocument = async (req, res) => {
  try {
    const updated = await departmentManagerService.updateDocument(req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Document updated successfully.", data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    await departmentManagerService.deleteDocument(req.params.id);
    return res.status(200).json({ success: true, message: "Document deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const bulkDocumentAction = async (req, res) => {
  try {
    const { action, documentIds = [] } = req.body;
    await departmentManagerService.bulkDocumentAction(action, documentIds);
    return res.status(200).json({ success: true, message: `Bulk ${action.toLowerCase()} executed.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  bulkDocumentAction,
};
