const prisma = require("../config/prismaClient");

class DocumentSearchService {
  /**
   * Enterprise Multi-Attribute Document Search
   */
  static async searchDocuments(organisationId, { query, type, status, startDate, endDate, limit = 20 }) {
    const where = {
      organisation_id: organisationId,
    };

    if (type && type !== "ALL") {
      where.type = { contains: type, mode: "insensitive" };
    }

    if (query && query.trim()) {
      const q = query.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { type: { contains: q, mode: "insensitive" } },
        { uploaded_by: { contains: q, mode: "insensitive" } },
      ];
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) where.created_at.lte = new Date(endDate);
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: Number(limit) || 20,
      include: {
        approvalRequests: {
          select: { id: true, status: true, currentStepOrder: true },
          take: 1,
        },
      },
    });

    // Also search in document extractions (IDP structured data)
    let extractions = [];
    if (query && query.trim()) {
      extractions = await prisma.documentExtraction.findMany({
        where: {
          organisationId,
          OR: [
            { documentName: { contains: query.trim(), mode: "insensitive" } },
            { documentType: { contains: query.trim(), mode: "insensitive" } },
          ],
        },
        take: 10,
      });
    }

    return {
      totalFound: documents.length,
      documents,
      matchedExtractions: extractions,
    };
  }

  // ─── DOCUMENT COMMENTS & COLLABORATION ────────────────────────────────────
  static async addComment({ documentId, organisationId, userId, authorName, content }) {
    return await prisma.documentComment.create({
      data: {
        documentId: Number(documentId),
        organisationId,
        userId: userId ? Number(userId) : null,
        authorName: authorName || "User",
        content,
      },
    });
  }

  static async getComments(documentId, organisationId) {
    return await prisma.documentComment.findMany({
      where: { documentId: Number(documentId), organisationId },
      orderBy: { createdAt: "asc" },
    });
  }
}

module.exports = DocumentSearchService;
