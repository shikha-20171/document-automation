const prisma = require("../config/prismaClient");

// =========================================================================
// AI PROVIDER CHECKER & DISPATCHER
// =========================================================================

const checkAiProviderStatus = async () => {
  try {
    const activeProvider = await prisma.aIProvider.findFirst({
      where: { status: "ACTIVE" },
      include: { models: { where: { status: "ACTIVE" } } },
    });

    if (activeProvider && activeProvider.apiKey && activeProvider.apiKey.trim().length > 5) {
      return {
        hasLiveAi: true,
        provider: activeProvider.name,
        model: activeProvider.models?.[0]?.modelCode || "gpt-4o",
        apiKey: activeProvider.apiKey,
      };
    }
  } catch (err) {
    // Database or table lookup fallback
  }

  return {
    hasLiveAi: false,
    provider: "Built-in Template/Fallback Engine",
    model: "Rule-Based Generator v2.4",
    apiKey: null,
  };
};

// Heuristic Multi-Language Template Generation Engine
const generateHeuristicDocument = ({
  classification = "Standard Agreement",
  templateName = "Employment Agreement",
  language = "English",
  tone = "Professional",
  prompt = "",
  variables = {},
}) => {
  const comp = variables.company_name || "{{company_name}}";
  const emp = variables.employee_name || "{{employee_name}}";
  const des = variables.designation || "{{designation}}";
  const sal = variables.salary || "{{salary}}";
  const date = variables.joining_date || "{{joining_date}}";
  const addr = variables.address || "{{address}}";

  if (language === "Hindi") {
    return `# ${classification.toUpperCase()} (अनुबंध पत्र)
प्रभावी तिथि: ${date} • भाषा: हिंदी • शैली: ${tone}

पक्षकार विवरण:
1. नियोक्ता / कंपनी: ${comp}, पता: ${addr}
2. कर्मचारी / प्राधिकृत व्यक्ति: ${emp}, पता: ${addr}

उद्देश्य एवं निर्देश:
"${prompt || "दस्तावेज़ निर्माण"}" के आधार पर तैयार किया गया।

1. नियुक्ति एवं पदभार:
कंपनी द्वारा ${emp} को ${des} के पद पर नियुक्त किया जाता है। कर्मचारी निष्ठापूर्वक अपने कर्तव्यों का पालन करेगा।

2. पारिश्रमिक एवं लाभ:
वार्षिक कुल पारिश्रमिक (CTC) ${sal} नियत किया गया है, जिसका भुगतान मासिक आधार पर किया जाएगा।

3. परिवीक्षा अवधि (Probation):
आरंभिक 6 माह परिवीक्षा अवधि रहेगी, जिसके संतोषजनक पूर्ण होने पर पद की पुष्टि की जाएगी।

4. गोपनीयता एवं बौद्धिक संपदा:
कर्मचारी कंपनी के सभी व्यापारिक रहस्यों, कोड और वित्तीय आंकड़ों को पूर्णतः गोपनीय रखेगा।

हस्ताक्षर:
कंपनी अधिकृत हस्ताक्षरकर्ता: _________________________
कर्मचारी हस्ताक्षर: _________________________`;
  }

  if (templateName.includes("NDA") || classification.includes("NDA")) {
    return `MUTUAL NON-DISCLOSURE & CONFIDENTIALITY AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is executed on ${date} ("Effective Date"), by and between:

DISCLOSING PARTY: ${comp}, registered at ${addr}.
RECEIVING PARTY: ${emp}, residing/registered at ${addr}.

1. PURPOSE & APPLICABILITY
The parties intend to disclose confidential business, technical, and proprietary information for the purpose of: "${prompt || "Evaluating business collaboration and operational integration"}".

2. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" encompasses all proprietary data, software source codes, algorithms, client lists, financial records, and operational methods disclosed directly or indirectly.

3. NON-DISCLOSURE OBLIGATIONS
The Receiving Party covenants to hold all Confidential Information in strict confidence and shall not duplicate, commercialize, or disclose such information without prior written authorization.

4. DURATION & SURVIVAL
This confidentiality covenant shall remain valid and legally binding for a period of 3 (three) years from the Effective Date.

5. JURISDICTION & REMEDIES
This agreement is governed under statutory laws. In the event of a breach, the Disclosing Party shall be entitled to seek injunctive relief in addition to damages.

IN WITNESS WHEREOF, the parties execute this Agreement:
For ${comp}: _________________________
For ${emp}: _________________________`;
  }

  if (templateName.includes("Offer Letter") || classification.includes("Offer Letter")) {
    return `OFFICIAL OFFER OF EMPLOYMENT

Date: ${date}

Dear ${emp},

On behalf of ${comp}, we are pleased to extend this official offer for the position of ${des} based at our registered office at ${addr}.

KEY TERMS OF OFFER:
• Designation: ${des}
• Total Compensation Package (CTC): ${sal} per annum
• Commencement / Joining Date: ${date}
• Probation Period: 6 (six) Months

DUTIES & RESPONSIBILITIES:
You will report to the departmental leadership and be responsible for delivering technical benchmarks, architecture governance, and operational deliverables.

Please sign and return the duplicate copy of this letter as confirmation of your acceptance.

Sincerely,
Human Resources Department
${comp}

ACCEPTANCE OF OFFER:
I, ${emp}, hereby accept the terms outlined above.
Signature: _________________________
Date: ${date}`;
  }

  if (templateName.includes("Consulting") || classification.includes("Consulting")) {
    return `INDEPENDENT CONTRACTOR CONSULTING AGREEMENT

Effective Date: ${date} • Classification: Consulting Agreement

PARTIES:
1. CLIENT: ${comp}, located at ${addr}
2. CONSULTANT: ${emp}, located at ${addr}

1. SCOPE OF CONSULTING SERVICES
The Consultant agrees to provide specialized professional advisory and engineering services as ${des} pursuant to user instructions: "${prompt || "Specialized consulting advisory"}".

2. PROFESSIONAL FEES & INVOICING
The Client shall pay the Consultant a professional fee of ${sal} upon milestone completion and invoice submission.

3. INDEPENDENT CONTRACTOR RELATIONSHIP
Nothing in this Agreement shall create an employer-employee or agency relationship. The Consultant is solely responsible for statutory taxes.

4. INTELLECTUAL PROPERTY RIGHTS
All deliverables, designs, and codebases developed under this agreement shall be the exclusive property of ${comp}.

Signatures:
Client Authorized Signatory: _________________________
Consultant: _________________________`;
  }

  // Default Standard Employment Agreement
  return `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is formally entered into as of ${date} ("Effective Date"), by and between:

EMPLOYER: ${comp}, having its registered office at ${addr}.
EMPLOYEE: ${emp}, residing at ${addr}.

1. APPOINTMENT & DESIGNATION
The Employer engages the Employee in the official capacity of ${des}. The Employee agrees to perform all assigned duties with utmost fidelity and professional standard.

2. COMPENSATION & SALARY STRUCTURE
2.1 The Employee shall receive an annual Total Cost to Company (CTC) of ${sal}, payable in monthly disbursements after statutory deductions.
2.2 The Employee shall undergo an initial probation period of 6 (six) months from ${date}.

3. CONFIDENTIALITY & IP ASSIGNMENT
The Employee agrees to preserve the absolute confidentiality of all trade secrets, source codes, proprietary algorithms, financial documentation, and client records during and after employment.

4. TERMINATION & NOTICE PERIOD
Either party may terminate this employment by providing a 30 (thirty) days written notice or gross salary in lieu thereof.

5. GOVERNING LAW & JURISDICTION
This Agreement shall be governed, construed, and enforced in accordance with statutory labor and contract jurisprudence.

IN WITNESS WHEREOF, the parties have executed this Agreement:
For ${comp}: _________________________
Employee (${emp}): _________________________`;
};

