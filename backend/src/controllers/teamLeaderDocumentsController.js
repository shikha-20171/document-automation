const teamLeaderService = require("../services/teamLeaderService");

const getDocuments = async (req, res) => {
  try {
    const list = await teamLeaderService.getDocuments(req);
    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getDocumentDetail = async (req, res) => {
  try {
    const doc = await teamLeaderService.getDocumentDetail(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found." });
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addDocumentComment = async (req, res) => {
  try {
    const comment = await teamLeaderService.addDocumentComment(req.params.id, req.body.text);
    return res.status(201).json({ success: true, message: "Comment added successfully!", data: comment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateDocumentAction = async (req, res) => {
  try {
    const result = await teamLeaderService.updateDocumentAction(req.params.id, req.body.action);
    return res.status(200).json({ success: true, message: "Document action completed!", data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDocuments,
  getDocumentDetail,
  addDocumentComment,
  updateDocumentAction,
};
