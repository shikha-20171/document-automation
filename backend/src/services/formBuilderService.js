const prisma = require("../config/prismaClient");
const TemplateMergeEngine = require("./templateMergeEngine");
const ESignatureService = require("./eSignatureService");

class FormBuilderService {
  /**
   * Create an Automation Form with custom field schemas and conditional logic
   */
  static async createForm(organisationId, { templateId, title, description, fields, submitAction, createdById }) {
    return await prisma.automationForm.create({
      data: {
        organisationId,
        templateId,
        title,
        description,
        fields: fields || [],
        submitAction: submitAction || { generateDocument: true, workflow: "NONE" },
        createdById,
        status: "ACTIVE",
      },
    });
  }

  static async listForms(organisationId) {
    return await prisma.automationForm.findMany({
      where: { organisationId },
      include: { _count: { select: { submissions: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getFormById(id, organisationId) {
    return await prisma.automationForm.findFirst({
      where: { id, organisationId },
      include: { submissions: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
  }

  /**
   * Process Form Submission -> Template Merge -> Document -> Workflow / E-Sign
   */
  static async submitForm({ formId, organisationId, submittedData, userId }) {
    const form = await prisma.automationForm.findFirst({
      where: { id: formId, organisationId },
    });

    if (!form) {
      throw new Error("Automation form not found for organisation.");
    }

    // Resolve template
    let template = null;
    if (form.templateId) {
      template = await prisma.documentTemplate.findFirst({
        where: { id: form.templateId, organisationId },
      });
    }

    const templateContent = template?.content || `FORM SUBMISSION RECORD: ${form.title}\n\nSubmitted Data:\n{{#each fields}} - {{label}}: {{value}}\n{{/each}}\nTimestamp: {{submitted_at}}`;
    
    // Prepare render payload
    const renderPayload = {
      ...submittedData,
      form_title: form.title,
      submitted_at: new Date().toISOString(),
      fields: Object.entries(submittedData).map(([k, v]) => ({ label: k, value: String(v) })),
    };

    const rendered = TemplateMergeEngine.render(templateContent, renderPayload);
    const entityName = submittedData.company_name || submittedData.client_name || submittedData.name || `Submission_${Date.now()}`;
    const docName = `${form.title} - ${entityName}.pdf`;

    const doc = await prisma.document.create({
      data: {
        name: docName,
        type: "Form Submission",
        size: Buffer.byteLength(rendered, "utf8"),
        uploaded_by: "DocuCore Form Engine",
        organisation_id: organisationId,
      },
    });

    // Record submission
    const submission = await prisma.automationFormSubmission.create({
      data: {
        formId: form.id,
        organisationId,
        submittedData,
        generatedDocumentId: doc.id,
        status: "PROCESSED",
      },
    });

    // Execute downstream trigger if configured
    const submitAction = form.submitAction || {};
    let downstreamResult = null;

    if (submitAction.workflow === "ESIGN" || submittedData.requiresSignature) {
      const envelope = await ESignatureService.createEnvelope({
        organisationId,
        documentId: doc.id,
        title: `Signature: ${doc.name}`,
        signers: [
          {
            name: submittedData.signerName || submittedData.name || "Form Signer",
            email: submittedData.signerEmail || submittedData.email || "signer@example.com",
            role: "SIGNER",
            order: 1,
          },
        ],
        createdById: userId,
      });
      downstreamResult = { type: "ESIGN", envelopeId: envelope.id };
    }

    return {
      submissionId: submission.id,
      document: doc,
      downstream: downstreamResult,
    };
  }
}

module.exports = FormBuilderService;
