"use client";

import { useRef, useState, useMemo } from "react";
import { 
  Sparkles, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote,
  Code,
  CheckSquare,
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Undo, 
  Redo, 
  Table, 
  RefreshCw,
  Search,
  Replace,
  FileCheck,
  Clock,
  Type,
  Maximize2,
  Minimize2,
  Trash2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DocumentEditorPanelProps {
  promptText: string;
  onUpdatePrompt: (prompt: string) => void;
  documentContent: string;
  onUpdateContent: (content: string) => void;
  isGenerating: boolean;
  onGenerateAi: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export default function DocumentEditorPanel({
  promptText,
  onUpdatePrompt,
  documentContent,
  onUpdateContent,
  isGenerating,
  onGenerateAi,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: DocumentEditorPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Search & Replace State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Calculate Metrics
  const metrics = useMemo(() => {
    const text = documentContent.trim();
    const chars = text.length;
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const readTimeMins = Math.max(1, Math.ceil(words / 200));
    return { chars, words, readTimeMins };
  }, [documentContent]);

  // Selection-aware formatting engine
  const insertFormatting = (prefix: string, suffix: string = "", placeholder: string = "formatted text") => {
    const el = textareaRef.current;
    if (!el) {
      onUpdateContent(documentContent + prefix + placeholder + suffix);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = documentContent.substring(start, end);
    const contentToInsert = selectedText || placeholder;

    const newText =
      documentContent.substring(0, start) +
      prefix +
      contentToInsert +
      suffix +
      documentContent.substring(end);

    onUpdateContent(newText);

    setTimeout(() => {
      el.focus();
      const newCursorStart = start + prefix.length;
      const newCursorEnd = newCursorStart + contentToInsert.length;
      el.setSelectionRange(newCursorStart, newCursorEnd);
    }, 40);
  };

  const handleFindReplace = () => {
    if (!searchTerm) return;
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    const updated = documentContent.replace(regex, replaceTerm);
    onUpdateContent(updated);
  };

  const handleClearDocument = () => {
    if (confirm("Are you sure you want to clear the current draft?")) {
      onUpdateContent("");
    }
  };

  return (
    <div className={`space-y-4 font-sans text-xs min-w-0 max-w-full ${isFullscreen ? "fixed inset-4 z-50 bg-slate-900/40 backdrop-blur-sm p-4 overflow-auto rounded-3xl" : ""}`}>
      {/* 1. Natural Language AI Prompt Card */}
      <Card className="rounded-2xl border border-purple-200/80 bg-gradient-to-br from-white via-purple-50/20 to-indigo-50/30 p-3.5 sm:p-4 shadow-sm space-y-3 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between min-w-0 flex-wrap gap-1.5">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 truncate">
            <Sparkles size={15} className="text-purple-600 animate-pulse shrink-0" />
            <span className="truncate">Natural Language AI Prompt & Instructions</span>
          </h3>
          <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2.5 py-0.5 rounded-full shrink-0">
            AI Document Engine
          </span>
        </div>

        <textarea
          rows={3}
          value={promptText}
          onChange={(e) => onUpdatePrompt(e.target.value)}
          placeholder="Describe your document requirements in detail (e.g. Generate a senior software engineering contract with a ₹18.5 LPA compensation package, 6-month probation, and IP assignment)..."
          className="w-full rounded-xl border border-purple-200 bg-white p-3 text-xs font-medium text-slate-800 focus:border-purple-600 focus:outline-none shadow-xs transition min-w-0 break-words"
        />

        <div className="flex items-center justify-between pt-1 flex-wrap gap-2 min-w-0">
          <p className="text-[10px] text-slate-500 truncate flex-1 min-w-[160px]">
            Tip: Insert variables like <code className="text-purple-700 font-bold font-mono">{"{{employee_name}}"}</code> or <code className="text-purple-700 font-bold font-mono">{"{{salary}}"}</code>.
          </p>
          <Button
            onClick={onGenerateAi}
            disabled={isGenerating}
            className="bg-gradient-to-r from-[#1f3561] via-[#274690] to-purple-700 hover:opacity-95 text-white font-extrabold rounded-xl text-xs px-4 py-2 shadow-md flex items-center gap-1.5 shrink-0"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={13} className="animate-spin" /> Generating Draft...
              </>
            ) : (
              <>
                <Sparkles size={13} className="text-[#ffd9a0]" /> Generate Full Draft
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* 2. Professional Document Editor Surface */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden min-w-0">
        {/* Editor Toolbar */}
        <div className="border-b border-slate-200/80 bg-slate-50/80 p-2 flex items-center justify-between gap-1 flex-wrap text-slate-700 min-w-0">
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            {/* Heading Selector */}
            <select
              onChange={(e) => {
                if (e.target.value === "h1") insertFormatting("\n\n# ", "\n", "Heading 1");
                if (e.target.value === "h2") insertFormatting("\n\n## ", "\n", "Heading 2");
                if (e.target.value === "h3") insertFormatting("\n\n### ", "\n", "Heading 3");
                e.target.value = "p";
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none shrink-0"
            >
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1 (#)</option>
              <option value="h2">Heading 2 (##)</option>
              <option value="h3">Heading 3 (###)</option>
            </select>

            <div className="h-4 w-px bg-slate-300 mx-0.5 shrink-0" />

            {/* Typography Modifiers */}
            <button
              type="button"
              onClick={() => insertFormatting("**", "**", "Bold text")}
              title="Bold (Ctrl+B)"
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition shrink-0"
            >
              <Bold size={14} />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("*", "*", "Italic text")}
              title="Italic (Ctrl+I)"
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition shrink-0"
            >
              <Italic size={14} />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("<u>", "</u>", "Underlined text")}
              title="Underline"
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition shrink-0"
            >
              <Underline size={14} />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("~~", "~~", "Strikethrough text")}
              title="Strikethrough"
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition shrink-0"
            >
              <Strikethrough size={14} />
            </button>

            <div className="h-4 w-px bg-slate-300 mx-0.5 shrink-0" />

            {/* Structure & Lists */}
            <button
              type="button"
              onClick={() => insertFormatting("\n• ", "", "Bullet item")}
              title="Bullet List"
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition shrink-0"
            >
              <List size={14} />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("\n1. ", "", "Numbered item")}
              title="Numbered List"
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition shrink-0"
            >
              <ListOrdered size={14} />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("\n- [ ] ", "", "Task checklist item")}
              title="Checklist Box"
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition shrink-0"
            >
              <CheckSquare size={14} />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting("\n> ", "", "Important quote / legal note")}
              title="Blockquote / Callout"
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition shrink-0"
            >
              <Quote size={14} />
            </button>

            <button
              type="button"
              onClick={() =>
                insertFormatting(
                  "\n\n| Item | Description | Value |\n| :--- | :--- | :--- |\n| 1 | Annual Compensation | {{salary}} |\n| 2 | Probation Term | 6 Months |\n",
                  ""
                )
              }
              title="Insert Structured Table"
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition shrink-0"
            >
              <Table size={14} />
            </button>

            <div className="h-4 w-px bg-slate-300 mx-0.5 shrink-0" />

            {/* Alignments */}
            <button
              type="button"
              onClick={() => insertFormatting("<div align=\"left\">\n", "\n</div>", "Left aligned block")}
              title="Align Left"
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 shrink-0"
            >
              <AlignLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("<div align=\"center\">\n", "\n</div>", "Center aligned text")}
              title="Align Center"
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 shrink-0"
            >
              <AlignCenter size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("<div align=\"right\">\n", "\n</div>", "Right aligned block")}
              title="Align Right"
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 shrink-0"
            >
              <AlignRight size={14} />
            </button>

            <div className="h-4 w-px bg-slate-300 mx-0.5 shrink-0" />

            {/* Undo / Redo */}
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition shrink-0"
            >
              <Undo size={14} />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition shrink-0"
            >
              <Redo size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              title="Find & Replace"
              className={`p-1.5 rounded-lg transition ${isSearchOpen ? "bg-purple-100 text-purple-800" : "hover:bg-slate-200 text-slate-600"}`}
            >
              <Search size={14} />
            </button>
            <button
              type="button"
              onClick={handleClearDocument}
              title="Clear Canvas"
              className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Search & Replace Floating Bar */}
        {isSearchOpen && (
          <div className="bg-purple-50/70 border-b border-purple-200/80 p-2.5 flex items-center gap-2 flex-wrap text-xs animate-in slide-in-from-top-2">
            <div className="flex items-center gap-1.5 bg-white border border-purple-200 rounded-lg px-2 py-1 min-w-[140px] flex-1">
              <Search size={12} className="text-purple-600 shrink-0" />
              <input
                type="text"
                placeholder="Find text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-purple-200 rounded-lg px-2 py-1 min-w-[140px] flex-1">
              <Replace size={12} className="text-purple-600 shrink-0" />
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                className="w-full bg-transparent text-xs focus:outline-none"
              />
            </div>
            <Button
              type="button"
              onClick={handleFindReplace}
              className="bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs h-7 px-3 font-bold"
            >
              Replace All
            </Button>
          </div>
        )}

        {/* Editable Workspace Document Surface */}
        <div className="p-4 sm:p-6 bg-white min-h-[460px] min-w-0">
          <textarea
            ref={textareaRef}
            value={documentContent}
            onChange={(e) => onUpdateContent(e.target.value)}
            className="w-full min-h-[440px] font-sans text-xs leading-relaxed text-slate-800 focus:outline-none resize-y border-none min-w-0 break-words whitespace-pre-wrap selection:bg-purple-100 selection:text-purple-900"
            placeholder="Document draft will appear here after AI generation or template selection..."
          />
        </div>

        {/* Footer Metrics & Document Status Bar */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2 flex items-center justify-between text-[11px] text-slate-500 font-medium flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Type size={12} className="text-slate-400" />
              <strong>{metrics.words}</strong> words
            </span>
            <span className="text-slate-300">•</span>
            <span><strong>{metrics.chars}</strong> characters</span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-slate-400" />
              ~{metrics.readTimeMins} min read
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              <FileCheck size={11} /> Auto-Saved
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
