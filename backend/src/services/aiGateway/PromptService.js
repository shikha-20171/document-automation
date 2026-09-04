/**
 * Centralized Prompt Management Service
 * Reusable and versionable prompt templates across all DocuCore SaaS modules.
 */

class PromptService {
  /**
   * Builds prompt for AI Document Generation with Strict Data Accuracy & No-Hallucination Rules
   */
  static buildDocumentGenerationPrompt({
    title,
    documentType,
    instructions = "",
    tone = "Professional",
    language = "English",
    organisationData = {},
    recipientData = {},
    variables = {},
    referenceText = "",
  }) {
    const verifiedSources = {
      ...(Object.keys(organisationData).length > 0 ? { AUTHENTICATED_ORGANISATION: organisationData } : {}),
      ...(Object.keys(recipientData).length > 0 ? { AUTHORIZED_RECIPIENT_OR_CRM: recipientData } : {}),
      ...(Object.keys(variables).length > 0 ? { USER_PROVIDED_VARIABLES: variables } : {}),
    };

    const hasSources = Object.keys(verifiedSources).length > 0;

    const systemPrompt = `You are a professional enterprise legal and business document specialist.
CRITICAL DATA ACCURACY & ANTI-HALLUCINATION RULES:
1. NEVER invent, fabricate, assume, or randomly generate business names, client names, employee names, salary/financial amounts, notice periods, leave rules, salary deductions, disciplinary policies, addresses, registration numbers, or dates.
2. ONLY use factual data from the verified sources or explicit user instructions provided below.
3. If any required information is missing or not provided:
   - DO NOT make up fake names, figures, or policies.
   - Use explicit bracketed placeholders so the user can fill or select them:
     • Missing Company/Organisation: [Organisation Name]
     • Missing Employee/Candidate/Recipient: [Employee Name: Select/Provide]
     • Missing Designation/Role: [Designation: Required]
     • Missing Compensation/Salary: [Annual Salary: Required]
     • Missing Dates: [Effective Date: DD/MM/YYYY]
     • Missing Registered Address: [Registered Address]
     • Missing Policy Terms: [Applicable Organisation Policy to be Attached]
4. For legal, HR, compliance, or financial documents, preserve the factual structure without inventing unstated corporate policies or penalty rules.
5. Produce complete, clean markdown formatted text. Do not output conversational introductory or concluding chat remarks outside the document.`;

    const userPrompt = `USER DOCUMENT SPECIFICATIONS:
- Document Title: ${title || "Untitled Document"}
${documentType ? `- Document Classification: ${documentType}` : ""}
- Desired Tone: ${tone}
- Language: ${language}

USER INSTRUCTIONS / REQUIREMENTS:
${instructions || `Create a formal ${title || documentType || "document"}.`}

VERIFIED FACTUAL DATA SOURCES (DO NOT DEVIATE OR INVENT BEYOND THIS):
${hasSources ? JSON.stringify(verifiedSources, null, 2) : "No verified factual variables provided. Use explicit bracketed placeholders for all unprovided data points."}

${referenceText ? `AUTHORIZED REFERENCE CONTENT:\n${referenceText.slice(0, 4000)}\n` : ""}
TASK:
Draft the complete, professional ${title || documentType || "document"} adhering strictly to the above facts. If any specific data is unstated, insert clean standard bracketed placeholders (e.g. [Employee Name: Select/Provide], [Effective Date]) instead of inventing values.`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Builds prompt for AI Document Summarization
   */
  static buildSummarizationPrompt({ text, options = {} }) {
    const length = options.length || "Medium";
    const includeKeyPoints = options.includeKeyPoints !== false;
    const includeActionItems = options.includeActionItems !== false;

    const systemPrompt = `You are an executive enterprise intelligence analyst. You summarize legal, operational, and financial documents with high factual accuracy.`;

    const userPrompt = `Summarize the following document content:
Target Length: ${length} (Short = 2-3 sentences, Medium = 1-2 paragraphs, Detailed = comprehensive section-by-section breakdown)
Include Key Points: ${includeKeyPoints}
Include Action Items: ${includeActionItems}

DOCUMENT CONTENT:
${text.slice(0, 15000)}

Please return your analysis formatted as:
### SUMMARY
[The concise summary text]

${includeKeyPoints ? `### KEY TAKEAWAYS\n- [Key point 1]\n- [Key point 2]\n...` : ""}

${includeActionItems ? `### REQUIRED ACTIONS & DEADLINES\n- [Action 1]\n- [Action 2]\n...` : ""}`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Builds prompt for Structured Data Extraction
   */
  static buildExtractionPrompt({ text, fields = [], extractionType = "General" }) {
    const systemPrompt = `You are an automated document data extraction engine. Extract key entity records and attributes into a valid JSON object. Do NOT wrap output in markdown code blocks; output raw JSON only.`;

    const fieldsSpec = fields && fields.length > 0
      ? `Extract the following specific fields: ${JSON.stringify(fields)}`
      : `Automatically detect and extract all key fields such as parties, dates, financial amounts, invoice numbers, tax IDs, jurisdiction, payment terms, and obligations.`;

    const userPrompt = `Extraction Type: ${extractionType}
${fieldsSpec}

DOCUMENT TEXT:
${text.slice(0, 12000)}

Return a clean JSON object containing the extracted key-value pairs. Numeric values and currency should preserve original representations.`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Builds prompt for Document Classification
   */
  static buildClassificationPrompt({ text, categories = [] }) {
    const defaultCategories = [
      "Non-Disclosure Agreement (NDA)",
      "Employment Agreement",
      "Offer Letter",
      "Vendor Invoice",
      "Purchase Order",
      "Master Services Agreement",
      "Service Level Agreement (SLA)",
      "Compliance Policy",
      "Board Resolution",
      "Financial Report",
    ];

    const targetCategories = categories && categories.length > 0 ? categories : defaultCategories;

    const systemPrompt = `You are an enterprise document categorization system. Output valid JSON only with keys: "documentType", "category", "department", "confidence" (0.0 - 1.0), "summary", "keywords" (array), and "suggestedSecurityLevel".`;

    const userPrompt = `Classify this document into one of the following categories or suggest the best fit:
${JSON.stringify(targetCategories)}

DOCUMENT CONTENT:
${text.slice(0, 6000)}`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Builds prompt for Document Rewriting & Transformation
   */
  static buildRewritePrompt({ text, action, tone = "Professional", language = "English" }) {
    const systemPrompt = `You are an expert enterprise document editor and legal stylist. Transform the provided text according to the requested transformation while preserving factual accuracy.`;

    let instruction = `Rewrite the text with a ${tone} tone.`;
    switch (action) {
      case "improve_writing":
        instruction = "Improve vocabulary, readability, and business eloquence while keeping the original meaning intact.";
        break;
      case "legal_polish":
        instruction = "Enhance the legal precision, add necessary contract covenants, standard warranty clauses, and formal jurisprudence phraseology.";
        break;
      case "expand":
        instruction = "Elaborate with detailed operational sub-clauses, stakeholder obligations, compliance requirements, and execution steps.";
        break;
      case "shorten":
      case "concise":
        instruction = "Make the text highly concise, removing redundancies and keeping only the core enforceable provisions.";
        break;
      case "fix_grammar":
        instruction = "Correct all grammatical, punctuation, structural, and typographical errors seamlessly.";
        break;
      case "translate":
        instruction = `Translate the entire document content accurately and fluently into ${language}, preserving formal terminology.`;
        break;
      default:
        instruction = `Revise the text to adhere to a ${tone} tone.`;
    }

    const userPrompt = `Action: ${action || "rewrite"}
Instruction: ${instruction}
Target Language: ${language}

ORIGINAL TEXT:
${text}`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Builds prompt for Grounded Document Q&A
   */
  static buildDocumentQAPrompt({ question, documentText, documentName = "Document" }) {
    const systemPrompt = `You are an intelligent enterprise document assistant. Answer questions strictly based on the provided document content. If the information is not present in the document, explicitly state that it is not covered. Include specific clause or section citations where possible.`;

    const userPrompt = `DOCUMENT TITLE: ${documentName}

DOCUMENT TEXT:
${documentText.slice(0, 15000)}

QUESTION:
${question}

Provide a direct, concise, and verifiable answer with section citations.`;

    return { systemPrompt, userPrompt };
  }
}

module.exports = PromptService;
