"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Eye,
  Save,
  CheckCircle,
  Sparkles,
  Undo2,
  Redo2,
  Table as TableIcon,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Minus,
  FileCode,
  FileSignature,
  Calendar,
  CheckSquare,
  Building2,
  User,
  Briefcase,
  DollarSign,
  Plus,
  Copy,
  Settings,
  History,
  Check,
  Search,
  Sliders,
  ChevronDown,
  Layers,
  Image as ImageIcon,
  Share2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TemplateDetailsData } from "./TemplateDetailsStep";
import TemplatePreviewModal from "./TemplatePreviewModal";
import TableBuilderModal from "./TableBuilderModal";

interface TemplateDesignerProps {
  details: TemplateDetailsData;
  initialContent?: string;
  initialStatus?: "Draft" | "Active";
  onBack: () => void;
  onSaveDraft: (content: string) => void;
  onPublish: (content: string) => void;
}

const DEFAULT_OFFER_LETTER_CONTENT = `# EMPLOYMENT OFFER LETTER

**Date:** {{joining_date}}

**To:** {{employee_name}}  
**Address:** {{client_address}}  
**Employee ID:** {{employee_id}}

Dear {{employee_name}},

We are pleased to formally extend an offer of employment for the position of **{{designation}}** in the **{{department}}** department at **{{organisation_name}}**.

---

### 1. Position & Reporting Structure
You will report directly to **{{manager_name}}**. Your responsibilities, key deliverables, and standard operating standards will be governed by company policy.

### 2. Compensation & Benefits Breakdown
Your annual Cost to Company (CTC) will be **{{total_salary}}**, structured as outlined below:

| Component / Item | Breakdown Standard | Amount / Value |
| :--- | :--- | :--- |
| Basic Salary | 50% of Total CTC | {{basic_salary}} |
| House Rent Allowance (HRA) | 40% of Basic | {{hra}} |
| Special Allowance | Discretionary Balance | {{special_allowance}} |
| Total Gross Annual CTC | All Inclusive | {{total_salary}} |

### 3. Terms of Employment & Probation
{{#if probation_period}}
- **Probationary Period:** You will undergo a formal probation period of **{{probation_period}} months**, evaluated by your reporting manager.
{{/if}}
- **Working Hours & Location:** As assigned in accordance with your official team schedule.
- **Confidentiality:** You agree to adhere strictly to all proprietary data protection and non-disclosure standards.

### 4. Key Job Responsibilities
{{AI_JOB_RESPONSIBILITIES}}

Please sign and return the duplicate copy of this letter on or before **{{joining_date}}** as confirmation of your acceptance.

---

### Authorized Digital Signatures

| For and on behalf of Employer | Candidate Acceptance Signatory |
| :--- | :--- |
| _____________________________ | _____________________________ |
| **Name:** {{manager_name}} | **Name:** {{employee_name}} |
| **Designation:** HR Director | **Designation:** {{designation}} |
| **Date:** {{joining_date}} | **Date:** {{joining_date}} |
| *E-Signature Status: Verified* | *E-Signature Status: Pending* |
`;

