const prisma = require("../../config/prismaClient");
const { decryptApiKey } = require("../../utils/aiEncryption");
const tesseractService = require("./tesseractService");
const googleDocumentAIService = require("./googleDocumentAIService");
const PlatformSettingsService = require("../platformSettingsService");

class OCRRouter {
  /**
   * Get active OCR Routing configuration via PlatformSettingsService (TTL-cached)
   * This ensures Super Admin config changes take effect within 60 seconds everywhere.
   */
  async getRoutingConfig() {
    // Use PlatformSettingsService which manages TTL cache and DB reads
    const config = await PlatformSettingsService.getOCRRoutingConfig();

    // If we need the actual DB record ID, fall back to direct DB
    if (!config.id) {
      try {
        const dbConfig = await prisma.oCRRoutingConfig.findFirst({ orderBy: { createdAt: "desc" } });
        if (dbConfig) return dbConfig;
        // Create default if missing
        return await prisma.oCRRoutingConfig.create({
          data: {
            primaryEngineCode: "TESSERACT",
            fallbackEngineCode: "TESSERACT",
            fallbackEnabled: true,
            defaultLanguage: "eng",
            autoRotate: true,
            deskew: true,
            denoise: true,
            enhanceImage: true,
            confidenceThreshold: 80.0,
            layoutDetection: true,
            tableDetection: true,
          },
        });
      } catch {
        return config;
      }
    }
    return config;
  }


  /**
   * Process document buffer through dynamic routing with automatic fallback
   */
  async processDocument({
    buffer,
    fileBuffer,
    mimeType = "application/pdf",
    language = "eng",
    documentId = null,
    organisationId = 1,
    userId = null,
  }) {
    const docBuffer = buffer || fileBuffer;
    const startTime = Date.now();
    const routingConfig = await this.getRoutingConfig();

    let primaryEngine = routingConfig.primaryEngineCode || "TESSERACT";
    let fallbackEngine = routingConfig.fallbackEngineCode || "TESSERACT";
    let fallbackEnabled = routingConfig.fallbackEnabled !== false;

    // Check if Google Document AI is requested as primary
    let googleProvider = null;
    if (primaryEngine === "GOOGLE_DOCUMENT_AI" || fallbackEngine === "GOOGLE_DOCUMENT_AI") {
      googleProvider = await prisma.oCRProvider.findFirst({
        where: {
          providerCode: { in: ["google_document_ai", "GOOGLE_DOCUMENT_AI"] },
        },
      });
    }

    let result = null;
    let selectedEngine = primaryEngine;
    let usedFallback = false;
    let errorMessage = null;

    // 1. Try Google Document AI if configured as primary
    if (primaryEngine === "GOOGLE_DOCUMENT_AI") {
      const isConfigured = Boolean(
        googleProvider &&
        googleProvider.status === "ACTIVE" &&
        googleProvider.projectId &&
        googleProvider.processorId &&
        googleProvider.credentialsEncrypted
      );

      if (isConfigured) {
        try {
          const decryptedCreds = decryptApiKey(googleProvider.credentialsEncrypted);
          result = await googleDocumentAIService.processDocument({
            buffer: docBuffer,
            mimeType,
            projectId: googleProvider.projectId,
            location: googleProvider.location || "us",
            processorId: googleProvider.processorId,
            credentials: decryptedCreds,
          });
          selectedEngine = "GOOGLE_DOCUMENT_AI";
        } catch (docAiErr) {
          console.warn("[OCRRouter] Google Document AI processing error:", docAiErr.message);
          errorMessage = docAiErr.message;
          if (fallbackEnabled) {
            usedFallback = true;
            console.log("[OCRRouter] Engaging automatic fallback to local Tesseract OCR...");
          } else {
            throw docAiErr;
          }
        }
      } else {
        console.warn("[OCRRouter] Google Document AI is not fully configured/active. Falling back to Tesseract.");
        usedFallback = true;
      }
    }

    // 2. Process with Tesseract if primary was Tesseract or Google Doc AI failed
    if (!result) {
      selectedEngine = "TESSERACT";
      result = await tesseractService.recognize(docBuffer, {
        language: language || routingConfig.defaultLanguage || "eng",
        autoRotate: routingConfig.autoRotate,
        deskew: routingConfig.deskew,
      });
    }

    const durationMs = Date.now() - startTime;

    // 3. Persist OCR Job and Metadata in PostgreSQL
    try {
      const orgIdStr = String(organisationId || 1);
      const jobCode = `OCR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Update provider lastUsedAt
      if (selectedEngine === "GOOGLE_DOCUMENT_AI" && googleProvider) {
        await prisma.oCRProvider.update({
          where: { id: googleProvider.id },
          data: { lastUsedAt: new Date() },
        }).catch(() => {});
      } else {
        const tessProv = await prisma.oCRProvider.findFirst({
          where: { providerCode: { in: ["tesseract", "TESSERACT"] } },
        });
        if (tessProv) {
          await prisma.oCRProvider.update({
            where: { id: tessProv.id },
            data: { lastUsedAt: new Date() },
          }).catch(() => {});
        }
      }

      // Record OCR Job
      await prisma.oCRJob.create({
        data: {
          jobCode,
          organisationId: orgIdStr,
          userId: userId ? String(userId) : null,
          documentId: documentId ? String(documentId) : null,
          language: language || routingConfig.defaultLanguage || "eng",
          pages: result.pageCount || 1,
          status: "COMPLETED",
          confidenceScore: Math.round((result.confidence || 0.95) * 100),
          processingTimeMs: durationMs,
          startedAt: new Date(startTime),
          completedAt: new Date(),
        },
      }).catch((e) => console.warn("[OCRRouter] OCRJob log error:", e.message));

      // Record OCR Log
      await prisma.oCRLog.create({
        data: {
          logCode: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          organisationId: orgIdStr,
          userId: userId ? String(userId) : null,
          documentId: documentId ? String(documentId) : null,
          status: result.success ? "SUCCESS" : "FAILED",
          pages: result.pageCount || 1,
          processingTimeMs: durationMs,
          confidence: (result.confidence || 0.95) * 100,
          errorMessage: errorMessage || null,
        },
      }).catch((e) => console.warn("[OCRRouter] OCRLog error:", e.message));
    } catch (logErr) {
      console.warn("[OCRRouter] Logging non-fatal error:", logErr.message);
    }

    return {
      success: true,
      text: result.text || "",
      pageCount: result.pageCount || 1,
      confidence: result.confidence || 0.95,
      engine: selectedEngine,
      engineUsed: selectedEngine,
      status: result.success ? "SUCCESS" : "FAILED",
      usedFallback,
      fallbackUsed: usedFallback,
      processingDurationMs: durationMs,
      durationMs,
      entities: result.entities || [],
    };
  }
}

module.exports = new OCRRouter();
