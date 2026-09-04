"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  Paperclip,
  Copy,
  Check,
  FileCheck,
  RefreshCw,
  Sparkles,
  ChevronDown,
  User,
  Plus,
  MessageSquare,
  Trash2,
  Lock,
  Layers,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { aiChatService } from "@/services/ai/aiChatService";
import SaveAiAsDocumentModal from "./SaveAiAsDocumentModal";
import type { AIProviderOption, AIChatMessage, AIConversation } from "@/services/types/ai";

interface AiChatComponentProps {
  userRole?: string;
  defaultDepartment?: string;
}

export default function AiChatComponent({
  userRole = "Employee",
  defaultDepartment = "Operations",
}: AiChatComponentProps) {
  const [availableProviders, setAvailableProviders] = useState<AIProviderOption[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("gemini");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.6-flash");

  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Hello! I am your Enterprise AI Assistant. You can ask me to draft employment contracts, summarize compliance reports, extract tabular data, or draft department policies. Any generated content can be saved directly into your Organization Documents vault.",
      provider: { id: "gemini", name: "Google Gemini" },
      model: { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash" },
      createdAt: new Date().toISOString(),
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save to Document Modal State
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [contentToSave, setContentToSave] = useState("");
  const [suggestedDocTitle, setSuggestedDocTitle] = useState("AI Generated Document");
  const [saveProvider, setSaveProvider] = useState("Google Gemini");
  const [saveModel, setSaveModel] = useState("Gemini 3.6 Flash");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load available AI models from backend based on tenant subscription
  const loadModels = async () => {
    try {
      const res = await aiChatService.getAvailableModels();
      if (res?.providers && Array.isArray(res.providers) && res.providers.length > 0) {
        setAvailableProviders(res.providers);
        const primary = res.providers[0];
        setSelectedProvider(primary.provider);
        if (primary.models?.length > 0) {
          setSelectedModel(primary.models[0].id);
        }
      } else {
        // Safe default fallback
        setAvailableProviders([
          {
            provider: "gemini",
            displayName: "Google Gemini",
            isAllowed: true,
            models: [{ id: "gemini-3.6-flash", name: "Gemini 3.6 Flash (Free Tier)", isDefault: true }],
          },
        ]);
      }
    } catch {
      setAvailableProviders([
        {
          provider: "gemini",
          displayName: "Google Gemini",
          isAllowed: true,
          models: [{ id: "gemini-3.6-flash", name: "Gemini 3.6 Flash (Free Tier)", isDefault: true }],
        },
      ]);
    }
  };

  // Load conversation threads
  const loadConversations = async () => {
    try {
      const res = await aiChatService.getConversations();
      if (res?.data && Array.isArray(res.data)) {
        setConversations(res.data);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadModels();
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Handle Provider / Model Change
  const handleProviderSelect = (providerCode: string) => {
    setSelectedProvider(providerCode);
    const p = availableProviders.find((item) => item.provider === providerCode);
    if (p && p.models?.length > 0) {
      setSelectedModel(p.models[0].id);
    }
  };

  // Handle Send Chat
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isGenerating) return;

    const userText = inputMessage.trim();
    const tempUserMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userText,
      attachmentName: attachedFile?.name || null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage("");
    setAttachedFile(null);
    setIsGenerating(true);

    try {
      const res = await aiChatService.sendMessage({
        conversationId: activeConversationId || undefined,
        message: userText,
        provider: selectedProvider,
        model: selectedModel,
        attachmentName: attachedFile?.name,
      });

      if (res?.message) {
        setMessages((prev) => [...prev, res.message]);
        if (!activeConversationId && res.conversationId) {
          setActiveConversationId(res.conversationId);
          loadConversations();
        }
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Failed to generate AI response.";
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Error: ${errMsg}`,
          provider: { id: selectedProvider, name: selectedProvider },
          model: { id: selectedModel, name: selectedModel },
          createdAt: new Date().toISOString(),
        },
      ]);
      showToast(`❌ ${errMsg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("📋 Text copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenSaveModal = (msg: AIChatMessage) => {
    setContentToSave(msg.content);
    setSaveProvider(msg.provider?.name || "Google Gemini");
    setSaveModel(msg.model?.name || "Gemini 3.6 Flash");

    // Suggest intelligent title from first line
    const firstLine = msg.content.split("\n")[0].replace(/^[#*=\-\s]+/, "").slice(0, 40);
    setSuggestedDocTitle(firstLine || "AI Generated Document");
    setSaveModalOpen(true);
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: "New conversation started. How can I assist you with your document workflows today?",
        provider: { id: selectedProvider, name: "AI Assistant" },
        model: { id: selectedModel, name: selectedModel },
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleSelectConversation = async (conv: AIConversation) => {
    setActiveConversationId(conv.id);
    try {
      const res = await aiChatService.getConversationById(conv.id);
      if (res?.data?.messages && res.data.messages.length > 0) {
        setMessages(res.data.messages);
      }
    } catch {
      // Ignored
    }
  };

  const handleDeleteConv = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await aiChatService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewChat();
      }
      showToast("Conversation deleted.");
    } catch {
      // Ignored
    }
  };

  // Flatten all available models for dropdown
  const allSelectableModels: { providerCode: string; providerName: string; modelId: string; modelName: string }[] = [];
  availableProviders.forEach((p) => {
    (p.models || []).forEach((m) => {
      allSelectableModels.push({
        providerCode: p.provider,
        providerName: p.displayName,
        modelId: m.id,
        modelName: m.name,
      });
    });
  });

  return (
    <div className="bg-white dark:bg-[#131c36] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col md:flex-row h-[720px] font-sans text-slate-800 dark:text-slate-100">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#274690] text-white font-bold text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in">
          <Sparkles size={15} className="text-[#8fb1ec]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT SIDEBAR: CONVERSATION HISTORY */}
      <div className="w-full md:w-64 border-r border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/40 p-3.5 flex flex-col justify-between hidden sm:flex">
        <div className="space-y-3">
          <Button
            onClick={handleNewChat}
            className="w-full bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs h-9 rounded-xl shadow-sm gap-2"
          >
            <Plus size={15} /> New Chat
          </Button>

          <div className="pt-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 px-1">
              Conversations
            </p>
            <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-none">
              {conversations.length > 0 ? (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectConversation(c)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition text-xs font-semibold ${
                      activeConversationId === c.id
                        ? "bg-white dark:bg-slate-800 text-[#274690] dark:text-[#8fb1ec] shadow-xs border border-slate-200 dark:border-white/10"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare size={14} className="shrink-0 text-slate-400" />
                      <span className="truncate">{c.title || "Conversation"}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConv(c.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-400 italic px-2 py-3">No previous chats recorded.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400">
          <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Bot size={13} className="text-[#274690] dark:text-[#8fb1ec]" /> Multi-Provider Gateway
          </p>
          <p className="mt-0.5 font-medium">Responses generated via central enterprise routing.</p>
        </div>
      </div>

      {/* RIGHT MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        {/* CHAT HEADER WITH PROVIDER / MODEL DROPDOWN */}
        <div className="p-3.5 px-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#131c36] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#274690] text-white flex items-center justify-center font-bold">
              <Bot size={17} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                Enterprise AI Assistant
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Tenant Isolated • {defaultDepartment} Department
              </p>
            </div>
          </div>

          {/* Dynamic AI Model Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">
              AI Engine:
            </span>

            {allSelectableModels.length > 1 ? (
              <select
                value={`${selectedProvider}::${selectedModel}`}
                onChange={(e) => {
                  const [pCode, mId] = e.target.value.split("::");
                  setSelectedProvider(pCode);
                  setSelectedModel(mId);
                }}
                className="h-8 px-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#274690]"
              >
                {allSelectableModels.map((item, idx) => (
                  <option key={idx} value={`${item.providerCode}::${item.modelId}`}>
                    {item.providerName} - {item.modelName}
                  </option>
                ))}
              </select>
            ) : (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold py-1 px-2.5 rounded-xl">
                ✓ Google Gemini (Gemini 3.6 Flash)
              </Badge>
            )}
          </div>
        </div>

        {/* CHAT MESSAGES FEED */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 scrollbar-none bg-slate-50/40 dark:bg-[#0c1222]">
          {messages.map((msg) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#274690] to-[#1e3a5f] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-1">
                    <Bot size={15} />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs font-medium space-y-2.5 shadow-xs leading-relaxed ${
                    isUser
                      ? "bg-[#274690] text-white rounded-br-none"
                      : "bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-white/10 rounded-tl-none"
                  }`}
                >
                  {/* Attachment Indicator */}
                  {msg.attachmentName && (
                    <div className="p-2 rounded-lg bg-black/10 dark:bg-white/5 border border-white/10 flex items-center gap-1.5 text-[11px] font-bold">
                      <Paperclip size={13} />
                      <span className="truncate">{msg.attachmentName}</span>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                  {/* Metadata & Actions for Assistant Messages */}
                  {!isUser && (
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        <Sparkles size={11} className="text-[#8fb1ec]" />
                        Generated by {msg.provider?.name || "Google Gemini"} ({msg.model?.name || "Gemini 3.6 Flash"})
                        {msg.latencyMs && ` · ${(msg.latencyMs / 1000).toFixed(1)}s`}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 transition"
                        >
                          {copiedId === msg.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                        </button>

                        <Button
                          onClick={() => handleOpenSaveModal(msg)}
                          size="sm"
                          className="h-6 px-2.5 rounded-lg bg-[#274690] hover:bg-[#1f3561] text-white text-[11px] font-bold shadow-xs gap-1"
                        >
                          <FileCheck size={11} /> Save as Document
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-1">
                    <User size={15} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing / Generating Indicator */}
          {isGenerating && (
            <div className="flex gap-3 justify-start animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-[#274690] text-white flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                <Bot size={15} />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl rounded-tl-none p-3.5 px-4 text-xs font-semibold text-slate-500 flex items-center gap-2 shadow-xs">
                <RefreshCw size={14} className="animate-spin text-[#274690] dark:text-[#8fb1ec]" />
                <span>Thinking and authoring with {selectedProvider.toUpperCase()}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ATTACHED FILE BANNER */}
        {attachedFile && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 border-t border-blue-100 dark:border-white/10 flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
            <span className="flex items-center gap-1.5 truncate">
              <Paperclip size={14} className="text-[#274690]" />
              Attached Reference: {attachedFile.name} ({(attachedFile.size / 1024).toFixed(1)} KB)
            </span>
            <button
              onClick={() => setAttachedFile(null)}
              className="text-slate-400 hover:text-rose-500"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* CHAT INPUT FORM */}
        <form
          onSubmit={handleSendMessage}
          className="p-3.5 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#131c36] flex items-center gap-2"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
            }}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-[#274690] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
            title="Attach reference document"
          >
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your prompt (e.g. 'Draft an employment agreement for a senior developer')..."
            className="flex-1 h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#274690]"
          />

          <Button
            type="submit"
            disabled={!inputMessage.trim() || isGenerating}
            className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs h-11 px-5 rounded-xl shadow-md shadow-[#274690]/20 gap-1.5"
          >
            <Send size={15} />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>

      {/* REUSABLE SAVE AS DOCUMENT MODAL */}
      <SaveAiAsDocumentModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        content={contentToSave}
        suggestedTitle={suggestedDocTitle}
        sourceType="AI Assistant Chat"
        aiProvider={saveProvider}
        aiModel={saveModel}
        conversationId={activeConversationId || undefined}
        onSaved={(doc) => {
          showToast(`✅ Document "${doc.name}" saved to vault!`);
        }}
      />
    </div>
  );
}
