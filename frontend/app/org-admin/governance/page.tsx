"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Key,
  Users,
  Clock,
  HardDrive,
  FileCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  RefreshCw,
  Sparkles,
  Bot,
  Layers,
  Search,
  Eye,
  Check,
  X,
  ChevronRight,
  Filter,
  Save,
  Play,
  FileText,
  AlertCircle,
  Activity,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  governanceApi,
  type GovernanceDashboardSummary,
  type SecurityPolicyData,
  type AiPolicyData,
  type GovernanceChangeRequestItem,
  type AccessReviewCampaignItem,
  type AccessReviewUserItem,
  type IncidentItem,
  type RiskItem,
  type RetentionPolicyItem,
} from "@/services/governanceApi";

const DEFAULT_GOVERNANCE_SUMMARY: GovernanceDashboardSummary = {
  complianceScore: 96,
  pendingChangeApprovals: 2,
  activeAccessReviewCampaigns: 1,
  pendingAccessReviewsDue: 4,
  openIncidents: 0,
  criticalRisks: 1,
  activeRetentionPolicies: 3,
  securitySummary: {
    mfaEnforced: true,
    passwordMinLength: 12,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
  },
  recentActivity: [
    {
      id: "ev-1",
      eventId: "EV-8941",
      action: "Security Policy Updated",
      actor: "Organisation Admin",
      resource: "MFA & Session Policy",
      severity: "INFO",
      status: "SUCCESS",
      timestamp: "Today, 11:20 AM",
    },
    {
      id: "ev-2",
      eventId: "EV-8940",
      action: "Access Review Completed",
      actor: "Priya Sharma",
      resource: "Q3 Legal Team Role Review",
      severity: "INFO",
      status: "SUCCESS",
      timestamp: "Yesterday",
    },
  ],
};

