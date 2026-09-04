"use client";

import { useState } from "react";
import { ScanText, CheckCircle2, AlertTriangle, RefreshCw, Eye, Sparkles, Check, Edit3, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface OcrJob {
  id: string;
  documentName: string;
  category: string;
  status: "Processing" | "Processed" | "Failed" | "Review Required";
  confidence: number;
  extractedFields: {
    invoiceNumber?: string;
    vendor?: string;
    totalAmount?: string;
    date?: string;
    gstNumber?: string;
  };
  processedDate: string;
}

const initialOcrJobs: OcrJob[] = [
  {
    id: "1",
    documentName: "Vendor_Invoice_TechCorp_Q3.pdf",
    category: "Invoices",
    status: "Review Required",
    confidence: 94.2,
    extractedFields: {
      invoiceNumber: "INV-2026-8891",
      vendor: "TechCorp Solutions Pvt Ltd",
      totalAmount: "₹1,45,000.00",
      date: "08 Aug 2026",
      gstNumber: "27AAAAA0000A1Z5"
    },
    processedDate: "10 Aug 2026, 01:15 PM"
  },
  {
    id: "2",
    documentName: "Fuel_Receipt_July_Scan.jpg",
    category: "Finance",
    status: "Processed",
    confidence: 99.1,
    extractedFields: {
      invoiceNumber: "REC-9012",
      vendor: "Indian Oil Petrol Pump",
      totalAmount: "₹3,200.00",
      date: "31 Jul 2026",
      gstNumber: "07BCCCB1111B2Z3"
    },
    processedDate: "09 Aug 2026, 04:20 PM"
  },
  {
    id: "3",
    documentName: "Blurry_Scanned_Vendor_Form.pdf",
    category: "Invoices",
    status: "Failed",
    confidence: 42.0,
    extractedFields: {
      invoiceNumber: "INV-???",
      vendor: "Unknown Vendor (Blurry Text)",
      totalAmount: "₹0.00",
      date: "N/A",
      gstNumber: "N/A"
    },
    processedDate: "09 Aug 2026, 11:05 AM"
  },
  {
    id: "4",
    documentName: "Client_Purchase_Order_88.pdf",
    category: "Contracts",
    status: "Processing",
    confidence: 0,
    extractedFields: {},
    processedDate: "Just now"
  }
];

export default function OcrExtractionTab() {
  const [jobs, setJobs] = useState<OcrJob[]>(initialOcrJobs);
  const [activeTab, setActiveTab] = useState<"Processing Queue" | "Processed" | "Failed" | "Review Required">("Review Required");
  const [inspectJob, setInspectJob] = useState<OcrJob | null>(null);
  const [editFields, setEditFields] = useState<OcrJob["extractedFields"]>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleRetry = (id: string, name: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: "Processing", confidence: 85 } : j));
    showToast(`Retrying OCR extraction job for "${name}"...`);
  };

  const handleApproveOcr = (job: OcrJob) => {
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: "Processed", extractedFields: { ...j.extractedFields, ...editFields } } : j));
    setInspectJob(null);
    showToast(`Approved AI OCR extracted data for ${job.documentName}`);
  };

  const filteredJobs = jobs.filter(j => {
    if (activeTab === "Processing Queue") return j.status === "Processing";
    if (activeTab === "Processed") return j.status === "Processed";
    if (activeTab === "Failed") return j.status === "Failed";
    return j.status === "Review Required";
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Toast */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Sparkles size={16} className="text-cyan-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ScanText size={22} className="text-[#274690]" /> OCR & AI Data Extraction
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated optical character recognition and AI field parser for invoices, receipts, contracts, and forms.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(["Review Required", "Processing Queue", "Processed", "Failed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === tab
                ? tab === "Review Required" ? "bg-amber-600 text-white shadow-xs" :
                  tab === "Processed" ? "bg-emerald-600 text-white shadow-xs" :
                  tab === "Failed" ? "bg-rose-600 text-white shadow-xs" :
                  "bg-cyan-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab} ({jobs.filter(j => {
              if (tab === "Processing Queue") return j.status === "Processing";
              if (tab === "Processed") return j.status === "Processed";
              if (tab === "Failed") return j.status === "Failed";
              return j.status === "Review Required";
            }).length})
          </button>
        ))}
      </div>

      {/* Jobs Grid / Inspector List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.length === 0 ? (
          <div className="col-span-2 text-center py-10 bg-white rounded-2xl border border-slate-200/80 text-slate-400 font-medium text-xs">
            No OCR jobs in the {activeTab} stage.
          </div>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">{job.documentName}</h4>
                  <p className="text-[11px] text-slate-500">Category: {job.category} • {job.processedDate}</p>
                </div>
                <Badge className={`text-[10px] font-bold ${
                  job.status === "Processed" ? "bg-emerald-100 text-emerald-800" :
                  job.status === "Review Required" ? "bg-amber-100 text-amber-800" :
                  job.status === "Failed" ? "bg-rose-100 text-rose-800" :
                  "bg-cyan-100 text-cyan-800"
                }`}>
                  {job.status} {job.confidence > 0 && `(${job.confidence}%)`}
                </Badge>
              </div>

              {/* Extracted Key-Values Box */}
              {job.extractedFields.invoiceNumber && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Invoice No:</span>
                    <strong className="text-slate-900">{job.extractedFields.invoiceNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Vendor:</span>
                    <strong className="text-slate-900">{job.extractedFields.vendor}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Total Amount:</span>
                    <strong className="text-emerald-700 font-extrabold">{job.extractedFields.totalAmount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">GSTIN:</span>
                    <strong className="text-slate-900">{job.extractedFields.gstNumber}</strong>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                {job.status === "Failed" && (
                  <Button onClick={() => handleRetry(job.id, job.documentName)} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs h-8">
                    <RefreshCw size={13} className="mr-1" /> Retry OCR Job
                  </Button>
                )}

                {job.status === "Review Required" && (
                  <Button 
                    onClick={() => {
                      setInspectJob(job);
                      setEditFields(job.extractedFields);
                    }} 
                    size="sm" 
                    className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs h-8 px-4"
                  >
                    <Edit3 size={13} className="mr-1" /> Review & Approve
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Review Inspector Modal */}
      {inspectJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" /> Review Extracted AI Data
                </h3>
                <p className="text-xs text-slate-500">Correct any OCR mistakes before saving to database</p>
              </div>
              <button onClick={() => setInspectJob(null)} className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={editFields.invoiceNumber || ""}
                  onChange={(e) => setEditFields({ ...editFields, invoiceNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#274690] focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Vendor Name</label>
                <input
                  type="text"
                  value={editFields.vendor || ""}
                  onChange={(e) => setEditFields({ ...editFields, vendor: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#274690] focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Amount</label>
                  <input
                    type="text"
                    value={editFields.totalAmount || ""}
                    onChange={(e) => setEditFields({ ...editFields, totalAmount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#274690] focus:outline-none font-extrabold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={editFields.gstNumber || ""}
                    onChange={(e) => setEditFields({ ...editFields, gstNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#274690] focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" onClick={() => setInspectJob(null)} variant="outline" className="rounded-xl font-bold">
                  Cancel
                </Button>
                <Button onClick={() => handleApproveOcr(inspectJob)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
                  Approve OCR Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