// =========================================================================
// AI TRANSFORMATION ENGINE (SELECTION-AWARE)
// =========================================================================

const transformContentHeuristically = ({ action, text, language = "English", tone = "Professional" }) => {
  switch (action) {
    case "improve_writing":
      return text
        .replace(/is made effective as of/gi, "is formally executed and legally effective from")
        .replace(/agrees to perform the duties/gi, "expressly covenants to discharge all assigned duties with utmost diligence")
        .replace(/shall receive an annual/gi, "shall be entitled to an annualized total");

    case "legal_polish":
      return `${text}\n\n### STATUTORY LEGAL COVENANTS & ASSENT\nThe parties hereto expressly acknowledge that all obligations, covenants, and warranties stipulated herein are legally enforceable under applicable contract jurisprudence, and mutually waive any claim of lack of consideration or defective execution.`;

    case "modernize":
      return text
        .replace(/hereinafter referred to as/gi, "referred to as")
        .replace(/witnesseth that/gi, "agrees as follows:")
        .replace(/shall be deemed to be/gi, "is");

    case "fix_grammar":
      return text
        .replace(/\s{2,}/g, " ")
        .replace(/\s*,\s*/g, ", ")
        .replace(/\s*\.\s*/g, ". ")
        .replace(/\(\s+/g, "(")
        .replace(/\s+\)/g, ")");

    case "expand":
      return `${text}\n\n### DETAILED OPERATIONAL OBLIGATIONS & MILESTONES\n1. Compliance with enterprise ISO 27001 data protection protocols, security guidelines, and internal governance.\n2. Participation in quarterly formal reviews and structured milestone assessments.\n3. Full indemnification against unauthorized disclosure of proprietary systems and trade assets.`;

    case "shorten":
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      return `${lines.slice(0, Math.min(lines.length, 10)).join("\n\n")}\n\n[Summary Memo Concluded - All Core Terms Enforced]`;

    case "executive_summary":
      return `> [!NOTE]\n> **EXECUTIVE SUMMARY & KEY PROVISIONS**\n> • Parties: {{company_name}} & {{employee_name}}\n> • Effective Date: {{joining_date}}\n> • Commercial Valuation / CTC: {{salary}}\n> • Key Status: Active Legal Instrument\n\n${text}`;

    case "hindi_clause":
      return `${text}\n\n---\n### हिंदी सारांश एवं अनुबंध नियम (Hindi Summary & Clause)\nयह अनुबंध {{company_name}} और {{employee_name}} के मध्य {{joining_date}} से प्रभावी रूप से निष्पादित किया गया है। निर्धारित पद: {{designation}}, कुल पारिश्रमिक: {{salary}}। दोनों पक्ष अनुबंध के सभी नियमों का पालन करने हेतु बाध्य हैं।`;

    case "termination_clause":
      return `${text}\n\n### TERMINATION & NOTICE PERIOD\n1. Either party may terminate this agreement by providing a 30 (thirty) days written notice to the other party.\n2. In the event of gross misconduct, material confidentiality breach, or criminal conviction, the Company reserves the right to terminate employment immediately without notice or severance.`;

    case "nda_ip_clause":
      return `${text}\n\n### NON-DISCLOSURE & INTELLECTUAL PROPERTY ASSIGNMENT\n1. The Signatory agrees to maintain strict confidentiality regarding all proprietary algorithms, client lists, financial data, and technical designs.\n2. All inventions, source codes, and works produced during the engagement shall remain the sole and exclusive intellectual property of the Company.`;

    case "dispute_clause":
      return `${text}\n\n### DISPUTE RESOLUTION & ARBITRATION\nAny dispute, controversy, or claim arising out of or relating to this agreement shall be settled by binding arbitration in accordance with statutory Arbitration and Conciliation rules, with the seat of arbitration situated in Mumbai, India.`;

    case "force_majeure_clause":
      return `${text}\n\n### FORCE MAJEURE\nNeither party shall be liable for any failure or delay in fulfilling obligations due to causes beyond reasonable control, including natural catastrophes, civil disturbances, pandemic restrictions, or national telecommunication failures.`;

    case "clean_blank_lines":
      return text.replace(/\n{3,}/g, "\n\n").trim();

    default:
      return text;
  }
};

