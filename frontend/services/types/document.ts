export interface DocumentItem {
  id: string | number;
  name: string;
  type?: string;
  category?: string;
  description?: string;
  content?: string;
  size?: string;
  version?: string;
  status: string;
  updatedAt?: string;
  createdAt?: string;
  assignedTo?: string;
  team?: string;
  priority?: string;
  tags?: string[];
  dueDate?: string;
  isArchived?: boolean;
  fileUrl?: string;
  author?: string;
}

export interface CreateDocumentPayload {
  name: string;
  category?: string;
  type?: string;
  description?: string;
  content?: string;
  status?: string;
  assignedTo?: string;
  team?: string;
  priority?: string;
  tags?: string[] | string;
  dueDate?: string;
  templateId?: string;
  submitApproval?: boolean;
  file?: File | null;
}

export interface DocumentFilters {
  search?: string;
  category?: string;
  status?: string;
  tab?: string;
  sort?: string;
  isArchived?: boolean;
}
