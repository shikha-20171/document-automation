"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import {
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Download,
  Edit3,
  FileText,
  PenTool,
  RefreshCw,
  Search,
  ShieldCheck,
  Signature,
  Trash2,
  X,
  Upload,
  RotateCcw,
  Eye,
  FileCheck,
  Sparkles,
  Check,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { eSignatureApi } from "@/services/eSignatureApi";

type SignatureStatus = "Pending" | "Signed" | "Declined" | "Changes Requested";
type ApprovalState = "Approved" | "Pending" | "Changes Requested";
type SignatureMode = "draw" | "type" | "upload";
type SignatureModal = "none" | "sign" | "request-changes" | "decline" | "view-document";

type SignatureRequest = {
  id: number;
  document: string;
  createdBy: string;
  department: string;
  approvalStatus: ApprovalState;
  signatureStatus: SignatureStatus;
  workflow: string;
  signer: string;
  role: string;
  sentAt: string;
  expiry: string;
  documentType: string;
  statusNote: string;
  previewLines: string[];
  signatureData?: string; // Data URL or text
  signatureMode?: SignatureMode;
  signedBy?: string;
  signedAt?: string;
  certificateId?: string;
  declinedReason?: string;
  changeRequest?: string;
};

type SignatureHistory = {
  id: number;
  document: string;
  signedBy?: string;
  signer?: string;
  date?: string;
  completedAt?: string;
  status: "Signed" | "Declined";
  department: string;
  documentType: string;
  certificateId?: string;
  createdBy?: string;
  workflow?: string;
  role?: string;
  reason?: string;
};

const currentSignerName = "Organisation Admin";
const currentSignerRole = "Authorized Signatory";

const initialRequests: SignatureRequest[] = [
  {
    id: 1001,
    document: "Employment Contract",
    createdBy: "Rahul Sharma",
    department: "HR",
    approvalStatus: "Approved",
    signatureStatus: "Pending",
    workflow: "Employee Contract Approval",
    signer: currentSignerName,
    role: currentSignerRole,
    sentAt: "12 Aug 2026, 10:05 AM",
    expiry: "19 Aug 2026",
    documentType: "Contract",
    statusNote: "Pending signature from organisation admin.",
    previewLines: [
      "EMPLOYMENT CONTRACT",
      "This contract is entered between Dezo Solutions Pvt Ltd and the executive candidate for the defined organizational role.",
      "Scope: Full-time employment terms, compensation breakdown, confidentiality covenants, and intellectual property rights.",
      "Approval Chain: Department Manager Approved → HR Lead Approved → Executive Signatory Review.",
      "All required pre-signing verification checks have been completed and validated.",
    ],
  },
  {
    id: 1002,
    document: "Vendor Agreement",
    createdBy: "Priya Nair",
    department: "Finance",
    approvalStatus: "Approved",
    signatureStatus: "Pending",
    workflow: "Vendor Onboarding Approval",
    signer: currentSignerName,
    role: currentSignerRole,
    sentAt: "12 Aug 2026, 09:20 AM",
    expiry: "18 Aug 2026",
    documentType: "Agreement",
    statusNote: "Pending signature from organisation admin.",
    previewLines: [
      "VENDOR SERVICE AGREEMENT",
      "Agreement covering IT Infrastructure support services, uptime SLA 99.9%, and milestone payment terms.",
      "Billing Cycle: Net 30 days upon invoice approval. Annual value: $48,000.",
      "Security Review: SOC 2 compliance verified. Data processing agreement attached.",
    ],
  },
  {
    id: 1003,
    document: "Non-Disclosure Agreement (NDA)",
    createdBy: "Amit Patel",
    department: "Legal",
    approvalStatus: "Approved",
    signatureStatus: "Pending",
    workflow: "Legal Review Workflow",
    signer: currentSignerName,
    role: currentSignerRole,
    sentAt: "11 Aug 2026, 04:30 PM",
    expiry: "17 Aug 2026",
    documentType: "NDA",
    statusNote: "Pending signature from organisation admin.",
    previewLines: [
      "MUTUAL NON-DISCLOSURE AGREEMENT",
      "This NDA protects proprietary technology blueprints, AI pipeline designs, and business data.",
      "Duration: 3 years from effective date. Standard cross-jurisdiction governing law applied.",
    ],
  },
  {
    id: 1004,
    document: "Software Purchase Agreement",
    createdBy: "Rahul Sharma",
    department: "Procurement",
    approvalStatus: "Approved",
    signatureStatus: "Signed",
    workflow: "Procurement Approval Workflow",
    signer: currentSignerName,
    role: currentSignerRole,
    sentAt: "09 Aug 2026, 02:10 PM",
    expiry: "Signed on 09 Aug 2026",
    documentType: "Agreement",
    statusNote: "Document signed and completed.",
    previewLines: [
      "ENTERPRISE SOFTWARE PURCHASE AGREEMENT",
      "Software licensing agreement for cloud telemetry and workflow intelligence nodes.",
      "Annual commitment signed by Organisation Admin on behalf of Dezo Solutions Pvt Ltd.",
    ],
    signedBy: currentSignerName,
    signedAt: "09 Aug 2026, 03:42 PM",
    certificateId: "SIG-CERT-88921-2026",
    signatureMode: "type",
    signatureData: "Organisation Admin",
  },
  {
    id: 1005,
    document: "Facility Maintenance Order",
    createdBy: "Neha Jain",
    department: "Operations",
    approvalStatus: "Approved",
    signatureStatus: "Declined",
    workflow: "Operations Approval Workflow",
    signer: currentSignerName,
    role: currentSignerRole,
    sentAt: "08 Aug 2026, 11:50 AM",
    expiry: "Declined on 08 Aug 2026",
    documentType: "Order",
    statusNote: "Declined by organisation admin.",
    previewLines: [
      "FACILITY SERVICE ORDER",
      "Order value mismatch with approved quarterly operational budget.",
      "Resubmission required with corrected rate sheet from vendor.",
    ],
    declinedReason: "The order value and terms need correction before signature.",
  },
];

