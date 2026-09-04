"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  FileText,
  Scan,
  MessageSquare,
  PenTool,
  CheckCircle2,
  AlertCircle,
  Copy,
  Layers,
  ArrowRight,
  Send,
  UploadCloud,
  FileSearch,
  Check,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiApi } from "@/services/aiApi";
import AiChatComponent from "@/components/ai/AiChatComponent";
import SaveAiAsDocumentModal from "@/components/ai/SaveAiAsDocumentModal";

type AiToolKey = "SUMMARIZER" | "QA_ASSISTANT" | "ANALYSIS_MISSING_INFO" | "AI_WRITER" | "OCR_SCANNER" | "CLASSIFIER";

export default function TeamLeaderAiToolsPage() {
  const [activeTab, setActiveTab] = useState<"tools" | "chat">("tools");
  const [selectedTool, setSelectedTool] = useState<AiToolKey>("SUMMARIZER");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [inputContent, setInputContent] = useState(
    `This Master Services Agreement ("Agreement") is executed between TechCorp Global and Client Organisation on August 15, 2026. 
Section 1. Deliverables: Vendor shall provide 99.9% cloud infrastructure uptime SLA.
Section 2. Invoicing: Invoices shall be payable within 45 days of receipt.
Section 3. Confidentiality: Both parties shall preserve proprietary algorithms and trade secrets for 5 years.
Schedule B. Commercials: Monthly payment terms fixed at Net 30 days.`
  );
  const [promptQuery, setPromptQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const handleRunTool = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim()) {
      setError("Please provide document content or text.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await aiApi.runAiTool({
        tool: selectedTool,
        content: inputContent.trim(),
        prompt: promptQuery.trim(),
      }, "/team-leader/ai-tools/run");
      if (res?.data) {
        setAiOutput(res.data);
        showToast("AI processing completed successfully!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run AI tool.");
    } finally {
      setLoading(false);
    }
  };

  const tools: { key: AiToolKey; title: string; desc: string; icon: any }[] = [
    { key: "SUMMARIZER", title: "AI Document Summarizer", desc: "Summarize contracts & extract bullet key points", icon: FileText },
    { key: "QA_ASSISTANT", title: "Document Q&A Assistant", desc: "Ask questions & extract specific clauses", icon: MessageSquare },
    { key: "ANALYSIS_MISSING_INFO", title: "Analysis & Discrepancy", desc: "Detect missing info & conflicting clauses", icon: FileSearch },
    { key: "AI_WRITER", title: "AI Operations Writer", desc: "Draft professional team notices & rewrites", icon: PenTool },
    { key: "OCR_SCANNER", title: "AI OCR Text Extractor", desc: "Extract tabular & textual data from scanned receipts", icon: Scan },
    { key: "CLASSIFIER", title: "Smart Document Classifier", desc: "Detect document category & suggest metadata", icon: Layers },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-20 font-sans text-slate-800">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-[#274690] sm:text-3xl">AI Document Tools</h1>
            <Badge className="bg-gradient-to-r from-[#274690] to-[#c96f4a] text-white text-xs font-black px-3 py-1">
              Operational AI
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-semibold">
            Summarize, audit, query, and extract documents using enterprise AI pipelines
          </p>
        </div>
      </div>

      {/* Alerts */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 shadow-sm animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("tools")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "tools"
              ? "bg-[#274690] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Sparkles size={14} /> Team AI Suite
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "chat"
              ? "bg-[#274690] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <MessageSquare size={14} /> Multi-Provider AI Chat
        </button>
      </div>

      {activeTab === "chat" ? (
        <AiChatComponent userRole="Team Leader" defaultDepartment="Operations" />
      ) : (
        <>
          {/* 2. TOOL SELECTOR GRID (6 TOOLS) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = selectedTool === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setSelectedTool(t.key);
                setAiOutput(null);
              }}
              className={`flex flex-col items-start p-4 rounded-3xl border text-left transition-all ${
                isActive
                  ? "border-[#c96f4a] bg-[#c96f4a]/10 text-[#274690] shadow-sm ring-2 ring-[#c96f4a]/20"
                  : "border-slate-200/80 bg-white hover:border-[#274690]/40 text-slate-700"
              }`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-black ${isActive ? "bg-gradient-to-tr from-[#274690] to-[#c96f4a] text-white" : "bg-slate-100 text-slate-600"}`}>
                <Icon size={18} />
              </div>
              <h4 className="mt-3 text-xs font-black leading-snug">{t.title}</h4>
              <p className="mt-1 text-[10px] text-slate-400 font-semibold line-clamp-2">{t.desc}</p>
            </button>
          );
        })}
      </div>

      {/* 3. INPUT & OUTPUT SPLIT WORKSPACE */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Input Panel (6 cols) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#274690]">Document Input:</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setInputContent("INVOICE #INV-9902\nVendor: Dell Enterprise Servers\nAmount: $64,800.00\nPayment Terms: Net 30 Days\nWarranty: 36 Months Onsite");
              }}
              className="h-7 text-[10px] font-bold rounded-lg border-[#274690]/20 text-[#274690] hover:bg-[#274690]/5"
            >
              Load Sample PO
            </Button>
          </div>

          <textarea
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="Paste raw contract, invoice OCR text, or email draft here..."
            className="w-full rounded-2xl border border-slate-200 p-4 text-xs font-medium text-slate-800 focus:border-[#274690] focus:outline-none min-h-[220px]"
            rows={10}
          />

          {selectedTool === "QA_ASSISTANT" && (
            <div>
              <label className="text-[11px] font-black uppercase text-slate-600">Question about document:</label>
              <Input
                value={promptQuery}
                onChange={(e) => setPromptQuery(e.target.value)}
                placeholder="e.g. What is the governing law or payment timeline?"
                className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
              />
            </div>
          )}

          {selectedTool === "AI_WRITER" && (
            <div>
              <label className="text-[11px] font-black uppercase text-slate-600">Writing Mode / Goal:</label>
              <Input
                value={promptQuery}
                onChange={(e) => setPromptQuery(e.target.value)}
                placeholder="e.g. Draft polite operational reminder for monthly invoice deadline"
                className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
              />
            </div>
          )}

          <Button
            onClick={() => handleRunTool()}
            disabled={loading}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#274690] to-[#c96f4a] text-xs font-black text-white hover:opacity-95 shadow-md shadow-[#274690]/20 gap-2"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles size={15} className="text-amber-200" />}
            Execute {selectedTool.replace("_", " ")}
          </Button>
        </div>

        {/* Output Panel (6 cols) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#274690]">AI Intelligence Output:</h3>
            {aiOutput && (
              <Badge className="bg-[#274690]/10 text-[#274690] border-[#274690]/20 text-[10px] font-black">
                Confidence {aiOutput.confidence || 98.5}%
              </Badge>
            )}
          </div>

          {!aiOutput ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 min-h-[260px]">
              <Sparkles size={32} className="text-[#c96f4a] opacity-60 mb-2" />
              <p className="text-xs font-bold text-slate-600">Ready to process document.</p>
              <p className="text-[11px] text-slate-400">Click &apos;Execute&apos; to view structured AI insights.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs font-medium text-slate-700 animate-in fade-in">
              {/* Tool specific rendering */}
              {selectedTool === "SUMMARIZER" && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-[#274690]/5 p-4 border border-[#274690]/15 text-slate-800">
                    <p className="font-bold">{aiOutput.summary}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black uppercase text-[#274690]">Extracted Key Points:</span>
                    <ul className="space-y-1 list-disc pl-4 text-slate-700">
                      {aiOutput.keyPoints?.map((kp: string, i: number) => (
                        <li key={i}>{kp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedTool === "QA_ASSISTANT" && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-[#c96f4a]/10 p-4 border border-[#c96f4a]/20">
                    <p className="font-black text-[#274690]">Q: {aiOutput.question}</p>
                    <p className="mt-2 text-slate-800">{aiOutput.answer}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 italic">
                    Referenced Clause: {aiOutput.relevantParagraph}
                  </div>
                </div>
              )}

              {selectedTool === "ANALYSIS_MISSING_INFO" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border">
                    <span>Document Completeness:</span>
                    <strong className="text-emerald-700">{aiOutput.completenessScore}%</strong>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-[#c96f4a]">Detected Inconsistencies:</span>
                    {aiOutput.inconsistencies?.map((inc: string, i: number) => (
                      <p key={i} className="text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">{inc}</p>
                    ))}
                  </div>
                </div>
              )}

              {selectedTool === "AI_WRITER" && (
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 whitespace-pre-line text-slate-800 font-semibold leading-relaxed">
                  {aiOutput.generatedText}
                </div>
              )}

              {selectedTool === "OCR_SCANNER" && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-[#131c36] text-[#ffd6c4] p-4 font-mono text-[11px] whitespace-pre-line">
                    {aiOutput.extractedText}
                  </div>
                </div>
              )}

              {selectedTool === "CLASSIFIER" && (
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2">
                  <p><strong>Detected Category:</strong> {aiOutput.detectedType}</p>
                  <p><strong>Retention Period:</strong> {aiOutput.suggestedMetadata?.retentionPeriod}</p>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  size="sm"
                  onClick={() => setSaveModalOpen(true)}
                  className="bg-[#274690] hover:bg-[#1f3770] text-white text-xs font-bold rounded-xl h-8 px-4 gap-1.5 shadow-sm"
                >
                  <FileText size={13} /> Save to Team Documents
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      <SaveAiAsDocumentModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        content={
          typeof aiOutput === "string"
            ? aiOutput
            : aiOutput?.generatedText ||
              aiOutput?.summary ||
              aiOutput?.extractedText ||
              JSON.stringify(aiOutput, null, 2)
        }
        suggestedTitle={`Team ${selectedTool} Note`}
        sourceType="Team AI Tools"
        aiProvider="Google Gemini"
        aiModel="Gemini 3.6 Flash"
        onSaved={(doc) => {
          showToast(`Document "${doc.name}" saved to team documents!`);
        }}
      />
    </div>
  );
}
