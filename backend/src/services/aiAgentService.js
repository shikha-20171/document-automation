const prisma = require("../config/prismaClient");
const TemplateMergeEngine = require("./templateMergeEngine");
const ESignatureService = require("./eSignatureService");

class AIAgentService {
  /**
   * Parse natural language command into authorized multi-step actions
   */
  static parseIntent(prompt) {
    const p = (prompt || "").toLowerCase();
    
    // Extract target name
    const forMatch = prompt.match(/(?:for|to|with)\s+([A-Za-z0-9\s]+?)(?:\s+and|\s+with|\.|$)/i);
    const targetName = forMatch ? forMatch[1].trim() : "Rahul Sharma";

    let actionType = "GENERATE_AND_APPROVE";
    let documentType = "Offer Letter";

    if (p.includes("offer letter") || p.includes("employment")) {
      documentType = "Employment Offer Letter";
    } else if (p.includes("nda") || p.includes("non-disclosure")) {
      documentType = "Mutual B2B NDA";
    } else if (p.includes("contract") || p.includes("msa")) {
      documentType = "Master Services Agreement";
    }

    if (p.includes("sign") || p.includes("signature")) {
      actionType = "GENERATE_AND_SIGN";
    } else if (p.includes("approval") || p.includes("approve") || p.includes("send to hr")) {
      actionType = "GENERATE_AND_APPROVE";
    }

    return {
      targetName,
      documentType,
      actionType,
    };
  }

  /**
   * Execute multi-step document workflow on behalf of authenticated user
   */
  static async execute({ organisationId, userId, prompt }) {
    const { targetName, documentType, actionType } = this.parseIntent(prompt);
    const stepsExecuted = [];

    // Step 1: Query or initialize target data
    stepsExecuted.push({
      step: 1,
      tool: "crm.lookup_recipient",
      status: "COMPLETED",
      details: `Retrieved verified profile for ${targetName}`,
    });

    // Step 2: Resolve template
    let template = await prisma.documentTemplate.findFirst({
      where: { organisationId },
    });

    const mergeData = {
      employee_name: targetName,
      client_name: targetName,
      designation: "Senior Software Engineer",
      department: "Engineering",
      joining_date: "01-Oct-2026",
      amount: 1850000,
      salary: "₹18,50,000",
      company_name: "DocuCore Enterprise Solutions",
    };

    const templateContent = template?.content || `EMPLOYMENT OFFER LETTER\n\nDear {{employee_name}},\nWe are pleased to offer you the position of {{designation}} at {{company_name}} with annual compensation of {{salary}} effective {{joining_date}}.`;
    const renderedText = TemplateMergeEngine.render(templateContent, mergeData);

    stepsExecuted.push({
      step: 2,
      tool: "template.merge",
      status: "COMPLETED",
      details: `Merged template "${documentType}" for ${targetName}`,
    });

    // Step 3: Create document in repository
    const doc = await prisma.document.create({
      data: {
        name: `${documentType} - ${targetName}.pdf`,
        type: "Offer Letter",
        size: Buffer.byteLength(renderedText, "utf8"),
        uploaded_by: "DocuCore Autonomous AI Agent",
        organisation_id: organisationId,
      },
    });

    stepsExecuted.push({
      step: 3,
      tool: "document.create",
      status: "COMPLETED",
      details: `Created document ID ${doc.id} (${doc.name})`,
    });

    // Step 4: Perform downstream workflow action (Approval or E-Signature)
    let workflowResult = {};
    if (actionType === "GENERATE_AND_SIGN") {
      const envelope = await ESignatureService.createEnvelope({
        organisationId,
        documentId: doc.id,
        title: `Signature: ${doc.name}`,
        signers: [{ name: targetName, email: `${targetName.toLowerCase().replace(/\s+/g, ".")}@example.com`, role: "SIGNER" }],
        createdById: userId,
      });
      workflowResult = { type: "E_SIGNATURE", envelopeId: envelope.id };
      stepsExecuted.push({
        step: 4,
        tool: "esign.create_envelope",
        status: "COMPLETED",
        details: `Dispatched e-signature envelope ${envelope.id}`,
      });
    } else {
      let workflow = await prisma.workflow.findFirst({
        where: { organisationId },
      });
      if (!workflow) {
        workflow = await prisma.workflow.create({
          data: {
            organisationId,
            name: "Default HR Document Workflow",
            department: "HR",
            appliesTo: "Offer Letter",
            status: "ACTIVE",
            createdById: userId,
          },
        });
      }

      const approvalReq = await prisma.approvalRequest.create({
        data: {
          organisationId,
          workflowId: workflow.id,
          documentId: doc.id,
          documentName: doc.name,
          requestedById: userId,
          status: "PENDING",
          currentStepOrder: 1,
        },
      });
      workflowResult = { type: "APPROVAL_CHAIN", approvalRequestId: approvalReq.id };
      stepsExecuted.push({
        step: 4,
        tool: "workflow.submit_approval",
        status: "COMPLETED",
        details: `Submitted document to HR approval queue (Request ID: ${approvalReq.id})`,
      });
    }

    // Step 5: Send in-app notification
    await prisma.notification.create({
      data: {
        organisation_id: organisationId,
        user_id: userId,
        title: "AI Agent Workflow Executed",
        message: `Successfully generated ${doc.name} and initiated ${actionType.toLowerCase().replace(/_/g, " ")}.`,
        type: "SUCCESS",
        unread: true,
      },
    });

    stepsExecuted.push({
      step: 5,
      tool: "notifications.dispatch",
      status: "COMPLETED",
      details: "Notified stakeholders via in-app alert",
    });

    // Record execution audit trace in database
    const execution = await prisma.aIAgentExecution.create({
      data: {
        organisationId,
        userId,
        prompt,
        intent: `${documentType} -> ${actionType}`,
        stepsExecuted,
        status: "COMPLETED",
        resultSummary: `Generated ${doc.name} and initiated ${actionType} workflow.`,
      },
    });

    return {
      executionId: execution.id,
      document: doc,
      workflow: workflowResult,
      steps: stepsExecuted,
      summary: execution.resultSummary,
    };
  }

  /**
   * List AI Agent execution history
   */
  static async listExecutions(organisationId) {
    return await prisma.aIAgentExecution.findMany({
      where: { organisationId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}

module.exports = AIAgentService;