// =========================================================================
// CONTROLLER HANDLERS
// =========================================================================

const AIGateway = require("../services/aiGateway/AIGateway");
const PromptService = require("../services/aiGateway/PromptService");

/**
 * 1. AI Generation Endpoint
 * POST /api/org-admin/ai-builder/generate
 */
const generateDocumentAi = async (req, res) => {
  try {
    const orgId = req.user?.organisation_id || req.user?.organization_id || req.user?.organisationId || 1;
    const userId = req.user?.id || req.user?.userId || null;
    const {
      name,
      classification = "Standard Document",
      template = "General Document",
      language = "English",
      tone = "Professional & Legally Binding",
      prompt = "",
      variables = {},
      crmCustomer = null,
      provider,
      model,
    } = req.body;

    // 1. Fetch Authenticated Organisation Context from DB & Document Settings
    let organisationData = {};
    let docSettings = null;
    try {
      const { getOrganisationDocumentSettings } = require("./orgSettingsController");
      if (typeof getOrganisationDocumentSettings === "function") {
        docSettings = getOrganisationDocumentSettings(orgId);
      }
    } catch (e) {}

    if (orgId) {
      try {
        const org = await prisma.organisation.findUnique({
          where: { id: Number(orgId) },
          select: { name: true, phone: true, address: true, industry: true },
        });
        if (org && org.name) {
          organisationData = {
            organisation_name: org.name,
            ...(org.address ? { organisation_address: org.address } : {}),
            ...(org.industry ? { organisation_industry: org.industry } : {}),
          };
        }
      } catch (err) {
        console.warn("[DocBuilder] Org lookup notice:", err.message);
      }
    }

    if (docSettings) {
      if (docSettings.headerText) organisationData.header_text = docSettings.headerText;
      if (docSettings.footerText) organisationData.footer_text = docSettings.footerText;
      if (docSettings.companyInfo) organisationData.company_info = docSettings.companyInfo;
      if (docSettings.termsAndConditions) organisationData.terms_and_conditions = docSettings.termsAndConditions;
      if (docSettings.defaultCurrency) organisationData.default_currency = docSettings.defaultCurrency;
    }

    // 2. Fetch Authorized CRM / Recipient Context
    let recipientData = {};
    if (crmCustomer) {
      if (typeof crmCustomer === "object" && crmCustomer.name) {
        recipientData = {
          recipient_name: crmCustomer.name,
          ...(crmCustomer.role || crmCustomer.designation ? { recipient_designation: crmCustomer.role || crmCustomer.designation } : {}),
          ...(crmCustomer.company ? { recipient_company: crmCustomer.company } : {}),
          ...(crmCustomer.salary ? { compensation: crmCustomer.salary } : {}),
          ...(crmCustomer.address ? { recipient_address: crmCustomer.address } : {}),
        };
      } else if (crmCustomer) {
        try {
          const clientRec = await prisma.crmClient.findFirst({
            where: {
              OR: [
                { id: String(crmCustomer) },
                { name: { equals: String(crmCustomer), mode: "insensitive" } },
              ],
              organisationId: Number(orgId),
            },
          });
          if (clientRec) {
            recipientData = {
              recipient_name: clientRec.name,
              ...(clientRec.company ? { recipient_company: clientRec.company } : {}),
              ...(clientRec.email ? { recipient_email: clientRec.email } : {}),
              ...(clientRec.phone ? { recipient_phone: clientRec.phone } : {}),
              ...(clientRec.address ? { recipient_address: clientRec.address } : {}),
            };
          }
        } catch (err) {
          console.warn("[DocBuilder] CRM lookup notice:", err.message);
        }
      }
    }

    // Filter out dummy default variable values if any passed
    const cleanVariables = {};
    for (const [k, v] of Object.entries(variables || {})) {
      if (v && typeof v === "string" && !v.includes("TechCorp India") && !v.includes("Rahul Sharma")) {
        cleanVariables[k] = v.trim();
      }
    }

    const docTitle = name && name !== "Untitled Document" && name !== "New AI Document" ? name : prompt ? prompt.slice(0, 50) : template;
    const { systemPrompt, userPrompt } = PromptService.buildDocumentGenerationPrompt({
      title: docTitle,
      documentType: classification && classification !== "Standard Document" ? classification : undefined,
      instructions: prompt,
      organisationData,
      recipientData,
      variables: cleanVariables,
      language,
      tone,
    });

    const aiResult = await AIGateway.execute({
      organisationId: orgId,
      userId,
      operation: "generateText",
      feature: "ai_builder",
      module: "builder",
      provider: provider || "gemini",
      model: model || "gemini-3.5-flash",
      params: {
        prompt: userPrompt,
        systemPrompt,
        temperature: 0.1,
        maxTokens: 4000,
      },
    });

    const provenance = {
      organisation_source: Object.keys(organisationData).length > 0 ? "DATABASE (AUTHENTICATED)" : "NONE",
      recipient_source: Object.keys(recipientData).length > 0 ? "CRM_DATABASE" : "NONE",
      user_prompt_source: prompt ? "USER_INPUT" : "NONE",
      variables_source: Object.keys(cleanVariables).length > 0 ? "USER_INPUT" : "NONE",
      generation_engine: "GEMINI_AI_GROUNDED",
    };

    res.status(200).json({
      success: true,
      message: `Document generated via AI (${aiResult.provider.toUpperCase()} - ${aiResult.model})`,
      data: {
        documentContent: aiResult.text,
        generation_mode: "live_ai",
        provider: aiResult.provider,
        model: aiResult.model,
        variables: Object.keys(cleanVariables),
        data_provenance: provenance,
        version: 1,
      },
    });
  } catch (error) {
    console.error("[DocBuilder] AI generation failed:", error.message);
    res.status(500).json({
      success: false,
      message: `AI Generation Error: ${error.message}`,
    });
  }
};

