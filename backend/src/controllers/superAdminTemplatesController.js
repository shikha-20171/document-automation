const prisma = require("../config/prismaClient");

const getAllTemplates = async (req, res, next) => {
  try {
    const templates = await prisma.documentTemplate.findMany({
      include: {
        organisation: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        fields: true,
      },
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    return res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

const getTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await prisma.documentTemplate.findUnique({
      where: { id: String(id) },
      include: {
        organisation: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        fields: true,
        versions: { orderBy: { version: "desc" } },
      },
    });

    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    return res.status(200).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const { name, description, category, documentType, content, organisationId } = req.body;
    const userId = Number(req.user?.id || req.user?.userId || 1);

    let orgId = Number(organisationId);
    if (!orgId) {
      const firstOrg = await prisma.organisation.findFirst();
      orgId = firstOrg ? firstOrg.id : 1;
    }

    const template = await prisma.documentTemplate.create({
      data: {
        name: name || "Global Blueprint Template",
        description: description || null,
        category: category || "GENERAL",
        documentType: documentType || "DOCUMENT",
        content: content || "<h1>Template Document</h1><p>Content goes here...</p>",
        status: "ACTIVE",
        organisationId: orgId,
        createdById: userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, category, documentType, content, status } = req.body;
    const userId = Number(req.user?.id || req.user?.userId || 1);

    const template = await prisma.documentTemplate.update({
      where: { id: String(id) },
      data: {
        name,
        description,
        category,
        documentType,
        content,
        status,
        updatedById: userId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.documentTemplate.delete({ where: { id: String(id) } });
    return res.status(200).json({ success: true, message: "Template deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
