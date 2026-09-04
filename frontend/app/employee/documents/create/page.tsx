"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Bot,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Heading1,
  Image as ImageIcon,
  Italic,
  LayoutTemplate,
  Link2,
  List,
  ListOrdered,
  Paperclip,
  PenLine,
  Redo2,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Table as TableIcon,
  Underline,
  Undo2,
  UploadCloud,
  Wand2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiApi } from "@/services/aiApi";
import { dashboardApi } from "@/services/dashboardApi";
import { documentsApi } from "@/services/documentsApi";
import { ocrApi } from "@/services/ocrApi";
import { profileApi } from "@/services/profileApi";
import { templatesApi } from "@/services/templatesApi";

type DocumentMode = "blank" | "template" | "ai" | "form" | "upload";

type EmployeeProfile = {
  fullName?: string;
  email?: string;
  employeeId?: string;
  department?: string;
  team?: string;
  designation?: string;
};

type EmployeeTemplate = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  documentType?: string;
  variables?: string[];
  contentTemplate?: string;
  scope?: string;
};

type AiSuggestion = {
  title: string;
  content: string;
  range?: { start: number; end: number };
};

const documentTypeOptions: Array<{
  id: DocumentMode;
  title: string;
  subtitle: string;
  icon: typeof FileText;
}> = [
  { id: "blank", title: "Blank Document", subtitle: "Start from scratch with a full editor.", icon: FileText },
  { id: "template", title: "From Template", subtitle: "Use published employee-ready templates.", icon: LayoutTemplate },
  { id: "ai", title: "AI Generated Document", subtitle: "Generate a first draft from a prompt.", icon: Sparkles },
  { id: "form", title: "Form / Standard Document", subtitle: "Create a structured standard request document.", icon: FileSpreadsheet },
  { id: "upload", title: "Upload & Convert", subtitle: "Upload a file and continue as an editable draft.", icon: UploadCloud },
];

const fontFamilies = ["Georgia", "Times New Roman", "Lora", "Merriweather", "Garamond", "serif"];
const fontSizes = [12, 14, 16, 18, 20];
const draftStorageKey = "employee-create-document-draft";

function formatDateTime(value: Date | string | null) {
  if (!value) return "Not saved yet";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function applyTemplateVariables(template: string, values: Record<string, string>) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, token: string) => values[token] ?? "");
}

function getModeLabel(mode: DocumentMode) {
  switch (mode) {
    case "template":
      return "From Template";
    case "ai":
      return "AI Generated Document";
    case "form":
      return "Form / Standard Document";
    case "upload":
      return "Upload & Convert";
    case "blank":
    default:
      return "Blank Document";
  }
}

