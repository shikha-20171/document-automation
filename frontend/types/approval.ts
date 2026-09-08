export interface ApprovalHistoryStep {
  step: string;
  user: string;
  time: string;
  status: string;
}

export interface ApprovalItem {
  id: string | number;
  documentId: string | number;
  documentName: string;
  category?: string;
  status: "Pending Approval" | "Approved" | "Rejected" | string;
  stage?: string;
  submittedAt?: string;
  reviewerName?: string;
  reviewerRole?: string;
  workflowName?: string;
  currentStep?: number;
  totalSteps?: number;
  rejectionReason?: string | null;
  comments?: Array<{ user: string; text: string; time: string }>;
  history?: ApprovalHistoryStep[];
}

export interface ProcessApprovalPayload {
  action: "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "FORWARD" | string;
  comment?: string;
  forwardToManager?: boolean;
  forwardToTarget?: string;
}
