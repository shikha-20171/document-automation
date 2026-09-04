"use client";

import { useState } from "react";
import { Tags, Plus, Edit2, Trash2, Shield, Folder, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface CategoryItem {
  id: string;
  name: string;
  docCount: number;
  permission: string;
  description: string;
}

const initialCategories: CategoryItem[] = [
  { id: "1", name: "HR", docCount: 342, permission: "HR Dept & Admin", description: "Employee records, offer letters, NDA, joining documents." },
  { id: "2", name: "Finance", docCount: 489, permission: "Finance Dept & Admin", description: "Tax filings, payroll reports, expense claims, bank stmts." },
  { id: "3", name: "Legal", docCount: 156, permission: "Legal & Executive Admin", description: "Master service agreements, NDAs, lease agreements." },
  { id: "4", name: "Sales", docCount: 210, permission: "Sales Team & Admin", description: "Client contracts, pitch decks, proposals, order forms." },
  { id: "5", name: "Compliance", docCount: 94, permission: "Compliance Officer & Admin", description: "ISO certifications, audit logs, data protection policies." },
  { id: "6", name: "Contracts", docCount: 178, permission: "Restricted Executive", description: "Vendor & client legally binding executed agreements." },
  { id: "7", name: "Invoices", docCount: 512, permission: "Accounts & Admin", description: "Scanned & OCR parsed vendor invoices." },
  { id: "8", name: "Policies", docCount: 45, permission: "All Organisation Staff", description: "Internal company rules, leave policies, IT guidelines." },
  { id: "9", name: "Reports", docCount: 88, permission: "Management & Admin", description: "Quarterly performance and financial reports." },
  { id: "10", name: "General", docCount: 65, permission: "All Users", description: "Unclassified general documents and memos." },
];

export default function CategoriesTab() {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [showModal, setShowModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatPerm, setNewCatPerm] = useState("All Users");
  const [newCatDesc, setNewCatDesc] = useState("");

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    const cat: CategoryItem = {
      id: Date.now().toString(),
      name: newCatName,
      docCount: 0,
      permission: newCatPerm,
      description: newCatDesc || "Custom document classification category.",
    };
    setCategories([...categories, cat]);
    setShowModal(false);
    setNewCatName("");
    setNewCatDesc("");
  };

  const handleDeleteCat = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Tags size={22} className="text-[#274690]" /> Document Categories
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization classification categories, document counts, and department access permissions.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-2xl text-xs px-4 py-2.5 shadow-md flex items-center gap-2">
          <Plus size={16} /> + Create Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <Card key={c.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-[#274690]/40 transition space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 text-[#274690] flex items-center justify-center font-bold text-xs">
                  <Folder size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{c.name}</h3>
                  <p className="text-[11px] font-semibold text-slate-400">{c.docCount} Documents</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button title="Delete Category" onClick={() => handleDeleteCat(c.id)} className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              {c.description}
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                <Shield size={13} className="text-slate-400" />
                <span>{c.permission}</span>
              </div>
              <Button size="sm" variant="ghost" className="text-xs font-bold text-[#274690] hover:bg-blue-50">
                Edit Access
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Tags size={18} className="text-[#274690]" /> Create Category
              </h3>
              <button onClick={() => setShowModal(false)} className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audits / Tax / Marketing"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#274690] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Access Permission Level</label>
                <select
                  value={newCatPerm}
                  onChange={(e) => setNewCatPerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none"
                >
                  <option value="All Users">All Users</option>
                  <option value="Admin & Dept Leads">Admin & Dept Leads</option>
                  <option value="Restricted Admin Only">Restricted Admin Only</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Category description..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#274690] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowModal(false)} variant="outline" className="rounded-xl font-bold">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl">
                  Create Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