export default function DocumentCreatePage() {
  const router = useRouter();
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [documentMode, setDocumentMode] = useState<DocumentMode>("blank");
  const [hasEnteredBuilder, setHasEnteredBuilder] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [workflowLocked, setWorkflowLocked] = useState(false);

  const [name, setName] = useState("Untitled Document");
  const [category, setCategory] = useState("Operations");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Draft");
  const [lastModifiedAt, setLastModifiedAt] = useState<Date | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [autosaveState, setAutosaveState] = useState("Saved");

  const [editorFont, setEditorFont] = useState("Georgia");
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [editorTextColor, setEditorTextColor] = useState("#1e293b");
  const [editorAlignment, setEditorAlignment] = useState<"left" | "center" | "right">("left");

  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const [templates, setTemplates] = useState<EmployeeTemplate[]>([]);
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<EmployeeTemplate | null>(null);
  const [templateFieldValues, setTemplateFieldValues] = useState<Record<string, string>>({});

  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [aiCreditsLabel, setAiCreditsLabel] = useState("Unavailable");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<string[]>([]);

  const [formFields, setFormFields] = useState({
    subject: "",
    purpose: "",
    requestDetails: "",
    dueDate: "",
    notes: "",
  });

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitTarget, setSubmitTarget] = useState("Department Manager");
  const [submitComment, setSubmitComment] = useState("Please review this document and proceed with the configured workflow.");

  const wordCount = useMemo(() => (content.trim() ? content.trim().split(/\s+/).length : 0), [content]);
  const charCount = content.length;

  const templateVariables = useMemo(() => {
    if (!selectedTemplate) return [] as string[];
    return (selectedTemplate.variables || []).filter(Boolean);
  }, [selectedTemplate]);

  const filteredTemplates = useMemo(() => {
    const query = templateSearch.toLowerCase().trim();
    return templates.filter((template) => {
      if (!query) return true;
      return [template.name, template.description, template.category, template.documentType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [templateSearch, templates]);

  const documentDetails = useMemo(
    () => [
      { label: "Document Name", value: name || "Untitled Document" },
      { label: "Document Type", value: getModeLabel(documentMode) },
      { label: "Created By", value: profile?.fullName || "Current employee" },
      { label: "Department", value: profile?.department || "Auto-filled" },
      { label: "Team", value: profile?.team || "Auto-filled" },
      { label: "Created Date", value: formatDateTime(lastSavedAt || new Date()) },
      { label: "Last Modified", value: formatDateTime(lastModifiedAt || new Date()) },
      { label: "Status", value: status },
    ],
    [documentMode, lastModifiedAt, lastSavedAt, name, profile, status]
  );

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setTemplatesLoading(true);
      try {
        const [profileRes, dashboardRes, templateRes] = await Promise.all([
          profileApi.getProfile(),
          dashboardApi.getEmployeeDashboard(),
          templatesApi.getTemplates({ tab: "SHARED" }),
        ]);

        const nextProfile = (profileRes?.data || {}) as EmployeeProfile;
        setProfile(nextProfile);

        if (dashboardRes?.data?.employee) {
          setAiEnabled(true);
          setAiCreditsLabel("380 units left");
        }

        const templatePayload = templateRes?.data as any;
        const nextTemplates = Array.isArray(templatePayload)
          ? templatePayload
          : Array.isArray(templatePayload?.templates)
          ? templatePayload.templates
          : [];
        setTemplates(nextTemplates.filter((template: EmployeeTemplate) => template.scope !== "MY_TEMPLATES"));
      } catch (error) {
        setAiEnabled(false);
        setErrorMessage(error instanceof Error ? error.message : "Failed to load document builder data.");
      } finally {
        setLoading(false);
        setTemplatesLoading(false);
      }
    };

    loadInitialData();

    try {
      const rawDraft = localStorage.getItem(draftStorageKey);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        setName(draft.name || "Untitled Document");
        setCategory(draft.category || "Operations");
        setContent(draft.content || "");
        setDescription(draft.description || "");
        setDocumentMode(draft.documentMode || "blank");
        setHasEnteredBuilder(Boolean(draft.hasEnteredBuilder));
        setLastSavedAt(draft.lastSavedAt ? new Date(draft.lastSavedAt) : null);
        setLastModifiedAt(draft.lastModifiedAt ? new Date(draft.lastModifiedAt) : null);
        setAutosaveState("Saved");
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!hasEnteredBuilder) return;
    setAutosaveState("Unsaved changes");
    const timeout = window.setTimeout(() => {
      const snapshot = {
        name,
        category,
        content,
        description,
        documentMode,
        hasEnteredBuilder,
        lastSavedAt: lastSavedAt?.toISOString() || null,
        lastModifiedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftStorageKey, JSON.stringify(snapshot));
      setLastModifiedAt(new Date());
      setAutosaveState("Saved");
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [category, content, description, documentMode, hasEnteredBuilder, lastSavedAt, name]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const applyContentUpdate = (nextValue: string) => {
    setUndoStack((current) => [...current.slice(-49), content]);
    setRedoStack([]);
    setContent(nextValue);
    setLastModifiedAt(new Date());
  };

  const insertAroundSelection = (before: string, after = "") => {
    const textarea = editorRef.current;
    if (!textarea) {
      applyContentUpdate(`${content}${before}${after}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const nextValue = `${content.slice(0, start)}${before}${selected}${after}${content.slice(end)}`;
    applyContentUpdate(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + before.length + selected.length + after.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((current) => current.slice(0, -1));
    setRedoStack((current) => [content, ...current].slice(0, 50));
    setContent(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setRedoStack((current) => current.slice(1));
    setUndoStack((current) => [...current.slice(-49), content]);
    setContent(next);
  };

  const handleContinue = () => {
    if (documentMode === "template" && !selectedTemplate) {
      setErrorMessage("Please select a template first.");
      return;
    }
    setHasEnteredBuilder(true);
    setErrorMessage(null);
  };

  const handleTemplateSelect = (template: EmployeeTemplate) => {
    setSelectedTemplate(template);
    const initialValues: Record<string, string> = {};
    for (const variable of template.variables || []) {
      switch (variable) {
        case "employee_name":
        case "full_name":
          initialValues[variable] = profile?.fullName || "";
          break;
        case "department":
          initialValues[variable] = profile?.department || "";
          break;
        case "team":
          initialValues[variable] = profile?.team || "";
          break;
        case "today_date":
        case "date":
          initialValues[variable] = new Date().toISOString().split("T")[0];
          break;
        case "employee_email":
          initialValues[variable] = profile?.email || "";
          break;
        default:
          initialValues[variable] = "";
      }
    }
    setTemplateFieldValues(initialValues);
    setName(template.name);
    setCategory(template.category || "Operations");
    setDescription(template.description || "");
  };

  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      const generated = await templatesApi.generateDocumentFromTemplate(selectedTemplate.id, templateFieldValues, name);
      const generatedContent =
        (generated?.data as any)?.content ||
        (generated?.data as any)?.generatedContent ||
        applyTemplateVariables(selectedTemplate.contentTemplate || "", templateFieldValues);
      applyContentUpdate(generatedContent);
    } catch {
      applyContentUpdate(applyTemplateVariables(selectedTemplate.contentTemplate || "", templateFieldValues));
    }
    setHasEnteredBuilder(true);
    setDocumentMode("template");
    showToast("Template applied successfully.");
  };

  const [uploading, setUploading] = useState(false);
  const [formPriority, setFormPriority] = useState("NORMAL");

  const formPresets = [
    {
      id: "leave",
      label: "Leave Application",
      subject: "Annual / Casual Leave Request",
      purpose: "Personal Leave & Family Commitment",
      requestDetails: "I would like to request leave for 3 working days from [Start Date] to [End Date]. All ongoing tasks have been aligned with the team.",
      notes: "Urgent issues can be escalated via mobile / Slack.",
    },
    {
      id: "expense",
      label: "Expense Claim",
      subject: "Travel & Client Expense Reimbursement",
      purpose: "Client Onboarding & Field Visit",
      requestDetails: "1. Flight / Train Travel: ₹4,500\n2. Lodging & Food: ₹3,200\n3. Local Commute: ₹850\nTotal Amount: ₹8,550",
      notes: "Original tax invoices and receipts will be submitted to accounts.",
    },
    {
      id: "it",
      label: "IT Equipment Request",
      subject: "Hardware / Monitor Requisition",
      purpose: "Developer Workspace Upgrade",
      requestDetails: "Requesting a secondary 27-inch 4K monitor and USB-C dock to improve development throughput.",
      notes: "Approved by Team Lead.",
    },
    {
      id: "project",
      label: "Project Sign-off",
      subject: "Project Milestone Delivery & Sign-off",
      purpose: "Sprint Deliverables Approval",
      requestDetails: "Phase 1 deliverables have been tested and deployed to staging environment. Ready for stakeholder review.",
      notes: "Release notes and test coverage reports attached.",
    },
  ];

  const applyFormPreset = (preset: typeof formPresets[0]) => {
    setFormFields({
      subject: preset.subject,
      purpose: preset.purpose,
      requestDetails: preset.requestDetails,
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
      notes: preset.notes,
    });
    setName(preset.subject);
    showToast(`Applied preset: ${preset.label}`);
  };

  const buildFormDocument = () => {
    const docTitle = formFields.subject.trim() || name || "Standard Request Document";
    const generated = `# ${docTitle}

> **Document Type:** Form / Standard Internal Request  
> **Employee:** ${profile?.fullName || "Employee"} (${profile?.email || "employee@docucore.ai"})  
> **Department:** ${profile?.department || "Operations"} | **Team:** ${profile?.team || "General"}  
> **Priority:** ${formPriority} | **Target Due Date:** ${formFields.dueDate || "TBD"}  
> **Generated Date:** ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}  

---

### 1. Purpose & Justification
${formFields.purpose || "Provide the business or operational reason for this request."}

### 2. Request Details & Line Items
${formFields.requestDetails || "Detail the specifications, amounts, dates, or resources required."}

### 3. Additional Instructions & Notes
${formFields.notes || "None provided."}

---
*Prepared via DocuCore Standard Document Form.*
`;
    applyContentUpdate(generated);
    setName(docTitle);
    setHasEnteredBuilder(true);
    setDocumentMode("form");
    showToast("Standard document generated! You can now edit and format in the editor.");
  };

  const handleUploadConvert = async () => {
    if (!uploadFile) {
      setErrorMessage("Please select a file to upload and convert.");
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      const fileNameWithoutExt = uploadFile.name.replace(/\.[^.]+$/, "") || "Uploaded Document";
      setName(fileNameWithoutExt);
      setAttachments((prev) => Array.from(new Set([...prev, uploadFile.name])));

      // 1. Text-based files (txt, md, json, csv)
      if (
        uploadFile.type.startsWith("text/") ||
        uploadFile.name.endsWith(".txt") ||
        uploadFile.name.endsWith(".md") ||
        uploadFile.name.endsWith(".json") ||
        uploadFile.name.endsWith(".csv")
      ) {
        const textContent = await uploadFile.text();
        const generated = `# ${fileNameWithoutExt}\n\n**Source File:** ${uploadFile.name} (${(uploadFile.size / 1024).toFixed(1)} KB)\n**Uploaded:** ${new Date().toLocaleDateString("en-IN")}\n\n---\n\n${textContent}`;
        applyContentUpdate(generated);
        setHasEnteredBuilder(true);
        setDocumentMode("upload");
        showToast(`Loaded ${uploadFile.name} content into editor.`);
      } else {
        // 2. Binary / Image / PDF -> Try OCR extraction
        let extractedText = "";
        try {
          const res = await ocrApi.digitize(uploadFile);
          extractedText = (res?.data as any)?.extractedText || (res?.data as any)?.text || (res?.data as any)?.content || "";
        } catch {
          // If OCR service returns non-200 or backend mock
        }

        if (extractedText.trim()) {
          const generated = `# ${fileNameWithoutExt}\n\n> **OCR Extracted Content** from source: \`${uploadFile.name}\` (${(uploadFile.size / 1024).toFixed(1)} KB)\n\n---\n\n${extractedText}`;
          applyContentUpdate(generated);
          showToast(`Successfully extracted text from ${uploadFile.name}!`);
        } else {
          const generated = `# ${fileNameWithoutExt}

> **Attached Source File:** \`${uploadFile.name}\` (${(uploadFile.size / 1024).toFixed(1)} KB)  
> **Upload Date:** ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}  
> **Status:** File attached to draft ready for submission  

---

### Document Summary & Notes
*The uploaded file \`${uploadFile.name}\` has been converted and attached to this draft. You can write document notes, executive summaries, or edit the content below before sending for review.*
`;
          applyContentUpdate(generated);
          showToast(`Attached ${uploadFile.name} to draft.`);
        }

        setHasEnteredBuilder(true);
        setDocumentMode("upload");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to process the uploaded file.");
    } finally {
      setUploading(false);
    }
  };

  const getSelectedTextRange = () => {
    const textarea = editorRef.current;
    if (!textarea) return { text: content, start: 0, end: content.length };
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end).trim();
    return {
      text: selectedText || content,
      start,
      end,
    };
  };

  const runAiAction = async (action: "IMPROVE" | "GRAMMAR" | "SUMMARIZE" | "REWRITE" | "EXPAND" | "PROFESSIONAL" | "GENERATE") => {
    if (!aiEnabled) return;
    setAiBusy(true);
    setErrorMessage(null);

    const selection = getSelectedTextRange();

    try {
      if (action === "GENERATE") {
        const response = await aiApi.runAiTool({
          tool: "GENERATE_DOC",
          prompt: aiPrompt.trim() || name,
        });
        const dataObj = (response?.data as any) || {};
        const generatedContent = dataObj.generatedContent || dataObj.content || dataObj.documentContent || "";
        const suggestedTitle = dataObj.suggestedTitle || dataObj.documentTitle;
        if (suggestedTitle) setName(suggestedTitle.replace(/\.docx$/i, ""));
        setAiSuggestion({ title: "Generate Content", content: generatedContent });
      } else if (action === "SUMMARIZE") {
        const response = await aiApi.runAiTool({
          tool: "SUMMARIZE_DOC",
          content: selection.text,
        });
        const summary = (response?.data as any)?.summary || "No summary generated.";
        setAiSuggestion({ title: "Summary", content: summary, range: { start: selection.start, end: selection.end } });
      } else {
        const modeMap: Record<string, string> = {
          IMPROVE: "REWRITE",
          GRAMMAR: "GRAMMAR",
          REWRITE: "REWRITE",
          EXPAND: "EXPAND",
          PROFESSIONAL: "PROFESSIONAL_TONE",
        };
        const response = await aiApi.runAiTool({
          tool: "IMPROVE_CONTENT",
          content: selection.text,
          mode: modeMap[action],
        });
        const improvedText = (response?.data as any)?.improvedText || selection.text;
        setAiSuggestion({
          title: action === "GRAMMAR" ? "Fix Grammar" : action === "PROFESSIONAL" ? "Make Professional" : `${action[0]}${action.slice(1).toLowerCase()}`,
          content: improvedText,
          range: { start: selection.start, end: selection.end },
        });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "AI action failed.");
    } finally {
      setAiBusy(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    if (aiSuggestion.range) {
      const nextValue = `${content.slice(0, aiSuggestion.range.start)}${aiSuggestion.content}${content.slice(aiSuggestion.range.end)}`;
      applyContentUpdate(nextValue);
    } else {
      applyContentUpdate(content ? `${content}\n\n${aiSuggestion.content}` : aiSuggestion.content);
    }
    setAiSuggestion(null);
    showToast("AI suggestion applied to document.");
  };

  const downloadPreview = () => {
    const printable = `<!doctype html><html><head><title>${name}</title></head><body style="font-family:${editorFont || 'Georgia'},serif;padding:32px;line-height:1.6;color:#0f172a;"><h1>${name}</h1><p><strong>Employee:</strong> ${profile?.fullName || "Employee"}</p><p><strong>Department:</strong> ${profile?.department || "Department"}</p><p><strong>Date:</strong> ${new Date().toLocaleDateString("en-IN")}</p><hr /><pre style="white-space:pre-wrap;font-family:${editorFont || 'Georgia'},serif;">${content}</pre></body></html>`;
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) return;
    popup.document.write(printable);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const saveDocument = async (submitForApproval = false) => {
    if (!name.trim()) {
      setErrorMessage("Document title is required.");
      return;
    }

    if (!content.trim() && documentMode !== "upload") {
      setErrorMessage("Please add document content before saving.");
      return;
    }

    const payload = {
      name: name.trim(),
      category,
      type: getModeLabel(documentMode),
      description,
      content: submitForApproval
        ? `${content}\n\nWorkflow Submission\nSend To: ${submitTarget}\nComment: ${submitComment}`
        : content,
      status: submitForApproval ? "Pending Approval" : "Draft",
      tags: [documentMode, category.toLowerCase()],
      assignedTo: submitForApproval ? submitTarget : undefined,
      team: profile?.team,
      templateId: selectedTemplate?.id,
      submitApproval: submitForApproval,
      file: uploadFile,
    };

    if (submitForApproval) {
      setSubmitting(true);
    } else {
      setSaving(true);
    }

    try {
      await documentsApi.createDocument(payload);
      const now = new Date();
      setLastSavedAt(now);
      setLastModifiedAt(now);
      setStatus(submitForApproval ? "Submitted" : "Draft");
      localStorage.removeItem(draftStorageKey);

      if (submitForApproval) {
        setWorkflowLocked(true);
        showToast("Document submitted for approval.");
        setTimeout(() => router.push("/employee/documents"), 1000);
      } else {
        showToast("Draft saved to My Documents.");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : submitForApproval ? "Failed to submit document." : "Failed to save draft.");
    } finally {
      setSaving(false);
      setSubmitting(false);
      setSubmitModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-[#274690]" />
          <span className="text-sm font-bold text-slate-700">Loading document builder...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Link
              href="/employee/documents"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="border-[#274690]/20 bg-[#274690]/10 text-[#274690]">Create New Document</Badge>
                <span className="text-xs font-bold text-slate-400">Auto-save: {autosaveState}</span>
              </div>
              <h1 className="mt-1 text-2xl font-black text-slate-900">Create New Document</h1>
              <p className="text-xs text-slate-500">Back to My Documents, choose your document flow, then save or submit through workflow.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>Last saved: {formatDateTime(lastSavedAt)}</span>
            <span>Word count: {wordCount}</span>
            <span>Characters: {charCount}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Document title"
            className="w-full min-w-65 bg-white sm:w-80"
            disabled={workflowLocked}
          />
          <Button variant="outline" onClick={() => saveDocument(false)} disabled={saving || submitting || workflowLocked}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={handleContinue} disabled={workflowLocked} className="bg-[#274690] text-white hover:bg-[#1f3561]">
            <PenLine className="mr-2 h-4 w-4" /> {hasEnteredBuilder ? "Continue Editing" : "Create / Continue"}
          </Button>
        </div>
      </div>

      {toastMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          <X className="h-4 w-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900">Choose Document Type</h2>
            <p className="text-xs text-slate-500">Pick how this document should be created before entering the main builder.</p>
          </div>
          <Badge className="bg-slate-100 text-slate-600">Step 1</Badge>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {documentTypeOptions.map((option) => {
            const Icon = option.icon;
            const selected = documentMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setDocumentMode(option.id);
                  if (option.id === "blank") {
                    setHasEnteredBuilder(true);
                  } else {
                    setHasEnteredBuilder(false);
                  }
                }}
                className={`rounded-3xl border p-4 text-left transition ${
                  selected ? "border-[#274690] bg-[#274690]/5 shadow-sm" : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
                }`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#274690] shadow-sm">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-sm font-black text-slate-900">{option.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{option.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>

      {documentMode === "template" && !hasEnteredBuilder && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Select Template</h2>
              <p className="text-xs text-slate-500">Only published/shared templates available to employees are shown here.</p>
            </div>
            <Input
              value={templateSearch}
              onChange={(event) => setTemplateSearch(event.target.value)}
              placeholder="Search templates..."
              className="w-full lg:w-72"
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3">
              {templatesLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Loading employee templates...</div>
              ) : filteredTemplates.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No published templates found.</div>
              ) : (
                filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedTemplate?.id === template.id ? "border-[#274690] bg-[#274690]/5" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{template.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">{template.description}</p>
                      </div>
                      <Badge className="bg-slate-100 text-slate-600">{template.category || "General"}</Badge>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
              <h3 className="text-sm font-black text-slate-900">Template Preview</h3>
              {selectedTemplate ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                    <p className="font-bold text-slate-800">{selectedTemplate.name}</p>
                    <p className="mt-1">{selectedTemplate.description}</p>
                  </div>
                  <div className="space-y-3">
                    {templateVariables.map((variable) => (
                      <div key={variable}>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{variable.replace(/_/g, " ")}</label>
                        <Input
                          value={templateFieldValues[variable] || ""}
                          onChange={(event) =>
                            setTemplateFieldValues((current) => ({
                              ...current,
                              [variable]: event.target.value,
                            }))
                          }
                          disabled={workflowLocked}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-3 text-xs whitespace-pre-wrap text-slate-700">
                    {applyTemplateVariables(selectedTemplate.contentTemplate || "", templateFieldValues).slice(0, 600) || "Template content preview"}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" onClick={() => setSelectedTemplate(null)} disabled={workflowLocked}>Cancel</Button>
                    <Button onClick={handleUseTemplate} disabled={workflowLocked} className="bg-[#274690] text-white hover:bg-[#1f3561]">Use Template</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Choose a template to preview and auto-fill employee details.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {documentMode === "ai" && !hasEnteredBuilder && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">AI Generated Document</h2>
              <p className="text-xs text-slate-500">Write the intent or prompt and generate a working draft.</p>
            </div>
            <Badge className={aiEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>{aiEnabled ? aiCreditsLabel : "AI unavailable"}</Badge>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
            <textarea
              rows={4}
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              placeholder="Example: Draft a leave application for 3 days due to family emergency."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none focus:border-[#274690]"
            />
            <Button
              onClick={async () => {
                await runAiAction("GENERATE");
                setHasEnteredBuilder(true);
              }}
              disabled={!aiEnabled || aiBusy || workflowLocked}
              className="h-fit bg-[#274690] text-white hover:bg-[#1f3561]"
            >
              {aiBusy ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Draft
            </Button>
          </div>
        </div>
      )}

      {documentMode === "form" && !hasEnteredBuilder && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Form / Standard Document</h2>
              <p className="text-xs text-slate-500">Create a structured employee request or standard internal form with presets.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Quick Presets:</span>
              {formPresets.map((preset) => (
                <Button
                  key={preset.id}
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => applyFormPreset(preset)}
                  className="rounded-xl text-xs font-semibold hover:border-[#274690] hover:text-[#274690]"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Subject / Request Title</label>
              <Input
                value={formFields.subject}
                onChange={(event) => setFormFields((current) => ({ ...current, subject: event.target.value }))}
                placeholder="e.g. Annual Leave Request or Expense Reimbursement"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Priority</label>
                <select
                  value={formPriority}
                  onChange={(event) => setFormPriority(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Due Date</label>
                <Input
                  type="date"
                  value={formFields.dueDate}
                  onChange={(event) => setFormFields((current) => ({ ...current, dueDate: event.target.value }))}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Purpose & Justification</label>
              <textarea
                rows={3}
                value={formFields.purpose}
                onChange={(event) => setFormFields((current) => ({ ...current, purpose: event.target.value }))}
                placeholder="Explain the business context or personal justification..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#274690]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Request Details & Line Items</label>
              <textarea
                rows={4}
                value={formFields.requestDetails}
                onChange={(event) => setFormFields((current) => ({ ...current, requestDetails: event.target.value }))}
                placeholder="List specifications, dates, expenses, or equipment details..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#274690]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Additional Instructions / Notes</label>
              <textarea
                rows={2}
                value={formFields.notes}
                onChange={(event) => setFormFields((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Any special handling, links, or contact instructions..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#274690]"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setHasEnteredBuilder(true);
              }}
            >
              Skip to Blank Editor
            </Button>
            <Button
              type="button"
              onClick={buildFormDocument}
              className="bg-[#274690] text-white hover:bg-[#1f3561]"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Generate & Open in Editor
            </Button>
          </div>
        </div>
      )}

      {documentMode === "upload" && !hasEnteredBuilder && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900">Upload & Convert</h2>
            <p className="text-xs text-slate-500">Attach an existing PDF, DOCX, TXT, CSV, or image file and continue editing as a managed draft.</p>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) setUploadFile(file);
            }}
            className="mt-5 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-8 text-center transition hover:border-[#274690]/50 hover:bg-[#274690]/5"
          >
            <UploadCloud className="mx-auto h-12 w-12 text-[#274690]" />
            <p className="mt-3 text-base font-bold text-slate-800">Drag & Drop your document here, or browse</p>
            <p className="mt-1 text-xs text-slate-500">Supports PDF, DOCX, TXT, Markdown, CSV, JSON, PNG, JPG (up to 25MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md,.json,.csv,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
            />
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="mr-2 h-4 w-4" />
                Browse File
              </Button>
              <Button
                type="button"
                onClick={handleUploadConvert}
                disabled={!uploadFile || uploading}
                className="bg-[#274690] text-white hover:bg-[#1f3561]"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Converting & Attaching...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Convert & Open in Editor
                  </>
                )}
              </Button>
            </div>
            {uploadFile && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)</span>
                <button
                  type="button"
                  onClick={() => setUploadFile(null)}
                  className="ml-2 text-emerald-600 hover:text-emerald-900"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {hasEnteredBuilder && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
          <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Document Title</label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} disabled={workflowLocked} className="font-bold" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Category</label>
                  <select value={category} onChange={(event) => setCategory(event.target.value)} disabled={workflowLocked} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Legal">Legal</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Human Resources">Human Resources</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Active Source:</span>
                <Badge className="bg-[#274690]/10 text-[#274690] font-bold">{getModeLabel(documentMode)}</Badge>
                {uploadFile && (
                  <span className="text-xs font-medium text-slate-500">
                    (File: {uploadFile.name})
                  </span>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setHasEnteredBuilder(false)}
                className="text-xs font-bold text-slate-600 hover:text-[#274690]"
              >
                Change Setup / Reconfigure
              </Button>
            </div>

            {!isPreview && (
              <div className="border-b border-slate-100 bg-slate-50/80 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleUndo} disabled={undoStack.length === 0 || workflowLocked}><Undo2 className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={handleRedo} disabled={redoStack.length === 0 || workflowLocked}><Redo2 className="h-4 w-4" /></Button>
                  <select value={editorFont} onChange={(event) => setEditorFont(event.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
                    {fontFamilies.map((font) => <option key={font} value={font}>{font}</option>)}
                  </select>
                  <select value={editorFontSize} onChange={(event) => setEditorFontSize(Number(event.target.value))} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
                    {fontSizes.map((size) => <option key={size} value={size}>{size}px</option>)}
                  </select>
                  <Input type="color" value={editorTextColor} onChange={(event) => setEditorTextColor(event.target.value)} className="h-9 w-14 rounded-xl p-1" />
                  <Button size="sm" variant="outline" onClick={() => insertAroundSelection("**", "**")} disabled={workflowLocked}><Bold className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => insertAroundSelection("_", "_")} disabled={workflowLocked}><Italic className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => insertAroundSelection("<u>", "</u>")} disabled={workflowLocked}><Underline className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => setEditorAlignment("left")}><AlignLeft className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => setEditorAlignment("center")}><AlignCenter className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => setEditorAlignment("right")}><AlignRight className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => insertAroundSelection("\n# ")} disabled={workflowLocked}><Heading1 className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => insertAroundSelection("\n- ")} disabled={workflowLocked}><List className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => insertAroundSelection("\n1. ")} disabled={workflowLocked}><ListOrdered className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => insertAroundSelection("[link text](https://)")} disabled={workflowLocked}><Link2 className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => insertAroundSelection("\n![Image description](https://)\n")} disabled={workflowLocked}><ImageIcon className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => insertAroundSelection("\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Value | Value |\n")} disabled={workflowLocked}><TableIcon className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={workflowLocked}><Paperclip className="h-4 w-4" /></Button>
                </div>
              </div>
            )}

            <div className="p-6">
              {isPreview ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-8">
                  <div className="border-b border-slate-200 pb-4">
                    <h2 className="text-center text-2xl font-black text-slate-900">{name}</h2>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
                    <p><span className="font-bold">Employee:</span> {profile?.fullName || "Shikha Gour"}</p>
                    <p><span className="font-bold">Department:</span> {profile?.department || "HR"}</p>
                    <p><span className="font-bold">Date:</span> {new Date().toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-800">{content || "Document content..."}</div>
                  <div className="mt-8 flex flex-wrap items-center justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsPreview(false)}>Back to Edit</Button>
                    <Button variant="outline" onClick={downloadPreview}><Download className="mr-2 h-4 w-4" />Download PDF</Button>
                    <Button onClick={() => setSubmitModalOpen(true)} disabled={workflowLocked} className="bg-[#274690] text-white hover:bg-[#1f3561]">Submit</Button>
                  </div>
                </div>
              ) : (
                <textarea
                  ref={editorRef}
                  rows={24}
                  value={content}
                  onChange={(event) => applyContentUpdate(event.target.value)}
                  disabled={workflowLocked}
                  placeholder="Document Title\nStart typing your document here..."
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50/30 p-5 outline-none focus:border-[#274690]"
                  style={{
                    fontFamily: editorFont,
                    fontSize: `${editorFontSize}px`,
                    color: editorTextColor,
                    textAlign: editorAlignment,
                    minHeight: 520,
                  }}
                />
              )}
            </div>
          </div>

          <div className="space-y-6">
            {aiEnabled && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[#274690]" />
                    <h3 className="text-sm font-black text-slate-900">AI Assistant</h3>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700">{aiCreditsLabel}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => runAiAction("IMPROVE")} disabled={aiBusy || workflowLocked}><Wand2 className="mr-2 h-4 w-4" />Improve Writing</Button>
                  <Button size="sm" variant="outline" onClick={() => runAiAction("GRAMMAR")} disabled={aiBusy || workflowLocked}>Fix Grammar</Button>
                  <Button size="sm" variant="outline" onClick={() => runAiAction("SUMMARIZE")} disabled={aiBusy || workflowLocked}>Summarize</Button>
                  <Button size="sm" variant="outline" onClick={() => runAiAction("REWRITE")} disabled={aiBusy || workflowLocked}>Rewrite</Button>
                  <Button size="sm" variant="outline" onClick={() => runAiAction("EXPAND")} disabled={aiBusy || workflowLocked}>Expand Content</Button>
                  <Button size="sm" variant="outline" onClick={() => runAiAction("PROFESSIONAL")} disabled={aiBusy || workflowLocked}>Make Professional</Button>
                </div>
                <div className="mt-3 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Generate Content</label>
                  <textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#274690]" placeholder="Describe what content AI should generate..." />
                  <Button onClick={() => runAiAction("GENERATE")} disabled={aiBusy || workflowLocked} className="w-full bg-[#274690] text-white hover:bg-[#1f3561]">
                    {aiBusy ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate Content
                  </Button>
                </div>
                {aiSuggestion && (
                  <div className="mt-4 rounded-2xl border border-[#274690]/20 bg-[#274690]/5 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black text-slate-900">{aiSuggestion.title}</p>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setAiSuggestion(null)}>Dismiss</Button>
                        <Button size="sm" onClick={applyAiSuggestion} className="bg-[#274690] text-white hover:bg-[#1f3561]">Apply</Button>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{aiSuggestion.content}</p>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">Document Details</h3>
                <ShieldCheck className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {documentDetails.map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-3 py-2.5">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-right font-bold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Status changes follow workflow rules. Employee cannot manually change status to Submitted, Approved, or Rejected.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-black text-slate-900">Attachments</h3>
                </div>
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={workflowLocked}>Attach File</Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  if (!file) return;
                  setUploadFile(file);
                  setAttachments((current) => [...current, file.name]);
                }}
              />
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {attachments.length === 0 && !uploadFile ? <p>No attachments added yet.</p> : null}
                {uploadFile && <div className="rounded-2xl bg-slate-50 px-3 py-2 font-semibold">Primary file: {uploadFile.name}</div>}
                {attachments.map((attachment) => (
                  <div key={attachment} className="rounded-2xl bg-slate-50 px-3 py-2 font-semibold">{attachment}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Status: <strong className="text-slate-800">{status}</strong></span>
            <span>Last modified: {formatDateTime(lastModifiedAt)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => saveDocument(false)} disabled={saving || submitting || workflowLocked || !hasEnteredBuilder}>
              <Save className="mr-2 h-4 w-4" />Save Draft
            </Button>
            <Button variant="outline" onClick={() => setIsPreview((current) => !current)} disabled={!hasEnteredBuilder}>
              <Eye className="mr-2 h-4 w-4" />{isPreview ? "Back to Edit" : "Preview"}
            </Button>
            <Button onClick={() => setSubmitModalOpen(true)} disabled={workflowLocked || !hasEnteredBuilder} className="bg-[#274690] text-white hover:bg-[#1f3561]">
              <Send className="mr-2 h-4 w-4" />Submit for Approval
            </Button>
          </div>
        </div>
      </div>

      {submitModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Submit Document</h3>
                <p className="text-sm text-slate-500">Send document through the configured employee approval workflow.</p>
              </div>
              <button onClick={() => setSubmitModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Send To</label>
                <select value={submitTarget} onChange={(event) => setSubmitTarget(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
                  <option>Department Manager</option>
                  <option>Team Leader</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Comment</label>
                <textarea value={submitComment} onChange={(event) => setSubmitComment(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#274690]" />
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                After submission, this document follows workflow rules and employee editing may be locked.
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSubmitModalOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={() => saveDocument(true)} disabled={submitting} className="bg-[#274690] text-white hover:bg-[#1f3561]">
                {submitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
