export interface SupportTicket {
  id: string | number;
  subject: string;
  category?: string;
  priority?: string;
  status?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: string;
  replies?: Array<{ id?: string; message: string; user?: string; time?: string }>;
}

export interface WorkflowItem {
  id: string | number;
  title: string;
  name?: string;
  status: string;
  currentStep?: number;
  totalSteps?: number;
  assignedTo?: string;
  documentName?: string;
  updatedAt?: string;
  steps?: any[];
  comments?: any[];
}
