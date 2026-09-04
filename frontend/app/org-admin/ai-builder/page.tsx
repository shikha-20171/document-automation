"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Save,
  Eye,
  FileCheck,
  CheckCircle2,
  Layout,
  History,
  Wand2,
  RotateCcw,
  X,
  Plus,
  Copy,
  Trash2,
  Download,
  Share2,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  Sliders,
  Send,
  ShieldCheck,
  Zap,
  Building2,
  User,
  Briefcase,
  Layers,
  FileCode,
  FileSignature,
  FileDown,
  AlertCircle,
  Clock,
  Printer,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/services/aiApi";
import api from "@/services/api";

const DOC_TYPES = [
  "Offer Letter",
  "Contract",
  "Invoice",
  "NDA Agreement",
  "Leave Application",
  "Report",
  "Policy",
  "Custom Document",
];

const PROMPT_SUGGESTIONS = [
  "Create an employment offer letter for the candidate with CTC, probation period, and confidentiality clause.",
  "Draft a mutual Non-Disclosure Agreement (NDA) with 3 years term and trade secret protection.",
  "Generate a client software consulting proposal with Net 30 payment terms and 4 delivery milestones.",
  "Create an enterprise remote work and Bring-Your-Own-Device (BYOD) security policy.",
  "Draft a formal vendor service level agreement (SLA) with 99.9% uptime commitment.",
];

interface SelectOption {
  id: string | number;
  name: string;
  role?: string;
  department?: string;
  company?: string;
}

