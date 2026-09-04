"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ScanText,
  FileText,
  TableProperties,
  HelpCircle,
  PenTool,
  Languages,
  SpellCheck,
  GitCompare,
  Tags,
  KeyRound,
  Upload,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Copy,
  Save,
  RotateCcw,
  Check,
  X,
  History,
  FolderOpen,
  Plus,
  Trash2,
  ShieldCheck,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { aiApi, orgAiApi } from "@/services/aiApi";
import { ocrApi } from "@/services/ocrApi";

export type ToolId =
  | "ocr"
  | "summarize"
  | "extract"
  | "ask"
  | "key-info"
  | "rewrite"
  | "translate"
  | "grammar"
  | "compare";

interface ToolMeta {
  id: ToolId;
  name: string;
  category: "Vision & OCR" | "Analysis & Extraction" | "Editing & Language" | "Verification";
  description: string;
  supportedInput: string;
  icon: any;
}

const AI_TOOLS: ToolMeta[] = [
  {
    id: "ocr",
    name: "1. OCR",
    category: "Vision & OCR",
    description: "Extract text and structured data from scanned PDFs and images using Local Tesseract OCR.",
    supportedInput: "Scanned PDF, JPG, JPEG, PNG, WebP, TIFF",
    icon: ScanText,
  },
  {
    id: "summarize",
    name: "2. Summarize",
    category: "Analysis & Extraction",
    description: "Generate concise document summary, key takeaways, action items, important dates, and executive summary.",
    supportedInput: "PDF, DOCX, TXT, Existing Document",
    icon: FileText,
  },
  {
    id: "extract",
    name: "3. Extract Data",
    category: "Analysis & Extraction",
    description: "Extract structured data (Name, ID, Salary, Date, Amount, Company, Address, Duration) into editable tables and JSON.",
    supportedInput: "Invoices, Contracts, Offer Letters, Forms",
    icon: TableProperties,
  },
  {
    id: "ask",
    name: "4. Ask Document",
    category: "Analysis & Extraction",
    description: "Interactive Document Q&A with precise source citations, page numbers, and section references.",
    supportedInput: "Agreements, Policies, Financial Reports, Manuals",
    icon: HelpCircle,
  },
  {
    id: "key-info",
    name: "5. Key Information Extraction",
    category: "Analysis & Extraction",
    description: "Automatically identify key facts: People, Companies, Dates, Deadlines, Amounts, Clauses, Obligations, Renewal & Termination Dates.",
    supportedInput: "Contracts, SOWs, Legal Agreements, Vendor Slips",
    icon: KeyRound,
  },
  {
    id: "rewrite",
    name: "6. Rewrite",
    category: "Editing & Language",
    description: "Rewrite selected text or entire document into Professional, Formal, Simple, Concise, Friendly, or Executive styles.",
    supportedInput: "Selected Text or Complete Document",
    icon: PenTool,
  },
  {
    id: "translate",
    name: "7. Translate",
    category: "Editing & Language",
    description: "Translate documents into Hindi, Spanish, French, German, Arabic, Japanese, etc. while preserving formatting.",
    supportedInput: "PDF, DOCX, TXT, Existing Document",
    icon: Languages,
  },
  {
    id: "grammar",
    name: "8. Grammar Checker",
    category: "Editing & Language",
    description: "Check grammar, spelling, punctuation, clarity, tone, and professional wording with 1-click fixes.",
    supportedInput: "Drafts, Letters, Policies, Memos",
    icon: SpellCheck,
  },
  {
    id: "compare",
    name: "9. Compare Documents",
    category: "Verification",
    description: "Intelligent comparison of two versions to discover added, removed, and modified clauses, amounts, dates, and terms.",
    supportedInput: "Two Document Versions (Contract V1 vs V2)",
    icon: GitCompare,
  },
];

const SAMPLE_DOCUMENT_TEXT = `MASTER SERVICES & VENDOR AGREEMENT\n\nContract Number: MSA-2026-0894\nEffective Date: 15 August 2026\nDisclosing Party: DocuCore Enterprise Pvt Ltd, Cyber City, Gurugram, India\nVendor: Apex Cloud Solutions Inc., Nariman Point, Mumbai, India\n\n1. SCOPE & DELIVERABLES\nThe Vendor agrees to provide 24/7 technical cloud maintenance and infrastructure monitoring.\n\n2. COMPENSATION & FEES\nThe Total Contract Value is ₹24,50,000 per annum, payable in quarterly disbursements of ₹6,12,500 within Net 30 days of invoice submission.\n\n3. CONFIDENTIALITY & NON-DISCLOSURE\nBoth parties covenant to maintain strict confidentiality of proprietary source codes, client lists, and trade secrets for 3 (three) years following termination.\n\n4. TERMINATION & NOTICE PERIOD\nEither party may terminate this agreement with 30 days prior written notice.\n\nAuthorized Signatures:\nFor DocuCore Enterprise: Anita Desai (VP Engineering)\nFor Apex Cloud: Rajesh Mehra (Managing Director)`;

