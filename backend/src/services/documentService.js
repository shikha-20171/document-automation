const prisma = require("../config/prismaClient");
const { documentRepository } = require("../repositories");
const { extractTextFromBuffer } = require("./ocrService");

/**
 * Document Service
 * Handles document upload, OCR extraction, metadata processing, and queries
 */

const documentService = {
  /**
   * Upload and process a new document
   */
  async uploadDocument({ file, organisationId, uploadedBy, name, type }) {
    if (!file) {
      throw new Error("No file provided for upload.");
    }

    const docName = name || file.originalname || "Untitled Document";
    const docType = type || file.mimetype || "application/octet-stream";
    const sizeInMB = Number((file.size / (1024 * 1024)).toFixed(3));

    // 1. Create document record in database
    const document = await documentRepository.create({
      organisation_id: Number(organisationId),
      name: docName,
      type: docType,
      size: sizeInMB,
      uploaded_by: uploadedBy || "User",
    });

    // 2. Perform OCR / text extraction asynchronously or inline
    let ocrResult = { text: "", confidence: 1.0, pageCount: 1, method: "NONE" };
    try {
      ocrResult = await extractTextFromBuffer(file);
    } catch (err) {
      console.warn("OCR extraction warning for document:", err.message);
    }

    // 3. Update organisation storage usage
    try {
      const orgUsage = await prisma.organisationStorageUsage.findUnique({
        where: { organisationId: Number(organisationId) },
      });

      if (orgUsage) {
        await prisma.organisationStorageUsage.update({
          where: { organisationId: Number(organisationId) },
          data: {
            usedStorageBytes: { increment: BigInt(file.size) },
            usedStorageGB: Number(((Number(orgUsage.usedStorageBytes) + file.size) / (1024 * 1024 * 1024)).toFixed(3)),
            totalFiles: { increment: 1 },
          },
        });
      }
    } catch (e) {
      // Non-blocking storage update
    }

    return {
      document,
      ocr: ocrResult,
    };
  },

  /**
   * Get all documents with pagination and filtering
   */
  async getDocuments(params) {
    return await documentRepository.findMany(params);
  },

  /**
   * Get document by ID
   */
  async getDocumentById(id) {
    const doc = await documentRepository.findById(id);
    if (!doc) {
      throw new Error("Document not found.");
    }
    return doc;
  },

  /**
   * Delete document
   */
  async deleteDocument(id, organisationId) {
    const doc = await documentRepository.findById(id);
    if (!doc) {
      throw new Error("Document not found.");
    }

    if (organisationId && doc.organisation_id !== Number(organisationId)) {
      throw new Error("Unauthorized to delete this document.");
    }

    await documentRepository.deleteDocument(id);

    return {
      success: true,
      message: "Document deleted successfully.",
    };
  },

  /**
   * Get storage statistics
   */
  async getStorageStats(organisationId) {
    return await documentRepository.getTotalStorageUsage(organisationId);
  },
};

module.exports = documentService;
