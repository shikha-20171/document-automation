const DocumentSearchService = require("../services/documentSearchService");

const getAuthContext = (req) => ({
  organisationId: req.user?.organisation_id || req.user?.organization_id || 1,
  userId: req.user?.id || 1,
  userName: req.user?.full_name || req.user?.name || "User",
});

const searchDocuments = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const results = await DocumentSearchService.searchDocuments(organisationId, req.query);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { organisationId, userId, userName } = getAuthContext(req);
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: "Comment content is required." });
    }

    const comment = await DocumentSearchService.addComment({
      documentId: req.params.id,
      organisationId,
      userId,
      authorName: userName,
      content,
    });

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const comments = await DocumentSearchService.getComments(req.params.id, organisationId);
    res.json({ success: true, data: comments });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  searchDocuments,
  addComment,
  getComments,
};