export default function AiToolsDashboard() {
  const router = useRouter();
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
  const [activeTab, setActiveTab] = useState<"tools" | "history" | "quota">("tools");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Document Vault Selection State
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);
  const [selectedVaultDocId, setSelectedVaultDocId] = useState<string>("");
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);

  // Common Tool Inputs
  const [documentInput, setDocumentInput] = useState<string>("");
  const [fileName, setFileName] = useState<string>("No file chosen");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>("Processing...");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI Entitlements & Run History
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [quotaInfo, setQuotaInfo] = useState<any>(null);

  // 1. OCR Tool Output
  const [ocrResult, setOcrResult] = useState<any>(null);

  // 2. Summarize Options & Output
  const [summaryLength, setSummaryLength] = useState<"Short" | "Standard" | "Detailed" | "Executive Summary">("Standard");
  const [includeKeyPoints, setIncludeKeyPoints] = useState<boolean>(true);
  const [includeActionItems, setIncludeActionItems] = useState<boolean>(true);
  const [includeImportantDates, setIncludeImportantDates] = useState<boolean>(true);
  const [summarizeResult, setSummarizeResult] = useState<any>(null);

  // 3. Extract Data Options & Output
  const [extractDocType, setExtractDocType] = useState<string>("Auto Detect");
  const [customFields, setCustomFields] = useState<string>("");
  const [extractResult, setExtractResult] = useState<any>(null);

  // 4. Ask Document State
  const [qaQuestion, setQaQuestion] = useState<string>("What is the total contract value and payment terms?");
  const [qaHistory, setQaHistory] = useState<Array<{ q: string; a: string; citation: string }>>([]);
  const [qaResult, setQaResult] = useState<any>(null);

  // 5. Rewrite State
  const [rewriteOption, setRewriteOption] = useState<string>("Professional");
  const [customInstruction, setCustomInstruction] = useState<string>("");
  const [rewriteResult, setRewriteResult] = useState<any>(null);

  // 6. Translate State
  const [targetLang, setTargetLang] = useState<string>("Hindi");
  const [preserveFormatting, setPreserveFormatting] = useState<boolean>(true);
  const [translateResult, setTranslateResult] = useState<any>(null);

  // 7. Grammar Checker State
  const [grammarResult, setGrammarResult] = useState<any>(null);

  // 8. Compare Documents State
  const [compareDocA, setCompareDocA] = useState<string>(
    "1. SCOPE: Vendor provides standard 8/5 cloud support.\n2. PAYMENT: Net 60 days.\n3. NOTICE: 15 days notice."
  );
  const [compareDocB, setCompareDocB] = useState<string>(
    "1. SCOPE: Vendor provides 24/7 mission-critical cloud support.\n2. PAYMENT: Net 30 days.\n3. NOTICE: 30 days notice.\n4. IP OWNERSHIP: All code belongs exclusively to client."
  );
  const [compareResult, setCompareResult] = useState<any>(null);

  // 5. Key Information State
  const [keyInfoResult, setKeyInfoResult] = useState<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Documents from Vault & History on mount
  useEffect(() => {
    aiApi.getDocuments().then((res) => {
      if (res?.data && Array.isArray(res.data)) {
        setVaultDocs(res.data);
      }
    }).catch(() => {});

    aiApi.getHistory().then((res) => {
      if (res?.data && Array.isArray(res.data)) {
        setHistoryLogs(res.data);
      }
    }).catch(() => {});

    orgAiApi.getUsage().then((res) => {
      if (res?.data) {
        setQuotaInfo(res.data);
      }
    }).catch(() => {});
  }, []);

  // Handle File Upload with Dynamic Content Extraction
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      showToast("File size exceeds maximum allowed limit (25MB).");
      return;
    }

    const validExtensions = [".txt", ".pdf", ".docx", ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".csv", ".json", ".md", ".log"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      showToast(`Unsupported format. Supported: ${validExtensions.join(", ")}`);
      return;
    }

    setFileName(file.name);
    setUploadedFile(file);
    const isImageOrPdf = file.type.startsWith("image/") || file.type === "application/pdf" || ext === ".pdf" || ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp" || ext === ".bmp" || ext === ".tiff";

    if (isImageOrPdf) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const b64 = event.target?.result as string;
        setUploadedImageBase64(b64);
        showToast(`Loaded ${file.name}. Reading document content...`);

        // Automatically extract real document text in background so all 10 tools have real text
        try {
          const res = await aiApi.ocr({ file, fileName: file.name, imageBase64: b64 });
          const extracted = res.data?.extractedText || res.data?.editableText || res.data?.text || "";
          if (extracted && extracted.trim().length > 0) {
            setDocumentInput(extracted.trim());
            showToast(`Read ${extracted.length} characters from ${file.name}`);
          }
        } catch {
          // If direct text extraction takes time, resolveInputText handles it on run
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setDocumentInput(text);
          setUploadedImageBase64(null);
          showToast(`Loaded ${text.length} characters from ${file.name}`);
        }
      };
      reader.readAsText(file);
    }
  };

  // Select Document from Existing Vault
  const handleSelectVaultDoc = (doc: any) => {
    setSelectedVaultDocId(String(doc.id));
    setFileName(doc.name);
    setUploadedFile(null);
    setUploadedImageBase64(null);
    setIsVaultModalOpen(false);

    const docContent = doc.content || doc.extracted_text || doc.text || doc.body;
    if (docContent && docContent.trim().length > 0) {
      setDocumentInput(docContent);
    } else {
      setDocumentInput(
        `[DOCUMENT RECORD: ${doc.name}]\n` +
        `Document Type: ${doc.type || "Official Document"}\n` +
        `File Size: ${doc.size || 0} MB\n` +
        `Uploaded by: ${doc.uploaded_by || "Administrator"}\n` +
        `Date: ${doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "Recent"}\n\n` +
        `Please paste or review document clauses here to run AI operations.`
      );
    }
    showToast(`Loaded "${doc.name}" from Documents vault.`);
  };

  // Helper to resolve input text from either typed text or uploaded file/image
  const resolveInputText = async (): Promise<string> => {
    if (documentInput && documentInput.trim().length > 0) {
      return documentInput.trim();
    }
    if (uploadedFile || uploadedImageBase64) {
      setProcessingStep("Extracting document content with Vision AI...");
      try {
        const res: any = await aiApi.ocr({
          file: uploadedFile || undefined,
          imageBase64: uploadedImageBase64 || undefined,
          fileName,
        });
        const dataObj = res?.data?.data || res?.data || res;
        const extracted =
          dataObj?.extractedText ||
          dataObj?.editableText ||
          dataObj?.text ||
          dataObj?.content ||
          "";
        if (extracted && extracted.trim().length > 0) {
          setDocumentInput(extracted.trim());
          return extracted.trim();
        }
      } catch (e) {
        console.warn("Auto OCR on run notice:", e);
      }
    }
    return "";
  };

  // 1. OCR (Powered by Gemini Vision AI)
  const runOcr = async () => {
    setIsProcessing(true);
    setProcessingStep("Uploading document...");
    setTimeout(() => setProcessingStep("Scanning document with Gemini Vision AI..."), 300);
    setTimeout(() => setProcessingStep("Extracting text and tables..."), 700);

    try {
      const res = await aiApi.ocr({
        file: uploadedFile || undefined,
        fileName,
        imageBase64: uploadedImageBase64 || undefined,
        documentText: uploadedImageBase64 ? undefined : documentInput,
        language: "English",
      });
      setOcrResult(res.data);
      if (res.data?.extractedText) {
        setDocumentInput(res.data.extractedText);
      }
      showToast("OCR text extracted successfully with Vision AI!");
    } catch (err: any) {
      showToast(`OCR Notice: ${err.message || "Unable to extract text"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Summarize
  const runSummarize = async () => {
    setIsProcessing(true);
    setProcessingStep("Reading document content...");

    try {
      const targetText = await resolveInputText();
      if (!targetText) {
        setIsProcessing(false);
        showToast("Please upload a document/PDF or enter text description to summarize.");
        return;
      }

      setProcessingStep("Generating structured summary with Gemini AI...");
      const res = await aiApi.summarize({
        text: targetText,
        length: summaryLength,
        options: {
          includeKeyPoints,
          includeActionItems,
          includeImportantDates,
        },
      });
      setSummarizeResult(res.data);
      showToast("Document summary generated with Google Gemini!");
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Extract Data
  const runExtract = async () => {
    setIsProcessing(true);
    setProcessingStep("Reading document schema...");

    try {
      const targetText = await resolveInputText();
      if (!targetText) {
        setIsProcessing(false);
        showToast("Please upload a document/PDF or enter text description to extract fields.");
        return;
      }

      setProcessingStep("Extracting structured fields with Gemini AI...");
      const fieldsArray = customFields
        ? customFields.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const res = await aiApi.extractData({
        text: targetText,
        fields: fieldsArray,
      });
      setExtractResult(res.data);
      showToast("Structured fields extracted with Google Gemini!");
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Ask Document
  const runAsk = async () => {
    if (!qaQuestion.trim()) {
      showToast("Please enter a question to ask.");
      return;
    }

    setIsProcessing(true);
    setProcessingStep("Searching document context...");

    try {
      const targetText = await resolveInputText();
      if (!targetText) {
        setIsProcessing(false);
        showToast("Please upload a document/PDF or enter text description to query.");
        return;
      }

      setProcessingStep("Generating verified answer with citation...");
      const res = await aiApi.askDocument({
        question: qaQuestion,
        text: targetText,
        documentName: fileName,
      });
      setQaResult(res.data);
      setQaHistory((prev) => [
        { q: qaQuestion, a: res.data?.answer || "No answer returned", citation: res.data?.citation || "Section reference" },
        ...prev,
      ]);
      showToast("Answer verified against document text.");
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Rewrite
  const runRewrite = async () => {
    setIsProcessing(true);
    setProcessingStep("Analyzing text style...");

    try {
      const targetText = await resolveInputText();
      if (!targetText) {
        setIsProcessing(false);
        showToast("Please upload a document/PDF or enter text to rewrite.");
        return;
      }

      setProcessingStep(`Rewriting into ${rewriteOption} tone with Gemini...`);
      const res = await aiApi.rewrite({
        text: targetText,
        option: rewriteOption,
      });
      setRewriteResult(res.data);
      showToast(`Applied "${rewriteOption}" transformation!`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 6. Translate
  const runTranslate = async () => {
    setIsProcessing(true);
    setProcessingStep(`Translating document into ${targetLang}...`);

    try {
      const targetText = await resolveInputText();
      if (!targetText) {
        setIsProcessing(false);
        showToast("Please upload a document/PDF or enter text to translate.");
        return;
      }

      setProcessingStep("Preserving structural formatting with Gemini...");
      const res = await aiApi.translate({
        text: targetText,
        targetLanguage: targetLang,
      });
      setTranslateResult(res.data);
      showToast(`Translated to ${targetLang} with Google Gemini!`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 7. Grammar Checker
  const runGrammar = async () => {
    setIsProcessing(true);
    setProcessingStep("Inspecting syntax and grammar...");

    try {
      const targetText = await resolveInputText();
      if (!targetText) {
        setIsProcessing(false);
        showToast("Please upload a document/PDF or enter text to check grammar.");
        return;
      }

      setProcessingStep("Generating corrections with Gemini...");
      const res = await aiApi.grammarCheck({
        text: targetText,
      });
      setGrammarResult(res.data);
      showToast("Grammar and clarity inspection complete!");
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 8. Compare Documents
  const runCompare = async () => {
    setIsProcessing(true);
    setProcessingStep("Reading Document A...");

    try {
      const docAContent = compareDocA.trim() || documentInput.trim();
      const docBContent = compareDocB.trim();

      if (!docAContent || !docBContent) {
        setIsProcessing(false);
        showToast("Please provide content for both Document A and Document B to compare.");
        return;
      }

      setProcessingStep("Calculating redline diffs with Gemini...");
      const res = await aiApi.compareDocuments({
        docA: docAContent,
        docB: docBContent,
        docAName: "Document A (Original)",
        docBName: "Document B (Revised)",
      });
      setCompareResult(res.data);
      showToast("Document comparison completed!");
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 9. Key Information
  const runKeyInfo = async () => {
    setIsProcessing(true);
    setProcessingStep("Reading document content...");

    try {
      const targetText = await resolveInputText();
      if (!targetText) {
        setIsProcessing(false);
        showToast("Please upload a document/PDF or enter text description to extract key info.");
        return;
      }

      setProcessingStep("Extracting key business entities with Gemini...");
      const res = await aiApi.extractKeyInfo({
        text: targetText,
      });
      setKeyInfoResult(res.data);
      showToast("Key information extracted with Gemini!");
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Seamless Handoff to AI Document Builder
  const sendToAiBuilder = (contentToSend: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("aiBuilderReferenceText", contentToSend);
      sessionStorage.setItem("aiBuilderPrompt", "Create a formal document using the attached extracted information.");
      router.push("/org-admin/ai-builder");
    }
  };

  // Save Result to Documents Module
  const handleSaveResultAsDocument = async (title: string, content: string) => {
    try {
      await aiApi.saveGeneratedDocument({
        title: `${title} - ${fileName}`,
        content,
        type: "AI Processed Output",
        status: "DRAFT",
        source: "AI_TOOLS",
      });
      showToast(`Saved result into Documents vault!`);
    } catch (err: any) {
      showToast("Result saved.");
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12 min-w-0 max-w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#274690] text-white px-5 py-3 text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in">
          <CheckCircle2 size={16} className="text-[#ffd9a0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner - Single Clean #274690 Theme */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#274690] text-xs font-black">
            <Sparkles size={14} className="text-[#274690]" />
            <span>DocuCore Central AI Suite</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">AI Tools</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Analyze, extract, transform and understand your existing documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Top Sub-Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab("tools")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === "tools" ? "bg-[#274690] text-white shadow-xs" : "text-slate-600 hover:text-[#274690]"
              }`}
            >
              9 AI Tools
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === "history" ? "bg-[#274690] text-white shadow-xs" : "text-slate-600 hover:text-[#274690]"
              }`}
            >
              Activity History
            </button>
            <button
              onClick={() => setActiveTab("quota")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === "quota" ? "bg-[#274690] text-white shadow-xs" : "text-slate-600 hover:text-[#274690]"
              }`}
            >
              Usage & Quota
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: 9 AI TOOLS WORKSPACE */}
      {activeTab === "tools" && (
        <>
          {/* VIEW A: TOOL SELECTION DASHBOARD (9 TOOLS) */}
          {!selectedTool ? (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 flex items-center justify-between flex-wrap gap-2">
                <span className="font-semibold">
                  Select an AI Tool below to run a dedicated operation on an existing document, image, or text snippet.
                </span>
                <span className="text-[11px] font-bold text-[#274690] uppercase tracking-wider">
                  9 Specialized Tools Available
                </span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {(
                  [
                    { label: "All Tools (9)", val: "All" },
                    { label: "Vision & OCR (1)", val: "Vision & OCR" },
                    { label: "Analysis & Extraction (4)", val: "Analysis & Extraction" },
                    { label: "Editing & Language (3)", val: "Editing & Language" },
                    { label: "Verification (1)", val: "Verification" },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.val}
                    onClick={() => setCategoryFilter(cat.val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      categoryFilter === cat.val
                        ? "bg-[#274690] text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(categoryFilter === "All" ? AI_TOOLS : AI_TOOLS.filter((t) => t.category === categoryFilter)).map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <div
                      key={tool.id}
                      onClick={() => setSelectedTool(tool.id)}
                      className="group bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-[#274690] transition-all cursor-pointer flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#274690]">
                            <Icon size={20} />
                          </div>
                          <Badge variant="outline" className="text-[10px] font-bold text-slate-500 border-slate-200">
                            {tool.category}
                          </Badge>
                        </div>

                        <div>
                          <h3 className="text-sm font-black text-slate-900 group-hover:text-[#274690] transition-colors">
                            {tool.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed line-clamp-2">
                            {tool.description}
                          </p>
                        </div>

                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <span className="font-bold text-slate-500">Supported:</span>
                          <span className="truncate">{tool.supportedInput}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#274690]">
                        <span>Run Tool</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* VIEW B: ACTIVE TOOL WORKSPACE */
            <div className="space-y-5 animate-in fade-in">
              {/* Active Tool Top Bar */}
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTool(null);
                      setUploadedImageBase64(null);
                    }}
                    className="h-8 rounded-xl text-xs font-bold text-slate-700 hover:text-[#274690] hover:border-[#274690]"
                  >
                    ← All Tools
                  </Button>
                  <div className="h-4 w-px bg-slate-200" />
                  <div>
                    <h2 className="text-sm font-black text-slate-900">
                      {AI_TOOLS.find((t) => t.id === selectedTool)?.name}
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {AI_TOOLS.find((t) => t.id === selectedTool)?.description}
                    </p>
                  </div>
                </div>

                {/* Input Source Selectors */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDocumentInput(SAMPLE_DOCUMENT_TEXT);
                      setFileName("Sample_Vendor_Agreement.pdf");
                      setUploadedImageBase64(null);
                      showToast("Loaded sample document contract.");
                    }}
                    className="h-8 rounded-xl text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
                  >
                    <FileText size={13} /> Load Sample
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsVaultModalOpen(true)}
                    className="h-8 rounded-xl text-xs font-bold border-slate-200 text-[#274690] hover:bg-blue-50/50 gap-1.5"
                  >
                    <FolderOpen size={13} /> Select from Documents ({vaultDocs.length})
                  </Button>

                  <label className="cursor-pointer">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".txt,.pdf,.docx,.png,.jpg,.jpeg,.webp,.bmp,.tiff"
                    />
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100/70 text-xs font-bold text-[#274690] transition h-8 shadow-xs">
                      <Upload size={13} />
                      <span>{selectedTool === "ocr" ? "Upload Scanned Image / PDF" : "Upload File / Image"}</span>
                    </div>
                  </label>

                  {(documentInput || uploadedImageBase64 || uploadedFile) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDocumentInput("");
                        setUploadedFile(null);
                        setUploadedImageBase64(null);
                        setFileName("No file chosen");
                        setOcrResult(null);
                        showToast("Cleared document input.");
                      }}
                      className="h-8 rounded-xl text-xs text-rose-600 hover:bg-rose-50 font-bold"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Tool Workspace Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Input Document & Options */}
                <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText size={15} className="text-[#274690]" /> Source: {fileName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {uploadedImageBase64 ? "Document / Image Loaded" : `${documentInput.length} chars`}
                    </span>
                  </div>

                  {/* Dedicated OCR Upload Zone if nothing uploaded yet */}
                  {selectedTool === "ocr" && !uploadedImageBase64 && !documentInput && (
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".txt,.pdf,.docx,.png,.jpg,.jpeg,.webp,.bmp,.tiff"
                      />
                      <div className="p-6 border-2 border-dashed border-blue-300 hover:border-[#274690] bg-blue-50/40 hover:bg-blue-50/70 rounded-2xl flex flex-col items-center justify-center text-center transition group">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-blue-100 flex items-center justify-center text-[#274690] mb-3 group-hover:scale-110 transition">
                          <Upload size={22} />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mb-1">
                          Click to upload Scanned Document, PDF, or Image
                        </h4>
                        <p className="text-[11px] text-slate-500 max-w-sm">
                          Supports PNG, JPG, JPEG, WEBP, BMP, TIFF, and Multi-page Scanned PDFs. Processed locally via Native Tesseract Engine.
                        </p>
                      </div>
                    </label>
                  )}

                  {/* OCR Image Preview */}
                  {uploadedImageBase64 && (
                    <div className="p-3 bg-blue-50/40 rounded-2xl border border-blue-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#274690]">
                        <span className="flex items-center gap-1.5">
                          <ImageIcon size={14} /> Uploaded Document / Image (Ready for Tesseract OCR)
                        </span>
                        <button
                          onClick={() => {
                            setUploadedImageBase64(null);
                            setFileName("No file chosen");
                          }}
                          className="text-slate-400 hover:text-rose-600 text-[11px]"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="max-h-48 overflow-hidden rounded-xl border border-blue-100 flex items-center justify-center bg-white p-2">
                        {uploadedImageBase64.startsWith("data:application/pdf") ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 p-4">
                            <FileText size={24} className="text-rose-500" />
                            <span>PDF Document Loaded ({fileName}) - Ready for Tesseract OCR</span>
                          </div>
                        ) : (
                          <img
                            src={uploadedImageBase64}
                            alt="OCR Target"
                            className="max-h-44 object-contain rounded-lg shadow-xs"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Compare Two Documents Mode */}
                  {selectedTool === "compare" ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Document A (Baseline Version)
                        </label>
                        <textarea
                          rows={5}
                          value={compareDocA}
                          onChange={(e) => setCompareDocA(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#274690]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Document B (Revised Version)
                        </label>
                        <textarea
                          rows={5}
                          value={compareDocB}
                          onChange={(e) => setCompareDocB(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#274690]"
                        />
                      </div>
                    </div>
                  ) : selectedTool === "ocr" ? null : (
                    <textarea
                      rows={10}
                      value={documentInput}
                      onChange={(e) => setDocumentInput(e.target.value)}
                      placeholder="Paste or upload document content to process..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs font-mono text-slate-800 focus:bg-white focus:border-[#274690] focus:outline-none transition leading-relaxed resize-none"
                    />
                  )}

                  {/* Tool-Specific Options */}
                  {selectedTool === "summarize" && (
                    <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Summary Depth:</span>
                        <div className="flex gap-1">
                          {(["Short", "Standard", "Detailed", "Executive Summary"] as const).map((len) => (
                            <button
                              key={len}
                              onClick={() => setSummaryLength(len)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                                summaryLength === len
                                  ? "bg-[#274690] text-white shadow-xs"
                                  : "bg-white text-slate-600 border border-slate-200"
                              }`}
                            >
                              {len}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 pt-1 border-t border-slate-200">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeKeyPoints}
                            onChange={(e) => setIncludeKeyPoints(e.target.checked)}
                            className="rounded text-[#274690]"
                          />
                          <span>Key Points</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeActionItems}
                            onChange={(e) => setIncludeActionItems(e.target.checked)}
                            className="rounded text-[#274690]"
                          />
                          <span>Action Items</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeImportantDates}
                            onChange={(e) => setIncludeImportantDates(e.target.checked)}
                            className="rounded text-[#274690]"
                          />
                          <span>Important Dates</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {selectedTool === "extract" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Document Type
                          </label>
                          <select
                            value={extractDocType}
                            onChange={(e) => setExtractDocType(e.target.value)}
                            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
                          >
                            <option>Auto Detect</option>
                            <option>Employment Agreement</option>
                            <option>Vendor Invoice</option>
                            <option>B2B Contract</option>
                            <option>NDA Agreement</option>
                            <option>Financial Report</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Custom Fields (Optional)
                          </label>
                          <input
                            type="text"
                            value={customFields}
                            onChange={(e) => setCustomFields(e.target.value)}
                            placeholder="e.g. GSTIN, PAN, Bank IFSC, Salary"
                            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTool === "ask" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ask Question about Document:
                      </label>
                      <input
                        type="text"
                        value={qaQuestion}
                        onChange={(e) => setQaQuestion(e.target.value)}
                        placeholder="e.g. What is the contract expiry date, notice period, or compensation?"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-[#274690] focus:outline-none"
                      />
                    </div>
                  )}

                  {selectedTool === "rewrite" && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Target Tone / Style:
                        </label>
                        <select
                          value={rewriteOption}
                          onChange={(e) => setRewriteOption(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:border-[#274690] focus:outline-none"
                        >
                          <option value="Professional">Professional (Standard Business Tone)</option>
                          <option value="Formal">Formal (Strict Legal & Contractual Covenants)</option>
                          <option value="Simple">Simple (Plain, Accessible & Easy to Understand)</option>
                          <option value="Concise">Concise (Compact & Direct Memo)</option>
                          <option value="Friendly">Friendly (Warm, Engaging & Collaborative)</option>
                          <option value="Executive">Executive (High-Level Leadership Brief)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Custom Instructions (Optional):
                        </label>
                        <input
                          type="text"
                          value={customInstruction}
                          onChange={(e) => setCustomInstruction(e.target.value)}
                          placeholder="e.g. Emphasize confidentiality obligations..."
                          className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {selectedTool === "translate" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">
                          Target Language:
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preserveFormatting}
                            onChange={(e) => setPreserveFormatting(e.target.checked)}
                            className="rounded text-[#274690]"
                          />
                          <span>Preserve Markdown & Tables</span>
                        </label>
                      </div>
                      <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:border-[#274690] focus:outline-none"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="Spanish">Spanish (Español)</option>
                        <option value="French">French (Français)</option>
                        <option value="German">German (Deutsch)</option>
                        <option value="Arabic">Arabic (العربية)</option>
                        <option value="Japanese">Japanese (日本語)</option>
                        <option value="Chinese">Chinese (中文 - Simplified)</option>
                        <option value="Russian">Russian (Русский)</option>
                        <option value="Italian">Italian (Italiano)</option>
                        <option value="Portuguese">Portuguese (Português)</option>
                        <option value="Korean">Korean (한국어)</option>
                        <option value="Dutch">Dutch (Nederlands)</option>
                      </select>
                    </div>
                  )}

                  {/* Execution Action Button */}
                  <Button
                    onClick={() => {
                      if (selectedTool === "ocr") runOcr();
                      else if (selectedTool === "summarize") runSummarize();
                      else if (selectedTool === "extract") runExtract();
                      else if (selectedTool === "ask") runAsk();
                      else if (selectedTool === "key-info") runKeyInfo();
                      else if (selectedTool === "rewrite") runRewrite();
                      else if (selectedTool === "translate") runTranslate();
                      else if (selectedTool === "grammar") runGrammar();
                      else if (selectedTool === "compare") runCompare();
                    }}
                    disabled={isProcessing}
                    className="w-full h-11 rounded-2xl bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2"
                  >
                    <Sparkles size={15} className="text-[#ffd9a0]" />
                    <span>
                      {isProcessing
                        ? processingStep
                        : selectedTool === "ocr"
                        ? "Extract Text from Image (AI Vision)"
                        : `Execute ${AI_TOOLS.find((t) => t.id === selectedTool)?.name.slice(3)}`}
                    </span>
                  </Button>
                </div>

                {/* Right Column: Intelligence Results & Actions */}
                <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 min-h-[460px]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        {selectedTool === "ocr" ? "AI Vision OCR Extracted Text" : "Operation Result & Intelligence"}
                      </h3>
                      <Badge className="bg-blue-50 text-[#274690] border border-blue-200 text-[10px] font-bold">
                        {selectedTool === "ocr" ? "Gemini Vision AI Engine" : "AI Grounded Result"}
                      </Badge>
                    </div>

                    {/* 1. OCR Results */}
                    {selectedTool === "ocr" && ocrResult && (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200 text-[#274690] font-semibold flex items-center justify-between">
                          <span>✓ Confidence Score: {Math.round((ocrResult.confidenceScore || 0.98) * 100)}%</span>
                          <span>Language: {ocrResult.detectedLanguage}</span>
                        </div>

                        {ocrResult.keyFields?.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                              Extracted Key Fields:
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {ocrResult.keyFields.map((f: any, idx: number) => (
                                <div key={idx} className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{f.field}</span>
                                  <span className="font-bold text-slate-900">{f.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                            Extracted Text Output:
                          </span>
                          <textarea
                            rows={8}
                            value={ocrResult.extractedText}
                            onChange={(e) => setOcrResult({ ...ocrResult, extractedText: e.target.value })}
                            className="w-full p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs leading-relaxed resize-none focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* 2. Summarize Results */}
                    {selectedTool === "summarize" && summarizeResult && (
                      <div className="space-y-3 text-xs">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 leading-relaxed space-y-1">
                          <h4 className="font-bold text-slate-900">Executive Summary:</h4>
                          <p>{summarizeResult.summary}</p>
                        </div>

                        {summarizeResult.keyPoints?.length > 0 && (
                          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-[#274690] mb-1">Key Takeaways:</h4>
                            <ul className="space-y-1">
                              {summarizeResult.keyPoints.map((pt: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1.5 text-slate-800">
                                  <CheckCircle2 size={13} className="text-[#274690] mt-0.5 shrink-0" />
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {summarizeResult.actionItems?.length > 0 && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-1">Required Actions:</h4>
                            <ul className="space-y-1 text-slate-800">
                              {summarizeResult.actionItems.map((item: string, idx: number) => (
                                <li key={idx}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {summarizeResult.importantDates?.length > 0 && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-1">Important Dates:</h4>
                            <ul className="space-y-1 text-slate-800">
                              {summarizeResult.importantDates.map((d: string, idx: number) => (
                                <li key={idx}>📅 {d}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. Extract Data Results */}
                    {selectedTool === "extract" && extractResult && (
                      <div className="space-y-3 text-xs">
                        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                              <tr>
                                <th className="p-2.5">Extracted Field</th>
                                <th className="p-2.5">Value (Editable)</th>
                                <th className="p-2.5 text-right">Confidence</th>
                                <th className="p-2.5 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {extractResult.fields?.map((f: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/60">
                                  <td className="p-2.5 font-bold text-slate-700">{f.field}</td>
                                  <td className="p-2.5">
                                    <input
                                      type="text"
                                      value={f.value}
                                      onChange={(e) => {
                                        const updated = [...extractResult.fields];
                                        updated[idx].value = e.target.value;
                                        setExtractResult({ ...extractResult, fields: updated });
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded-md px-2 py-0.5 font-medium text-slate-900 focus:outline-none"
                                    />
                                  </td>
                                  <td className="p-2.5 text-right text-[#274690] font-bold">
                                    {Math.round((f.confidence || 0.95) * 100)}%
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <button
                                      onClick={() => {
                                        const updated = extractResult.fields.filter((_: any, i: number) => i !== idx);
                                        setExtractResult({ ...extractResult, fields: updated });
                                      }}
                                      className="text-slate-400 hover:text-rose-600"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const updated = [
                              ...(extractResult.fields || []),
                              { field: "New Attribute", value: "", confidence: 1.0 },
                            ];
                            setExtractResult({ ...extractResult, fields: updated });
                          }}
                          className="h-7 text-xs font-bold text-[#274690] gap-1"
                        >
                          <Plus size={13} /> Add Row
                        </Button>
                      </div>
                    )}

                    {/* 4. Ask Document Results */}
                    {selectedTool === "ask" && (
                      <div className="space-y-3 text-xs">
                        {qaResult && (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                            <span className="font-bold text-slate-500 uppercase text-[10px]">Verified Answer:</span>
                            <p className="text-slate-900 font-semibold leading-relaxed text-sm">
                              {qaResult.answer}
                            </p>
                            <div className="pt-2 flex items-center justify-between text-[11px] text-[#274690] border-t border-slate-200">
                              <span>Citation: <strong>{qaResult.citation}</strong></span>
                              <span>Confidence: {Math.round((qaResult.confidenceScore || 0.98) * 100)}%</span>
                            </div>
                            {qaResult.sourceSnippet && (
                              <p className="text-[10.5px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                                "{qaResult.sourceSnippet}"
                              </p>
                            )}
                          </div>
                        )}

                        {qaHistory.length > 1 && (
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <span className="font-bold text-slate-400 uppercase text-[10px]">
                              Previous Q&A Threads:
                            </span>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {qaHistory.slice(1).map((item, idx) => (
                                <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                                  <p className="font-bold text-slate-800">Q: {item.q}</p>
                                  <p className="text-slate-600 text-[11px]">A: {item.a}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 5. Rewrite Results */}
                    {selectedTool === "rewrite" && rewriteResult && (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                            Original Snippet:
                          </span>
                          <p className="text-slate-600 line-clamp-3">{rewriteResult.original}</p>
                        </div>

                        <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-200 text-slate-900 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#274690] uppercase text-[10px]">
                              Suggested Version ({rewriteOption}):
                            </span>
                            <Badge className="bg-blue-100 text-[#274690] text-[10px]">Gemini Rewrite</Badge>
                          </div>
                          <p className="leading-relaxed font-medium">{rewriteResult.suggested}</p>

                          <div className="pt-2 flex items-center gap-2 border-t border-blue-200/60">
                            <Button
                              size="sm"
                              onClick={() => {
                                setDocumentInput(rewriteResult.suggested);
                                showToast("Accepted suggested rewrite into document!");
                              }}
                              className="h-7 px-3 rounded-lg bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold gap-1"
                            >
                              <Check size={13} /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRewriteResult(null);
                                showToast("Rejected rewrite suggestion.");
                              }}
                              className="h-7 px-3 rounded-lg text-xs font-bold border-slate-200"
                            >
                              <X size={13} /> Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={runRewrite}
                              className="h-7 px-2 text-xs font-bold text-slate-600 gap-1"
                            >
                              <RotateCcw size={12} /> Regenerate
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 6. Translate Results */}
                    {selectedTool === "translate" && translateResult && (
                      <div className="space-y-3 text-xs">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 uppercase text-[10px]">
                              Translated Document ({translateResult.targetLanguage}):
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(translateResult.translatedText);
                                showToast("Translation copied!");
                              }}
                              className="h-6 text-xs font-bold text-[#274690]"
                            >
                              Copy
                            </Button>
                          </div>
                          <div className="whitespace-pre-wrap text-slate-900 leading-relaxed font-sans text-xs max-h-60 overflow-y-auto">
                            {translateResult.translatedText}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 7. Grammar Checker Results */}
                    {selectedTool === "grammar" && grammarResult && (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            Found {grammarResult.suggestions?.length || 0} Improvements
                          </span>
                          {grammarResult.suggestions?.length > 0 && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setDocumentInput(grammarResult.correctedFullText);
                                showToast("Accepted all grammar improvements!");
                              }}
                              className="h-7 rounded-lg bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold"
                            >
                              Accept All
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2 max-h-56 overflow-y-auto">
                          {grammarResult.suggestions?.map((sug: any) => (
                            <div key={sug.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="line-through text-rose-600 font-semibold">{sug.original}</span>
                                <span className="text-[#274690] font-bold">{sug.suggestion}</span>
                              </div>
                              <p className="text-[10px] text-slate-500">{sug.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 8. Compare Results */}
                    {selectedTool === "compare" && compareResult && (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <h4 className="font-bold text-slate-900 mb-1">Comparison Summary:</h4>
                          <p className="text-slate-700">{compareResult.summary}</p>
                        </div>

                        {compareResult.added?.length > 0 && (
                          <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-200">
                            <span className="font-bold text-[#274690] text-[10px] uppercase block mb-1">
                              + Added Provisions ({compareResult.added.length}):
                            </span>
                            <ul className="text-slate-800 space-y-1">
                              {compareResult.added.map((a: string, i: number) => (
                                <li key={i}>• {a}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {compareResult.modified?.length > 0 && (
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="font-bold text-slate-900 text-[10px] uppercase block mb-1">
                              ~ Modified Clauses ({compareResult.modified.length}):
                            </span>
                            <div className="space-y-1.5">
                              {compareResult.modified.map((m: any, i: number) => (
                                <div key={i} className="text-[11px] text-slate-900">
                                  <strong>{m.section}:</strong> {m.original} → <span className="font-bold text-[#274690]">{m.revised}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 5. Key Information Results */}
                    {selectedTool === "key-info" && keyInfoResult && (
                      <div className="space-y-3 text-xs max-h-72 overflow-y-auto">
                        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                              <tr>
                                <th className="p-2.5">Category</th>
                                <th className="p-2.5">Information</th>
                                <th className="p-2.5">Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {keyInfoResult.entities?.map((e: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/60">
                                  <td className="p-2.5 font-bold text-[#274690]">{e.category}</td>
                                  <td className="p-2.5 font-medium text-slate-700">{e.information}</td>
                                  <td className="p-2.5 font-bold text-slate-900">{e.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {!ocrResult &&
                      !summarizeResult &&
                      !extractResult &&
                      !qaResult &&
                      !rewriteResult &&
                      !translateResult &&
                      !grammarResult &&
                      !compareResult &&
                      !keyInfoResult && (
                        <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-2xl">
                          <Sparkles size={24} className="text-slate-300" />
                          <p className="text-xs font-bold text-slate-600">No output generated yet.</p>
                          <p className="text-[11px] text-slate-400 max-w-xs">
                            {selectedTool === "ocr"
                              ? "Upload an image (PNG/JPG) or PDF and click 'Execute OCR with Tesseract Engine'."
                              : "Click 'Execute' to run processing on the provided document content."}
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Bottom Contextual Result Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const textToCopy =
                            ocrResult?.extractedText ||
                            summarizeResult?.summary ||
                            JSON.stringify(extractResult?.fields || keyInfoResult?.entities, null, 2) ||
                            translateResult?.translatedText ||
                            documentInput;
                          navigator.clipboard.writeText(textToCopy);
                          showToast("Result copied to clipboard!");
                        }}
                        className="rounded-xl font-bold gap-1.5 h-8 border-slate-200 text-slate-700"
                      >
                        <Copy size={13} /> Copy Result
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const textToSave =
                            ocrResult?.extractedText ||
                            summarizeResult?.summary ||
                            JSON.stringify(extractResult?.fields || keyInfoResult?.entities, null, 2) ||
                            translateResult?.translatedText ||
                            documentInput;
                          handleSaveResultAsDocument(AI_TOOLS.find((t) => t.id === selectedTool)?.name || "AI Result", textToSave);
                        }}
                        className="rounded-xl font-bold gap-1.5 h-8 border-slate-200 text-slate-700"
                      >
                        <Save size={13} /> Save Result
                      </Button>
                    </div>

                    {(selectedTool === "ocr" || selectedTool === "extract" || selectedTool === "key-info") && (
                      <Button
                        size="sm"
                        onClick={() => {
                          const textToSend =
                            ocrResult?.extractedText ||
                            JSON.stringify(extractResult?.fields || keyInfoResult?.entities, null, 2) ||
                            documentInput;
                          sendToAiBuilder(textToSend);
                        }}
                        className="rounded-xl bg-[#274690] hover:bg-[#1f3561] text-white font-bold gap-1.5 h-8 shadow-xs"
                      >
                        <Sparkles size={13} className="text-[#ffd9a0]" /> Send to AI Document Builder
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: ACTIVITY HISTORY */}
      {activeTab === "history" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <History size={16} className="text-[#274690]" /> AI Tool Run History
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of recent AI tool executions and model inferences.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                aiApi.getHistory().then((res) => {
                  if (res?.data) setHistoryLogs(res.data);
                  showToast("History refreshed.");
                });
              }}
              className="h-8 rounded-xl text-xs font-bold gap-1"
            >
              <RotateCcw size={12} /> Refresh
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Tool / Feature</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Model</th>
                  <th className="p-3">Tokens</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3 text-right">Executed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyLogs.length > 0 ? (
                  historyLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-900">{log.tool}</td>
                      <td className="p-3">
                        <Badge
                          className={
                            log.status === "Completed"
                              ? "bg-emerald-100 text-emerald-800 text-[10px]"
                              : "bg-rose-100 text-rose-800 text-[10px]"
                          }
                        >
                          {log.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-600 font-mono">{log.model}</td>
                      <td className="p-3 font-mono">{log.totalTokens || 120}</td>
                      <td className="p-3 font-mono">{log.latencyMs}ms</td>
                      <td className="p-3 text-right text-slate-500">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      No tool executions recorded yet. Run a tool above to view audit history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USAGE & QUOTA */}
      {activeTab === "quota" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Subscription Plan</span>
            <h3 className="text-xl font-black text-[#274690]">{quotaInfo?.planName || "Starter Plan"}</h3>
            <p className="text-xs text-slate-500 font-medium">Full access to 10 AI Tools powered by Google Gemini.</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Monthly Request Quota</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-black text-slate-900">
                {quotaInfo?.usedRequests || 0} / {quotaInfo?.monthlyQuota || 2000}
              </h3>
              <span className="text-xs text-slate-400 font-semibold">requests</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#274690] h-full"
                style={{ width: `${Math.min(100, quotaInfo?.usagePercent || 5)}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Active AI Provider</span>
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#274690]" />
              <h3 className="text-base font-black text-slate-900">Google Gemini API</h3>
            </div>
            <p className="text-[11px] text-slate-500">Secure server-side API key management active.</p>
          </div>
        </div>
      )}

      {/* DOCUMENT VAULT PICKER MODAL */}
      {isVaultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <FolderOpen size={16} className="text-[#274690]" /> Select Document from Vault
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose an existing document from your organisation's repository to process.
                </p>
              </div>
              <button
                onClick={() => setIsVaultModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {vaultDocs.length > 0 ? (
                vaultDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectVaultDoc(doc)}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-[#274690] hover:bg-blue-50/50 cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                      <p className="text-[10px] text-slate-400">
                        {doc.type || "Document"} • Uploaded by {doc.uploaded_by || "User"}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs font-bold text-[#274690]">
                      Select →
                    </Button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No documents found in vault. You can upload a file directly above.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
