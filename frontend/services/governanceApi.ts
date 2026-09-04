import axios from "@/lib/axios";

export interface GovernanceDashboardSummary {
  complianceScore: number;
  pendingChangeApprovals: number;
  activeAccessReviewCampaigns: number;
  pendingAccessReviewsDue: number;
  openIncidents: number;
  criticalRisks: number;
  activeRetentionPolicies: number;
  securitySummary: {
    mfaEnforced: boolean;
    passwordMinLength: number;
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
  };
  recentActivity: Array<{
    id: string;
    eventId: string;
    action: string;
    actor: string;
    resource: string;
    severity: string;
    status: string;
    timestamp: string;
  }>;
}

export interface SecurityPolicyData {
  id?: string;
  organisationId?: number;
  mfaEnforced: boolean;
  passwordMinLength: number;
  passwordRequireComplexity: boolean;
  lockoutDurationMinutes: number;
  sessionTimeoutMinutes: number;
  ipAllowlist: string[];
  maxLoginAttempts: number;
  sensitiveDocAiRestricted: boolean;
  externalAiRestricted: boolean;
}

export interface AiPolicyData {
  id?: string;
  departmentId?: number | null;
  monthlyQuotaRequests: number;
  allowedProviders: string[];
  allowedTools: string[];
}

