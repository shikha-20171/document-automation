const prisma = require("../config/prismaClient");

let memoryCmsStore = {
  landing: {
    heroTitle: "Next-Gen AI Document Automation",
    heroSubtitle: "Extract, classify, summarize, and securely store multi-tenant enterprise documents with multi-model AI reasoning.",
    ctaText: "Get Started Free",
    announcementBanner: "🔥 Gemini 3.5 & Claude 3.5 Sonnet processing pipelines now live!",
  },
  faqs: [
    { id: "faq-1", question: "How does AI Document Automation ensure enterprise privacy?", answer: "All document text embeddings and API gateway tokens are encrypted in transit and at rest with tenant isolation." },
    { id: "faq-2", question: "Which OCR engines are supported?", answer: "Google Cloud Document AI, AWS Textract, and open-source Tesseract." },
    { id: "faq-3", question: "Can we configure custom tenant quotas?", answer: "Yes, Super Admins can set storage quotas, token limits, and OCR page limits per subscription tier." },
  ],
  announcements: [
    { id: "ann-1", title: "Enterprise High-Speed OCR V2 Released", date: "2026-08-30", status: "PUBLISHED" },
    { id: "ann-2", title: "Scheduled Database Maintenance Notice", date: "2026-09-05", status: "SCHEDULED" },
  ],
};

const getCmsData = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: memoryCmsStore,
    });
  } catch (error) {
    next(error);
  }
};

const updateCmsData = async (req, res, next) => {
  try {
    const { landing, faqs, announcements } = req.body;
    if (landing) memoryCmsStore.landing = { ...memoryCmsStore.landing, ...landing };
    if (faqs) memoryCmsStore.faqs = faqs;
    if (announcements) memoryCmsStore.announcements = announcements;

    return res.status(200).json({
      success: true,
      message: "CMS content updated successfully",
      data: memoryCmsStore,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCmsData,
  updateCmsData,
};
