export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  type?: string;
  uploadedAt?: string;
  url?: string;
}

export interface TaskCommentReply {
  id: string;
  user: string;
  role?: string;
  text: string;
  time: string;
}

export interface TaskComment {
  id: string;
  user: string;
  role?: string;
  text: string;
  time: string;
  replies?: TaskCommentReply[];
}

export interface TaskActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  details: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | string;
  dueDate: string;
  createdDate?: string;
  assignedBy: string;
  assignedByRole?: string;
  relatedDocId?: string | null;
  relatedDocName?: string | null;
  instructions?: string;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  activity?: TaskActivity[];
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assignToId?: string;
  employeeName?: string;
  employeeEmail?: string;
  sendEmail?: boolean;
  relatedDocId?: string;
  priority?: string;
  startDate?: string;
  dueDate?: string;
  instructions?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  assignToId?: string;
  comment?: string;
  attachments?: TaskAttachment[];
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  employeeId?: string;
  search?: string;
}