export interface GovernanceChangeRequestItem {
  id: string;
  changeRequestId: string;
  organisationId: number;
  requesterId: number;
  requesterName: string;
  changeType: string;
  title: string;
  description: string;
  currentValue?: any;
  requestedValue?: any;
  severity: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "APPLIED";
  approverId?: number;
  approverName?: string;
  approvalReason?: string;
  reviewedAt?: string;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccessReviewCampaignItem {
  id: string;
  name: string;
  description?: string;
  reviewerName: string;
  startDate: string;
  dueDate: string;
  status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";
  progress: number;
  stats: {
    total: number;
    certified: number;
    revoked: number;
    changeReq: number;
    pending: number;
  };
  createdAt: string;
}

export interface AccessReviewUserItem {
  id: string;
  campaignId: string;
  userId: number;
  userName: string;
  userEmail: string;
  currentRole: string;
  currentDepartmentId?: number;
  currentDepartment?: string;
  lastLogin?: string;
  status: "PENDING" | "CERTIFIED" | "REVOKED" | "CHANGE_REQUESTED";
  decisionReason?: string;
  decidedByName?: string;
  decidedAt?: string;
}

export interface IncidentItem {
  id: string;
  incidentNumber: string;
  title: string;
  description: string;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "INVESTIGATING" | "CONTAINED" | "RESOLVED" | "CLOSED";
  reporterName?: string;
  assigneeName?: string;
  resolution?: string;
  investigationNotes?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  history?: Array<{
    id: string;
    actorName: string;
    action: string;
    previousStatus?: string;
    newStatus?: string;
    notes?: string;
    createdAt: string;
  }>;
}

export interface RiskItem {
  id: string;
  riskId: string;
  title: string;
  description: string;
  category: string;
  likelihood: "LOW" | "MEDIUM" | "HIGH";
  impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  ownerName?: string;
  status: "IDENTIFIED" | "ASSESSING" | "MITIGATING" | "CONTROLLED" | "ACCEPTED" | "CLOSED";
  mitigationPlan?: string;
  dueDate?: string;
  createdAt: string;
}

export interface RetentionPolicyItem {
  id: string;
  policyName: string;
  description?: string;
  documentCategory: string;
  retentionDays: number;
  actionOnExpiry: "DELETE" | "ARCHIVE" | "MOVE_TO_COLD_STORAGE" | "KEEP_FOREVER";
  status: "ACTIVE" | "DISABLED" | "LOCKED";
  createdBy?: string;
  createdAt: string;
}

export const governanceApi = {
  // 1. Dashboard
  getDashboardSummary: async () => {
    const res = await axios.get<{ success: boolean; data: GovernanceDashboardSummary }>("/api/governance/dashboard");
    return res.data.data;
  },

  getComplianceReadiness: async () => {
    const res = await axios.get("/api/governance/readiness");
    return res.data.data;
  },

  exportAuditEvidence: async () => {
    const res = await axios.get("/api/governance/audit-evidence");
    return res.data.data;
  },

  // 2. Policies
  getSecurityPolicy: async () => {
    const res = await axios.get<{ success: boolean; data: SecurityPolicyData }>("/api/governance/security-policy");
    return res.data.data;
  },

  updateSecurityPolicy: async (data: Partial<SecurityPolicyData>) => {
    const res = await axios.put<{ success: boolean; message: string; data: SecurityPolicyData }>("/api/governance/security-policy", data);
    return res.data;
  },

  getAiPolicies: async () => {
    const res = await axios.get<{ success: boolean; data: AiPolicyData[] }>("/api/governance/ai-policy");
    return res.data.data;
  },

  saveAiPolicy: async (data: Partial<AiPolicyData>) => {
    const res = await axios.post<{ success: boolean; message: string; data: AiPolicyData }>("/api/governance/ai-policy", data);
    return res.data;
  },

  // 3. Change Requests
  getChangeRequests: async (filters: { status?: string; changeType?: string; severity?: string } = {}) => {
    const res = await axios.get<{ success: boolean; data: GovernanceChangeRequestItem[] }>("/api/governance/change-requests", { params: filters });
    return res.data.data;
  },

  createChangeRequest: async (payload: { title: string; description: string; changeType: string; severity?: string; requestedValue?: any; currentValue?: any }) => {
    const res = await axios.post<{ success: boolean; message: string; data: GovernanceChangeRequestItem }>("/api/governance/change-requests", payload);
    return res.data;
  },

  approveChangeRequest: async (id: string, approvalReason: string) => {
    const res = await axios.post<{ success: boolean; message: string; data: GovernanceChangeRequestItem }>(`/api/governance/change-requests/${id}/approve`, { approvalReason });
    return res.data;
  },

  rejectChangeRequest: async (id: string, approvalReason: string) => {
    const res = await axios.post<{ success: boolean; message: string; data: GovernanceChangeRequestItem }>(`/api/governance/change-requests/${id}/reject`, { approvalReason });
    return res.data;
  },

  applyChangeRequest: async (id: string) => {
    const res = await axios.post<{ success: boolean; message: string; data: GovernanceChangeRequestItem }>(`/api/governance/change-requests/${id}/apply`);
    return res.data;
  },

  // 4. Access Reviews
  getAccessReviewCampaigns: async () => {
    const res = await axios.get<{ success: boolean; data: AccessReviewCampaignItem[] }>("/api/governance/access-reviews");
    return res.data.data;
  },

  createAccessReviewCampaign: async (payload: { name: string; description?: string; dueDate?: string; reviewerName?: string }) => {
    const res = await axios.post<{ success: boolean; message: string; data: any }>("/api/governance/access-reviews", payload);
    return res.data;
  },

  getCampaignDetails: async (campaignId: string) => {
    const res = await axios.get<{ success: boolean; data: AccessReviewCampaignItem & { items: AccessReviewUserItem[] } }>(`/api/governance/access-reviews/${campaignId}`);
    return res.data.data;
  },

  decideAccessReviewItem: async (campaignId: string, itemId: string, payload: { decision: "CERTIFIED" | "REVOKED" | "CHANGE_REQUESTED"; decisionReason?: string }) => {
    const res = await axios.post<{ success: boolean; message: string; data: AccessReviewUserItem }>(`/api/governance/access-reviews/${campaignId}/items/${itemId}/decide`, payload);
    return res.data;
  },

  completeCampaign: async (campaignId: string) => {
    const res = await axios.post<{ success: boolean; message: string; data: any }>(`/api/governance/access-reviews/${campaignId}/complete`);
    return res.data;
  },

  // 5. Incidents
  getIncidents: async (filters: { status?: string; severity?: string; category?: string } = {}) => {
    const res = await axios.get<{ success: boolean; data: IncidentItem[] }>("/api/governance/incidents", { params: filters });
    return res.data.data;
  },

  createIncident: async (payload: { title: string; description: string; category?: string; severity?: string; assigneeName?: string }) => {
    const res = await axios.post<{ success: boolean; message: string; data: IncidentItem }>("/api/governance/incidents", payload);
    return res.data;
  },

  updateIncident: async (id: string, payload: Partial<IncidentItem> & { notes?: string }) => {
    const res = await axios.patch<{ success: boolean; message: string; data: IncidentItem }>(`/api/governance/incidents/${id}`, payload);
    return res.data;
  },

  // 6. Risks
  getRisks: async (filters: { status?: string; severity?: string; category?: string } = {}) => {
    const res = await axios.get<{ success: boolean; data: RiskItem[] }>("/api/governance/risks", { params: filters });
    return res.data.data;
  },

  createRisk: async (payload: { title: string; description: string; category?: string; likelihood?: string; impact?: string; severity?: string; ownerName?: string; mitigationPlan?: string; dueDate?: string }) => {
    const res = await axios.post<{ success: boolean; message: string; data: RiskItem }>("/api/governance/risks", payload);
    return res.data;
  },

  updateRisk: async (id: string, payload: Partial<RiskItem>) => {
    const res = await axios.patch<{ success: boolean; message: string; data: RiskItem }>(`/api/governance/risks/${id}`, payload);
    return res.data;
  },

  deleteRisk: async (id: string) => {
    const res = await axios.delete<{ success: boolean; message: string }>(`/api/governance/risks/${id}`);
    return res.data;
  },

  // 7. Retention
  getRetentionPolicies: async () => {
    const res = await axios.get<{ success: boolean; data: RetentionPolicyItem[] }>("/api/governance/retention");
    return res.data.data;
  },

  createRetentionPolicy: async (payload: { policyName: string; description?: string; documentCategory?: string; retentionDays: number; actionOnExpiry?: string }) => {
    const res = await axios.post<{ success: boolean; message: string; data: RetentionPolicyItem }>("/api/governance/retention", payload);
    return res.data;
  },

  updateRetentionPolicy: async (id: string, payload: Partial<RetentionPolicyItem>) => {
    const res = await axios.put<{ success: boolean; message: string; data: RetentionPolicyItem }>(`/api/governance/retention/${id}`, payload);
    return res.data;
  },

  deleteRetentionPolicy: async (id: string) => {
    const res = await axios.delete<{ success: boolean; message: string }>(`/api/governance/retention/${id}`);
    return res.data;
  },

  runRetentionSweep: async () => {
    const res = await axios.post<{ success: boolean; message: string; data: any }>("/api/governance/retention/run-worker");
    return res.data;
  },
};
