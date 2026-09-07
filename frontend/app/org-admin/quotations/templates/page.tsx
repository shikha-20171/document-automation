"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers, Plus, Search, ArrowLeft, ArrowUpRight, Trash2, Edit2,
  CheckCircle2, AlertCircle, RefreshCw, Sparkles, FileText,
  DollarSign, ShieldCheck
} from "lucide-react";
import apiClient from "@/lib/axios";

interface TemplateItem {
  title: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
}

interface QuotationTemplate {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  currency: string;
  defaultTaxRate: number;
  defaultTerms?: string | null;
  defaultPaymentTerms?: string | null;
  defaultNotes?: string | null;
  items?: TemplateItem[] | null;
  isStandard: boolean;
  createdAt: string;
  _count?: { quotations: number };
}

export default function QuotationTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string; type?: "success" | "error" } | null>(null);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuotationTemplate | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Software");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [defaultTaxRate, setDefaultTaxRate] = useState(18);
  const [defaultTerms, setDefaultTerms] = useState(
    "1. Quotation valid for 30 calendar days.\n2. 50% advance invoice required prior to kickoff.\n3. Complete IP ownership transferred upon settlement."
  );
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(
    "50% advance on sign-off, 30% upon staging milestone, 20% on final handover."
  );
  const [items, setItems] = useState<TemplateItem[]>([
    { title: "Discovery & Solution Architecture", description: "Requirement analysis & tech design", quantity: 1, unit: "milestone", unitPrice: 50000 },
    { title: "Core Engineering & Implementation", description: "Full-stack development & testing", quantity: 1, unit: "milestone", unitPrice: 150000 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (title: string, desc?: string, type: "success" | "error" = "success") => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/api/quotation-templates?category=${categoryFilter}&search=${encodeURIComponent(search)}`);
      if (res.data?.success) {
        setTemplates(res.data.data || []);
      }
    } catch (err: any) {
      showToast("Load Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setName("");
    setCategory("Software");
    setDescription("");
    setCurrency("INR");
    setDefaultTaxRate(18);
    setItems([
      { title: "Discovery & Solution Architecture", description: "Requirement analysis & tech design", quantity: 1, unit: "milestone", unitPrice: 50000 },
      { title: "Core Engineering & Implementation", description: "Full-stack development & testing", quantity: 1, unit: "milestone", unitPrice: 150000 },
    ]);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (tpl: QuotationTemplate) => {
    setEditingTemplate(tpl);
    setName(tpl.name);
    setCategory(tpl.category);
    setDescription(tpl.description || "");
    setCurrency(tpl.currency || "INR");
    setDefaultTaxRate(tpl.defaultTaxRate || 18);
    setDefaultTerms(tpl.defaultTerms || "");
    setDefaultPaymentTerms(tpl.defaultPaymentTerms || "");
    setItems(Array.isArray(tpl.items) && tpl.items.length > 0 ? tpl.items : [
      { title: "Deliverable 1", description: "", quantity: 1, unit: "unit", unitPrice: 10000 }
    ]);
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string, tplName: string) => {
    if (!confirm(`Are you sure you want to delete template "${tplName}"?`)) return;
    try {
      await apiClient.delete(`/api/quotation-templates/${id}`);
      showToast("Deleted", `Template "${tplName}" removed.`);
      loadTemplates();
    } catch (err: any) {
      showToast("Delete Failed", err.response?.data?.message || err.message, "error");
    }
  };

  const handleAddItem = () => {
    setItems([...items, { title: "", description: "", quantity: 1, unit: "milestone", unitPrice: 0 }]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof TemplateItem, val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    setItems(updated);
  };

  const handleSubmitTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Missing Name", "Template name is required.", "error");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        category,
        description: description.trim() || null,
        currency,
        defaultTaxRate,
        defaultTerms,
        defaultPaymentTerms,
        items,
      };

      if (editingTemplate) {
        await apiClient.put(`/api/quotation-templates/${editingTemplate.id}`, payload);
        showToast("Template Updated!", `Updated "${name}"`);
      } else {
        await apiClient.post(`/api/quotation-templates`, payload);
        showToast("Template Created!", `Created "${name}"`);
      }

      setShowCreateModal(false);
      loadTemplates();
    } catch (err: any) {
      showToast("Save Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number, curr = "INR") => {
    const sym = curr === "INR" ? "₹" : curr === "USD" ? "$" : `${curr} `;
    return `${sym}${Number(val || 0).toLocaleString("en-IN")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md transition-all ${
            toastMessage.type === "error"
              ? "bg-rose-50/95 text-rose-800 border-rose-200"
              : "bg-emerald-50/95 text-emerald-800 border-emerald-200"
          }`}
        >
          {toastMessage.type === "error" ? <AlertCircle className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          <div>
            <div className="font-semibold text-sm">{toastMessage.title}</div>
            {toastMessage.desc && <div className="text-xs opacity-90">{toastMessage.desc}</div>}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/org-admin/quotations"
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Reusable Quotation Templates</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                {templates.length} Available
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Standardize commercial pricing, deliverable milestones, and terms. Apply to any new client without data leakage.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Custom Template</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {["All", "Software", "Consulting", "Marketing", "General"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
                categoryFilter === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-600">Loading templates...</div>
        </div>
      ) : templates.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No Templates Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Try clearing your search query or create a brand new template.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl"
          >
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => {
            const itemCount = Array.isArray(tpl.items) ? tpl.items.length : 0;
            const estimatedTotal = Array.isArray(tpl.items)
              ? tpl.items.reduce((sum, it) => sum + (Number(it.quantity || 1) * Number(it.unitPrice || 0)), 0)
              : 0;

            return (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                      {tpl.category}
                    </span>
                    {tpl.isStandard ? (
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Standard
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(tpl)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded"
                          title="Edit Template"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tpl.id, tpl.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{tpl.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {tpl.description || "Reusable enterprise quotation structure."}
                  </p>

                  {/* Highlights */}
                  <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pre-defined Items:</span>
                      <strong className="text-slate-800">{itemCount} items</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Est. Base Total:</span>
                      <strong className="text-slate-800">{formatCurrency(estimatedTotal, tpl.currency)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Standard GST:</span>
                      <strong className="text-slate-800">{tpl.defaultTaxRate}%</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Used {tpl._count?.quotations || 0} times
                  </div>

                  <Link
                    href={`/org-admin/quotations/new?templateId=${tpl.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
                  >
                    <span>Use Template</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingTemplate ? `Edit Template: ${editingTemplate.name}` : "Create Quotation Template"}
                  </h3>
                  <p className="text-xs text-slate-500">Configure standard deliverables, terms, and tax rate</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmitTemplate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Template Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mobile App Engineering Standard"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Software">Software & IT</option>
                    <option value="Consulting">Consulting & Advisory</option>
                    <option value="Marketing">Marketing & Design</option>
                    <option value="General">General Services</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of when to use this template..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Tax / GST %
                  </label>
                  <input
                    type="number"
                    value={defaultTaxRate}
                    onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Standard Line Items */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Standard Deliverable Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {items.map((it, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="Item Title"
                        value={it.title}
                        onChange={(e) => handleItemChange(idx, "title", e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 1)}
                        className="w-16 px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                      <input
                        type="number"
                        placeholder="Rate"
                        value={it.unitPrice}
                        onChange={(e) => handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Payment Terms
                  </label>
                  <textarea
                    rows={2}
                    value={defaultPaymentTerms}
                    onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Terms & Conditions
                  </label>
                  <textarea
                    rows={3}
                    value={defaultTerms}
                    onChange={(e) => setDefaultTerms(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingTemplate ? "Update Template" : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