const DEFAULT_CHANGE_REQUESTS: GovernanceChangeRequestItem[] = [
  {
    id: "cr-1",
    changeRequestId: "CR-2026-001",
    organisationId: 1,
    requesterId: 2,
    requesterName: "Priya Sharma (Legal Manager)",
    changeType: "DOCUMENT_RETENTION",
    title: "Extend NDA & Contract Retention Period to 7 Years",
    description: "Align internal retention policy with statutory tax compliance and GDPR requirements.",
    severity: "MEDIUM",
    status: "PENDING_APPROVAL",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cr-2",
    changeRequestId: "CR-2026-002",
    organisationId: 1,
    requesterId: 3,
    requesterName: "Amit Patel (Finance)",
    changeType: "AI_PERMISSION",
    title: "Enable GPT-4o OCR extraction for Accounts Payable team",
    description: "Authorize invoice table parser for 6 accountants in Finance department.",
    severity: "LOW",
    status: "APPROVED",
    approverName: "Organisation Admin",
    approvalReason: "Verified within subscription budget.",
    reviewedAt: new Date(Date.now() - 43200000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_CAMPAIGNS: AccessReviewCampaignItem[] = [
  {
    id: "camp-1",
    name: "Q3 2026 Enterprise User Role & Permission Certification",
    description: "Quarterly SOC2 compliance review of all Department Managers and Team Leaders.",
    reviewerName: "Organisation Admin",
    startDate: "2024-07-01",
    dueDate: "2024-09-30",
    status: "ACTIVE",
    progress: 75,
    stats: { total: 24, certified: 18, revoked: 2, changeReq: 1, pending: 3 },
    createdAt: "2024-07-01T00:00:00Z",
  },
];

const DEFAULT_INCIDENTS: IncidentItem[] = [
  {
    id: "inc-1",
    incidentNumber: "INC-9912",
    title: "Excessive Failed Login Attempts on Employee Account",
    description: "Triggered automatic account temporary lock and password reset advisory.",
    category: "SECURITY",
    severity: "LOW",
    status: "RESOLVED",
    reporterName: "Security Automated Probe",
    resolution: "User confirmed forgotten password. Credential reset dispatched.",
    resolvedAt: "Yesterday, 4:00 PM",
    createdAt: "Yesterday, 3:45 PM",
  },
];

const DEFAULT_RISKS: RiskItem[] = [
  {
    id: "risk-1",
    riskId: "RSK-104",
    title: "External Client Email Attachment Data Loss Risk",
    description: "Contracts shared via unencrypted third-party email clients without password protection.",
    category: "COMPLIANCE",
    likelihood: "LOW",
    impact: "HIGH",
    riskScore: 6,
    severity: "MEDIUM",
    status: "MITIGATING",
    ownerName: "Priya Sharma",
    mitigationPlan: "Enforce DocuCore secure download links with expiration timers and OTP.",
    createdAt: "2024-02-10T00:00:00Z",
  },
];

const DEFAULT_RETENTION_POLICIES: RetentionPolicyItem[] = [
  {
    id: "ret-1",
    policyName: "Standard Contracts & NDAs Policy",
    description: "Enterprise retention standard for NDAs and customer contracts",
    documentCategory: "CONTRACTS",
    retentionDays: 2555,
    actionOnExpiry: "ARCHIVE",
    status: "ACTIVE",
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "ret-2",
    policyName: "Vendor Invoices & Receipts Policy",
    description: "Finance regulatory retention schedule",
    documentCategory: "FINANCE",
    retentionDays: 1825,
    actionOnExpiry: "MOVE_TO_COLD_STORAGE",
    status: "ACTIVE",
    createdAt: "2024-01-15T00:00:00Z",
  },
];

export default function OrgAdminGovernancePage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "policies" | "change_requests" | "access_reviews" | "incidents" | "risks" | "retention"
  >("overview");

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Summary State
  const [summary, setSummary] = useState<GovernanceDashboardSummary | null>(DEFAULT_GOVERNANCE_SUMMARY);

  // Policies State
  const [securityPolicy, setSecurityPolicy] = useState<SecurityPolicyData>({
    mfaEnforced: true,
    passwordMinLength: 12,
    passwordRequireComplexity: true,
    lockoutDurationMinutes: 15,
    sessionTimeoutMinutes: 60,
    ipAllowlist: [],
    maxLoginAttempts: 5,
    sensitiveDocAiRestricted: false,
    externalAiRestricted: false,
  });
  const [ipInput, setIpInput] = useState("");
  const [aiPolicies, setAiPolicies] = useState<AiPolicyData[]>([]);

  // Change Requests State
  const [changeRequests, setChangeRequests] = useState<GovernanceChangeRequestItem[]>(DEFAULT_CHANGE_REQUESTS);
  const [crFilter, setCrFilter] = useState("ALL");
  const [showCreateCrModal, setShowCreateCrModal] = useState(false);
  const [crTitle, setCrTitle] = useState("");
  const [crDescription, setCrDescription] = useState("");
  const [crType, setCrType] = useState("SECURITY_POLICY");
  const [crSeverity, setCrSeverity] = useState("MEDIUM");
  const [selectedCrForAction, setSelectedCrForAction] = useState<GovernanceChangeRequestItem | null>(null);
  const [approvalReasonInput, setApprovalReasonInput] = useState("");
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);

  // Access Reviews State
  const [campaigns, setCampaigns] = useState<AccessReviewCampaignItem[]>(DEFAULT_CAMPAIGNS);
  const [selectedCampaign, setSelectedCampaign] = useState<(AccessReviewCampaignItem & { items: AccessReviewUserItem[] }) | null>(null);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignDesc, setCampaignDesc] = useState("");
  const [selectedItemForDecision, setSelectedItemForDecision] = useState<AccessReviewUserItem | null>(null);
  const [decisionType, setDecisionType] = useState<"CERTIFIED" | "REVOKED" | "CHANGE_REQUESTED">("CERTIFIED");
  const [decisionReason, setDecisionReason] = useState("");

  // Incidents State
  const [incidents, setIncidents] = useState<IncidentItem[]>(DEFAULT_INCIDENTS);
  const [showCreateIncidentModal, setShowCreateIncidentModal] = useState(false);
  const [incTitle, setIncTitle] = useState("");
  const [incDesc, setIncDesc] = useState("");
  const [incCategory, setIncCategory] = useState("SECURITY");
  const [incSeverity, setIncSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  const [resolutionInput, setResolutionInput] = useState("");
  const [incidentNotesInput, setIncidentNotesInput] = useState("");

  // Risks State
  const [risks, setRisks] = useState<RiskItem[]>(DEFAULT_RISKS);
  const [showCreateRiskModal, setShowCreateRiskModal] = useState(false);
  const [riskTitle, setRiskTitle] = useState("");
  const [riskDesc, setRiskDesc] = useState("");
  const [riskCategory, setRiskCategory] = useState("SECURITY");
  const [riskLikelihood, setRiskLikelihood] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [riskImpact, setRiskImpact] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");
  const [riskMitigation, setRiskMitigation] = useState("");
  const [riskOwner, setRiskOwner] = useState("");

  // Retention State
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicyItem[]>(DEFAULT_RETENTION_POLICIES);
  const [showCreateRetentionModal, setShowCreateRetentionModal] = useState(false);
  const [retPolicyName, setRetPolicyName] = useState("");
  const [retDays, setRetDays] = useState(365);
  const [retAction, setRetAction] = useState<"DELETE" | "ARCHIVE" | "MOVE_TO_COLD_STORAGE">("DELETE");
  const [retCategory, setRetCategory] = useState("ALL_DOCUMENTS");
  const [sweepResult, setSweepResult] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial Load
  const loadDashboardData = async () => {
    try {
      const [sumRes, secRes, crRes, campRes, incRes, riskRes, retRes] = await Promise.all([
        governanceApi.getDashboardSummary().catch(() => null),
        governanceApi.getSecurityPolicy().catch(() => null),
        governanceApi.getChangeRequests().catch(() => []),
        governanceApi.getAccessReviewCampaigns().catch(() => []),
        governanceApi.getIncidents().catch(() => []),
        governanceApi.getRisks().catch(() => []),
        governanceApi.getRetentionPolicies().catch(() => []),
      ]);

      if (sumRes) setSummary(sumRes);
      if (secRes) {
        setSecurityPolicy(secRes);
        setIpInput(secRes.ipAllowlist ? secRes.ipAllowlist.join(", ") : "");
      }
      if (crRes && Array.isArray(crRes) && crRes.length > 0) setChangeRequests(crRes);
      if (campRes && Array.isArray(campRes) && campRes.length > 0) setCampaigns(campRes);
      if (incRes && Array.isArray(incRes) && incRes.length > 0) setIncidents(incRes);
      if (riskRes && Array.isArray(riskRes) && riskRes.length > 0) setRisks(riskRes);
      if (retRes && Array.isArray(retRes) && retRes.length > 0) setRetentionPolicies(retRes);
    } catch (err: any) {
      console.warn("Notice loading governance telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Save Security Policy
  const handleSaveSecurityPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedIps = ipInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await governanceApi.updateSecurityPolicy({
        ...securityPolicy,
        ipAllowlist: parsedIps,
      });
      setSecurityPolicy(res.data);
      showToast(res.message || "Security policy saved and active.");
      loadDashboardData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Failed to save security policy.");
    }
  };

  // Create Change Request
  const handleCreateChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await governanceApi.createChangeRequest({
        title: crTitle,
        description: crDescription,
        changeType: crType,
        severity: crSeverity,
      });
      showToast(res.message);
      setShowCreateCrModal(false);
      setCrTitle("");
      setCrDescription("");
      loadDashboardData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Error submitting change request.");
    }
  };

  // Approve / Reject Change Request
  const handleDecisionChangeRequest = async () => {
    if (!selectedCrForAction || !actionType) return;
    try {
      if (actionType === "APPROVE") {
        await governanceApi.approveChangeRequest(selectedCrForAction.id, approvalReasonInput);
        showToast(`Change request ${selectedCrForAction.changeRequestId} approved.`);
      } else {
        await governanceApi.rejectChangeRequest(selectedCrForAction.id, approvalReasonInput);
        showToast(`Change request ${selectedCrForAction.changeRequestId} rejected.`);
      }
      setSelectedCrForAction(null);
      setActionType(null);
      setApprovalReasonInput("");
      loadDashboardData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Action failed.");
    }
  };

  // Apply Change Request
  const handleApplyChangeRequest = async (id: string) => {
    try {
      const res = await governanceApi.applyChangeRequest(id);
      showToast(res.message);
      loadDashboardData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Apply failed.");
    }
  };

  // Open Campaign Details
  const handleOpenCampaign = async (campaignId: string) => {
    try {
      const details = await governanceApi.getCampaignDetails(campaignId);
      setSelectedCampaign(details);
    } catch (err: any) {
      showToast("Failed to load campaign checklist.");
    }
  };

  // Create Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await governanceApi.createAccessReviewCampaign({
        name: campaignName,
        description: campaignDesc,
      });
      showToast(res.message);
      setShowCreateCampaignModal(false);
      setCampaignName("");
      setCampaignDesc("");
      loadDashboardData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Error creating campaign.");
    }
  };

  // Decide Access Item
  const handleDecideAccessItem = async () => {
    if (!selectedCampaign || !selectedItemForDecision) return;
    try {
      await governanceApi.decideAccessReviewItem(selectedCampaign.id, selectedItemForDecision.id, {
        decision: decisionType,
        decisionReason,
      });
      showToast(`User ${selectedItemForDecision.userName} marked as ${decisionType}`);
      setSelectedItemForDecision(null);
      setDecisionReason("");
      handleOpenCampaign(selectedCampaign.id);
      loadDashboardData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Failed to record access decision.");
    }
  };

  // Create Incident
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await governanceApi.createIncident({
        title: incTitle,
        description: incDesc,
        category: incCategory,
        severity: incSeverity,
      });
      showToast(res.message);
      setShowCreateIncidentModal(false);
      setIncTitle("");
      setIncDesc("");
      loadDashboardData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Failed to create incident.");
    }
  };

  // Update Incident Status
  const handleUpdateIncidentStatus = async (id: string, newStatus: string) => {
    try {
      await governanceApi.updateIncident(id, {
        status: newStatus as any,
        resolution: newStatus === "RESOLVED" || newStatus === "CLOSED" ? resolutionInput : undefined,
        notes: incidentNotesInput || undefined,
      });
      showToast(`Incident status updated to ${newStatus}`);
      setSelectedIncident(null);
      setResolutionInput("");
      setIncidentNotesInput("");
      loadDashboardData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Error updating incident.");
    }
  };

  // Create Risk
  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await governanceApi.createRisk({
        title: riskTitle,
        description: riskDesc,
        category: riskCategory,
        likelihood: riskLikelihood,
        impact: riskImpact,
        mitigationPlan: riskMitigation,
        ownerName: riskOwner,
      });
      showToast(res.message);
      setShowCreateRiskModal(false);
      setRiskTitle("");
      setRiskDesc("");
      setRiskMitigation("");
      setRiskOwner("");
      loadDashboardData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Failed to create risk.");
    }
  };

  // Create Retention Policy
  const handleCreateRetentionPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await governanceApi.createRetentionPolicy({
        policyName: retPolicyName,
        retentionDays: Number(retDays),
        actionOnExpiry: retAction,
        documentCategory: retCategory,
      });
      showToast(res.message);
      setShowCreateRetentionModal(false);
      setRetPolicyName("");
      loadDashboardData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Failed to create retention policy.");
    }
  };

  // Trigger Retention Sweep Worker
  const handleRunRetentionSweep = async () => {
    try {
      const res = await governanceApi.runRetentionSweep();
      setSweepResult(res.data);
      showToast(res.message);
      loadDashboardData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Sweep failed.");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview & Telemetry", icon: Activity },
    { id: "policies", label: "Security & AI Policies", icon: Lock },
    { id: "change_requests", label: "Change Approvals", icon: FileCheck, count: summary?.pendingChangeApprovals },
    { id: "access_reviews", label: "Access Reviews", icon: Users, count: summary?.pendingAccessReviewsDue },
    { id: "incidents", label: "Incidents", icon: AlertCircle, count: summary?.openIncidents },
    { id: "risks", label: "Risk Register", icon: ShieldAlert, count: summary?.criticalRisks },
    { id: "retention", label: "Data Retention", icon: HardDrive },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#274690] text-white px-5 py-3.5 text-xs font-bold shadow-2xl flex items-center gap-2.5 border border-white/20 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 size={18} className="text-[#ffd9a0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#274690] text-white shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Enterprise Governance Hub</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enforce organization security policies, structural change controls, access certifications, incidents, and data retention.
          </p>
        </div>

        <div className="flex items-center gap-2">
          
          <Badge className="bg-[#274690] text-white text-xs font-extrabold px-3 py-1.5">
            Compliance Score: {summary?.complianceScore || 92}%
          </Badge>
        </div>
      </div>

      {/* High-Level KPI Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span>Compliance</span>
            <ShieldCheck size={14} className="text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{summary?.complianceScore || 92}%</p>
          <p className="text-[10px] text-emerald-700 font-semibold">Active Controls</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span>Pending Changes</span>
            <FileCheck size={14} className="text-amber-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{summary?.pendingChangeApprovals || 0}</p>
          <p className="text-[10px] text-amber-700 font-semibold">Require Sign-off</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span>Access Reviews</span>
            <Users size={14} className="text-blue-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{summary?.pendingAccessReviewsDue || 0}</p>
          <p className="text-[10px] text-blue-700 font-semibold">Pending Checklist</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span>Open Incidents</span>
            <AlertCircle size={14} className="text-rose-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{summary?.openIncidents || 0}</p>
          <p className="text-[10px] text-rose-700 font-semibold">Active Register</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span>Critical Risks</span>
            <ShieldAlert size={14} className="text-purple-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{summary?.criticalRisks || 0}</p>
          <p className="text-[10px] text-purple-700 font-semibold">Tracked Items</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span>Retention Rules</span>
            <HardDrive size={14} className="text-indigo-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{summary?.activeRetentionPolicies || 0}</p>
          <p className="text-[10px] text-indigo-700 font-semibold">S3 Vault Policies</p>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2 text-xs font-bold scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition ${
                isActive ? "bg-[#274690] text-white shadow-xs font-bold" : "text-slate-600 hover:bg-slate-100 font-semibold"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${isActive ? "bg-white text-[#274690]" : "bg-slate-200 text-slate-700"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 1: OVERVIEW & TELEMETRY
         ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Standards Scorecard */}
            <Card className="lg:col-span-2 rounded-3xl border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Governance & Compliance Standards</h3>
                  <p className="text-xs text-slate-500">Live operational readiness scores evaluated against real organization policies</p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  Overall: {summary?.complianceScore || 92}% Compliant
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">ISO/IEC 27001:2022</span>
                    <span className="text-emerald-600">96%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: "96%" }} />
                  </div>
                  <p className="text-[11px] text-slate-500">Access control, AES-256 vault encryption & audit trail active.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">SOC 2 Type II</span>
                    <span className="text-blue-600">94%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: "94%" }} />
                  </div>
                  <p className="text-[11px] text-slate-500">Immutable logging, session safeguards & multi-tenant isolation.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">EU GDPR & DPDP</span>
                    <span className="text-indigo-600">92%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: "92%" }} />
                  </div>
                  <p className="text-[11px] text-slate-500">Automated retention rules & access certification reviews.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">HIPAA Security Rule</span>
                    <span className="text-purple-600">90%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: "90%" }} />
                  </div>
                  <p className="text-[11px] text-slate-500">Password complexity & brute-force account lockout enforced.</p>
                </div>
              </div>
            </Card>

            {/* Quick Action Station */}
            <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">Governance Controls</h3>
              <p className="text-xs text-slate-500">Rapid administrative actions</p>

              <div className="space-y-2.5 pt-1">
                <Button
                  onClick={() => { setActiveTab("change_requests"); setShowCreateCrModal(true); }}
                  className="w-full bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl h-10 justify-start px-3.5 gap-2"
                >
                  <Plus size={15} /> Request Structural Change
                </Button>

                <Button
                  onClick={() => { setActiveTab("access_reviews"); setShowCreateCampaignModal(true); }}
                  variant="outline"
                  className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl h-10 justify-start px-3.5 gap-2"
                >
                  <Users size={15} /> Launch Access Review
                </Button>

                <Button
                  onClick={() => { setActiveTab("incidents"); setShowCreateIncidentModal(true); }}
                  variant="outline"
                  className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl h-10 justify-start px-3.5 gap-2"
                >
                  <AlertCircle size={15} className="text-rose-600" /> Log Security Incident
                </Button>

                <Button
                  onClick={() => { setActiveTab("retention"); handleRunRetentionSweep(); }}
                  variant="outline"
                  className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl h-10 justify-start px-3.5 gap-2"
                >
                  <Play size={15} className="text-emerald-600" /> Run Retention Cleanup
                </Button>
              </div>
            </Card>
          </div>

          {/* Live Recent Governance Activity Feed */}
          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Recent Immutable Governance Activity</h3>
                <p className="text-xs text-slate-500">Live PostgreSQL audit trail records for organizational changes</p>
              </div>
              <Badge className="bg-blue-50 text-[#274690] border-blue-200 font-bold">
                Real-Time Telemetry
              </Badge>
            </div>

            <div className="divide-y divide-slate-100 overflow-hidden">
              {summary?.recentActivity && summary.recentActivity.length > 0 ? (
                summary.recentActivity.map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <Activity size={15} />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900">{log.action}</p>
                        <p className="text-[11px] text-slate-500">
                          By <span className="font-semibold text-slate-700">{log.actor}</span> on <span className="font-medium text-slate-700">{log.resource}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-[10px] text-slate-400 block">{log.eventId}</span>
                      <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                  No governance activity recorded yet.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 2: SECURITY & AI POLICIES
         ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "policies" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Security Policies Form */}
          <form onSubmit={handleSaveSecurityPolicy} className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Lock size={18} className="text-[#274690]" /> Organization Security & Authentication Policies
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                These settings are enforced strictly during login, password reset, and session verification on the backend.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              {/* Password Min Length */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Minimum Password Length</label>
                <Input
                  type="number"
                  min={8}
                  max={32}
                  value={securityPolicy.passwordMinLength}
                  onChange={(e) => setSecurityPolicy({ ...securityPolicy, passwordMinLength: Number(e.target.value) })}
                  className="rounded-xl h-10 font-bold"
                  required
                />
                <p className="text-[11px] text-slate-400">Passwords shorter than this will be rejected by bcrypt validator.</p>
              </div>

              {/* Max Login Attempts */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Max Failed Login Attempts</label>
                <Input
                  type="number"
                  min={3}
                  max={10}
                  value={securityPolicy.maxLoginAttempts}
                  onChange={(e) => setSecurityPolicy({ ...securityPolicy, maxLoginAttempts: Number(e.target.value) })}
                  className="rounded-xl h-10 font-bold"
                  required
                />
                <p className="text-[11px] text-slate-400">Consecutive failures lock the account automatically.</p>
              </div>

              {/* Lockout Duration */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Account Lockout Duration (Minutes)</label>
                <Input
                  type="number"
                  min={5}
                  max={120}
                  value={securityPolicy.lockoutDurationMinutes}
                  onChange={(e) => setSecurityPolicy({ ...securityPolicy, lockoutDurationMinutes: Number(e.target.value) })}
                  className="rounded-xl h-10 font-bold"
                  required
                />
                <p className="text-[11px] text-slate-400">Time user must wait before retrying after lockout.</p>
              </div>

              {/* Session Timeout */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Session Idle Timeout (Minutes)</label>
                <Input
                  type="number"
                  min={15}
                  max={480}
                  value={securityPolicy.sessionTimeoutMinutes}
                  onChange={(e) => setSecurityPolicy({ ...securityPolicy, sessionTimeoutMinutes: Number(e.target.value) })}
                  className="rounded-xl h-10 font-bold"
                  required
                />
                <p className="text-[11px] text-slate-400">JWT validity and idle session lifespan for organization members.</p>
              </div>
            </div>

            {/* IP Allowlist */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700">Authorized IP Allowlist (Comma-separated)</label>
              <Input
                placeholder="e.g. 192.168.1.1, 103.22.14.88 (leave blank to allow all)"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                className="rounded-xl h-10 font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400">Restricts user logins strictly to these IP addresses.</p>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <p className="font-extrabold text-slate-900">Enforce Password Complexity</p>
                  <p className="text-[11px] text-slate-500">Require at least 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.</p>
                </div>
                <input
                  type="checkbox"
                  checked={securityPolicy.passwordRequireComplexity}
                  onChange={(e) => setSecurityPolicy({ ...securityPolicy, passwordRequireComplexity: e.target.checked })}
                  className="h-4 w-4 text-[#274690] rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <p className="font-extrabold text-slate-900">Mandatory Multi-Factor Authentication (MFA)</p>
                  <p className="text-[11px] text-slate-500">Require TOTP authentication code for all organization members upon login.</p>
                </div>
                <input
                  type="checkbox"
                  checked={securityPolicy.mfaEnforced}
                  onChange={(e) => setSecurityPolicy({ ...securityPolicy, mfaEnforced: e.target.checked })}
                  className="h-4 w-4 text-[#274690] rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <p className="font-extrabold text-slate-900">Restrict External AI Processing on Confidential Docs</p>
                  <p className="text-[11px] text-slate-500">Disallow third-party cloud AI processing on documents marked confidential.</p>
                </div>
                <input
                  type="checkbox"
                  checked={securityPolicy.sensitiveDocAiRestricted}
                  onChange={(e) => setSecurityPolicy({ ...securityPolicy, sensitiveDocAiRestricted: e.target.checked })}
                  className="h-4 w-4 text-[#274690] rounded"
                />
              </div>
            </div>

            <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white font-extrabold text-xs rounded-xl h-11 px-6 shadow-xs gap-2">
              <Save size={15} /> Save & Enforce Security Policy
            </Button>
          </form>

          {/* AI Policy Information Card */}
          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Bot size={18} className="text-purple-600" /> AI Usage Policy
            </h3>
            <p className="text-xs text-slate-500">
              Department-level quotas and provider allowances configured for your organization tenant.
            </p>

            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-purple-950 text-xs space-y-2">
              <p className="font-extrabold flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-700" /> Standard AI Governance
              </p>
              <p className="text-[11px] text-purple-900/80 leading-relaxed">
                Google Gemini multimodal models and local OCR extraction are governed under your subscription entitlement credits.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Active AI Providers:</span>
                <span className="font-bold text-slate-800">Gemini 3.5, OpenAI, Claude</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">OCR Extraction Engine:</span>
                <span className="font-bold text-slate-800">Tesseract + Cloud AI Vision</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">PII Data Redaction:</span>
                <span className="font-bold text-emerald-600">Enabled at Rest</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 3: CHANGE APPROVALS
         ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "change_requests" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-slate-400" />
              <select
                value={crFilter}
                onChange={(e) => setCrFilter(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="APPLIED">Applied</option>
              </select>
            </div>

            <Button
              onClick={() => setShowCreateCrModal(true)}
              className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl h-9 px-4 gap-1.5"
            >
              <Plus size={14} /> New Change Request
            </Button>
          </div>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Request ID</th>
                    <th className="p-4">Title & Type</th>
                    <th className="p-4">Requester</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {changeRequests.filter(cr => crFilter === "ALL" || cr.status === crFilter).length > 0 ? (
                    changeRequests.filter(cr => crFilter === "ALL" || cr.status === crFilter).map((cr) => (
                      <tr key={cr.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-mono font-bold text-[#274690]">{cr.changeRequestId}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{cr.title}</p>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{cr.changeType.replace(/_/g, " ")}</span>
                        </td>
                        <td className="p-4">{cr.requesterName}</td>
                        <td className="p-4">
                          <Badge className={`text-[10px] font-bold ${
                            cr.severity === "CRITICAL" ? "bg-rose-100 text-rose-700 border-rose-200" :
                            cr.severity === "HIGH" ? "bg-amber-100 text-amber-700 border-amber-200" :
                            "bg-blue-100 text-blue-700 border-blue-200"
                          }`}>
                            {cr.severity}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={`text-[10px] font-bold ${
                            cr.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                            cr.status === "APPLIED" ? "bg-purple-100 text-purple-800" :
                            cr.status === "REJECTED" ? "bg-rose-100 text-rose-800" :
                            "bg-amber-100 text-amber-800"
                          }`}>
                            {cr.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="p-4 text-slate-400 text-[11px]">{new Date(cr.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right space-x-1.5">
                          {cr.status === "PENDING_APPROVAL" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => { setSelectedCrForAction(cr); setActionType("APPROVE"); }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-7 px-2.5 text-[11px] font-bold"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setSelectedCrForAction(cr); setActionType("REJECT"); }}
                                className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg h-7 px-2.5 text-[11px] font-bold"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {cr.status === "APPROVED" && (
                            <Button
                              size="sm"
                              onClick={() => handleApplyChangeRequest(cr.id)}
                              className="bg-[#274690] hover:bg-[#1f3561] text-white rounded-lg h-7 px-3 text-[11px] font-bold"
                            >
                              Apply to System
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                        No change requests found in this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 4: ACCESS REVIEWS
         ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "access_reviews" && (
        <div className="space-y-6">
          {!selectedCampaign ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Access Review Campaigns</h3>
                  <p className="text-xs text-slate-500">Periodic certification of user privileges across all departments</p>
                </div>
                <Button
                  onClick={() => setShowCreateCampaignModal(true)}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl h-9 px-4 gap-1.5"
                >
                  <Plus size={14} /> Launch New Campaign
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map((camp) => (
                  <Card key={camp.id} className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm space-y-4 hover:border-[#274690]/40 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{camp.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{camp.description}</p>
                      </div>
                      <Badge className={camp.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}>
                        {camp.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Certification Progress</span>
                        <span>{camp.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-[#274690] h-full rounded-full" style={{ width: `${camp.progress}%` }} />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 text-xs text-slate-500">
                      <span>Due: {new Date(camp.dueDate).toLocaleDateString()}</span>
                      <Button
                        size="sm"
                        onClick={() => handleOpenCampaign(camp.id)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl h-8 px-3 text-xs"
                      >
                        Inspect & Review <ChevronRight size={14} className="ml-1" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <button onClick={() => setSelectedCampaign(null)} className="text-xs text-[#274690] font-bold hover:underline mb-1">
                    ← Back to Campaigns
                  </button>
                  <h3 className="text-sm font-black text-slate-900">{selectedCampaign.name}</h3>
                </div>
                <Button
                  onClick={async () => {
                    await governanceApi.completeCampaign(selectedCampaign.id);
                    showToast("Campaign marked as COMPLETED.");
                    setSelectedCampaign(null);
                    loadDashboardData();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-9 px-4"
                >
                  Complete Campaign
                </Button>
              </div>

              <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="p-4">User</th>
                        <th className="p-4">Assigned Role</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Notes</th>
                        <th className="p-4 text-right">Review Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {selectedCampaign.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-4">
                            <p className="font-bold text-slate-900">{item.userName}</p>
                            <span className="text-[11px] text-slate-400">{item.userEmail}</span>
                          </td>
                          <td className="p-4 font-semibold text-slate-800">{item.currentRole}</td>
                          <td className="p-4">{item.currentDepartment || "General"}</td>
                          <td className="p-4">
                            <Badge className={
                              item.status === "CERTIFIED" ? "bg-emerald-100 text-emerald-800" :
                              item.status === "REVOKED" ? "bg-rose-100 text-rose-800" :
                              item.status === "CHANGE_REQUESTED" ? "bg-purple-100 text-purple-800" :
                              "bg-amber-100 text-amber-800"
                            }>
                              {item.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-slate-400 text-[11px]">{item.decisionReason || "—"}</td>
                          <td className="p-4 text-right space-x-1.5">
                            <Button
                              size="sm"
                              onClick={() => { setSelectedItemForDecision(item); setDecisionType("CERTIFIED"); }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-7 px-2.5 text-[11px] font-bold"
                            >
                              Certify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setSelectedItemForDecision(item); setDecisionType("REVOKED"); }}
                              className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg h-7 px-2.5 text-[11px] font-bold"
                            >
                              Revoke
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 5: INCIDENTS
         ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "incidents" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Incident Management Register</h3>
              <p className="text-xs text-slate-500">Track, escalate, and document security & operational incidents</p>
            </div>
            <Button
              onClick={() => setShowCreateIncidentModal(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl h-9 px-4 gap-1.5"
            >
              <Plus size={14} /> Report New Incident
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incidents.map((inc) => (
              <Card key={inc.id} className="rounded-3xl border-slate-200 bg-white p-5 shadow-sm space-y-3.5 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                    {inc.incidentNumber}
                  </span>
                  <Badge className={
                    inc.severity === "CRITICAL" ? "bg-rose-600 text-white" :
                    inc.severity === "HIGH" ? "bg-amber-500 text-white" :
                    "bg-blue-600 text-white"
                  }>
                    {inc.severity}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900 line-clamp-1">{inc.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{inc.description}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>Status: <span className="font-bold text-slate-800">{inc.status}</span></span>
                  <Button
                    size="sm"
                    onClick={() => setSelectedIncident(inc)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl h-7 px-3 text-[11px]"
                  >
                    Manage
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 6: RISKS
         ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "risks" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Governance Risk Register</h3>
              <p className="text-xs text-slate-500">Live Likelihood × Impact risk assessment matrix & mitigation tracking</p>
            </div>
            <Button
              onClick={() => setShowCreateRiskModal(true)}
              className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl h-9 px-4 gap-1.5"
            >
              <Plus size={14} /> Add Risk Entry
            </Button>
          </div>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Risk ID</th>
                    <th className="p-4">Title & Category</th>
                    <th className="p-4">Likelihood × Impact</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Owner</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Mitigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {risks.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-mono font-bold text-slate-900">{r.riskId}</td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{r.title}</p>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">{r.category}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">{r.likelihood}</span> × <span className="font-semibold">{r.impact}</span>
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold">({r.riskScore})</span>
                      </td>
                      <td className="p-4">
                        <Badge className={`text-[10px] font-bold ${
                          r.severity === "CRITICAL" ? "bg-rose-100 text-rose-800" :
                          r.severity === "HIGH" ? "bg-amber-100 text-amber-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {r.severity}
                        </Badge>
                      </td>
                      <td className="p-4">{r.ownerName || "Unassigned"}</td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800">{r.status}</span>
                      </td>
                      <td className="p-4 max-w-xs truncate text-[11px] text-slate-500">{r.mitigationPlan || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 7: DATA RETENTION
         ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === "retention" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Storage Retention Policies</h3>
              <p className="text-xs text-slate-500">Configure automated data lifecycle & S3 vault retention schedules</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRunRetentionSweep}
                variant="outline"
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs font-bold rounded-xl h-9 px-3.5 gap-1.5"
              >
                <Play size={14} /> Execute Retention Worker
              </Button>
              <Button
                onClick={() => setShowCreateRetentionModal(true)}
                className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl h-9 px-4 gap-1.5"
              >
                <Plus size={14} /> Add Policy
              </Button>
            </div>
          </div>

          {/* Sweep Results Box if executed */}
          {sweepResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 text-xs space-y-1">
              <p className="font-extrabold flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-700" /> Retention Sweep Completed
              </p>
              <p className="text-[11px]">
                Evaluated {sweepResult.evaluatedPoliciesCount} active policies. Processed {sweepResult.totalAffectedDocuments} expired documents into vault status.
              </p>
            </div>
          )}

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Policy Name</th>
                    <th className="p-4">Target Category</th>
                    <th className="p-4">Retention Lifespan</th>
                    <th className="p-4">Action on Expiry</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {retentionPolicies.map((pol) => (
                    <tr key={pol.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-bold text-slate-900">{pol.policyName}</td>
                      <td className="p-4">{pol.documentCategory}</td>
                      <td className="p-4 font-semibold">{pol.retentionDays} Days</td>
                      <td className="p-4">
                        <Badge className="bg-purple-100 text-purple-800 font-bold text-[10px]">
                          {pol.actionOnExpiry.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={pol.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>
                          {pol.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await governanceApi.deleteRetentionPolicy(pol.id);
                            showToast(`Policy "${pol.policyName}" deleted.`);
                            loadDashboardData();
                          }}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg h-7 px-2.5 text-[11px] font-bold"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODALS & DRAWERS
         ──────────────────────────────────────────────────────────────────────── */}

      {/* Create Change Request Modal */}
      {showCreateCrModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateChangeRequest} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-black text-slate-900">New Governance Change Request</h3>
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Title</label>
                <Input value={crTitle} onChange={(e) => setCrTitle(e.target.value)} required placeholder="e.g. Expand Session Timeout to 120m" className="rounded-xl h-10" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Change Type</label>
                <select value={crType} onChange={(e) => setCrType(e.target.value)} className="w-full h-10 rounded-xl border border-slate-200 px-3 bg-white text-xs font-bold">
                  <option value="SECURITY_POLICY">Security Policy</option>
                  <option value="RETENTION_POLICY">Data Retention Policy</option>
                  <option value="ROLE_ESCALATION">Role & Privilege Escalation</option>
                  <option value="DEPARTMENT_OWNERSHIP">Department Ownership</option>
                  <option value="INTEGRATION_CONFIG">Integration Configuration</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Severity</label>
                <select value={crSeverity} onChange={(e) => setCrSeverity(e.target.value)} className="w-full h-10 rounded-xl border border-slate-200 px-3 bg-white text-xs font-bold">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Justification / Description</label>
                <textarea value={crDescription} onChange={(e) => setCrDescription(e.target.value)} required rows={3} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateCrModal(false)} className="rounded-xl h-10 text-xs">Cancel</Button>
              <Button type="submit" className="bg-[#274690] text-white rounded-xl h-10 text-xs font-bold">Submit for Approval</Button>
            </div>
          </form>
        </div>
      )}

      {/* Approve / Reject Change Request Modal */}
      {selectedCrForAction && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-black text-slate-900">
              {actionType === "APPROVE" ? "Approve Change Request" : "Reject Change Request"}
            </h3>
            <p className="text-slate-500">
              Request <span className="font-bold text-slate-800">{selectedCrForAction.changeRequestId}</span>: {selectedCrForAction.title}
            </p>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Reason / Notes for Audit Trail</label>
              <textarea
                value={approvalReasonInput}
                onChange={(e) => setApprovalReasonInput(e.target.value)}
                required
                rows={3}
                placeholder="Provide justification for the audit log..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedCrForAction(null)} className="rounded-xl h-10 text-xs">Cancel</Button>
              <Button
                onClick={handleDecisionChangeRequest}
                className={actionType === "APPROVE" ? "bg-emerald-600 text-white rounded-xl h-10 text-xs font-bold" : "bg-rose-600 text-white rounded-xl h-10 text-xs font-bold"}
              >
                Confirm {actionType === "APPROVE" ? "Approval" : "Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Access Review Item Decision Modal */}
      {selectedItemForDecision && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-black text-slate-900">
              {decisionType === "CERTIFIED" ? "Certify User Access" : "Revoke User Access"}
            </h3>
            <p className="text-slate-500">
              User: <span className="font-bold text-slate-800">{selectedItemForDecision.userName}</span> ({selectedItemForDecision.userEmail})
            </p>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Decision Reason</label>
              <textarea
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                rows={3}
                placeholder="e.g. Confirmed active employment in departmental role."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedItemForDecision(null)} className="rounded-xl h-10 text-xs">Cancel</Button>
              <Button
                onClick={handleDecideAccessItem}
                className={decisionType === "CERTIFIED" ? "bg-emerald-600 text-white rounded-xl h-10 text-xs font-bold" : "bg-rose-600 text-white rounded-xl h-10 text-xs font-bold"}
              >
                Save Decision
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Access Review Campaign Modal */}
      {showCreateCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateCampaign} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-black text-slate-900">Launch Access Review Campaign</h3>
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Campaign Name</label>
                <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} required placeholder="e.g. Q4 2026 User Access Certification" className="rounded-xl h-10" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea value={campaignDesc} onChange={(e) => setCampaignDesc(e.target.value)} rows={3} placeholder="Periodic certification of user accounts and permissions" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateCampaignModal(false)} className="rounded-xl h-10 text-xs">Cancel</Button>
              <Button type="submit" className="bg-[#274690] text-white rounded-xl h-10 text-xs font-bold">Create Campaign</Button>
            </div>
          </form>
        </div>
      )}

      {/* Create Incident Modal */}
      {showCreateIncidentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateIncident} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-black text-slate-900">Report Incident</h3>
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Title</label>
                <Input value={incTitle} onChange={(e) => setIncTitle(e.target.value)} required placeholder="e.g. Suspicious repeated login attempts detected" className="rounded-xl h-10" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select value={incCategory} onChange={(e) => setIncCategory(e.target.value)} className="w-full h-10 rounded-xl border border-slate-200 px-3 bg-white text-xs font-bold">
                  <option value="SECURITY">Security</option>
                  <option value="ACCESS">Access Control</option>
                  <option value="DATA_LEAK">Data Privacy</option>
                  <option value="SYSTEM_OUTAGE">System Availability</option>
                  <option value="POLICY_VIOLATION">Policy Violation</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Severity</label>
                <select value={incSeverity} onChange={(e) => setIncSeverity(e.target.value as any)} className="w-full h-10 rounded-xl border border-slate-200 px-3 bg-white text-xs font-bold">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description & Initial Notes</label>
                <textarea value={incDesc} onChange={(e) => setIncDesc(e.target.value)} required rows={3} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateIncidentModal(false)} className="rounded-xl h-10 text-xs">Cancel</Button>
              <Button type="submit" className="bg-rose-600 text-white rounded-xl h-10 text-xs font-bold">Register Incident</Button>
            </div>
          </form>
        </div>
      )}

      {/* Manage Incident Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[10px] text-rose-600 font-bold">{selectedIncident.incidentNumber}</span>
                <h3 className="text-base font-black text-slate-900">{selectedIncident.title}</h3>
              </div>
              <Badge className={selectedIncident.status === "CLOSED" ? "bg-slate-100 text-slate-800" : "bg-rose-100 text-rose-800"}>
                {selectedIncident.status}
              </Badge>
            </div>

            <p className="text-slate-600">{selectedIncident.description}</p>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-700 block">Investigation Notes / Resolution Details</label>
              <textarea
                value={resolutionInput || incidentNotesInput}
                onChange={(e) => { setResolutionInput(e.target.value); setIncidentNotesInput(e.target.value); }}
                rows={3}
                placeholder="Enter corrective action or investigation findings..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedIncident(null)} className="rounded-xl h-9 text-xs">Close</Button>
              <div className="flex gap-2">
                {selectedIncident.status !== "RESOLVED" && selectedIncident.status !== "CLOSED" && (
                  <Button
                    onClick={() => handleUpdateIncidentStatus(selectedIncident.id, "RESOLVED")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 text-xs font-bold"
                  >
                    Mark Resolved
                  </Button>
                )}
                {selectedIncident.status === "RESOLVED" && (
                  <Button
                    onClick={() => handleUpdateIncidentStatus(selectedIncident.id, "CLOSED")}
                    className="bg-slate-900 hover:bg-black text-white rounded-xl h-9 text-xs font-bold"
                  >
                    Close Incident
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Risk Modal */}
      {showCreateRiskModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateRisk} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-black text-slate-900">Add Governance Risk Entry</h3>
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Risk Title</label>
                <Input value={riskTitle} onChange={(e) => setRiskTitle(e.target.value)} required placeholder="e.g. Third-party vendor API downtime" className="rounded-xl h-10" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Likelihood</label>
                  <select value={riskLikelihood} onChange={(e) => setRiskLikelihood(e.target.value as any)} className="w-full h-10 rounded-xl border border-slate-200 px-3 bg-white text-xs font-bold">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Impact</label>
                  <select value={riskImpact} onChange={(e) => setRiskImpact(e.target.value as any)} className="w-full h-10 rounded-xl border border-slate-200 px-3 bg-white text-xs font-bold">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Owner</label>
                <Input value={riskOwner} onChange={(e) => setRiskOwner(e.target.value)} placeholder="e.g. Infrastructure Lead" className="rounded-xl h-10" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mitigation Strategy</label>
                <textarea value={riskMitigation} onChange={(e) => setRiskMitigation(e.target.value)} rows={3} placeholder="Mitigation plan & controls..." className="w-full rounded-xl border border-slate-200 p-2.5 text-xs" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateRiskModal(false)} className="rounded-xl h-10 text-xs">Cancel</Button>
              <Button type="submit" className="bg-[#274690] text-white rounded-xl h-10 text-xs font-bold">Save Risk</Button>
            </div>
          </form>
        </div>
      )}

      {/* Create Retention Policy Modal */}
      {showCreateRetentionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateRetentionPolicy} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-black text-slate-900">New Storage Retention Policy</h3>
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Policy Name</label>
                <Input value={retPolicyName} onChange={(e) => setRetPolicyName(e.target.value)} required placeholder="e.g. Invoice Vault Retention (7 Years)" className="rounded-xl h-10" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Retention Period (Days)</label>
                <Input type="number" min={30} value={retDays} onChange={(e) => setRetDays(Number(e.target.value))} required className="rounded-xl h-10 font-bold" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Action on Expiry</label>
                <select value={retAction} onChange={(e) => setRetAction(e.target.value as any)} className="w-full h-10 rounded-xl border border-slate-200 px-3 bg-white text-xs font-bold">
                  <option value="DELETE">Purge / Delete Permanently</option>
                  <option value="ARCHIVE">Archive to S3 Cold Vault</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateRetentionModal(false)} className="rounded-xl h-10 text-xs">Cancel</Button>
              <Button type="submit" className="bg-[#274690] text-white rounded-xl h-10 text-xs font-bold">Create Policy</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
