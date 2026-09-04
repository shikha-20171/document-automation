"use client";

import { useState } from "react";
import { 
  Sparkles, 
  Wand2, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Shield, 
  PlusCircle, 
  MinusCircle, 
  Globe, 
  Scale,
  FileCheck,
  Zap,
  BookOpen,
  HelpCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AiAssistantPanelProps {
  onApplyAiAction: (actionType: string, snippet?: string) => void;
  isProcessingAction: boolean;
  activeTone: string;
  activeLanguage: string;
}

export default function AiAssistantPanel({ 
  onApplyAiAction, 
  isProcessingAction,
  activeTone,
  activeLanguage,
}: AiAssistantPanelProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleAction = (actionName: string, snippet?: string) => {
    setActiveAction(actionName);
    onApplyAiAction(actionName, snippet);
    setTimeout(() => setActiveAction(null), 1000);
  };

  return (
    <div className="space-y-4 font-sans text-xs min-w-0 max-w-full">
      <Card className="rounded-2xl border border-purple-200/80 bg-white p-3.5 sm:p-4 shadow-xs space-y-4 min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 min-w-0">
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5 truncate">
            <Wand2 size={15} className="text-purple-600 shrink-0" />
            <span className="truncate">AI Assistant Copilot</span>
          </h3>
          <Badge className="bg-purple-100 text-purple-800 text-[10px] font-bold shrink-0">
            {activeTone} • {activeLanguage}
          </Badge>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Transform your draft with one-click intelligent actions, legal polish, and standard clause blocks.
        </p>

        {/* Core Writing & Enhancement Transformations */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tone & Transformations</p>
            <span className="text-[9px] text-purple-600 font-bold">1-Click Apply</span>
          </div>

          <Button
            type="button"
            disabled={isProcessingAction}
            onClick={() => handleAction("Improve Writing")}
            variant="outline"
            className="w-full justify-start text-[11px] sm:text-xs font-bold text-slate-800 border-slate-200 hover:border-purple-300 hover:bg-purple-50/60 rounded-xl py-2 px-2.5 transition overflow-hidden min-w-0"
          >
            <Sparkles size={13} className="mr-1.5 text-purple-600 shrink-0" />
            <span className="truncate text-left">{activeAction === "Improve Writing" ? "Refining Flow..." : "✦ Improve Writing & Clarity"}</span>
          </Button>

          <Button
            type="button"
            disabled={isProcessingAction}
            onClick={() => handleAction("Make Professional")}
            variant="outline"
            className="w-full justify-start text-[11px] sm:text-xs font-bold text-slate-800 border-slate-200 hover:border-purple-300 hover:bg-purple-50/60 rounded-xl py-2 px-2.5 transition overflow-hidden min-w-0"
          >
            <Scale size={13} className="mr-1.5 text-indigo-600 shrink-0" />
            <span className="truncate text-left">{activeAction === "Make Professional" ? "Polishing Legalese..." : "✦ Polish Legal & Statutory Tone"}</span>
          </Button>

          <Button
            type="button"
            disabled={isProcessingAction}
            onClick={() => handleAction("Rewrite")}
            variant="outline"
            className="w-full justify-start text-[11px] sm:text-xs font-bold text-slate-800 border-slate-200 hover:border-purple-300 hover:bg-purple-50/60 rounded-xl py-2 px-2.5 transition overflow-hidden min-w-0"
          >
            <RefreshCw size={13} className="mr-1.5 text-blue-600 shrink-0" />
            <span className="truncate text-left">{activeAction === "Rewrite" ? "Rephrasing..." : "✦ Modernize & Rephrase Draft"}</span>
          </Button>

          <Button
            type="button"
            disabled={isProcessingAction}
            onClick={() => handleAction("Fix Grammar")}
            variant="outline"
            className="w-full justify-start text-[11px] sm:text-xs font-bold text-slate-800 border-slate-200 hover:border-purple-300 hover:bg-purple-50/60 rounded-xl py-2 px-2.5 transition overflow-hidden min-w-0"
          >
            <CheckCircle2 size={13} className="mr-1.5 text-teal-600 shrink-0" />
            <span className="truncate text-left">{activeAction === "Fix Grammar" ? "Sanitizing..." : "✦ Fix Grammar, Spacing & Syntax"}</span>
          </Button>
        </div>

        {/* Length Controls & Summary */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100 min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Length & Summary</p>

          <div className="grid grid-cols-2 gap-1.5 min-w-0">
            <Button
              type="button"
              disabled={isProcessingAction}
              onClick={() => handleAction("Expand")}
              variant="outline"
              className="text-[10.5px] font-bold text-slate-800 border-slate-200 hover:bg-slate-50 rounded-xl py-1.5 px-2 truncate min-w-0"
            >
              <span className="truncate">✦ Expand Details</span>
            </Button>
            <Button
              type="button"
              disabled={isProcessingAction}
              onClick={() => handleAction("Shorten")}
              variant="outline"
              className="text-[10.5px] font-bold text-slate-800 border-slate-200 hover:bg-slate-50 rounded-xl py-1.5 px-2 truncate min-w-0"
            >
              <span className="truncate">✦ Shorten / Memo</span>
            </Button>
          </div>

          <Button
            type="button"
            disabled={isProcessingAction}
            onClick={() => handleAction("Summarize")}
            variant="outline"
            className="w-full justify-start text-[11px] sm:text-xs font-bold text-slate-800 border-slate-200 hover:bg-slate-50 rounded-xl py-2 px-2.5 min-w-0 overflow-hidden"
          >
            <FileText size={13} className="mr-1.5 text-amber-600 shrink-0" />
            <span className="truncate text-left">✦ Insert Executive Summary Callout</span>
          </Button>

          <Button
            type="button"
            disabled={isProcessingAction}
            onClick={() => handleAction("Translate to Hindi")}
            variant="outline"
            className="w-full justify-start text-[11px] sm:text-xs font-bold text-slate-800 border-slate-200 hover:bg-slate-50 rounded-xl py-2 px-2.5 min-w-0 overflow-hidden"
          >
            <Globe size={13} className="mr-1.5 text-indigo-600 shrink-0" />
            <span className="truncate text-left">✦ Append Bilingual Hindi Clause (हिंदी)</span>
          </Button>
        </div>

        {/* Preset Enterprise Legal Clauses */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100 min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enterprise Legal Clauses</p>

          <Button
            type="button"
            onClick={() =>
              handleAction(
                "Add Termination Clause",
                "\n\n### TERMINATION & NOTICE PERIOD\n1. Either party may terminate this agreement by serving a written notice of 30 (thirty) days to the other party.\n2. In the event of gross misconduct, material breach of confidentiality, or insolvency, termination shall be immediate with cause."
              )
            }
            size="sm"
            variant="ghost"
            className="w-full justify-start text-[11px] font-bold text-purple-900 bg-purple-50/70 hover:bg-purple-100 rounded-xl py-1.5 px-2.5 min-w-0 overflow-hidden"
          >
            <PlusCircle size={13} className="mr-1.5 text-purple-600 shrink-0" />
            <span className="truncate text-left">+ Termination & Notice Clause</span>
          </Button>

          <Button
            type="button"
            onClick={() =>
              handleAction(
                "Add Confidentiality Clause",
                "\n\n### NON-DISCLOSURE & INTELLECTUAL PROPERTY\n1. The Receiving Party agrees to hold all proprietary algorithms, client lists, and financial records in strict confidence.\n2. All works, codebases, and patents developed during engagement shall remain the sole intellectual property of the Company."
              )
            }
            size="sm"
            variant="ghost"
            className="w-full justify-start text-[11px] font-bold text-purple-900 bg-purple-50/70 hover:bg-purple-100 rounded-xl py-1.5 px-2.5 min-w-0 overflow-hidden"
          >
            <PlusCircle size={13} className="mr-1.5 text-purple-600 shrink-0" />
            <span className="truncate text-left">+ Non-Disclosure & IP Assignment</span>
          </Button>

          <Button
            type="button"
            onClick={() =>
              handleAction(
                "Add Dispute Resolution Clause",
                "\n\n### DISPUTE RESOLUTION & ARBITRATION\nAny dispute arising out of or in connection with this agreement shall be settled through binding arbitration in accordance with the Arbitration and Conciliation statutory rules, with the seat of arbitration situated in Mumbai, India."
              )
            }
            size="sm"
            variant="ghost"
            className="w-full justify-start text-[11px] font-bold text-purple-900 bg-purple-50/70 hover:bg-purple-100 rounded-xl py-1.5 px-2.5 min-w-0 overflow-hidden"
          >
            <PlusCircle size={13} className="mr-1.5 text-purple-600 shrink-0" />
            <span className="truncate text-left">+ Dispute Resolution & Arbitration</span>
          </Button>

          <Button
            type="button"
            onClick={() =>
              handleAction(
                "Add Force Majeure Clause",
                "\n\n### FORCE MAJEURE\nNeither party shall be held liable for failure or delay in performing obligations due to causes beyond reasonable control, including natural disasters, governmental restrictions, war, or global telecommunication outages."
              )
            }
            size="sm"
            variant="ghost"
            className="w-full justify-start text-[11px] font-bold text-purple-900 bg-purple-50/70 hover:bg-purple-100 rounded-xl py-1.5 px-2.5 min-w-0 overflow-hidden"
          >
            <PlusCircle size={13} className="mr-1.5 text-purple-600 shrink-0" />
            <span className="truncate text-left">+ Force Majeure Provision</span>
          </Button>

          <Button
            type="button"
            onClick={() => handleAction("Remove Section")}
            size="sm"
            variant="ghost"
            className="w-full justify-start text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl py-1.5 px-2.5 min-w-0 overflow-hidden"
          >
            <MinusCircle size={13} className="mr-1.5 text-rose-600 shrink-0" />
            <span className="truncate text-left">- Clean Trailing Blank Lines</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