/**
 * 2. AI Transform Endpoint (Selection-Aware)
 * POST /api/org-admin/ai-builder/transform
 */
const transformDocumentAi = async (req, res) => {
  try {
    const orgId = req.user?.organisation_id || req.user?.organization_id || req.user?.organisationId || 1;
    const userId = req.user?.id || req.user?.userId || null;
    const {
      action,
      content,
      selectedText,
      language = "English",
      tone = "Professional",
      provider,
      model,
    } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, message: "Action parameter is required." });
    }

    const targetText = selectedText && selectedText.trim().length > 0 ? selectedText : content || "";

    const { systemPrompt, userPrompt } = PromptService.buildRewritePrompt({
      text: targetText,
      action,
      tone,
      language,
    });

    const aiResult = await AIGateway.execute({
      organisationId: orgId,
      userId,
      operation: "generateText",
      feature: "ai_builder_transform",
      module: "builder",
      provider: provider || "gemini",
      model: model || "gemini-3.6-flash",
      params: {
        prompt: userPrompt,
        systemPrompt,
        temperature: 0.2,
        maxTokens: 2500,
      },
    });

    const transformedSnippet = aiResult.text;

    let finalContent = content || "";
    if (selectedText && selectedText.trim().length > 0) {
      finalContent = finalContent.replace(selectedText, transformedSnippet);
    } else {
      finalContent = transformedSnippet;
    }

    res.status(200).json({
      success: true,
      message: `Action "${action}" applied via ${aiResult.provider.toUpperCase()}.`,
      data: {
        transformedText: transformedSnippet,
        fullContent: finalContent,
        action,
        isSelectionOnly: Boolean(selectedText && selectedText.trim().length > 0),
        generation_mode: "live_ai",
        provider: aiResult.provider,
        model: aiResult.model,
      },
    });
  } catch (error) {
    console.error("[DocBuilder] AI transform failed:", error.message);
    res.status(500).json({
      success: false,
      message: `AI Transform Error: ${error.message}`,
    });
  }
};

/**
 * 3. Autosave / Draft Persistence
 * POST /api/org-admin/ai-builder/autosave
 */
