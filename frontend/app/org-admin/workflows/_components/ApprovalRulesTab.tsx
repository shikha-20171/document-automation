"use client";

import { useState } from "react";
import { Plus, Edit3, Trash2, Power, MoreVertical, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ApprovalRule {
  id: string;
  rule: string;
  condition: string;
  approvers: string;
  status: "Active" | "Disabled";
}

interface ApprovalRulesTabProps {
  showToast: (msg: string) => void;
}

const initialRules: ApprovalRule[] = [
  { id: "1", rule: "Contract > ₹10L", condition: "Contract Amount > ₹10,00,000", approvers: "Manager + Finance", status: "Active" },
  { id: "2", rule: "Contract > ₹25L", condition: "Contract Amount > ₹25,00,000", approvers: "Manager + Finance + Legal + Admin", status: "Active" },
  { id: "3", rule: "Invoice > ₹5L", condition: "Invoice Amount > ₹5,00,000", approvers: "Finance Manager", status: "Active" },
  { id: "4", rule: "HR Offer Letter", condition: "Document Type = Offer Letter", approvers: "HR Manager", status: "Active" },
];

export default function ApprovalRulesTab({ showToast }: ApprovalRulesTabProps) {
  const [rules, setRules] = useState<ApprovalRule[]>(initialRules);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const toggleStatus = (id: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const newStatus = r.status === "Active" ? "Disabled" : "Active";
        showToast(`Rule "${r.rule}" ${newStatus.toLowerCase()}`);
        return { ...r, status: newStatus };
      })
    );
    setActiveMenuId(null);
  };

  const deleteRule = (id: string) => {
    setRules((prev) => {
      const rule = prev.find((r) => r.id === id);
      if (rule) showToast(`Rule "${rule.rule}" deleted`);
      return prev.filter((r) => r.id !== id);
    });
    setActiveMenuId(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings size={22} className="text-[#274690]" /> Approval Rules
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure conditional approval rules based on document type, amount, and other criteria.
          </p>
        </div>

        <button
          onClick={() => showToast("Create rule wizard coming soon")}
          className="flex items-center gap-2 bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-2xl text-xs px-4 py-2.5 shadow-md transition"
        >
          <Plus size={16} /> + Create Rule
        </button>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Rule</th>
                <th className="py-3.5 px-4">Condition</th>
                <th className="py-3.5 px-4">Approvers</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No rules configured.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{rule.rule}</td>
                    <td className="py-3.5 px-4 text-slate-600">{rule.condition}</td>
                    <td className="py-3.5 px-4 text-slate-600">{rule.approvers}</td>
                    <td className="py-3.5 px-4">
                      <Badge className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        rule.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                      }`}>
                        {rule.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right relative">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => showToast(`Editing rule "${rule.rule}"`)}
                          title="Edit"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-amber-600 transition"
                        >
                          <Edit3 size={16} />
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === rule.id ? null : rule.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenuId === rule.id && (
                            <div className="absolute right-0 top-8 z-30 w-44 rounded-2xl bg-white border border-slate-200 shadow-xl p-1.5 text-left text-xs font-semibold text-slate-700 space-y-0.5 animate-in fade-in zoom-in-95">
                              <button
                                onClick={() => toggleStatus(rule.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100"
                              >
                                <Power size={14} className={rule.status === "Active" ? "text-orange-600" : "text-emerald-600"} />
                                {rule.status === "Active" ? "Disable" : "Enable"}
                              </button>
                              <button
                                onClick={() => deleteRule(rule.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
