"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, ArrowLeft, Plus, Trash2, Save, Send, Building2,
  Calendar, Layers, CheckCircle2, AlertCircle, RefreshCw, FileText
} from "lucide-react";
import apiClient from "@/lib/axios";

interface LineItem {
  id?: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  amount: number;
}

interface CrmClientOption {
  id: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
}

interface TemplateOption {
  id: string;
  name: string;
  category: string;
  currency: string;
  defaultTaxRate: number;
  defaultTerms?: string | null;
  defaultPaymentTerms?: string | null;
  defaultNotes?: string | null;
  items?: Array<{
    title: string;
    description?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
  }> | null;
}

const PROMPT_SUGGESTIONS = [
  "Create a professional quotation for ABC Technologies for website development worth ₹3,00,000.",
  "Annual Cloud DevOps & Infrastructure maintenance retainer for ₹2,40,000.",
  "Mobile app MVP design & engineering for FinTech startup worth ₹5,00,000.",
  "Quarterly Performance Marketing & Growth Retainer for ₹1,20,000.",
];

function CreateQuotationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTemplateId = searchParams.get("templateId");

  // AI State
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);

  // CRM & Template Data
  const [crmClients, setCrmClients] = useState<CrmClientOption[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(preselectedTemplateId || "");

  // Form Fields
  const [title, setTitle] = useState("Professional Services Quotation");
  const [clientName, setClientName] = useState("");
  const [clientContactPerson, setClientContactPerson] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Financials & Items
  const [items, setItems] = useState<LineItem[]>([
    {
      title: "UI/UX Design & Architecture Specification",
      description: "Wireframes, responsive layouts, interactive Figma prototype, and technical PRD.",
      quantity: 1,
      unit: "milestone",
      unitPrice: 75000,
      amount: 75000,
    },
    {
      title: "Core Full-Stack Application Engineering",
      description: "Frontend components, authenticated REST microservices, database schemas, and external API integrations.",
      quantity: 1,
      unit: "milestone",
      unitPrice: 175000,
      amount: 175000,
    },
    {
      title: "QA Hardening, Cloud Deployment & Warranty",
      description: "End-to-end automated testing, load testing, cloud CI/CD pipeline setup, and 30-day post-launch warranty.",
      quantity: 1,
      unit: "milestone",
      unitPrice: 50000,
      amount: 50000,
    },
  ]);

  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18);

  // Terms & Payment
  const [paymentTerms, setPaymentTerms] = useState(
    "50% advance upon quotation sign-off, 30% on staging delivery & UAT, 20% on final production handover."
  );
  const [termsAndConditions, setTermsAndConditions] = useState(
    "1. Quotation valid for 30 calendar days from date of issue.\n2. Work commences within 3 business days of advance clearance.\n3. Complete source code, IP ownership, and production keys transferred upon final invoice settlement.\n4. Additional scope changes will be estimated through formal change requests."
  );
  const [notes, setNotes] = useState(
    "Thank you for considering our proposal. We look forward to delivering exceptional engineering results for your team."
  );

  // Bank Details
  const [bankDetails, setBankDetails] = useState({
    bankName: "HDFC Bank Ltd",
    accountName: "Enterprise Solutions Tech Pvt Ltd",
    accountNumber: "50200012345678",
    ifscCode: "HDFC0001234",
    branch: "Cyber City Branch, Gurugram",
    upiId: "enterprisesolutions@hdfcbank",
  });

  // Saving State
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string; type?: "success" | "error" } | null>(null);

  const showToast = (title: string, desc?: string, type: "success" | "error" = "success") => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load CRM Clients & Templates
  useEffect(() => {
    async function initData() {
      try {
        const [crmRes, tplRes] = await Promise.all([
          apiClient.get("/api/crm/clients").catch(() => ({ data: { data: [] } })),
          apiClient.get("/api/quotation-templates").catch(() => ({ data: { data: [] } })),
        ]);

        if (crmRes.data?.data) {
          setCrmClients(crmRes.data.data);
        }
        if (tplRes.data?.data) {
          setTemplates(tplRes.data.data);

          // If template was passed in URL query, apply it
          if (preselectedTemplateId) {
            const match = tplRes.data.data.find((t: TemplateOption) => t.id === preselectedTemplateId);
            if (match) applyTemplate(match);
          }
        }
      } catch (err) {
        console.warn("Initial data load error:", err);
      }
    }
    initData();
  }, [preselectedTemplateId]);

  // Handle CRM Client Selection
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = crmClients.find((c) => c.id === clientId);
    if (client) {
      setClientName(client.name);
      if (client.contactPerson) setClientContactPerson(client.contactPerson);
      if (client.email) setClientEmail(client.email);
      if (client.phone) setClientPhone(client.phone);
      if (client.address || client.city) {
        setClientAddress([client.address, client.city].filter(Boolean).join(", "));
      }
    }
  };

  // Apply Template
  const applyTemplate = (tpl: TemplateOption) => {
    if (tpl.currency) setCurrency(tpl.currency);
    if (tpl.defaultTaxRate !== undefined) setTaxRate(tpl.defaultTaxRate);
    if (tpl.defaultTerms) setTermsAndConditions(tpl.defaultTerms);
    if (tpl.defaultPaymentTerms) setPaymentTerms(tpl.defaultPaymentTerms);
    if (tpl.defaultNotes) setNotes(tpl.defaultNotes);

    if (tpl.items && Array.isArray(tpl.items) && tpl.items.length > 0) {
      const mapped = tpl.items.map((it) => ({
        title: it.title || "Item",
        description: it.description || "",
        quantity: Number(it.quantity || 1),
        unit: it.unit || "unit",
        unitPrice: Number(it.unitPrice || 0),
        amount: Number(it.quantity || 1) * Number(it.unitPrice || 0),
      }));
      setItems(mapped);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) applyTemplate(tpl);
  };

  // Handle AI Generation
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      showToast("Empty Prompt", "Please describe the quotation you want to create.", "error");
      return;
    }

    try {
      setGeneratingAi(true);
      const res = await apiClient.post("/api/quotations/ai-generate", {
        prompt: aiPrompt.trim(),
        clientContext: selectedClientId ? crmClients.find((c) => c.id === selectedClientId) : null,
        templateContext: selectedTemplateId ? templates.find((t) => t.id === selectedTemplateId) : null,
      });

      if (res.data?.success && res.data.data) {
        const gen = res.data.data;
        if (gen.title) setTitle(gen.title);
        if (gen.clientName && !clientName) setClientName(gen.clientName);
        if (gen.clientContactPerson && !clientContactPerson) setClientContactPerson(gen.clientContactPerson);
        if (gen.clientEmail && !clientEmail) setClientEmail(gen.clientEmail);
        if (gen.currency) setCurrency(gen.currency);
        if (gen.paymentTerms) setPaymentTerms(gen.paymentTerms);
        if (gen.termsAndConditions) setTermsAndConditions(gen.termsAndConditions);
        if (gen.notes) setNotes(gen.notes);
        if (gen.taxRate !== undefined) setTaxRate(gen.taxRate);

        if (gen.items && Array.isArray(gen.items) && gen.items.length > 0) {
          setItems(
            gen.items.map((it: any) => ({
              title: it.title,
              description: it.description || "",
              quantity: Number(it.quantity || 1),
              unit: it.unit || "unit",
              unitPrice: Number(it.unitPrice || 0),
              amount: Number(it.amount || it.quantity * it.unitPrice || 0),
            }))
          );
        }

        showToast("Quotation Generated!", "AI created structured deliverables and recalculated exact financials.");
      }
    } catch (err: any) {
      showToast("AI Generation Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setGeneratingAi(false);
    }
  };

  // Dynamic Item Handlers
  const handleItemChange = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };
    
    // Auto recalculate row amount
    if (field === "quantity" || field === "unitPrice") {
      const q = Math.max(0, Number(field === "quantity" ? val : item.quantity) || 0);
      const p = Math.max(0, Number(field === "unitPrice" ? val : item.unitPrice) || 0);
      item.amount = Math.round(q * p * 100) / 100;
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        title: "",
        description: "",
        quantity: 1,
        unit: "unit",
        unitPrice: 0,
        amount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      showToast("Notice", "A quotation must have at least one line item.", "error");
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Math Calculations (Live)
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    if (discountType === "PERCENTAGE") {
      return Math.round(((subtotal * Math.min(100, Number(discountValue || 0))) / 100) * 100) / 100;
    }
    return Math.min(subtotal, Number(discountValue || 0));
  }, [subtotal, discountType, discountValue]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = useMemo(() => {
    return Math.round(((taxableAmount * Number(taxRate || 0)) / 100) * 100) / 100;
  }, [taxableAmount, taxRate]);

  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  const formatCurrency = (val: number) => {
    const sym = currency === "INR" ? "₹" : currency === "USD" ? "$" : `${currency} `;
    return `${sym}${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Save Quotation
  const handleSaveQuotation = async (status: "DRAFT" | "GENERATED" = "DRAFT") => {
    if (!clientName.trim()) {
      showToast("Missing Client Name", "Please enter or select a client name.", "error");
      return;
    }
    if (!title.trim()) {
      showToast("Missing Title", "Please provide a quotation subject/title.", "error");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        clientId: selectedClientId || null,
        clientName: clientName.trim(),
        clientContactPerson: clientContactPerson.trim() || null,
        clientEmail: clientEmail.trim() || null,
        clientPhone: clientPhone.trim() || null,
        clientAddress: clientAddress.trim() || null,
        currency,
        issueDate,
        expiryDate,
        items,
        discountType,
        discountValue,
        taxRate,
        paymentTerms,
        termsAndConditions,
        notes,
        bankDetails,
        templateId: selectedTemplateId || null,
        aiPrompt: aiPrompt ? aiPrompt.trim() : null,
        status,
      };

      const res = await apiClient.post("/api/quotations", payload);

      if (res.data?.success && res.data.data) {
        showToast("Quotation Created!", `Quotation ${res.data.data.quotationNumber} saved successfully.`);
        router.push(`/org-admin/quotations/${res.data.data.id}`);
      }
    } catch (err: any) {
      showToast("Failed to Save", err.response?.data?.message || err.message, "error");
    } finally {
      setSaving(false);
    }
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

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/org-admin/quotations"
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create New Quotation</h1>
            <p className="text-xs text-slate-500">
              Use natural language AI generation, choose a reusable template, or build itemized deliverables manually.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveQuotation("DRAFT")}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save as Draft</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveQuotation("GENERATED")}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Save & Generate Proposal</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Assistant Section */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>AI Quotation Co-Pilot</span>
        </div>

        <h2 className="text-lg font-bold mb-1">Generate Instant Commercial Quotation with AI</h2>
        <p className="text-xs text-blue-200/80 mb-4 max-w-2xl">
          Describe the client, requirements, milestones, and estimated budget in natural language. The AI will extract deliverables, calculate milestones, and structure line items with tax.
        </p>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <textarea
              rows={2}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Create a professional quotation for ABC Technologies for website development worth ₹3,00,000 with 4 milestones..."
              className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-blue-400 rounded-xl text-xs text-white placeholder-blue-200/50 focus:outline-none transition resize-none"
            />
          </div>
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={generatingAi || !aiPrompt.trim()}
            className="md:self-start flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/30 transition disabled:opacity-50 whitespace-nowrap"
          >
            {generatingAi ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Breakdown...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate with AI</span>
              </>
            )}
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-blue-300/80 uppercase font-semibold">Try Prompt:</span>
          {PROMPT_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setAiPrompt(s)}
              className="text-[11px] bg-white/10 hover:bg-white/20 text-blue-100 px-3 py-1 rounded-lg border border-white/10 transition truncate max-w-xs"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Quotation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Deliverables & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Meta & Client Selection */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>1. General Details & CRM Client</span>
              <span className="text-xs font-normal text-slate-500">Auto-links to your CRM records</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quotation Subject / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Website Design & Full-Stack Development"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Pick from CRM Client Directory</span>
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="">-- Manual Entry or Select Client --</option>
                  {crmClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.contactPerson ? `(${c.contactPerson})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client / Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. ABC Technologies Pvt Ltd"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attention / Contact Person
                </label>
                <input
                  type="text"
                  value={clientContactPerson}
                  onChange={(e) => setClientContactPerson(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Email Address
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@abctech.com"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Phone Number
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Billing Address / Location
                </label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="e.g. Tower B, DLF Cyber City, Phase 2, Gurugram, Haryana"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valid Until / Expiry
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">2. Deliverables & Line Items</h3>
                <p className="text-xs text-slate-500">Provide itemized milestones with rate and units.</p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">
                      {index + 1}
                    </span>

                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder="Deliverable or Milestone Title"
                        value={item.title}
                        onChange={(e) => handleItemChange(index, "title", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                      <textarea
                        rows={2}
                        placeholder="Detailed scope, technical components, or deliverable description..."
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs text-slate-600 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white resize-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Pricing Fields */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                        Unit
                      </label>
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="unit">unit</option>
                        <option value="milestone">milestone</option>
                        <option value="service">service</option>
                        <option value="hours">hours</option>
                        <option value="days">days</option>
                        <option value="month">month</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                        Rate ({currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                      />
                    </div>

                    <div className="text-right">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                        Line Amount
                      </label>
                      <div className="text-xs font-bold text-slate-900 pt-1">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terms, Conditions & Notes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              3. Payment Terms & Commercial Clauses
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Schedule & Milestones
              </label>
              <textarea
                rows={2}
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Terms & Conditions
              </label>
              <textarea
                rows={4}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes & Acknowledgement
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Col: Financial Math & Bank Details */}
        <div className="space-y-6">
          {/* Template Quick Loader */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-900 flex items-center justify-between">
              <span>Load from Template</span>
              <Layers className="w-3.5 h-3.5 text-blue-600" />
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="">-- Select Quotation Template --</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.category})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              Applying a template populates pre-saved line items & terms without overwriting your client details.
            </p>
          </div>

          {/* Real-time Financial Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Summary & Financial Math
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Currency</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="font-bold text-slate-800 border border-slate-200 rounded px-2 py-0.5"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>

              {/* Discount Selector */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-600">Discount</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDiscountType("PERCENTAGE")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        discountType === "PERCENTAGE" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType("FIXED")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        discountType === "FIXED" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      Flat
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg text-right font-medium"
                    placeholder="0"
                  />
                  <span className="text-xs text-emerald-600 font-semibold whitespace-nowrap">
                    - {formatCurrency(discountAmount)}
                  </span>
                </div>
              </div>

              {/* GST / Tax Selector */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-600">Tax / GST Rate</span>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="font-bold text-slate-800 border border-slate-200 rounded px-2 py-0.5"
                  >
                    <option value={0}>0% (Tax Exempt)</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST (Standard)</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>

                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Calculated GST</span>
                  <span className="font-semibold text-slate-800">+ {formatCurrency(taxAmount)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-slate-200">
                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Grand Total</div>
                    <div className="text-xs text-slate-300">All deliverables included</div>
                  </div>
                  <div className="text-xl font-bold text-white tracking-tight">
                    {formatCurrency(grandTotal)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bank & Remittance Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Bank & Remittance Details
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                  Account Name
                </label>
                <input
                  type="text"
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                  Account Number
                </label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={bankDetails.upiId}
                    onChange={(e) => setBankDetails({ ...bankDetails, upiId: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateQuotationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-medium text-slate-500">Loading Quotation Studio...</p>
        </div>
      }
    >
      <CreateQuotationContent />
    </Suspense>
  );
}