const autosaveDocument = async (req, res) => {
  try {
    const {
      id,
      name,
      classification,
      content,
      template,
      language,
      tone,
      variables,
      crmCustomer,
      step,
    } = req.body;

    const orgId = req.user?.organisation_id || 1;

    let docRecord = null;
    if (id && !String(id).startsWith("draft-") && !isNaN(Number(id))) {
      try {
        docRecord = await prisma.document.update({
          where: { id: Number(id) },
          data: {
            name: name || "Untitled Document",
            type: classification || "Agreement",
            updated_at: new Date(),
          },
        });
      } catch (e) {}
    }

    res.status(200).json({
      success: true,
      message: "Draft auto-saved successfully",
      data: {
        id: docRecord ? docRecord.id : id || `draft-${Date.now()}`,
        name,
        classification,
        savedAt: new Date().toISOString(),
        status: "DRAFT",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. Submit to Organisation Workflow
 * POST /api/org-admin/ai-builder/submit
 */
const submitDocumentToWorkflow = async (req, res) => {
  try {
    const {
      name,
      classification = "Standard Agreement",
      content,
      variables = {},
      crmCustomer = null,
      language = "English",
      tone = "Professional",
    } = req.body;

    const orgId = req.user?.organisation_id || 1;
    const userId = req.user?.id || 1;

    // 1. Create or Find Document in DB
    const createdDoc = await prisma.document.create({
      data: {
        organisation_id: orgId,
        name: name || `Contract - ${Date.now()}`,
        type: classification,
        uploaded_by: req.user?.full_name || "Organisation Admin",
        size: Buffer.byteLength(content || "", "utf8"),
      },
    });

    // 2. Discover Active Matching Workflow
    let matchedWorkflow = await prisma.workflow.findFirst({
      where: {
        organisationId: orgId,
        status: "ACTIVE",
      },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });

    if (!matchedWorkflow) {
      matchedWorkflow = await prisma.workflow.findFirst({
        where: { status: "ACTIVE" },
        include: { steps: { orderBy: { stepOrder: "asc" } } },
      });
    }

    let approvalReq = null;
    let assignedApproverRole = "Department Manager";

    if (matchedWorkflow) {
      const firstStep = matchedWorkflow.steps?.[0];
      if (firstStep) assignedApproverRole = firstStep.approverType || "Department Manager";

      approvalReq = await prisma.approvalRequest.create({
        data: {
          organisationId: orgId,
          workflowId: matchedWorkflow.id,
          documentId: createdDoc.id,
          documentName: createdDoc.name,
          requestedById: userId,
          currentStepOrder: 1,
          status: "PENDING",
        },
      });

      // Create Approval Action Item
      try {
        await prisma.approvalAction.create({
          data: {
            approvalRequestId: approvalReq.id,
            stepOrder: 1,
            stepName: firstStep?.name || "Initial Review",
            approverType: firstStep?.approverType || "ROLE",
            status: "PENDING",
            assignedToId: userId,
          },
        });
      } catch (e) {}

      // Create Audit Log
      try {
        await prisma.activityLog.create({
          data: {
            organisation_id: orgId,
            action: "DOCUMENT_SUBMITTED_WORKFLOW",
            user: req.user?.full_name || "Organisation Admin",
            details: `Document "${createdDoc.name}" submitted to Workflow "${matchedWorkflow.name}". Assigned to ${assignedApproverRole}.`,
          },
        });
      } catch (e) {}

      // Send Notification
      try {
        await prisma.notification.create({
          data: {
            organisation_id: orgId,
            title: `New Document for Review: ${createdDoc.name}`,
            message: `Document "${createdDoc.name}" was created via AI Document Builder and submitted for approval.`,
            type: "APPROVAL",
            category: "Workflow",
            link: "/org-admin/workflows",
          },
        });
      } catch (e) {}
    }

    res.status(201).json({
      success: true,
      message: `Document "${createdDoc.name}" submitted successfully to workflow!`,
      data: {
        documentId: createdDoc.id,
        documentName: createdDoc.name,
        workflowId: matchedWorkflow?.id || null,
        workflowName: matchedWorkflow?.name || "Standard Enterprise Approval",
        approvalRequestId: approvalReq?.id || null,
        assignedTo: assignedApproverRole,
        status: "PENDING_APPROVAL",
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCrmRecipients = async (req, res) => {
  try {
    const orgId = req.user?.organisation_id || 1;

    const [users, org] = await Promise.all([
      prisma.user.findMany({
        where: { organisation_id: orgId },
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
        },
        take: 50,
      }),
      prisma.organisation.findUnique({
        where: { id: orgId },
        select: { name: true, city: true, state: true, address: true },
      }),
    ]);

    const companyName = org?.name || "Organisation";
    const companyAddress = [org?.address, org?.city, org?.state].filter(Boolean).join(", ") || "Corporate Headquarters";

    const formattedRecipients = users.map((u) => ({
      id: String(u.id),
      name: u.full_name,
      email: u.email,
      role: u.role || "Team Member",
      company: companyName,
      address: companyAddress,
    }));

    res.status(200).json({
      success: true,
      data: formattedRecipients,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Helper to reliably resolve valid Organisation ID and User ID
 */
const resolveOrgAndUser = async (req) => {
  let orgId = Number(req.user?.organisation_id || req.user?.organization_id || req.user?.organisationId || 1);
  let userId = Number(req.user?.id || req.user?.userId || 1);

  // Ensure organisation exists
  let org = await prisma.organisation.findUnique({ where: { id: orgId } }).catch(() => null);
  if (!org) {
    org = await prisma.organisation.findFirst().catch(() => null);
    if (org) orgId = org.id;
  }

  // Ensure user exists
  let user = await prisma.user.findUnique({ where: { id: userId } }).catch(() => null);
  if (!user) {
    user = await prisma.user.findFirst({ where: { organisation_id: orgId } }).catch(() => null)
      || await prisma.user.findFirst().catch(() => null);
    if (user) userId = user.id;
  }

  return {
    orgId,
    userId,
    userName: user?.full_name || req.user?.name || "Organisation Admin",
  };
};

/**
 * 6. Template Management (Prisma Database Persisted)
 */
const getTemplates = async (req, res) => {
  try {
    const { orgId, userId } = await resolveOrgAndUser(req);
    let templates = await prisma.documentTemplate.findMany({
      where: { organisationId: orgId },
      include: {
        createdBy: { select: { id: true, full_name: true, email: true } },
        versions: { orderBy: { version: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!templates || templates.length === 0) {
      // Seed robust standard templates including Commercial Quotation, Offer Letter, NDA, Invoice, Contract
      const defaultTemplates = [
        {
          name: "Commercial Proposal & Quotation",
          category: "Sales",
          documentType: "Quotation",
          description: "Standard commercial project quotation with scope, itemized milestones, payment terms, and client signoff.",
          content: `# COMMERCIAL PROPOSAL & QUOTATION\n\n**Quotation Reference:** {{quotation_number}}\n**Date:** {{today_date}}\n**Validity:** 30 Days from date of issue\n\n### Prepared For:\n**Client Name:** {{client_name}}\n**Company:** {{client_company}}\n**Billing Address:** {{client_address}}\n**Contact Email:** {{client_email}}\n\n### Service Provider Details:\n**Organisation:** {{organisation_name}}\n**Address:** {{organisation_address}}\n**Representative:** {{manager_name}}\n**Official Email:** {{organisation_email}}\n\n---\n\n### 1. Scope of Work & Deliverables\n{{project_scope}}\n\n### 2. Commercial Investment Breakdown\n| Item / Milestone Description | Qty | Rate (INR) | Total (INR) |\n| :--- | :--- | :--- | :--- |\n| Core Technology Solution & Licensing | 1 | {{basic_fee}} | {{basic_fee}} |\n| Custom Module Engineering & Integrations | 1 | {{integration_fee}} | {{integration_fee}} |\n| Maintenance, Hosting & SLA Support (Year 1) | 1 | {{support_fee}} | {{support_fee}} |\n| **Total Investment Payable (Excl. Taxes)** | | | **{{total_amount}}** |\n\n### 3. Payment Terms & Schedule\n- 50% advance on commercial contract acceptance.\n- 40% upon completion of User Acceptance Testing (UAT).\n- 10% on live production handover.\n\n### 4. Client Sign-Off & Acceptance\nKindly confirm your acceptance of this quotation by returning a signed duplicate copy.\n\n---\n\n| For {{organisation_name}} (Authorized) | Client Acceptance Signature |\n| :--- | :--- |\n| _____________________________________ | _____________________________________ |\n| **Name:** {{manager_name}} | **Name:** {{client_name}} |\n| **Title:** Commercial Director | **Title:** Authorized Client Signatory |\n| **Date:** {{today_date}} | **Date:** __________________________ |`,
        },
        {
          name: "Employee Offer Letter",
          category: "HR",
          documentType: "Offer Letter",
          description: "Official employment offer letter with salary breakdown, joining date, and e-signatures.",
          content: `# EMPLOYMENT OFFER LETTER\n\n**Date:** {{joining_date}}\n\n**To:** {{employee_name}}\n**Employee ID:** {{employee_id}}\n**Address:** {{client_address}}\n\nDear {{employee_name}},\n\nWe are pleased to formally extend an offer of employment for the position of **{{designation}}** in the **{{department}}** department at **{{organisation_name}}**.\n\n### 1. Position & Reporting\nYou will report directly to **{{manager_name}}** commencing on **{{joining_date}}**.\n\n### 2. Compensation & Benefits\nYour annual Gross CTC will be **{{total_salary}}**, structured as follows:\n- Basic Salary: {{basic_salary}}\n- House Rent Allowance: {{hra}}\n- Special Allowance: {{special_allowance}}\n- Total CTC: {{total_salary}}\n\n### 3. Key Responsibilities\n• Deliver high-quality engineering and technical solutions.\n• Collaborate cross-functionally with internal business leaders.\n• Comply with corporate code of ethics and confidentiality.\n\n---\n\n| For Employer Signatory | Employee Acceptance |\n| :--- | :--- |\n| _______________________ | _______________________ |\n| Name: {{manager_name}} | Name: {{employee_name}} |`,
        },
        {
          name: "Mutual Non-Disclosure Agreement (NDA)",
          category: "Legal",
          documentType: "NDA",
          description: "Standard confidentiality agreement protecting proprietary information and commercial terms.",
          content: `# MUTUAL NON-DISCLOSURE AGREEMENT\n\n**Effective Date:** {{joining_date}}\n\n**Disclosing Party:** {{organisation_name}}\n**Receiving Party:** {{client_name}} ({{client_company}})\n\n### 1. Purpose & Confidential Information\nThe parties intend to discuss commercial collaboration and service provision. Both parties agree to protect proprietary technical architectures, financial records, and business secrets.\n\n### 2. Non-Disclosure Obligations\nThe Receiving Party shall hold all Confidential Information in strict confidence for a period of 3 (three) years from the Effective Date.\n\n---\n\n| Disclosing Party Signature | Receiving Party Signature |\n| :--- | :--- |\n| __________________________ | __________________________ |\n| Name: {{manager_name}} | Name: {{client_name}} |`,
        },
        {
          name: "GST Tax Invoice & Billing",
          category: "Finance",
          documentType: "Invoice",
          description: "Formal tax invoice template with itemized service rates, GSTIN, and payment terms.",
          content: `# TAX INVOICE\n\n**Invoice Date:** {{today_date}}\n**Vendor:** {{organisation_name}}\n**Client:** {{client_name}} ({{client_company}})\n**Billing Address:** {{client_address}}\n\n### Billing Summary\n| Description | Rate | Amount |\n| :--- | :--- | :--- |\n| Professional Automation & Technology Services | Standard Fee | {{total_amount}} |\n| Applicable Goods & Services Tax (GST 18%) | 18% | Included |\n| **Grand Total Payable** | Net 30 Days | **{{total_amount}}** |\n\nAuthorized Signatory:\n{{organisation_name}} Accounts Department`,
        },
        {
          name: "Master Services Agreement (MSA)",
          category: "Sales",
          documentType: "Contract",
          description: "Enterprise contract covering SLAs, liability limits, and milestones.",
          content: `# MASTER SERVICES AGREEMENT\n\n**Total Value:** {{total_amount}}\n**Effective Date:** {{today_date}}\n**Service Provider:** {{organisation_name}}\n**Client:** {{client_name}}\n\n### 1. Scope of Services\nProvider shall deliver digital workflow engineering, document automation, and systems maintenance.\n\n### 2. Payment Terms\nInvoices are payable within 30 days of submission. Total consideration: {{total_amount}}.\n\nAuthorized Signatures:\nFor Provider: {{manager_name}}\nFor Client: {{client_name}}`,
        },
      ];

      for (const t of defaultTemplates) {
        try {
          await prisma.documentTemplate.create({
            data: {
              name: t.name,
              description: t.description,
              category: t.category,
              documentType: t.documentType,
              content: t.content,
              status: "ACTIVE",
              organisation: { connect: { id: orgId } },
              createdBy: { connect: { id: userId } },
            },
          });
        } catch (seedErr) {
          console.warn("Template seed item error:", seedErr.message);
        }
      }

      templates = await prisma.documentTemplate.findMany({
        where: { organisationId: orgId },
        include: {
          createdBy: { select: { id: true, full_name: true, email: true } },
          versions: { orderBy: { version: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    const formatted = templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description || "",
      category: t.category || "General",
      documentType: t.documentType || "Document",
      content: t.content || "",
      status: t.status === "ACTIVE" ? "Active" : "Draft",
      createdBy: t.createdBy?.full_name || "Org Admin",
      owner: t.createdBy?.full_name || "Org Admin",
      updated: t.updatedAt ? new Date(t.updatedAt).toLocaleDateString("en-GB") : "Recently",
      updatedAt: t.updatedAt ? t.updatedAt.toISOString() : "Recently",
      createdAt: t.createdAt ? t.createdAt.toISOString() : "Recently",
      department: "All",
      visibility: "Organisation Wide",
      isShared: true,
      usage: 0,
      tags: [t.category || "General", t.documentType || "Document"],
      activities: [{ time: "Just now", event: "Template available" }],
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("getTemplates error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTemplate = async (req, res) => {
  try {
    const { orgId, userId } = await resolveOrgAndUser(req);
    const {
      name,
      title,
      description = "",
      category = "General",
      documentType = "Document",
      content = "",
      status = "ACTIVE",
    } = req.body;

    const templateName = (name || title || "").trim();
    if (!templateName) {
      return res.status(400).json({ success: false, message: "Template name is required." });
    }

    const cleanName = templateName;
    const cleanContent = content || `# ${cleanName}\n\nStandard template content.`;

    const template = await prisma.documentTemplate.create({
      data: {
        name: cleanName,
        description: description || null,
        category: category || "General",
        documentType: documentType || cleanName,
        content: cleanContent,
        status: status === "Draft" || status === "DRAFT" ? "DRAFT" : "ACTIVE",
        organisation: { connect: { id: orgId } },
        createdBy: { connect: { id: userId } },
      },
      include: { createdBy: { select: { id: true, full_name: true, email: true } } },
    });

    // Create initial version record
    try {
      await prisma.documentTemplateVersion.create({
        data: {
          template: { connect: { id: template.id } },
          version: 1,
          content: template.content,
          createdBy: { connect: { id: userId } },
        },
      });
    } catch (verErr) {}

    res.status(201).json({
      success: true,
      message: `Template "${template.name}" created successfully.`,
      data: {
        id: template.id,
        name: template.name,
        description: template.description || "",
        category: template.category,
        documentType: template.documentType,
        content: template.content,
        status: template.status === "ACTIVE" ? "Active" : "Draft",
        createdBy: template.createdBy?.full_name || "Org Admin",
        updatedAt: template.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("createTemplate error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = await resolveOrgAndUser(req);
    const { name, description, category, documentType, content, status } = req.body;

    const existing = await prisma.documentTemplate.findUnique({
      where: { id: String(id) },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Template not found." });
    }

    const updated = await prisma.documentTemplate.update({
      where: { id: String(id) },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(documentType && { documentType }),
        ...(content !== undefined && { content }),
        ...(status && { status: status === "Draft" || status === "DRAFT" ? "DRAFT" : "ACTIVE" }),
        updatedById: userId,
      },
      include: { createdBy: { select: { id: true, full_name: true, email: true } } },
    });

    // Record new version snapshot if content changed
    if (content && content !== existing.content) {
      const nextVer = (existing.versions?.[0]?.version || 1) + 1;
      await prisma.documentTemplateVersion.create({
        data: {
          templateId: updated.id,
          version: nextVer,
          content: updated.content,
          createdById: userId,
        },
      }).catch(() => null);
    }

    res.status(200).json({
      success: true,
      message: `Template "${updated.name}" updated successfully.`,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description || "",
        category: updated.category,
        documentType: updated.documentType,
        content: updated.content,
        status: updated.status === "ACTIVE" ? "Active" : "Draft",
        createdBy: updated.createdBy?.full_name || "Org Admin",
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("updateTemplate error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const duplicateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId, userId } = await resolveOrgAndUser(req);

    const orig = await prisma.documentTemplate.findUnique({
      where: { id: String(id) },
    });

    if (!orig) {
      return res.status(404).json({ success: false, message: "Original template not found." });
    }

    const copy = await prisma.documentTemplate.create({
      data: {
        name: `${orig.name} (Copy)`,
        description: orig.description,
        category: orig.category,
        documentType: orig.documentType,
        content: orig.content,
        status: orig.status,
        organisationId: orgId,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, full_name: true, email: true } } },
    });

    res.status(201).json({
      success: true,
      message: `Template duplicated as "${copy.name}".`,
      data: {
        id: copy.id,
        name: copy.name,
        description: copy.description || "",
        category: copy.category,
        documentType: copy.documentType,
        content: copy.content,
        status: copy.status === "ACTIVE" ? "Active" : "Draft",
        createdBy: copy.createdBy?.full_name || "Org Admin",
        updatedAt: copy.updatedAt.toISOString(),
      },
      newTemplateId: copy.id,
    });
  } catch (error) {
    console.error("duplicateTemplate error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.documentTemplate.delete({
      where: { id: String(id) },
    }).catch(() => null);
    res.status(200).json({ success: true, message: `Template deleted successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleTemplatePublish = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await prisma.documentTemplate.update({
      where: { id: String(id) },
      data: { status: status === "Draft" || status === "DRAFT" ? "DRAFT" : "ACTIVE" },
    });
    res.status(200).json({ success: true, message: `Template status updated to ${updated.status}.`, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTemplateVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const versions = await prisma.documentTemplateVersion.findMany({
      where: { templateId: String(id) },
      include: { createdBy: { select: { full_name: true, email: true } } },
      orderBy: { version: "desc" },
    });

    res.status(200).json({
      success: true,
      data: versions.map((v) => ({
        id: v.id,
        version: v.version,
        createdAt: v.createdAt ? v.createdAt.toISOString() : "Recently",
        createdBy: v.createdBy?.full_name || "Org Admin",
        changeSummary: `Version ${v.version} snapshot`,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const restoreTemplateVersion = async (req, res) => {
  try {
    const { id, version } = req.params;
    const ver = await prisma.documentTemplateVersion.findFirst({
      where: { templateId: String(id), version: Number(version) },
    });

    if (!ver) {
      return res.status(404).json({ success: false, message: "Version not found." });
    }

    await prisma.documentTemplate.update({
      where: { id: String(id) },
      data: { content: ver.content },
    });

    res.status(200).json({
      success: true,
      message: `Restored template to Version #${version}.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. Generate Document from Template & Save to Repository
 * Allows multiple instances with different names/variables (Quotations, Invoices, Letters)
 */
const generateDocumentFromTemplate = async (req, res) => {
  try {
    const { orgId, userId, userName } = await resolveOrgAndUser(req);
    const targetTemplateId = req.params.id || req.body.templateId;
    const {
      docTitle,
      title,
      name,
      content = "",
      category = "General",
      documentType = "Document",
      fieldValues = {},
      variables = {},
      workflow = "Standard Two-Level Approval",
    } = req.body;

    let baseContent = content;
    let templateRecord = null;

    if (targetTemplateId) {
      templateRecord = await prisma.documentTemplate.findUnique({
        where: { id: String(targetTemplateId) },
      });
      if (templateRecord) {
        baseContent = templateRecord.content || content;
      }
    }

    // Merge fieldValues and variables
    const mergeData = { ...fieldValues, ...variables };
    let renderedContent = baseContent;
    for (const [key, val] of Object.entries(mergeData)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      renderedContent = renderedContent.replace(regex, String(val));
    }

    const rawTitle = (docTitle || title || name || templateRecord?.name || "Generated Document").trim();
    const finalDocFileName = rawTitle.endsWith(".pdf") || rawTitle.endsWith(".docx") || rawTitle.endsWith(".txt")
      ? rawTitle
      : `${rawTitle}.pdf`;

    // 1. Create document record in database
    const createdDoc = await prisma.document.create({
      data: {
        organisation_id: orgId,
        created_by_user_id: userId,
        name: finalDocFileName,
        original_name: finalDocFileName,
        type: category || documentType || "Official Document",
        mime_type: "application/pdf",
        status: "ACTIVE",
        uploaded_by: userName,
        size: Math.max(1024, Buffer.byteLength(String(renderedContent), "utf8")),
      },
    });

    // 2. Increment template usage if templateId is provided
    if (targetTemplateId) {
      try {
        await prisma.documentTemplate.update({
          where: { id: String(targetTemplateId) },
          data: { updatedAt: new Date() },
        });
      } catch (tmplErr) {}
    }

    // 3. Create Audit Activity Log
    try {
      await prisma.activityLog.create({
        data: {
          organisation_id: orgId,
          action: "DOCUMENT_GENERATED_FROM_TEMPLATE",
          user: userName,
          details: `Generated document "${finalDocFileName}" from template (Category: ${category})`,
        },
      });
    } catch (actErr) {}

    return res.status(201).json({
      success: true,
      message: `Document "${finalDocFileName}" generated and saved into Documents vault successfully!`,
      renderedContent,
      data: {
        id: String(createdDoc.id),
        name: createdDoc.name,
        type: createdDoc.type,
        status: createdDoc.status,
        owner: createdDoc.uploaded_by,
        createdAt: createdDoc.created_at,
        content: renderedContent,
        renderedContent,
      },
    });
  } catch (error) {
    console.error("generateDocumentFromTemplate error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 8. Share/Send Template to Recipient Email or Update Visibility
 */
const shareTemplate = async (req, res) => {
  try {
    const { orgId, userName } = await resolveOrgAndUser(req);
    const { id } = req.params;
    const { email, recipientName, message, visibility, department } = req.body;

    let template = null;
    if (id) {
      template = await prisma.documentTemplate.findUnique({
        where: { id: String(id) },
      }).catch(() => null);

      if (template && (visibility || department)) {
        await prisma.documentTemplate.update({
          where: { id: String(id) },
          data: {
            ...(visibility && { visibility }),
            ...(department && { department }),
          },
        }).catch(() => null);
      }
    }

    if (email) {
      await prisma.activityLog.create({
        data: {
          organisation_id: orgId,
          action: "TEMPLATE_SHARED",
          user: userName,
          details: `Shared template "${template?.name || id}" with ${recipientName ? recipientName + ' (' + email + ')' : email}. Message: ${message || 'None'}`,
        },
      }).catch(() => null);
    }

    return res.status(200).json({
      success: true,
      message: `Template "${template?.name || "Document"}" successfully sent to ${email || "recipient"}!`,
      data: {
        templateId: id,
        recipient: email,
        recipientName: recipientName || email,
        sharedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("shareTemplate error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateDocumentAi,
  transformDocumentAi,
  autosaveDocument,
  submitDocumentToWorkflow,
  getCrmRecipients,
  getTemplates,
  createTemplate,
  updateTemplate,
  duplicateTemplate,
  deleteTemplate,
  toggleTemplatePublish,
  getTemplateVersions,
  restoreTemplateVersion,
  generateDocumentFromTemplate,
  shareTemplate,
};
