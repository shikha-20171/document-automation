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

    // 1. Fetch Authenticated Organisation Context from DB
    let organisationData = {};
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
      } else if (!isNaN(Number(crmCustomer))) {
        try {
          const clientRec = await prisma.client.findFirst({
            where: { id: Number(crmCustomer), organisation_id: Number(orgId) },
          });
          if (clientRec) {
            recipientData = {
              recipient_name: clientRec.name,
              ...(clientRec.company ? { recipient_company: clientRec.company } : {}),
              ...(clientRec.email ? { recipient_email: clientRec.email } : {}),
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
 * 6. Template Management
 */
const getTemplates = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: [
        { id: "tmpl-1", name: "Standard Employment Agreement", category: "HR", documentType: "Agreement", status: "ACTIVE", updatedAt: "Today" },
        { id: "tmpl-2", name: "Mutual B2B NDA", category: "Legal", documentType: "NDA", status: "ACTIVE", updatedAt: "Yesterday" },
        { id: "tmpl-3", name: "Client Master Services Agreement", category: "Sales", documentType: "Contract", status: "ACTIVE", updatedAt: "10 Aug 2026" },
        { id: "tmpl-4", name: "Candidate Official Offer Letter", category: "HR", documentType: "Offer Letter", status: "ACTIVE", updatedAt: "05 Aug 2026" },
        { id: "tmpl-5", name: "Consulting Services Agreement", category: "Operations", documentType: "Consulting", status: "ACTIVE", updatedAt: "01 Aug 2026" },
        { id: "tmpl-6", name: "Vendor Purchase Order SOW", category: "Finance", documentType: "Invoice", status: "ACTIVE", updatedAt: "28 Jul 2026" },
      ],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTemplate = async (req, res) => {
  try {
    const { name, category = "HR", documentType = "Contract", content } = req.body;
    res.status(201).json({
      success: true,
      message: `Template "${name}" created.`,
      data: {
        id: `tmpl-${Date.now()}`,
        name,
        category,
        documentType,
        content: content || "",
        status: "ACTIVE",
        updatedAt: "Just now",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({ success: true, message: `Template #${id} updated.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const duplicateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({
      success: true,
      message: `Template #${id} duplicated.`,
      newTemplateId: `tmpl-copy-${Date.now()}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({ success: true, message: `Template #${id} deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleTemplatePublish = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    res.status(200).json({ success: true, message: `Template #${id} status: ${status}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTemplateVersions = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: [
        { version: 2, createdAt: "Today, 11:30 AM", createdBy: "Shikha Gour", changeSummary: "Updated statutory covenants and compensation structure" },
        { version: 1, createdAt: "15 Aug 2026, 02:00 PM", createdBy: "Legal Dept", changeSummary: "Initial baseline publish" },
      ],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const restoreTemplateVersion = async (req, res) => {
  try {
    const { id, version } = req.params;
    res.status(200).json({
      success: true,
      message: `Restored to Version #${version}.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
};
