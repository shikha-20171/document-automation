"use client";

import React, { useState } from "react";
import AiToolsDashboard from "./_components/AiToolsDashboard";
import AiChatComponent from "@/components/ai/AiChatComponent";
import { Wrench, MessageSquare } from "lucide-react";

export default function OrgAdminAiToolsPage() {
  const [activeSubTab, setActiveSubTab] = useState<"tools" | "chat">("tools");

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12 min-w-0 max-w-full">
      {/* Top Tab Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("tools")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === "tools"
              ? "bg-[#274690] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <Wrench size={14} className={activeSubTab === "tools" ? "text-amber-300" : "text-slate-500"} />
          <span>9 AI Processing Tools</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("chat")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === "chat"
              ? "bg-[#274690] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <MessageSquare size={14} className={activeSubTab === "chat" ? "text-amber-300" : "text-slate-500"} />
          <span>AI Assistant & Q&A</span>
        </button>
      </div>

      {activeSubTab === "tools" && <AiToolsDashboard />}
      {activeSubTab === "chat" && <AiChatComponent userRole="Org Admin" defaultDepartment="Company-wide" />}
    </div>
  );
}
