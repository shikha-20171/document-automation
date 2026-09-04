const prisma = require("../config/prismaClient");

const getAuthContext = (req) => {
  const orgId = req.user?.organisation_id || req.user?.organization_id || req.user?.organisationId || 1;
  const userId = req.user?.id || req.user?.userId || "user-1";
  const userRole = req.user?.role || "EMPLOYEE";
  const userName = req.user?.name || req.user?.email || "User";
  const department = req.user?.department || req.user?.department_name || "General";
  const team = req.user?.team || req.user?.team_name || "General Team";

  return {
    organisationId: Number(orgId) || 1,
    userId: String(userId),
    userRole,
    userName,
    department,
    team,
  };
};

const aiDocumentService = {
  /**
   * Save AI generated content as a formal document
   */
  async saveAiContentAsDocument(req) {
    const context = getAuthContext(req);
    const {
      title,
      documentTitle,
      content,
      documentType = "General Document",
      type,
      departmentId,
      departmentName,
      teamId,
      teamName,
      folder = "AI Documents",
      tags = [],
      status = "DRAFT",
      aiMetadata = {},
    } = req.body;

    const rawTitle = (title || documentTitle || "AI_Generated_Document").trim();
    const finalDocName = rawTitle.endsWith(".pdf") || rawTitle.endsWith(".docx") ? rawTitle : `${rawTitle}.pdf`;
    const docType = type || documentType;
    const assignedDept = departmentName || context.department;
    const assignedTeam = teamName || context.team;

    const contentSize = content ? Buffer.byteLength(String(content), "utf8") : 145000;

    // 1. Create persistent Document record
    const doc = await prisma.document.create({
      data: {
        name: finalDocName,
        type: docType,
        size: Math.max(1024, contentSize),
        uploaded_by: `${context.userName} (${context.userRole})`,
        organisation_id: context.organisationId,
      },
    });

    // 2. Record Activity Log for Audit
    await prisma.activityLog.create({
      data: {
        organisation_id: context.organisationId,
        action: "AI_DOCUMENT_SAVED",
        user: context.userName,
        details: `Saved AI Generated Document: "${finalDocName}" (Type: ${docType}, Dept: ${assignedDept}, AI Provider: ${aiMetadata?.provider || "Gemini"})`,
      },
    }).catch(() => null);

    // 3. Record in Department AI Vault
    await prisma.departmentAiToolRun.create({
      data: {
        organisation_id: context.organisationId,
        department_name: assignedDept,
        tool: "SAVED_AI_DOCUMENT",
        title: rawTitle,
        input: {
          documentType: docType,
          folder,
          tags,
          status,
          department: assignedDept,
          team: assignedTeam,
          aiMetadata,
        },
        output: {
          documentId: doc.id,
          fileName: doc.name,
          savedAt: new Date().toISOString(),
          contentPreview: content ? String(content).slice(0, 300) : "",
        },
        status: status === "DRAFT" ? "DRAFT" : "COMPLETED",
      },
    }).catch(() => null);

    return {
      success: true,
      message: `Document "${finalDocName}" successfully saved to ${assignedDept} vault!`,
      data: {
        id: doc.id,
        name: doc.name,
        type: doc.type,
        department: assignedDept,
        team: assignedTeam,
        folder,
        tags,
        status,
        size: doc.size,
        uploaded_by: doc.uploaded_by,
        isAiGenerated: true,
        aiProvider: aiMetadata?.provider || "Google Gemini",
        aiModel: aiMetadata?.model || "Gemini 3.6 Flash",
        createdAt: doc.created_at,
      },
    };
  },
};

module.exports = aiDocumentService;
