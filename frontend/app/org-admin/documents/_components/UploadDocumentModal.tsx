"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  ScanText,
  Tag,
  Shield,
  File,
  X,
  FileSpreadsheet,
  FileType,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (fileName: string, customDoc?: any) => void;
}

export default function UploadDocumentModal({ isOpen, onClose, onSuccess }: UploadDocumentModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string>("PDF");
  const [fileName, setFileName] = useState("");
  const [category, setCategory] = useState("Invoices");
  const [department, setDepartment] = useState("Finance");
  const [branch, setBranch] = useState("Headquarters");
  const [enableOcr, setEnableOcr] = useState(true);
  const [tags, setTags] = useState("Urgent, Tax2026");
  const [accessPermission, setAccessPermission] = useState("Organisation Admin Only");

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setFileName(file.name);

    const ext = file.name.split(".").pop()?.toUpperCase() || "PDF";
    if (["PDF", "DOCX", "XLSX", "PPTX", "PNG", "JPG", "JPEG"].includes(ext)) {
      setSelectedFileType(ext === "PNG" || ext === "JPG" || ext === "JPEG" ? "JPG/PNG" : ext);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = fileName.trim()
      ? fileName.trim()
      : selectedFile
      ? selectedFile.name
      : `Document_${Date.now()}.${selectedFileType === "JPG/PNG" ? "png" : selectedFileType.toLowerCase()}`;

    setIsUploading(true);
    setUploadProgress(20);

    // Simulate smooth upload & OCR processing progress
    await new Promise((r) => setTimeout(r, 200));
    setUploadProgress(60);
    await new Promise((r) => setTimeout(r, 250));
    setUploadProgress(100);
    await new Promise((r) => setTimeout(r, 200));

    const newDoc = {
      id: `doc-${Date.now()}`,
      name: finalName,
      type: selectedFileType,
      category,
      owner: "Organisation Admin",
      department,
      branch,
      status: "Active",
      updated: "Just now",
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      ocrStatus: enableOcr ? "Completed" : "Skipped",
      size: selectedFile ? formatFileSize(selectedFile.size) : "1.4 MB",
    };

    onSuccess(finalName, newDoc);
    setIsUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    setFileName("");
    onClose();
  };

  const renderFileIcon = () => {
    if (selectedFileType === "PDF") return <FileText className="text-rose-600" size={24} />;
    if (selectedFileType === "XLSX") return <FileSpreadsheet className="text-emerald-600" size={24} />;
    if (selectedFileType === "JPG/PNG") return <ImageIcon className="text-cyan-600" size={24} />;
    return <FileType className="text-blue-600" size={24} />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Upload size={18} className="text-[#274690]" /> Upload Organisation Document
            </h3>
            <p className="text-xs text-slate-500">Upload and auto-classify document with AI OCR indexing</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          {/* Supported Files Types Bar */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Supported File Types</label>
            <div className="flex flex-wrap gap-2">
              {["PDF", "DOCX", "XLSX", "PPTX", "JPG/PNG", "Other"].map((ft) => (
                <button
                  key={ft}
                  type="button"
                  onClick={() => setSelectedFileType(ft)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                    selectedFileType === ft
                      ? "bg-[#274690] text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>
          </div>

          {/* Hidden Real File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {/* 1. File Upload Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center space-y-2.5 cursor-pointer transition ${
              isDragging
                ? "border-[#274690] bg-blue-50/60"
                : selectedFile
                ? "border-emerald-300 bg-emerald-50/20"
                : "border-blue-200/80 bg-blue-50/30 hover:bg-blue-50/60"
            }`}
          >
            {selectedFile ? (
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    {renderFileIcon()}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-slate-900 truncate text-xs">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-400 font-semibold">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setFileName("");
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Remove File"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="h-12 w-12 rounded-2xl bg-blue-100/70 text-[#274690] flex items-center justify-center mx-auto shadow-xs">
                  <Upload size={24} />
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">
                    Drag & drop your {selectedFileType} file here
                  </p>
                  <p className="text-xs text-[#274690] font-bold mt-0.5 underline">
                    or click to browse local files from your computer
                  </p>
                </div>
              </>
            )}

            <input
              type="text"
              placeholder="Or enter file title (e.g. Invoice_July_2026.pdf)..."
              value={fileName}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#274690]"
            />
          </div>

          {/* Upload Progress Bar (When uploading) */}
          {isUploading && (
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Loader2 size={13} className="animate-spin text-[#274690]" /> Uploading & Processing OCR...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#274690] to-cyan-500 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* 2. Category & Department/Branch */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none bg-white"
              >
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Legal">Legal</option>
                <option value="Sales">Sales</option>
                <option value="Compliance">Compliance</option>
                <option value="Contracts">Contracts</option>
                <option value="Invoices">Invoices</option>
                <option value="Policies">Policies</option>
                <option value="Reports">Reports</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none bg-white"
              >
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="Legal">Legal</option>
                <option value="Engineering">Engineering</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none bg-white"
              >
                <option value="Headquarters">Headquarters</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Delhi">Delhi</option>
              </select>
            </div>
          </div>

          {/* 3. OCR? Yes/No Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <ScanText size={18} className="text-cyan-600" />
              <div>
                <p className="font-extrabold text-slate-900">Run AI OCR & Data Extraction?</p>
                <p className="text-[10px] text-slate-500">Automatically extract dates, amounts, vendors, and text</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnableOcr(!enableOcr)}
              className={`px-3 py-1 rounded-full font-bold text-xs transition ${
                enableOcr ? "bg-cyan-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {enableOcr ? "Yes (Enabled)" : "No (Skip)"}
            </button>
          </div>

          {/* 4. Tags & Access Permission */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tags (Comma Separated)</label>
              <input
                type="text"
                placeholder="e.g. Urgent, Tax2026"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Access Permission</label>
              <select
                value={accessPermission}
                onChange={(e) => setAccessPermission(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none bg-white"
              >
                <option value="Organisation Admin Only">Organisation Admin Only</option>
                <option value="Department Leads">Department Leads</option>
                <option value="All Organisation Staff">All Organisation Staff</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              variant="outline"
              className="rounded-xl font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading}
              className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md px-5"
            >
              {isUploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload size={14} /> Upload & Save Document
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