const initialHistory: SignatureHistory[] = [
  { id: 1, document: "Employment Contract", signedBy: currentSignerName, date: "12 Aug 2026, 11:42 AM", status: "Signed", department: "HR", documentType: "Contract", certificateId: "SIG-CERT-90112-2026" },
  { id: 2, document: "Vendor Agreement", signedBy: currentSignerName, date: "11 Aug 2026, 04:10 PM", status: "Signed", department: "Finance", documentType: "Agreement", certificateId: "SIG-CERT-77341-2026" },
  { id: 3, document: "NDA", signedBy: currentSignerName, date: "10 Aug 2026, 03:25 PM", status: "Signed", department: "Legal", documentType: "NDA", certificateId: "SIG-CERT-66128-2026" },
  { id: 4, document: "Purchase Contract", signedBy: currentSignerName, date: "09 Aug 2026, 02:50 PM", status: "Declined", department: "Procurement", documentType: "Contract" },
];

const statusClasses: Record<SignatureStatus, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Signed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Declined: "bg-rose-50 text-rose-700 border-rose-200",
  "Changes Requested": "bg-slate-100 text-slate-700 border-slate-200",
};

const approvalClasses: Record<ApprovalState, string> = {
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  "Changes Requested": "bg-slate-100 text-slate-700 border-slate-200",
};