export default function TemplateDesigner({
  details,
  initialContent = DEFAULT_OFFER_LETTER_CONTENT,
  initialStatus = "Draft",
  onBack,
  onSaveDraft,
  onPublish,
}: TemplateDesignerProps) {
  // Canvas State
  const [content, setContent] = useState<string>(initialContent);
  const [status, setStatus] = useState<"Draft" | "Active">(initialStatus);
  const [saveStatus, setSaveStatus] = useState<string>("Draft saved just now");
  const [activeRightTab, setActiveRightTab] = useState<"variables" | "branding" | "settings">("variables");
  const [variableSearch, setVariableSearch] = useState<string>("");

  // Modals
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showTableBuilder, setShowTableBuilder] = useState<boolean>(false);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  // Formatting & Page Settings
  const [fontFamily, setFontFamily] = useState<string>("Georgia");
  const [fontSize, setFontSize] = useState<string>("13px");
  const [lineSpacing, setLineSpacing] = useState<string>("1.6");
  const [pageSize, setPageSize] = useState<"A4" | "Letter" | "Legal">("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margins, setMargins] = useState<"normal" | "narrow" | "wide">("normal");

  // Branding Toggles
  const [includeHeaderLogo, setIncludeHeaderLogo] = useState<boolean>(true);
  const [includeFooterNotice, setIncludeFooterNotice] = useState<boolean>(true);

  // Undo / Redo History
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-save timer simulator
  useEffect(() => {
    const timer = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setSaveStatus(`Auto-saved at ${timeStr}`);
    }, 45000);
    return () => clearInterval(timer);
  }, []);

  const updateContentWithHistory = (newContent: string) => {
    setContent(newContent);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setSaveStatus(`Saved at ${timeStr}`);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = historyIndex - 1;
      setHistoryIndex(prev);
      setContent(history[prev]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = historyIndex + 1;
      setHistoryIndex(next);
      setContent(history[next]);
    }
  };

  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      updateContentWithHistory(content + textToInsert);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const updated = currentVal.substring(0, start) + textToInsert + currentVal.substring(end);
    updateContentWithHistory(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
    }, 10);
  };

  const wrapSelectionWith = (before: string, after: string = before) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    const selected = currentVal.substring(start, end) || "Text";

    const updated = currentVal.substring(0, start) + before + selected + after + currentVal.substring(end);
    updateContentWithHistory(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selected.length;
    }, 10);
  };

  const handleCopyVariable = (varName: string) => {
    navigator.clipboard.writeText(`{{${varName}}}`);
    setCopiedVariable(varName);
    setTimeout(() => setCopiedVariable(null), 1500);
  };

  const handleSaveDraftAction = () => {
    setStatus("Draft");
    setSaveStatus("Draft saved successfully");
    onSaveDraft(content);
  };

  const handlePublishAction = () => {
    setStatus("Active");
    setSaveStatus("Published & Active for all employees");
    onPublish(content);
  };

  // Variables catalog
  const VARIABLE_GROUPS = [
    {
      group: "Organisation",
      icon: Building2,
      color: "text-blue-700 bg-blue-50 border-blue-200",
      items: [
        { name: "organisation_name", desc: "Company registered name" },
        { name: "organisation_address", desc: "Official headquarters address" },
        { name: "organisation_email", desc: "Official support/HR email" },
        { name: "organisation_phone", desc: "Company phone number" },
        { name: "company_website", desc: "Corporate URL" },
      ],
    },
    {
      group: "Employee",
      icon: User,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      items: [
        { name: "employee_name", desc: "Full legal name" },
        { name: "employee_id", desc: "Internal employee code" },
        { name: "designation", desc: "Designated role / job title" },
        { name: "department", desc: "Assigned department" },
        { name: "joining_date", desc: "Official joining date" },
        { name: "manager_name", desc: "Reporting manager" },
      ],
    },
    {
      group: "Salary & Financial",
      icon: DollarSign,
      color: "text-amber-800 bg-amber-50 border-amber-200",
      items: [
        { name: "basic_salary", desc: "Basic monthly/annual base" },
        { name: "hra", desc: "House rent allowance" },
        { name: "special_allowance", desc: "Discretionary allowance" },
        { name: "total_salary", desc: "Annual total CTC" },
        { name: "contract_value", desc: "Total engagement fee" },
        { name: "probation_period", desc: "Probation duration in months" },
      ],
    },
    {
      group: "Client / CRM",
      icon: Briefcase,
      color: "text-purple-700 bg-purple-50 border-purple-200",
      items: [
        { name: "client_name", desc: "Client primary contact" },
        { name: "client_company", desc: "Client legal entity name" },
        { name: "client_email", desc: "Client billing email" },
        { name: "client_address", desc: "Client registered office" },
      ],
    },
  ];

  return (
    <div className="w-full h-full min-h-[calc(100vh-80px)] flex flex-col bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden shadow-xl animate-in fade-in">
      {/* 1. TOP HEADER & ACTION BAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-9 px-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 gap-1.5"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </Button>

          <div className="h-5 w-px bg-slate-200" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 tracking-tight">
                {details.name}
              </h1>
              <Badge
                className={`text-[10px] font-bold ${
                  status === "Active"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-amber-100 text-amber-800 border-amber-200"
                }`}
              >
                {status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <span>{details.category}</span>
              <span>•</span>
              <span>{details.visibility}</span>
              <span>•</span>
              <span className="text-slate-500 font-semibold">{saveStatus}</span>
            </div>
          </div>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Live Preview */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreviewModal(true)}
            className="h-9 rounded-xl text-xs font-bold text-[#274690] border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 gap-1.5"
          >
            <Eye size={14} />
            <span>Preview</span>
          </Button>

          {/* Save Draft */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveDraftAction}
            className="h-9 rounded-xl text-xs font-bold text-slate-800 border-slate-300 hover:bg-slate-50 gap-1.5"
          >
            <Save size={14} />
            <span>Save Draft</span>
          </Button>

          {/* Publish Template */}
          <Button
            type="button"
            size="sm"
            onClick={handlePublishAction}
            className="h-9 rounded-xl bg-[#274690] hover:bg-[#1f3561] text-xs font-bold text-white shadow-md shadow-[#274690]/20 gap-1.5 px-4"
          >
            <CheckCircle size={14} />
            <span>Publish Template</span>
          </Button>
        </div>
      </div>

      {/* 2. FORMATTING TOOLBAR */}
      <div className="bg-slate-50/90 border-b border-slate-200 px-6 py-2 flex items-center justify-between overflow-x-auto text-xs shrink-0">
        <div className="flex items-center gap-1">
          {/* Undo / Redo */}
          <button
            type="button"
            disabled={historyIndex <= 0}
            onClick={handleUndo}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            disabled={historyIndex >= history.length - 1}
            onClick={handleRedo}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={15} />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1.5" />

          {/* Headings */}
          <button
            type="button"
            onClick={() => insertTextAtCursor("\n# Heading 1\n")}
            className="px-2 py-1 hover:bg-white text-slate-700 rounded-md font-bold text-xs"
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor("\n## Heading 2\n")}
            className="px-2 py-1 hover:bg-white text-slate-700 rounded-md font-bold text-xs"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor("\n### Heading 3\n")}
            className="px-2 py-1 hover:bg-white text-slate-700 rounded-md font-bold text-xs"
            title="Heading 3"
          >
            H3
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1.5" />

          {/* Text Style */}
          <button
            type="button"
            onClick={() => wrapSelectionWith("**")}
            className="p-1.5 text-slate-700 hover:bg-white rounded-md font-bold"
            title="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => wrapSelectionWith("*")}
            className="p-1.5 text-slate-700 hover:bg-white rounded-md italic"
            title="Italic"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => wrapSelectionWith("<u>", "</u>")}
            className="p-1.5 text-slate-700 hover:bg-white rounded-md underline"
            title="Underline"
          >
            <Underline size={14} />
          </button>
          <button
            type="button"
            onClick={() => wrapSelectionWith("~~")}
            className="p-1.5 text-slate-700 hover:bg-white rounded-md line-through"
            title="Strikethrough"
          >
            <Strikethrough size={14} />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1.5" />

          {/* Lists & Dividers */}
          <button
            type="button"
            onClick={() => insertTextAtCursor("\n- Item 1\n- Item 2\n- Item 3\n")}
            className="p-1.5 text-slate-700 hover:bg-white rounded-md"
            title="Bullet List"
          >
            <List size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor("\n1. Step 1\n2. Step 2\n3. Step 3\n")}
            className="p-1.5 text-slate-700 hover:bg-white rounded-md"
            title="Numbered List"
          >
            <ListOrdered size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor("\n---\n")}
            className="p-1.5 text-slate-700 hover:bg-white rounded-md"
            title="Divider Line"
          >
            <Minus size={14} />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1.5" />

          {/* Table & Page Break */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowTableBuilder(true)}
            className="h-7 px-2 text-xs font-bold text-[#274690] hover:bg-blue-50 rounded-md gap-1"
          >
            <TableIcon size={14} />
            <span>Table Builder</span>
          </Button>

          <button
            type="button"
            onClick={() => insertTextAtCursor("\n\n<!-- pagebreak -->\n\n## Page 2\n")}
            className="px-2 py-1 text-purple-700 hover:bg-purple-50 rounded-md font-semibold text-xs flex items-center gap-1"
            title="Insert Page Break"
          >
            <FileCode size={13} />
            <span>Page Break</span>
          </button>
        </div>

        {/* Font size & line spacing indicators */}
        <div className="hidden lg:flex items-center gap-2 text-slate-500 text-[11px] font-medium">
          <span>Font: {fontFamily}</span>
          <span>•</span>
          <span>Size: {fontSize}</span>
          <span>•</span>
          <span>Spacing: {lineSpacing}</span>
        </div>
      </div>

      {/* 3. 3-COLUMN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================
            LEFT COLUMN: ELEMENTS PALETTE
           ======================================================== */}
        <div className="w-64 bg-white border-r border-slate-200 p-4 overflow-y-auto space-y-5 text-xs shrink-0 shadow-xs">
          {/* Group 1: Content Elements */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
              Content Elements
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => insertTextAtCursor("\n### Section Title\nDetailed paragraph text goes here.\n")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-[#274690] hover:bg-blue-50/40 transition font-semibold text-slate-800 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 group-hover:text-[#274690]">T</span>
                  <span>Text / Paragraph</span>
                </div>
                <Plus size={13} className="text-slate-300 group-hover:text-[#274690]" />
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor("\n# Document Heading\n")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-[#274690] hover:bg-blue-50/40 transition font-semibold text-slate-800 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <Heading1 size={14} className="text-slate-500 group-hover:text-[#274690]" />
                  <span>Heading Title</span>
                </div>
                <Plus size={13} className="text-slate-300 group-hover:text-[#274690]" />
              </button>

              <button
                type="button"
                onClick={() => setShowTableBuilder(true)}
                className="w-full text-left p-2.5 rounded-xl border border-blue-200 bg-blue-50/30 hover:bg-blue-50 transition font-semibold text-[#274690] flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <TableIcon size={14} className="text-[#274690]" />
                  <span>Table Builder</span>
                </div>
                <Plus size={13} className="text-[#274690]" />
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor("\n![Company Logo]({{company_logo_url}})\n")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-[#274690] hover:bg-blue-50/40 transition font-semibold text-slate-800 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-500 group-hover:text-[#274690]" />
                  <span>Branding Image</span>
                </div>
                <Plus size={13} className="text-slate-300 group-hover:text-[#274690]" />
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor("\n---\n")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-[#274690] hover:bg-blue-50/40 transition font-semibold text-slate-800 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <Minus size={14} className="text-slate-500 group-hover:text-[#274690]" />
                  <span>Divider Line</span>
                </div>
                <Plus size={13} className="text-slate-300 group-hover:text-[#274690]" />
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor("\n<!-- pagebreak -->\n\n## Next Page\n")}
                className="w-full text-left p-2.5 rounded-xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50 transition font-semibold text-purple-900 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <FileCode size={14} className="text-purple-600" />
                  <span>Page Break</span>
                </div>
                <Plus size={13} className="text-purple-600" />
              </button>
            </div>
          </div>

          {/* Group 2: Dynamic Fields */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
              Dynamic Fields
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => insertTextAtCursor(" {{custom_variable}} ")}
                className="w-full text-left p-2 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition font-mono text-[11px] text-emerald-800 flex items-center justify-between"
              >
                <span>{"{{custom_variable}}"}</span>
                <Plus size={13} />
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor(" {{effective_date}} ")}
                className="w-full text-left p-2 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition font-semibold text-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-emerald-700" />
                  <span>Date Picker Field</span>
                </div>
                <Plus size={13} className="text-slate-300" />
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor("\n**Options Checklist:**\n- [ ] Clause Accepted\n- [ ] Statutory Compliance Signed\n- [ ] Background Verification Complete\n")}
                className="w-full text-left p-2 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition font-semibold text-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CheckSquare size={13} className="text-emerald-700" />
                  <span>Checkbox Group</span>
                </div>
                <Plus size={13} className="text-slate-300" />
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor("\n\n| Authorized Signatory | Employee Signatory |\n| :--- | :--- |\n| ____________________ | ____________________ |\n| **Name:** {{manager_name}} | **Name:** {{employee_name}} |\n| **Date:** {{joining_date}} | **Date:** {{joining_date}} |\n| *E-Sign: Verified* | *E-Sign: Pending* |\n")}
                className="w-full text-left p-2 rounded-xl border border-slate-200 hover:border-[#274690] hover:bg-blue-50/40 transition font-semibold text-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FileSignature size={13} className="text-[#274690]" />
                  <span>E-Signatures Block</span>
                </div>
                <Plus size={13} className="text-slate-300" />
              </button>
            </div>
          </div>

          {/* Group 3: AI & Conditional Sections */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block mb-2">
              ⚡ AI & Conditional
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => insertTextAtCursor("\n### Job Responsibilities\n{{AI_JOB_RESPONSIBILITIES}}\n")}
                className="w-full text-left p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100 transition font-semibold text-purple-950 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-purple-600" />
                  <span>AI Responsibilities</span>
                </div>
                <Plus size={13} className="text-purple-600" />
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor("\n### Executive Scope Summary\n{{AI_SUMMARY}}\n")}
                className="w-full text-left p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100 transition font-semibold text-purple-950 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-purple-600" />
                  <span>AI Summary Section</span>
                </div>
                <Plus size={13} className="text-purple-600" />
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor("\n{{#if probation_period}}\n**Probation Period:** {{probation_period}} Months\n{{/if}}\n")}
                className="w-full text-left p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 transition font-mono text-[11px] text-amber-900 flex items-center justify-between"
              >
                <span>{"{{#if condition}}"}</span>
                <Plus size={13} className="text-amber-700" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================
            CENTER COLUMN: DOCUMENT CANVAS (PAPER VIEW)
           ======================================================== */}
        <div className="flex-1 bg-slate-200/60 p-6 md:p-8 overflow-y-auto flex justify-center items-start">
          <div
            style={{
              fontFamily,
              fontSize,
              lineHeight: lineSpacing,
            }}
            className="w-full max-w-[760px] min-h-[960px] bg-white rounded-2xl shadow-xl border border-slate-300/80 p-10 md:p-14 flex flex-col justify-between transition-all"
          >
            {/* Paper Header / Company Branding */}
            {includeHeaderLogo && (
              <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#274690] to-[#1B2A4A] text-white flex items-center justify-center font-black text-xs shadow-xs">
                    DC
                  </div>
                  <div>
                    <div className="font-black text-xs text-slate-900 tracking-tight">
                      {"{{organisation_name}}"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {"{{organisation_address}}"}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-400">
                  <div className="font-semibold text-slate-600">{"{{company_website}}"}</div>
                  <div>{"{{organisation_email}}"}</div>
                </div>
              </div>
            )}

            {/* Editable Content Canvas */}
            <div className="flex-1 flex flex-col">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => updateContentWithHistory(e.target.value)}
                placeholder="Start typing your official template content here..."
                rows={28}
                className="w-full flex-1 resize-none font-sans text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none leading-relaxed selection:bg-blue-100"
              />
            </div>

            {/* Paper Footer */}
            {includeFooterNotice && (
              <div className="border-t border-slate-200 pt-4 mt-8 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-medium">
                  Confidential & Proprietary • {"{{organisation_name}}"}
                </span>
                <span className="font-mono">
                  Official Blueprint • Page 1
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: PROPERTIES & VARIABLES PANEL
           ======================================================== */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col overflow-hidden text-xs shrink-0 shadow-xs">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 p-1">
            <button
              type="button"
              onClick={() => setActiveRightTab("variables")}
              className={`flex-1 py-2 font-bold rounded-xl transition ${
                activeRightTab === "variables"
                  ? "bg-white text-[#274690] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Variables
            </button>
            <button
              type="button"
              onClick={() => setActiveRightTab("branding")}
              className={`flex-1 py-2 font-bold rounded-xl transition ${
                activeRightTab === "branding"
                  ? "bg-white text-[#274690] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Branding
            </button>
            <button
              type="button"
              onClick={() => setActiveRightTab("settings")}
              className={`flex-1 py-2 font-bold rounded-xl transition ${
                activeRightTab === "settings"
                  ? "bg-white text-[#274690] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Page Setup
            </button>
          </div>

          {/* Panel Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-5">
            {activeRightTab === "variables" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Database Variables ⭐
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click to insert variable token directly into canvas at cursor.
                  </p>
                </div>

                {/* Search Variables */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search variable name..."
                    value={variableSearch}
                    onChange={(e) => setVariableSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#274690] focus:outline-none"
                  />
                </div>

                {/* Variable Groups */}
                <div className="space-y-4">
                  {VARIABLE_GROUPS.map((grp) => {
                    const filteredItems = grp.items.filter((item) =>
                      item.name.toLowerCase().includes(variableSearch.toLowerCase()) ||
                      item.desc.toLowerCase().includes(variableSearch.toLowerCase())
                    );

                    if (filteredItems.length === 0) return null;

                    const IconComponent = grp.icon;

                    return (
                      <div key={grp.group} className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <IconComponent size={14} className="text-slate-500" />
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            {grp.group}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {filteredItems.map((item) => (
                            <div
                              key={item.name}
                              className="p-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#274690] transition flex items-center justify-between gap-2 group"
                            >
                              <button
                                type="button"
                                onClick={() => insertTextAtCursor(`{{${item.name}}}`)}
                                className="text-left flex-1"
                              >
                                <div className="font-mono text-[11px] font-bold text-[#274690]">
                                  {"{{" + item.name + "}}"}
                                </div>
                                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                                  {item.desc}
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyVariable(item.name)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                                title="Copy token"
                              >
                                {copiedVariable === item.name ? (
                                  <Check size={13} className="text-emerald-600" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeRightTab === "branding" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Company Branding
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Embed standardized company headers, logo, and official metadata.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <span className="font-bold text-slate-800 text-xs">Official Header & Logo</span>
                    <input
                      type="checkbox"
                      checked={includeHeaderLogo}
                      onChange={(e) => setIncludeHeaderLogo(e.target.checked)}
                      className="rounded text-[#274690] focus:ring-[#274690]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <span className="font-bold text-slate-800 text-xs">Confidential Footer</span>
                    <input
                      type="checkbox"
                      checked={includeFooterNotice}
                      onChange={(e) => setIncludeFooterNotice(e.target.checked)}
                      className="rounded text-[#274690] focus:ring-[#274690]"
                    />
                  </label>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Quick Brand Tokens:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor("{{organisation_name}}")}
                      className="p-1.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700"
                    >
                      + Company Name
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor("{{organisation_address}}")}
                      className="p-1.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700"
                    >
                      + Address
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor("{{organisation_phone}}")}
                      className="p-1.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700"
                    >
                      + Phone
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor("{{company_website}}")}
                      className="p-1.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700"
                    >
                      + Website URL
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeRightTab === "settings" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Page & Typography
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configure document format, font families, margins and sizes.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Page Size
                    </label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value as any)}
                      className="w-full h-8 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold focus:border-[#274690] focus:outline-none"
                    >
                      <option value="A4">A4 (Standard 210 x 297 mm)</option>
                      <option value="Letter">Letter (8.5 x 11 in)</option>
                      <option value="Legal">Legal (8.5 x 14 in)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Font Family
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full h-8 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold focus:border-[#274690] focus:outline-none"
                    >
                      <option value="Inter">Inter (Clean Modern Sans)</option>
                      <option value="Roboto">Roboto (Enterprise Standard)</option>
                      <option value="Georgia">Georgia (Classic Editorial Serif)</option>
                      <option value="Playfair Display">Playfair Display (Executive Serif)</option>
                      <option value="Courier New">Courier New (Monospace Legal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Font Size
                    </label>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      className="w-full h-8 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold focus:border-[#274690] focus:outline-none"
                    >
                      <option value="11px">11px - Compact</option>
                      <option value="12px">12px - Normal</option>
                      <option value="13px">13px - Standard (Recommended)</option>
                      <option value="14px">14px - Large</option>
                      <option value="16px">16px - Extra Large</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Line Spacing
                    </label>
                    <select
                      value={lineSpacing}
                      onChange={(e) => setLineSpacing(e.target.value)}
                      className="w-full h-8 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold focus:border-[#274690] focus:outline-none"
                    >
                      <option value="1.2">1.2 (Tight)</option>
                      <option value="1.4">1.4 (Compact)</option>
                      <option value="1.6">1.6 (Standard Balanced)</option>
                      <option value="2.0">2.0 (Double Spaced)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. MODALS */}
      <TemplatePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        templateName={details.name}
        category={details.category}
        content={content}
        pageSettings={{
          pageSize,
          orientation,
          margins,
          fontFamily,
          fontSize,
          lineSpacing,
        }}
      />

      <TableBuilderModal
        isOpen={showTableBuilder}
        onClose={() => setShowTableBuilder(false)}
        onInsertTable={(tableMd) => insertTextAtCursor(tableMd)}
      />
    </div>
  );
}
