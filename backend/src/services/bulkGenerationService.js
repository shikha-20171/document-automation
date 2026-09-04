const prisma = require("../config/prismaClient");
const TemplateMergeEngine = require("./templateMergeEngine");
const s3Storage = require("../utils/s3Storage");

class BulkGenerationService {
  /**
   * Parse CSV string to JSON array of objects
   */
  static parseCsv(csvText) {
    if (!csvText || typeof csvText !== "string") return [];
    const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
      const record = {};
      headers.forEach((h, idx) => {
        record[h] = values[idx] !== undefined ? values[idx] : "";
      });
      records.push(record);
    }
    return records;
  }

  /**
   * Create and execute bulk generation job
   */
  static async startBulkJob({ organisationId, templateId, records, createdById }) {
    const template = await prisma.documentTemplate.findFirst({
      where: { id: templateId, organisationId },
    });

    if (!template) {
      throw new Error("Document template not found for this organisation.");
    }

    const job = await prisma.bulkGenerationJob.create({
      data: {
        organisationId,
        templateId: template.id,
        templateName: template.name,
        totalRecords: records.length,
        status: "PROCESSING",
        createdById,
      },
    });

    // Execute batch processing synchronously or asynchronously
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < records.length; i++) {
      const recordData = records[i];
      try {
        const renderedContent = TemplateMergeEngine.render(template.content, recordData);
        const docName = `${template.name} - ${recordData.client_name || recordData.name || recordData.employee_name || `Record ${i + 1}`}.pdf`;

        // Save generated document in Document repository
        const doc = await prisma.document.create({
          data: {
            name: docName,
            type: template.documentType || "Contract",
            size: Buffer.byteLength(renderedContent, "utf8"),
            uploaded_by: "DocuCore Bulk Engine",
            organisation_id: organisationId,
          },
        });

        // Record in bulk records table
        await prisma.bulkGenerationRecord.create({
          data: {
            jobId: job.id,
            recordIndex: i + 1,
            documentId: doc.id,
            documentName: docName,
            status: "SUCCESS",
          },
        });

        successCount++;
      } catch (recErr) {
        failCount++;
        await prisma.bulkGenerationRecord.create({
          data: {
            jobId: job.id,
            recordIndex: i + 1,
            status: "FAILED",
            errorMessage: recErr.message,
          },
        });
      }
    }

    // Finalize job status
    const updatedJob = await prisma.bulkGenerationJob.update({
      where: { id: job.id },
      data: {
        processedRecords: records.length,
        successfulRecords: successCount,
        failedRecords: failCount,
        status: failCount === 0 ? "COMPLETED" : successCount > 0 ? "PARTIALLY_COMPLETED" : "FAILED",
        downloadUrl: `/api/bulk-generation/jobs/${job.id}/export`,
      },
      include: { records: true },
    });

    return updatedJob;
  }

  /**
   * Get single job status and statistics
   */
  static async getJobStatus(jobId, organisationId) {
    const job = await prisma.bulkGenerationJob.findFirst({
      where: { id: jobId, organisationId },
      include: {
        records: {
          take: 100,
          orderBy: { recordIndex: "asc" },
        },
      },
    });
    return job;
  }

  /**
   * List all bulk jobs for an organisation
   */
  static async listJobs(organisationId) {
    return await prisma.bulkGenerationJob.findMany({
      where: { organisationId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}

module.exports = BulkGenerationService;