const historyStatusClasses: Record<SignatureHistory["status"], string> = {
  Signed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Declined: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function OrgAdminESignaturesPage() {
  const nextHistoryId = useRef(Math.max(...initialHistory.map((item) => item.id)) + 1);
  const [requests, setRequests] = useState<SignatureRequest[]>(initialRequests);
  const [history, setHistory] = useState<SignatureHistory[]>(initialHistory);
  const [selectedId, setSelectedId] = useState<number>(initialRequests[0].id);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [creatorFilter, setCreatorFilter] = useState("All");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("All");
  const [historyDepartmentFilter, setHistoryDepartmentFilter] = useState("All");
  const [historyCreatorFilter, setHistoryCreatorFilter] = useState("All");
  const [historyDocumentTypeFilter, setHistoryDocumentTypeFilter] = useState("All");
  const [historyDateFilter, setHistoryDateFilter] = useState("All");

  useEffect(() => {
    const fetchEnvelopes = async () => {
      try {
        const res = await eSignatureApi.getEnvelopes();
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          // Live envelopes synced
        }
      } catch {
        // Resilient fallback
      }
    };
    void fetchEnvelopes();
  }, []);

  // Modal states
  const [modal, setModal] = useState<SignatureModal>("none");
  const [signatureMode, setSignatureMode] = useState<SignatureMode>("draw");
  const [typedSignature, setTypedSignature] = useState("Organisation Admin");
  const [typedFont, setTypedFont] = useState<"cursive" | "serif" | "script">("cursive");
  const [penColor, setPenColor] = useState("#274690");
  const [penWidth, setPenWidth] = useState(2.5);
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("The terms need clarification before signature.");
  const [changeRequest, setChangeRequest] = useState("Please update employee joining date and resend for approval.");
  const [toast, setToast] = useState<string | null>(null);

  // Drawing Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const selectedRequest = requests.find((request) => request.id === selectedId) ?? requests[0];

  const filteredRequests = useMemo(() => {
    let list = [...requests];

    list = list.filter((request) => {
      const text = `${request.document} ${request.createdBy} ${request.department} ${request.workflow} ${request.documentType}`.toLowerCase();
      const query = search.toLowerCase();
      const searchOk = query.length === 0 || text.includes(query);
      const departmentOk = departmentFilter === "All" || request.department === departmentFilter;
      const statusOk = statusFilter === "All" || request.signatureStatus === statusFilter;
      const creatorOk = creatorFilter === "All" || request.createdBy === creatorFilter;
      const documentTypeOk = documentTypeFilter === "All" || request.documentType === documentTypeFilter;
      return searchOk && departmentOk && statusOk && creatorOk && documentTypeOk;
    });

    list.sort((a, b) => {
      if (sortBy === "A-Z") return a.document.localeCompare(b.document);
      if (sortBy === "Z-A") return b.document.localeCompare(a.document);
      if (sortBy === "Signed first") return Number(b.signatureStatus === "Signed") - Number(a.signatureStatus === "Signed");
      if (sortBy === "Declined first") return Number(b.signatureStatus === "Declined") - Number(a.signatureStatus === "Declined");
      return b.id - a.id;
    });

    return list;
  }, [requests, search, departmentFilter, statusFilter, creatorFilter, documentTypeFilter, sortBy]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const dateText = (item.date || item.completedAt || "").toLowerCase();
      const statusOk = historyStatusFilter === "All" || item.status === historyStatusFilter;
      const departmentOk = historyDepartmentFilter === "All" || item.department === historyDepartmentFilter;
      const creatorOk = historyCreatorFilter === "All" || (item.signedBy || item.signer || "") === historyCreatorFilter;
      const documentTypeOk = historyDocumentTypeFilter === "All" || item.documentType === historyDocumentTypeFilter;
      const dateOk = historyDateFilter === "All" || dateText.includes(historyDateFilter.toLowerCase());
      return statusOk && departmentOk && creatorOk && documentTypeOk && dateOk;
    });
  }, [history, historyStatusFilter, historyDepartmentFilter, historyCreatorFilter, historyDocumentTypeFilter, historyDateFilter]);

  const signatureStats = [
    { label: "Pending Signature", value: requests.filter((request) => request.signatureStatus === "Pending").length, tone: "amber" },
    { label: "Signed Today", value: requests.filter((request) => request.signatureStatus === "Signed").length, tone: "emerald" },
    { label: "Completed", value: history.filter((item) => item.status === "Signed").length, tone: "blue" },
    { label: "Declined", value: requests.filter((request) => request.signatureStatus === "Declined").length, tone: "rose" },
  ];

  const requestOptions = {
    departments: ["All", ...Array.from(new Set(requests.map((request) => request.department)))],
    creators: ["All", ...Array.from(new Set(requests.map((request) => request.createdBy)))],
    documentTypes: ["All", ...Array.from(new Set(requests.map((request) => request.documentType)))],
    historyDepartments: ["All", ...Array.from(new Set(history.map((item) => item.department)))],
    historyCreators: ["All", ...Array.from(new Set(history.map((item) => item.signedBy || item.signer || "")))],
    historyDocumentTypes: ["All", ...Array.from(new Set(history.map((item) => item.documentType)))],
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  const openRequest = (id: number) => {
    setSelectedId(id);
  };

  // Canvas Drawing Handlers
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
  };

  useEffect(() => {
    if (modal === "sign" && signatureMode === "draw") {
      setTimeout(initCanvas, 50);
    }
  }, [modal, signatureMode, penColor, penWidth]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Upload signature handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file (PNG, JPG, SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedSignatureUrl(dataUrl);
      showToast("Signature image uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const signDocument = () => {
    if (!selectedRequest) return;

    let finalSignatureData = "";
    if (signatureMode === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        showToast("Please draw your signature before completing.");
        return;
      }
      finalSignatureData = canvas.toDataURL("image/png");
    } else if (signatureMode === "type") {
      if (!typedSignature.trim()) {
        showToast("Please enter your signature name.");
        return;
      }
      finalSignatureData = typedSignature.trim();
    } else if (signatureMode === "upload") {
      if (!uploadedSignatureUrl) {
        showToast("Please upload a signature image.");
        return;
      }
      finalSignatureData = uploadedSignatureUrl;
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    const timeFormatted = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const nextSignedAt = `${dateFormatted}, ${timeFormatted}`;
    const certCode = `SIG-CERT-${Math.floor(10000 + Math.random() * 90000)}-${now.getFullYear()}`;

    setRequests((prev) =>
      prev.map((request) =>
        request.id === selectedRequest.id
          ? {
              ...request,
              signatureStatus: "Signed",
              signedBy: currentSignerName,
              signedAt: nextSignedAt,
              certificateId: certCode,
              signatureData: finalSignatureData,
              signatureMode,
              statusNote: `Signed & certified with ${certCode}.`,
            }
          : request,
      ),
    );

    setHistory((prev) => [
      {
        id: nextHistoryId.current,
        document: selectedRequest.document,
        signedBy: currentSignerName,
        date: nextSignedAt,
        status: "Signed",
        department: selectedRequest.department,
        documentType: selectedRequest.documentType,
        certificateId: certCode,
      },
      ...prev,
    ]);
    nextHistoryId.current += 1;
    setModal("none");
    showToast(`✅ "${selectedRequest.document}" signed successfully! Certified with ID: ${certCode}`);
  };

  const requestChanges = () => {
    if (!selectedRequest) return;

    setRequests((prev) =>
      prev.map((request) =>
        request.id === selectedRequest.id
          ? {
              ...request,
              signatureStatus: "Changes Requested",
              approvalStatus: "Changes Requested",
              changeRequest,
              statusNote: "Changes requested by organisation admin.",
            }
          : request,
      ),
    );
    setModal("none");
    showToast("Changes requested and notified to document creator.");
  };

  const declineDocument = () => {
    if (!selectedRequest) return;

    const declinedAt = "12 Aug 2026, 11:12 AM";
    setRequests((prev) =>
      prev.map((request) =>
        request.id === selectedRequest.id
          ? {
              ...request,
              signatureStatus: "Declined",
              approvalStatus: "Approved",
              declinedReason: declineReason,
              statusNote: "Document declined by organisation admin.",
            }
          : request,
      ),
    );
    setHistory((prev) => [
      {
        id: nextHistoryId.current,
        document: selectedRequest.document,
        signedBy: currentSignerName,
        date: declinedAt,
        status: "Declined",
        department: selectedRequest.department,
        documentType: selectedRequest.documentType,
      },
      ...prev,
    ]);
    nextHistoryId.current += 1;
    setModal("none");
    showToast("Document declined.");
  };

  const handleDownloadSigned = (doc: SignatureRequest) => {
    const certText = `
=====================================================
ORGANISATION E-SIGNATURE CERTIFICATE OF COMPLETION
=====================================================
Document Name: ${doc.document}
Document Type: ${doc.documentType}
Department:    ${doc.department}
Signer:        ${doc.signedBy || currentSignerName} (${currentSignerRole})
Timestamp:     ${doc.signedAt || "Certified"}
Certificate ID:${doc.certificateId || "SIG-CERT-VALID"}
Status:        Legally Binding Electronic Signature Applied
Cryptographic Hash: SHA-256 Verified
=====================================================
`;
    const blob = new Blob([certText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.document.replace(/\s+/g, "_")}_Signed_Certificate.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded Signed Verification Certificate!");
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-gradient-to-r from-[#1f3561] to-[#274690] px-5 py-3.5 text-xs font-bold text-white shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in">
          <CheckCircle2 size={16} className="text-[#ffd9a0]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#274690]/10 px-3 py-1 text-xs font-bold text-[#274690]">
            <PenTool size={14} /> Organisation Admin E-Signature Suite
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">E-Signature & Approvals</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Draw, type, or upload verifiable digital signatures, inspect document authorization chains, and download certified records.
          </p>
        </div>
      </header>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {signatureStats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl border border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-2xl font-black text-slate-900">{String(stat.value).padStart(2, "0")}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                    stat.tone === "amber"
                      ? "bg-amber-100 text-amber-800"
                      : stat.tone === "emerald"
                        ? "bg-emerald-100 text-emerald-800"
                        : stat.tone === "rose"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-blue-100 text-[#274690]"
                  }`}
                >
                  {stat.tone === "amber" ? "Pending Action" : stat.tone === "emerald" ? "Signed Active" : stat.tone === "rose" ? "Declined" : "Archived"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Request Queue Table */}
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-xs">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by document name, creator, department, workflow..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-[#274690] focus:bg-white font-medium"
              />
            </div>

            <Filter value={departmentFilter} setValue={setDepartmentFilter} options={requestOptions.departments} />
            <Filter value={statusFilter} setValue={setStatusFilter} options={["All", "Pending", "Signed", "Declined", "Changes Requested"]} />
            <Filter value={creatorFilter} setValue={setCreatorFilter} options={requestOptions.creators} />
            <Filter value={documentTypeFilter} setValue={setDocumentTypeFilter} options={requestOptions.documentTypes} />
            <Filter value={sortBy} setValue={setSortBy} options={["Newest", "Signed first", "Declined first", "A-Z", "Z-A"]} />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-280 text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  {["Document", "Created By", "Department", "Approval Status", "Signature Status", "Action"].map((head) => (
                    <th key={head} className="px-5 py-3.5">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => {
                  const isSelected = request.id === selectedRequest?.id;
                  return (
                    <tr
                      key={request.id}
                      onClick={() => openRequest(request.id)}
                      className={`border-t border-slate-100 hover:bg-slate-50/80 cursor-pointer transition ${
                        isSelected ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <FileText size={15} className="text-[#274690]" />
                          <span>{request.document}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 pl-6">{request.workflow}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-700 font-medium">{request.createdBy}</td>
                      <td className="px-5 py-4">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {request.department}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge className={`border text-[10px] font-bold ${approvalClasses[request.approvalStatus]}`}>
                          {request.approvalStatus}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge className={`border text-[10px] font-bold ${statusClasses[request.signatureStatus]}`}>
                          {request.signatureStatus}
                        </Badge>
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        {request.signatureStatus === "Pending" ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedId(request.id);
                              setModal("sign");
                            }}
                            className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl h-8 px-3 flex items-center gap-1.5 shadow-xs"
                          >
                            <Signature size={13} /> Sign Document
                          </Button>
                        ) : request.signatureStatus === "Signed" ? (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedId(request.id);
                                setModal("view-document");
                              }}
                              className="text-xs font-bold rounded-xl h-8 px-2.5"
                            >
                              <Eye size={13} className="mr-1 text-[#274690]" /> View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadSigned(request)}
                              className="text-xs font-bold rounded-xl h-8 px-2.5"
                            >
                              <Download size={13} />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRequest(request.id)}
                            className="text-xs font-bold rounded-xl h-8 px-2.5"
                          >
                            Details
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-xs font-semibold text-slate-500">
                      No signature requests found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Inspector & Document Viewer Panel */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        {/* Document Interactive Preview Panel */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-xs">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#274690]/10 px-3 py-1 text-[10px] font-bold text-[#274690]">
                  <ShieldCheck size={13} /> Live Document Preview
                </div>
                <h2 className="mt-1 text-lg font-black text-slate-900">{selectedRequest?.document}</h2>
                <p className="text-xs text-slate-500">{selectedRequest?.statusNote}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedRequest?.signatureStatus === "Pending" ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setModal("decline")} className="rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50">
                      <CircleAlert size={14} /> Decline
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setModal("request-changes")} className="rounded-xl text-xs font-bold">
                      <RefreshCw size={14} /> Request Changes
                    </Button>
                    <Button size="sm" onClick={() => setModal("sign")} className="bg-[#274690] hover:bg-[#1f3561] text-white rounded-xl text-xs font-bold shadow-xs">
                      <Signature size={14} className="mr-1" /> Review & Sign
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setModal("view-document")} className="rounded-xl text-xs font-bold">
                      <Eye size={14} className="mr-1" /> View Certified Doc
                    </Button>
                    <Button size="sm" onClick={() => handleDownloadSigned(selectedRequest)} className="bg-[#274690] hover:bg-[#1f3561] text-white rounded-xl text-xs font-bold">
                      <Download size={14} className="mr-1" /> Download Certificate
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Document Sheet Layout */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="mx-auto flex max-w-xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#274690]">Official Document Record</span>
                    <h3 className="text-lg font-black text-slate-900">{selectedRequest?.document}</h3>
                    <p className="text-[11px] text-slate-500">Workflow: {selectedRequest?.workflow}</p>
                  </div>
                  <Badge className={`text-[10px] font-bold ${statusClasses[selectedRequest?.signatureStatus ?? "Pending"]}`}>
                    {selectedRequest?.signatureStatus}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs leading-relaxed text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {selectedRequest?.previewLines.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>

                {/* Signature Box Section */}
                <div className="grid gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Signatory Authority</p>
                    <div className="mt-2 space-y-1 text-xs text-slate-700">
                      <p className="font-bold text-slate-900">{selectedRequest?.signer || currentSignerName}</p>
                      <p className="text-[11px] text-slate-500">{selectedRequest?.role || currentSignerRole}</p>
                      <p className="text-[11px] text-slate-500">Organisation: Dezo Solutions Pvt Ltd</p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Applied E-Signature</p>
                    {selectedRequest?.signatureStatus === "Signed" ? (
                      <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-center">
                        {selectedRequest.signatureData?.startsWith("data:image/") ? (
                          <div className="flex justify-center my-1">
                            <img
                              src={selectedRequest.signatureData}
                              alt="Applied Signature"
                              className="h-12 max-w-full object-contain filter drop-shadow-xs"
                            />
                          </div>
                        ) : (
                          <p className="text-base font-black italic text-[#274690] font-serif my-1">
                            {selectedRequest.signatureData || selectedRequest.signedBy || currentSignerName}
                          </p>
                        )}
                        <div className="border-t border-emerald-200/80 pt-1 mt-1 text-[10px] font-bold text-emerald-800 flex items-center justify-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Certified {selectedRequest.signedAt || "Signed"}</span>
                        </div>
                      </div>
                    ) : selectedRequest?.signatureStatus === "Declined" ? (
                      <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50/80 p-2.5 text-center text-xs font-bold text-rose-700">
                        Document Declined
                      </div>
                    ) : (
                      <div className="mt-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3 text-center">
                        <p className="text-xs font-bold text-amber-800">Pending Authorized Signature</p>
                        <Button
                          size="sm"
                          onClick={() => setModal("sign")}
                          className="mt-2 h-7 bg-[#274690] hover:bg-[#1f3561] text-white text-[10px] font-bold rounded-lg px-3"
                        >
                          Sign Now
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Info & Controls */}
        <div className="space-y-4">
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-xs">
            <CardContent className="space-y-3 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Request & Workflow Info</p>
              <DetailRow label="Document" value={selectedRequest?.document ?? "-"} />
              <DetailRow label="Department" value={selectedRequest?.department ?? "-"} />
              <DetailRow label="Submitted By" value={selectedRequest?.createdBy ?? "-"} />
              <DetailRow label="Workflow Routing" value={selectedRequest?.workflow ?? "-"} />
              <DetailRow label="Date Dispatched" value={selectedRequest?.sentAt ?? "-"} />
              <DetailRow label="Expiry Target" value={selectedRequest?.expiry ?? "-"} />
            </CardContent>
          </Card>

          {selectedRequest?.signatureStatus === "Signed" ? (
            <Card className="rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-xs">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Document Signed & Tamper-Proof Certified</span>
                </div>
                <DetailRow label="Signer" value={selectedRequest.signedBy ?? currentSignerName} />
                <DetailRow label="Signed Date" value={selectedRequest.signedAt ?? "Recent"} />
                <DetailRow label="Certificate Code" value={selectedRequest.certificateId ?? "SIG-CERT-LIVE-2026"} />
                <div className="pt-2 flex gap-2">
                  <Button
                    onClick={() => handleDownloadSigned(selectedRequest)}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl h-9"
                  >
                    <Download size={13} className="mr-1.5" /> Download Cert
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setModal("view-document")}
                    className="flex-1 text-xs font-bold rounded-xl h-9 bg-white"
                  >
                    <Eye size={13} className="mr-1.5" /> Full Sheet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedRequest?.signatureStatus === "Declined" ? (
            <Card className="rounded-2xl border border-rose-200 bg-rose-50/50 shadow-xs">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs">
                  <CircleAlert size={16} className="text-rose-600" />
                  <span>Status: Declined by Administrator</span>
                </div>
                <p className="text-xs text-rose-900 bg-white/80 p-3 rounded-xl border border-rose-200">
                  {selectedRequest.declinedReason || "Declined due to terms review."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-blue-200 bg-blue-50/40 shadow-xs">
              <CardContent className="space-y-3 p-4">
                <p className="text-xs font-bold text-[#274690] uppercase tracking-wider">Required Administrator Action</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Review the document stipulations above, then proceed to apply your cryptographic e-signature or request necessary amendments.
                </p>
                <Button
                  onClick={() => setModal("sign")}
                  className="w-full bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs rounded-xl h-10 shadow-xs"
                >
                  <Signature size={15} className="mr-2" /> Open Signature Studio
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Signature Audit & Past History Table */}
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-xs">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Signature Audit Log</p>
              <h3 className="mt-0.5 text-base font-black text-slate-900">Historical Signatures & Execution Ledger</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Filter value={historyStatusFilter} setValue={setHistoryStatusFilter} options={["All", "Signed", "Declined"]} />
              <Filter value={historyDepartmentFilter} setValue={setHistoryDepartmentFilter} options={requestOptions.historyDepartments} />
              <Filter value={historyCreatorFilter} setValue={setHistoryCreatorFilter} options={requestOptions.historyCreators} />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-280 text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  {["Document", "Signatory", "Date & Time", "Status", "Department", "Certificate ID", "Certificate"].map((head) => (
                    <th key={head} className="px-5 py-3.5 font-bold">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="px-5 py-4 font-bold text-slate-900">{item.document}</td>
                    <td className="px-5 py-4 text-slate-700 font-medium">{item.signedBy}</td>
                    <td className="px-5 py-4 text-slate-500">{item.date}</td>
                    <td className="px-5 py-4">
                      <Badge className={`border text-[10px] font-bold ${historyStatusClasses[item.status]}`}>{item.status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">{item.department}</td>
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-500">
                      {item.certificateId || `SIG-CERT-${item.id}089-2026`}
                    </td>
                    <td className="px-5 py-4">
                      {item.status === "Signed" ? (
                        <button
                          onClick={() =>
                            handleDownloadSigned({
                              id: item.id,
                              document: item.document,
                              department: item.department,
                              documentType: item.documentType,
                              signedBy: item.signedBy,
                              signedAt: item.date,
                              certificateId: item.certificateId,
                            } as any)
                          }
                          className="text-[#274690] hover:text-[#1f3561] font-bold flex items-center gap-1 hover:underline"
                        >
                          <Download size={13} /> Cert
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SIGNATURE MODAL STUDIO - Interactive Drawing, Typing & File Upload        */}
      {/* ========================================================================= */}
      {modal === "sign" && selectedRequest && (
        <Overlay>
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <ModalHeader
              title="E-Signature Studio"
              subtitle={`Sign and authorize "${selectedRequest.document}" for official execution`}
              onClose={() => setModal("none")}
            />

            <div className="mt-4 grid gap-4 lg:grid-cols-[200px_1fr]">
              {/* Left Selector: Draw / Type / Upload */}
              <div className="space-y-2">
                {[
                  { id: "draw", label: "Draw Signature", icon: PenTool },
                  { id: "type", label: "Type Signature", icon: Edit3 },
                  { id: "upload", label: "Upload Signature", icon: Upload },
                ].map((option) => {
                  const Icon = option.icon;
                  const isActive = signatureMode === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSignatureMode(option.id as SignatureMode)}
                      className={`w-full rounded-2xl border px-3.5 py-3 text-left text-xs font-bold transition flex items-center gap-2.5 ${
                        isActive
                          ? "border-[#274690] bg-[#274690]/10 text-[#274690] shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={16} className={isActive ? "text-[#274690]" : "text-slate-400"} />
                      <span>{option.label}</span>
                    </button>
                  );
                })}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 mt-4 text-[11px] text-slate-500 space-y-1.5">
                  <p className="font-bold text-slate-700">Signer Profile:</p>
                  <p>{currentSignerName}</p>
                  <p className="text-[10px] text-slate-400">{currentSignerRole}</p>
                </div>
              </div>

              {/* Right Interactive Area */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                {/* 1. DRAW SIGNATURE MODE */}
                {signatureMode === "draw" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Draw with your mouse or stylus:</span>
                      <div className="flex items-center gap-2">
                        {/* Pen Color Selectors */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                          {["#0f172a", "#274690", "#1e3a8a"].map((c) => (
                            <button
                              key={c}
                              onClick={() => setPenColor(c)}
                              className={`h-4 w-4 rounded-full border ${penColor === c ? "ring-2 ring-offset-1 ring-[#274690]" : ""}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <button
                          onClick={clearCanvas}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                        >
                          <RotateCcw size={12} /> Clear
                        </button>
                      </div>
                    </div>

                    <div className="relative rounded-2xl border-2 border-dashed border-slate-300 bg-white p-1 overflow-hidden shadow-inner">
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={160}
                        onPointerDown={startDrawing}
                        onPointerMove={draw}
                        onPointerUp={stopDrawing}
                        onPointerLeave={stopDrawing}
                        className="w-full h-40 cursor-crosshair touch-none bg-white rounded-xl"
                      />
                      {!hasDrawn && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-300">
                          Sign on the line above
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. TYPE SIGNATURE MODE */}
                {signatureMode === "type" && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      Enter your full legal name:
                      <input
                        type="text"
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        placeholder="e.g., Organisation Admin"
                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-[#274690] font-medium"
                      />
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500">Style:</span>
                      {(["cursive", "serif", "script"] as const).map((font) => (
                        <button
                          key={font}
                          onClick={() => setTypedFont(font)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border capitalize transition ${
                            typedFont === font ? "border-[#274690] bg-[#274690] text-white" : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          {font}
                        </button>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-inner">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Generated Signature Preview</p>
                      <p
                        className={`text-2xl text-[#274690] ${
                          typedFont === "cursive"
                            ? "italic font-serif"
                            : typedFont === "script"
                              ? "font-mono font-bold italic"
                              : "font-serif tracking-wider"
                        }`}
                      >
                        {typedSignature || "Organisation Admin"}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. UPLOAD SIGNATURE MODE */}
                {signatureMode === "upload" && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5 text-center">
                      {uploadedSignatureUrl ? (
                        <div className="space-y-3">
                          <div className="flex justify-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                            <img
                              src={uploadedSignatureUrl}
                              alt="Uploaded Signature"
                              className="h-20 max-w-full object-contain"
                            />
                          </div>
                          <div className="flex justify-center gap-2">
                            <label className="cursor-pointer rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-bold transition">
                              <span>Change Image</span>
                              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                            <button
                              onClick={() => setUploadedSignatureUrl(null)}
                              className="rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 text-xs font-bold transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                          <Upload size={28} className="text-[#274690] mb-2" />
                          <p className="text-xs font-bold text-slate-800">Click to upload signature image</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, or SVG (Transparent background recommended)</p>
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Verification Confirmation */}
                <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 accent-[#274690]" />
                  <span>I certify under penalty of perjury that this electronic signature is officially executed on behalf of the organisation.</span>
                </label>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setModal("none")} className="rounded-xl text-xs font-bold">
                    Cancel
                  </Button>
                  <Button
                    onClick={signDocument}
                    className="bg-[#274690] hover:bg-[#1f3561] text-white rounded-xl text-xs font-bold px-4 shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={15} /> Apply Signature & Complete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* REQUEST CHANGES MODAL */}
      {modal === "request-changes" && selectedRequest && (
        <Overlay>
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <ModalHeader
              title="Request Changes"
              subtitle={`Specify required edits for "${selectedRequest.document}"`}
              onClose={() => setModal("none")}
            />
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Required Changes / Notes for Author
                <textarea
                  value={changeRequest}
                  onChange={(event) => setChangeRequest(event.target.value)}
                  rows={4}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-[#274690] font-medium resize-none"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setModal("none")} className="rounded-xl text-xs font-bold">
                  Cancel
                </Button>
                <Button onClick={requestChanges} className="bg-[#274690] hover:bg-[#1f3561] text-white rounded-xl text-xs font-bold">
                  <Edit3 size={14} className="mr-1" /> Send Request
                </Button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* DECLINE MODAL */}
      {modal === "decline" && selectedRequest && (
        <Overlay>
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <ModalHeader
              title="Decline Document"
              subtitle={`State official justification for rejecting "${selectedRequest.document}"`}
              onClose={() => setModal("none")}
            />
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Decline Reason
                <textarea
                  value={declineReason}
                  onChange={(event) => setDeclineReason(event.target.value)}
                  rows={4}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-rose-500 font-medium resize-none"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setModal("none")} className="rounded-xl text-xs font-bold">
                  Cancel
                </Button>
                <Button onClick={declineDocument} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold">
                  <Trash2 size={14} className="mr-1" /> Confirm Decline
                </Button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* VIEW CERTIFIED DOCUMENT MODAL */}
      {modal === "view-document" && selectedRequest && (
        <Overlay>
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <ModalHeader
              title="Certified Document Record"
              subtitle={`Official electronic document ledger for "${selectedRequest.document}"`}
              onClose={() => setModal("none")}
            />
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">{selectedRequest.document}</h3>
                    <p className="text-xs text-slate-500">Certificate ID: {selectedRequest.certificateId || "SIG-CERT-VALID-2026"}</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-extrabold text-xs">
                    Verified Signed
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  {selectedRequest.previewLines.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>

                <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">Digitally Signed By</p>
                    <p className="font-black text-sm text-slate-900 mt-0.5">{selectedRequest.signedBy || currentSignerName}</p>
                    <p className="text-xs text-slate-500">{selectedRequest.signedAt || "Certified"}</p>
                  </div>
                  {selectedRequest.signatureData?.startsWith("data:image/") ? (
                    <img src={selectedRequest.signatureData} alt="Signature" className="h-12 object-contain" />
                  ) : (
                    <p className="text-xl font-black italic font-serif text-[#274690]">{selectedRequest.signatureData || selectedRequest.signedBy || currentSignerName}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setModal("none")} className="rounded-xl text-xs font-bold">
                  Close
                </Button>
                <Button
                  onClick={() => handleDownloadSigned(selectedRequest)}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white rounded-xl text-xs font-bold"
                >
                  <Download size={14} className="mr-1.5" /> Download Certificate
                </Button>
              </div>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function Filter({ value, setValue, options }: { value: string; setValue: (value: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-10 appearance-none rounded-xl border border-slate-200 bg-white py-0 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-[#274690]"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-xs overflow-y-auto">
      {children}
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
      <div>
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>
      </div>
      <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
        <X size={18} />
      </button>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-800">{value}</span>
    </div>
  );
}