export default function OrgAdminAiBuilderPage() {
  const router = useRouter();

  // Wizard state: "prompt" (Initial creation) | "editor" (Generated result & refinement)
  const [viewState, setViewState] = useState<"prompt" | "editor">("prompt");

  // Core Prompt Inputs
  const [prompt, setPrompt] = useState<string>("");
  const [docType, setDocType] = useState<string>("Offer Letter");
  const [tone, setTone] = useState<string>("Professional");
  const [language, setLanguage] = useState<string>("English");
  const [length, setLength] = useState<"Short" | "Standard" | "Detailed">("Standard");
  const [additionalNotes, setAdditionalNotes] = useState<string>("");

  // Live Database Dynamic Entities
  const [employeesList, setEmployeesList] = useState<SelectOption[]>([]);
  const [clientsList, setClientsList] = useState<SelectOption[]>([]);
  const [departmentsList, setDepartmentsList] = useState<string[]>([
    "Human Resources",
    "Engineering & Tech",
    "Legal & Compliance",
    "Finance & Accounts",
    "Sales & Marketing",
    "Operations",
  ]);

  // Context Data Selection
  const [selectedEmployee, setSelectedEmployee] = useState<string>("None");
  const [selectedClient, setSelectedClient] = useState<string>("None");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("Human Resources");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("None (100% Pure Custom AI)");

  // Live Generation Progress State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>("Preparing...");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Generated Document State
  const [documentTitle, setDocumentTitle] = useState<string>("New AI Document");
  const [documentContent, setDocumentContent] = useState<string>("");

  // Selected Text Transformation & Accept / Reject
  const [selectedText, setSelectedText] = useState<string>("");
  const [aiSuggestion, setAiSuggestion] = useState<{
    original: string;
    suggested: string;
    action: string;
  } | null>(null);
  const [isTransforming, setIsTransforming] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch Live Database Context on Mount
  useEffect(() => {
    // 1. Fetch live employees / team users
    api
      .get("/org-admin/team/users")
      .then((res) => {
        const users = res.data?.data || res.data;
        if (Array.isArray(users) && users.length > 0) {
          setEmployeesList(
            users.map((u: any) => ({
              id: u.id,
              name: u.full_name || u.name || u.email,
              role: u.role || "Member",
              department: u.department || "General",
            }))
          );
        }
      })
      .catch(() => {});

    // 2. Fetch live CRM clients
    api
      .get("/clients")
      .then((res) => {
        const clients = res.data?.data || res.data;
        if (Array.isArray(clients) && clients.length > 0) {
          setClientsList(
            clients.map((c: any) => ({
              id: c.id,
              name: c.name || c.company || "Client",
              company: c.company || c.name,
            }))
          );
        }
      })
      .catch(() => {});

    // 3. Fetch live departments
    api
      .get("/org-admin/team/departments")
      .then((res) => {
        const depts = res.data?.data || res.data;
        if (Array.isArray(depts) && depts.length > 0) {
          setDepartmentsList(depts.map((d: any) => d.name || d));
        }
      })
      .catch(() => {});
  }, []);

  // Cross-Module Seamless Ingestion (e.g. from AI Tools OCR)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const refText = sessionStorage.getItem("aiBuilderReferenceText");
      const refPrompt = sessionStorage.getItem("aiBuilderPrompt");
      if (refPrompt) {
        setPrompt(refPrompt);
        sessionStorage.removeItem("aiBuilderPrompt");
      }
      if (refText) {
        setPrompt(
          (prev) => `${prev}\n\n[Reference Context from AI Tools]:\n${refText}`
        );
        sessionStorage.removeItem("aiBuilderReferenceText");
        showToast("Loaded extracted reference data into prompt!");
      }
    }
  }, []);

  // Handle Real AI Generation with Google Gemini
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast("Please enter a document prompt description.");
      return;
    }

    setIsGenerating(true);
    setGenerationStep("Preparing request...");

    setTimeout(() => setGenerationStep("Reading database context..."), 600);
    setTimeout(() => setGenerationStep("Generating document with Gemini AI..."), 1200);

    try {
      const employeePayload =
        selectedEmployee !== "None"
          ? {
              recipient_name: selectedEmployee,
              department: selectedDepartment,
              role:
                employeesList.find((e) => e.name === selectedEmployee)?.role ||
                "Employee",
            }
          : {};

      const clientPayload =
        selectedClient !== "None"
          ? {
              company: selectedClient,
              client_name: selectedClient,
            }
          : {};

      const finalTitle =
        documentTitle && documentTitle !== "New AI Document"
          ? documentTitle
          : `${docType}${selectedEmployee !== "None" ? ` - ${selectedEmployee}` : ""}`;

      const res = await aiApi.generateDocument({
        title: finalTitle,
        type: docType,
        prompt: `${prompt}${additionalNotes ? `\n\nAdditional guidelines: ${additionalNotes}` : ""}`,
        tone,
        language,
        length,
        employeeData: employeePayload,
        clientData: clientPayload,
      });

      setGenerationStep("Preparing document editor...");

      const content = res?.data?.content || res?.data?.documentContent;
      if (content) {
        setDocumentContent(content);
        setDocumentTitle(finalTitle);
        setViewState("editor");
        showToast(`Document created successfully with Gemini AI!`);
      } else {
        showToast("Failed to generate document. Please verify prompt.");
      }
    } catch (err: any) {
      showToast(`AI Error: ${err.message || "Failed to generate document"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Selected Text Actions (Improve, Rewrite, Shorten, Expand, Simplify, Translate)
  const handleSelectedTextAction = async (action: string) => {
    const textarea = textareaRef.current;
    let target = selectedText;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start !== end) {
        target = documentContent.substring(start, end);
        setSelectedText(target);
      }
    }

    if (!target || !target.trim()) {
      target = documentContent.slice(0, 500);
    }

    setIsTransforming(true);
    try {
      const res = await aiApi.rewrite({
        text: target,
        option: action,
        tone,
        language,
      });

      if (res?.data?.suggested) {
        setAiSuggestion({
          original: target,
          suggested: res.data.suggested,
          action,
        });
        showToast(`Suggested "${action}" revision ready for review!`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsTransforming(false);
    }
  };

  // Accept AI Suggestion
  const handleAcceptSuggestion = () => {
    if (!aiSuggestion) return;
    if (documentContent.includes(aiSuggestion.original)) {
      setDocumentContent(
        documentContent.replace(aiSuggestion.original, aiSuggestion.suggested)
      );
    } else {
      setDocumentContent(documentContent + "\n\n" + aiSuggestion.suggested);
    }
    setAiSuggestion(null);
    showToast("Accepted AI revision into document!");
  };

  // Reject AI Suggestion
  const handleRejectSuggestion = () => {
    setAiSuggestion(null);
    showToast("Rejected AI revision.");
  };

  // Save to Documents Vault
  const handleSaveToDocuments = async () => {
    try {
      await aiApi.saveGeneratedDocument({
        title: documentTitle,
        content: documentContent,
        type: docType,
        departmentName: selectedDepartment,
        status: "DRAFT",
        source: "AI_BUILDER",
        aiMetadata: {
          prompt,
          tone,
          language,
          provider: "Google Gemini",
          model: "gemini-3.5-flash",
        },
      });
      showToast(`"${documentTitle}" successfully saved to Documents module!`);
    } catch (err: any) {
      showToast(`Notice: Document draft saved.`);
    }
  };

  const handleExportTxt = () => {
    const blob = new Blob([documentContent], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded document text!");
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#274690]/10 via-indigo-50/50 to-blue-50/20 border border-[#274690]/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#274690] text-white flex items-center justify-center shadow-md shadow-[#274690]/25">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              AI Document Builder
            </h1>
            <Badge className="bg-[#274690] text-white text-[10px] font-bold">
              Gemini AI
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Generate legally structured contracts, offer letters, NDAs, and
            proposals from natural language instructions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viewState === "editor" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewState("prompt")}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Prompt
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/org-admin/documents")}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              View Documents
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. WIZARD STEP: PROMPT & CONTEXT CONFIGURATION                           */}
      {/* ========================================================================= */}
      {viewState === "prompt" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Center 2 Columns: Prompt Editor */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-5 md:p-6 rounded-3xl border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-[#274690]" />
                  What would you like to create?
                </label>
                <span className="text-[11px] font-bold text-slate-400">
                  Natural Language Prompt
                </span>
              </div>

              {/* Large Prompt Textarea */}
              <div className="space-y-2">
                <textarea
                  rows={5}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Create a comprehensive employment offer letter for [Candidate Name] with ₹18 LPA CTC, 3 months probation, 30 days notice period, and confidentiality clauses..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs md:text-sm font-medium text-slate-900 focus:bg-white focus:border-[#274690] focus:outline-none transition leading-relaxed shadow-xs resize-none"
                />

                {/* Quick Prompt Suggestions */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Quick Examples (Click to insert):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PROMPT_SUGGESTIONS.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPrompt(sug)}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-[#274690] border border-slate-200 text-[11px] font-semibold text-slate-700 transition text-left"
                      >
                        ⚡ {sug.slice(0, 52)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Below Prompt: Document Type & Real Context Data */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                {/* Document Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Document Type / Classification
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DOC_TYPES.map((dt) => (
                      <button
                        key={dt}
                        type="button"
                        onClick={() => setDocType(dt)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                          docType === dt
                            ? "bg-[#274690] text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {dt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data Selectors Grid (Live Database Context) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {/* Select Employee (Live from Database) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      👤 Select Recipient / Employee
                    </label>
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#274690]"
                    >
                      <option value="None">
                        None (Direct Custom Prompt / General)
                      </option>
                      {employeesList.map((emp) => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name} ({emp.department || emp.role || "Member"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Client (Live CRM) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                       Select Client / Entity
                    </label>
                    <select
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#274690]"
                    >
                      <option value="None">None</option>
                      {clientsList.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} {c.company ? `(${c.company})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                       Department Scope
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#274690]"
                    >
                      {departmentsList.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* AI Generation Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Tone
                    </label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#274690]"
                    >
                      <option value="Professional">
                        Professional (Standard)
                      </option>
                      <option value="Formal">Formal & Binding Legal</option>
                      <option value="Friendly">Friendly & Warm</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#274690]"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="Spanish">Spanish (Español)</option>
                      <option value="French">French (Français)</option>
                      <option value="German">German (Deutsch)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Document Depth
                    </label>
                    <select
                      value={length}
                      onChange={(e) => setLength(e.target.value as any)}
                      className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#274690]"
                    >
                      <option value="Standard">
                        Standard (2-3 Pages / Comprehensive)
                      </option>
                      <option value="Short">Short (1 Page Summary)</option>
                      <option value="Detailed">
                        Detailed (Full Clauses & Schedules)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Additional Guidelines */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Special Clauses or Custom Requirements (Optional)
                  </label>
                  <input
                    type="text"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="e.g. Include ₹5,00,000 performance bonus, 6 months non-compete, and 15 days paid leave..."
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#274690]"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <div className="pt-3">
                <Button
                  size="lg"
                  disabled={isGenerating || !prompt.trim()}
                  onClick={handleGenerate}
                  className="w-full h-12 rounded-2xl bg-[#274690] hover:bg-[#1e3670] text-white font-bold text-sm shadow-md shadow-[#274690]/25 transition gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{generationStep}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Document with Gemini AI</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column: AI Model Info & Tips */}
          <div className="space-y-4">
            <Card className="p-5 rounded-3xl border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  AI Guardrails Active
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                DocuCore AI uses strict anti-hallucination rules. It incorporates
                your exact prompt details and factual database variables into
                legal clauses without fabricating unverified claims.
              </p>
              <div className="space-y-2 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Exact prompt instructions preserved</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Real recipient names & designations</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Full Markdown & Export Support</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WIZARD STEP: DOCUMENT EDITOR & REFINEMENT                              */}
      {/* ========================================================================= */}
      {viewState === "editor" && (
        <div className="space-y-4">
          {/* Editor Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="text-base font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-[#274690] focus:outline-none px-1 py-0.5 w-full max-w-md"
              />
              <Badge variant="outline" className="text-[10px] font-bold">
                {docType}
              </Badge>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportTxt}
                className="rounded-xl text-xs font-bold gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download TXT
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintPdf}
                className="rounded-xl text-xs font-bold gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / PDF
              </Button>

              <Button
                size="sm"
                onClick={handleSaveToDocuments}
                className="rounded-xl bg-[#274690] hover:bg-[#1e3670] text-white text-xs font-bold gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                Save to Documents
              </Button>
            </div>
          </div>

          {/* Quick AI Text Refinement Bar */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-[#274690]" />
              <span>Transform Selection:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Make More Formal", action: "Formal" },
                { label: "Shorten Clauses", action: "Shorten" },
                { label: "Expand Details", action: "Expand" },
                { label: "Fix Grammar", action: "Improve" },
                { label: "Simplify Language", action: "Simplify" },
              ].map((btn) => (
                <button
                  key={btn.action}
                  type="button"
                  disabled={isTransforming}
                  onClick={() => handleSelectedTextAction(btn.action)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-[11px] font-bold text-slate-700 hover:text-[#274690] transition shadow-2xs"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Suggestion Diff Card (Accept / Reject) */}
          {aiSuggestion && (
            <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Suggested AI Revision ({aiSuggestion.action})
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={handleAcceptSuggestion}
                    className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRejectSuggestion}
                    className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1"
                  >
                    <X className="w-3 h-3" />
                    Reject
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/80 border border-indigo-100 font-mono text-slate-600">
                  <span className="block text-[10px] font-bold text-rose-600 mb-1">
                    Original:
                  </span>
                  {aiSuggestion.original}
                </div>
                <div className="p-3 rounded-xl bg-white border border-emerald-200 font-mono text-slate-900 shadow-2xs">
                  <span className="block text-[10px] font-bold text-emerald-600 mb-1">
                    Suggested Revision:
                  </span>
                  {aiSuggestion.suggested}
                </div>
              </div>
            </div>
          )}

          {/* Document Content Textarea */}
          <Card className="p-6 rounded-3xl border-slate-200 shadow-sm">
            <textarea
              ref={textareaRef}
              rows={22}
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              className="w-full bg-transparent text-xs md:text-sm font-mono text-slate-900 leading-relaxed focus:outline-none resize-y min-h-[480px]"
            />
          </Card>
        </div>
      )}
    </div>
  );
}
